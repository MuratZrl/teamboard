import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import {
  FREE_PLAN_MAX_MEMBERS,
  INVITATION_EXPIRY_DAYS,
} from '../common/constants';

@Injectable()
export class InvitationService {
  private resend: Resend | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async invite(workspaceId: string, invitedById: string, email: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: { select: { members: true } },
        subscription: true,
      },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    const isFreePlan = workspace.subscription?.status !== 'ACTIVE';
    if (isFreePlan && workspace._count.members >= FREE_PLAN_MAX_MEMBERS) {
      throw new ForbiddenException(
        `Free plan allows max ${FREE_PLAN_MAX_MEMBERS} members. Upgrade to Pro.`,
      );
    }

    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: email, workspaceId } },
    });

    const alreadyInvited = await this.prisma.invitation.findFirst({
      where: { email, workspaceId, status: 'PENDING' },
    });

    if (alreadyInvited) {
      throw new BadRequestException('Invitation already sent to this email');
    }

    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const invitation = await this.prisma.invitation.create({
      data: {
        email,
        token,
        workspaceId,
        invitedById,
        expiresAt,
      },
    });

    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const inviteLink = `${frontendUrl}/invite/${token}`;

    if (this.resend) {
      await this.resend.emails.send({
        from: 'TeamBoard <noreply@teamboard.dev>',
        to: email,
        subject: `You're invited to join ${workspace.name} on TeamBoard`,
        html: `
          <h2>You've been invited!</h2>
          <p>You've been invited to join <strong>${workspace.name}</strong> on TeamBoard.</p>
          <p><a href="${inviteLink}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Accept Invitation</a></p>
          <p>This invitation expires in ${INVITATION_EXPIRY_DAYS} days.</p>
        `,
      });
    } else {
      console.log(`[DEV] Invite link for ${email}: ${inviteLink}`);
    }

    return invitation;
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Invitation is no longer valid');
    }
    if (new Date() > invitation.expiresAt) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Invitation has expired');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.workspaceMember.create({
        data: {
          userId,
          workspaceId: invitation.workspaceId,
          role: 'MEMBER',
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });
    });

    return { workspaceId: invitation.workspaceId };
  }

  async getPendingInvitations(workspaceId: string) {
    return this.prisma.invitation.findMany({
      where: { workspaceId, status: 'PENDING' },
      include: {
        invitedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

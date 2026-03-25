import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FREE_PLAN_MAX_WORKSPACES } from '../common/constants';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, name: string) {
    const ownedCount = await this.prisma.workspace.count({
      where: { ownerId: userId },
    });

    const hasProPlan = await this.hasActiveSubscription(userId);

    if (!hasProPlan && ownedCount >= FREE_PLAN_MAX_WORKSPACES) {
      throw new ForbiddenException(
        'Free plan allows only 1 workspace. Upgrade to Pro for unlimited.',
      );
    }

    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now().toString(36);

    const workspace = await this.prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: { name, slug, ownerId: userId },
      });

      await tx.workspaceMember.create({
        data: { userId, workspaceId: ws.id, role: 'OWNER' },
      });

      return ws;
    });

    return workspace;
  }

  async findAllForUser(userId: string, dto: PaginationDto = new PaginationDto()) {
    const where = {
      members: { some: { userId } },
      ...(dto.search && { name: { contains: dto.search, mode: 'insensitive' as const } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.workspace.findMany({
        where,
        include: {
          _count: { select: { members: true, boards: true } },
          subscription: { select: { status: true } },
        },
        skip: (dto.page - 1) * dto.limit,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.workspace.count({ where }),
    ]);

    return paginate(data, total, dto.page, dto.limit);
  }

  async findById(workspaceId: string) {
    return this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        subscription: true,
        _count: { select: { boards: true } },
      },
    });
  }

  async update(workspaceId: string, name: string) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name },
    });
  }

  async delete(workspaceId: string) {
    return this.prisma.workspace.delete({
      where: { id: workspaceId },
    });
  }

  async removeMember(workspaceId: string, targetUserId: string, requestingUserId: string) {
    const requester = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: requestingUserId, workspaceId } },
    });
    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
      throw new ForbiddenException('Only owners and admins can remove members');
    }
    const target = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'OWNER') throw new ForbiddenException('Cannot remove workspace owner');
    if (targetUserId === requestingUserId) throw new ForbiddenException('Cannot remove yourself');
    return this.prisma.workspaceMember.delete({ where: { id: target.id } });
  }

  private async hasActiveSubscription(userId: string): Promise<boolean> {
    const workspace = await this.prisma.workspace.findFirst({
      where: { ownerId: userId },
      include: { subscription: true },
    });

    return workspace?.subscription?.status === 'ACTIVE';
  }
}

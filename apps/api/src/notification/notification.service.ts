import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationCenterService } from '../notification-center/notification-center.service';

@Injectable()
export class NotificationService {
  private resend: Resend | null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notificationCenter: NotificationCenterService,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async notifyTaskAssigned(assigneeEmail: string, taskTitle: string, workspaceName: string) {
    // Create in-app notification for the assignee
    const user = await this.prisma.user.findUnique({
      where: { email: assigneeEmail },
      select: { id: true },
    });

    if (user) {
      await this.notificationCenter.create(
        user.id,
        'TASK_ASSIGNED',
        'Task Assigned',
        `You've been assigned to "${taskTitle}" in ${workspaceName}`,
      );
    }

    if (this.resend) {
      await this.resend.emails.send({
        from: 'TeamBoard <noreply@teamboard.dev>',
        to: assigneeEmail,
        subject: `You've been assigned to "${taskTitle}" in ${workspaceName}`,
        html: `
          <h2>Task Assigned</h2>
          <p>You've been assigned to the task <strong>${taskTitle}</strong> in workspace <strong>${workspaceName}</strong>.</p>
          <p>Log in to TeamBoard to view the details.</p>
        `,
      });
    } else {
      console.log(`[DEV] Task assigned notification: ${assigneeEmail} -> "${taskTitle}" in ${workspaceName}`);
    }
  }

  async notifyNewComment(recipientEmail: string, commenterName: string, taskTitle: string) {
    // Create in-app notification for the recipient
    const user = await this.prisma.user.findUnique({
      where: { email: recipientEmail },
      select: { id: true },
    });

    if (user) {
      await this.notificationCenter.create(
        user.id,
        'COMMENT_ADDED',
        'New Comment',
        `${commenterName} commented on "${taskTitle}"`,
      );
    }

    if (this.resend) {
      await this.resend.emails.send({
        from: 'TeamBoard <noreply@teamboard.dev>',
        to: recipientEmail,
        subject: `${commenterName} commented on "${taskTitle}"`,
        html: `
          <h2>New Comment</h2>
          <p><strong>${commenterName}</strong> left a comment on <strong>${taskTitle}</strong>.</p>
          <p>Log in to TeamBoard to view the comment.</p>
        `,
      });
    } else {
      console.log(`[DEV] New comment notification: ${recipientEmail} -> ${commenterName} on "${taskTitle}"`);
    }
  }

  async notifyInviteAccepted(ownerEmail: string, memberName: string, workspaceName: string) {
    // Create in-app notification for the workspace owner
    const user = await this.prisma.user.findUnique({
      where: { email: ownerEmail },
      select: { id: true },
    });

    if (user) {
      await this.notificationCenter.create(
        user.id,
        'INVITE_ACCEPTED',
        'Invitation Accepted',
        `${memberName} has joined ${workspaceName}`,
      );
    }

    if (this.resend) {
      await this.resend.emails.send({
        from: 'TeamBoard <noreply@teamboard.dev>',
        to: ownerEmail,
        subject: `${memberName} joined ${workspaceName}`,
        html: `
          <h2>Invitation Accepted</h2>
          <p><strong>${memberName}</strong> has accepted the invitation and joined <strong>${workspaceName}</strong>.</p>
        `,
      });
    } else {
      console.log(`[DEV] Invite accepted notification: ${ownerEmail} -> ${memberName} joined ${workspaceName}`);
    }
  }

  async checkDueDateReminders() {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find tasks due within next 24 hours that are not in a "Done" column
    const dueSoonTasks = await this.prisma.task.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: in24Hours,
        },
        assigneeId: { not: null },
        column: {
          name: { not: 'Done' },
        },
      },
      include: {
        assignee: { select: { id: true } },
        column: { select: { name: true } },
      },
    });

    for (const task of dueSoonTasks) {
      if (task.assignee) {
        await this.notificationCenter.create(
          task.assignee.id,
          'TASK_DUE_SOON',
          'Task Due Soon',
          `Task "${task.title}" is due soon`,
        );
      }
    }

    // Find overdue tasks (dueDate < now, not Done)
    const overdueTasks = await this.prisma.task.findMany({
      where: {
        dueDate: {
          lt: now,
        },
        assigneeId: { not: null },
        column: {
          name: { not: 'Done' },
        },
      },
      include: {
        assignee: { select: { id: true } },
        column: { select: { name: true } },
      },
    });

    for (const task of overdueTasks) {
      if (task.assignee) {
        await this.notificationCenter.create(
          task.assignee.id,
          'TASK_OVERDUE',
          'Task Overdue',
          `Task "${task.title}" is overdue`,
        );
      }
    }

    return {
      dueSoonCount: dueSoonTasks.length,
      overdueCount: overdueTasks.length,
    };
  }
}

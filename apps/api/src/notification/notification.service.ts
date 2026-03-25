import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class NotificationService {
  private resend: Resend | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async notifyTaskAssigned(assigneeEmail: string, taskTitle: string, workspaceName: string) {
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
}

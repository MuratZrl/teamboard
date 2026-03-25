import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { RoleGuard, Roles } from '../common/guards/role.guard';
import { Request } from 'express';

@Controller()
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post('workspaces/:id/invitations')
  @UseGuards(JwtAuthGuard, WorkspaceGuard, RoleGuard)
  @Roles('OWNER', 'ADMIN')
  invite(
    @Param('id') workspaceId: string,
    @Body('email') email: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.invitationService.invite(workspaceId, user.id, email);
  }

  @Post('invitations/accept')
  @UseGuards(JwtAuthGuard)
  acceptInvitation(@Body('token') token: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.invitationService.acceptInvitation(token, user.id);
  }

  @Get('workspaces/:id/invitations')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  getPending(@Param('id') workspaceId: string) {
    return this.invitationService.getPendingInvitations(workspaceId);
  }
}

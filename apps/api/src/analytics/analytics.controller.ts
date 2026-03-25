import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('workspaces/:id/analytics')
  @UseGuards(WorkspaceGuard)
  getWorkspaceAnalytics(@Param('id') workspaceId: string) {
    return this.analyticsService.getWorkspaceAnalytics(workspaceId);
  }
}

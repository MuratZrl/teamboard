import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('workspaces/:id/activity')
  @UseGuards(WorkspaceGuard)
  getByWorkspace(@Param('id') workspaceId: string, @Query() query: PaginationDto) {
    return this.activityService.getByWorkspace(workspaceId, query);
  }
}

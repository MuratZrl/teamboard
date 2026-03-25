import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { LabelService } from './label.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class LabelController {
  constructor(private readonly labelService: LabelService) {}

  @Post('workspaces/:id/labels')
  @UseGuards(WorkspaceGuard)
  create(
    @Param('id') workspaceId: string,
    @Body() body: { name: string; color: string },
  ) {
    return this.labelService.create(workspaceId, body.name, body.color);
  }

  @Get('workspaces/:id/labels')
  @UseGuards(WorkspaceGuard)
  findByWorkspace(@Param('id') workspaceId: string) {
    return this.labelService.findByWorkspace(workspaceId);
  }

  @Delete('labels/:id')
  delete(@Param('id') id: string) {
    return this.labelService.delete(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BoardTemplateService } from './board-template.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class BoardTemplateController {
  constructor(private readonly boardTemplateService: BoardTemplateService) {}

  @Get('board-templates')
  findAll() {
    return this.boardTemplateService.findAll();
  }

  // Fix: C2 — workspaceId moved into the URL so WorkspaceGuard authorizes
  // against it directly. Old route POST /board-templates/:id/create with
  // body.workspaceId allowed cross-workspace board creation.
  @Post('workspaces/:id/boards/from-template/:templateId')
  @UseGuards(WorkspaceGuard)
  createFromTemplate(
    @Param('id') workspaceId: string,
    @Param('templateId') templateId: string,
    @Body() body: { name: string },
  ) {
    return this.boardTemplateService.createBoardFromTemplate(
      workspaceId,
      templateId,
      body.name,
    );
  }
}

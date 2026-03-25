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

@Controller('board-templates')
@UseGuards(JwtAuthGuard)
export class BoardTemplateController {
  constructor(private readonly boardTemplateService: BoardTemplateService) {}

  @Get()
  findAll() {
    return this.boardTemplateService.findAll();
  }

  @Post(':id/create')
  @UseGuards(WorkspaceGuard)
  createFromTemplate(
    @Param('id') templateId: string,
    @Body() body: { workspaceId: string; name: string },
  ) {
    return this.boardTemplateService.createBoardFromTemplate(
      body.workspaceId,
      templateId,
      body.name,
    );
  }
}

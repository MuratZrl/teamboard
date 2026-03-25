import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { RoleGuard, Roles } from '../common/guards/role.guard';

@Controller()
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post('workspaces/:id/boards')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  create(@Param('id') workspaceId: string, @Body('name') name: string) {
    return this.boardService.create(workspaceId, name);
  }

  @Get('workspaces/:id/boards')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  findAll(@Param('id') workspaceId: string) {
    return this.boardService.findAllByWorkspace(workspaceId);
  }

  @Get('boards/:id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.boardService.findById(id);
  }

  @Delete('boards/:id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.boardService.delete(id);
  }
}

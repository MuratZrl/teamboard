import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import {
  BoardWorkspaceGuard,
  ColumnWorkspaceGuard,
} from '../common/guards/resource.guard';

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

  // Fix: C1 — workspace membership check via BoardWorkspaceGuard
  @Get('boards/:id')
  @UseGuards(JwtAuthGuard, BoardWorkspaceGuard)
  findOne(@Param('id') id: string) {
    return this.boardService.findById(id);
  }

  // Fix: C1 — workspace membership check via BoardWorkspaceGuard
  @Delete('boards/:id')
  @UseGuards(JwtAuthGuard, BoardWorkspaceGuard)
  delete(@Param('id') id: string) {
    return this.boardService.delete(id);
  }

  // Column endpoints

  // Fix: C1 — workspace membership check via BoardWorkspaceGuard (param :id is boardId)
  @Post('boards/:id/columns')
  @UseGuards(JwtAuthGuard, BoardWorkspaceGuard)
  addColumn(@Param('id') boardId: string, @Body('name') name: string) {
    return this.boardService.addColumn(boardId, name);
  }

  // Fix: C1 — workspace membership check via ColumnWorkspaceGuard
  @Patch('columns/:id/rename')
  @UseGuards(JwtAuthGuard, ColumnWorkspaceGuard)
  renameColumn(@Param('id') columnId: string, @Body('name') name: string) {
    return this.boardService.renameColumn(columnId, name);
  }

  // Fix: C1 — workspace membership check via ColumnWorkspaceGuard
  @Delete('columns/:id')
  @UseGuards(JwtAuthGuard, ColumnWorkspaceGuard)
  deleteColumn(@Param('id') id: string) {
    return this.boardService.deleteColumn(id);
  }

  // Fix: C1 — workspace membership check via BoardWorkspaceGuard (param :id is boardId)
  @Patch('boards/:id/columns/reorder')
  @UseGuards(JwtAuthGuard, BoardWorkspaceGuard)
  reorderColumns(@Param('id') boardId: string, @Body('columnIds') columnIds: string[]) {
    return this.boardService.reorderColumns(boardId, columnIds);
  }
}

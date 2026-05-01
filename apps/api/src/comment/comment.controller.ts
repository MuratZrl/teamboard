import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CommentWorkspaceGuard,
  TaskIdWorkspaceGuard,
} from '../common/guards/resource.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Request } from 'express';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // Fix: C1 — workspace membership check via TaskIdWorkspaceGuard (param :taskId)
  @Post('tasks/:taskId/comments')
  @UseGuards(TaskIdWorkspaceGuard)
  create(
    @Param('taskId') taskId: string,
    @Body('content') content: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.commentService.create(taskId, user.id, content);
  }

  // Fix: C1 — workspace membership check via TaskIdWorkspaceGuard (param :taskId)
  @Get('tasks/:taskId/comments')
  @UseGuards(TaskIdWorkspaceGuard)
  findByTask(@Param('taskId') taskId: string, @Query() query: PaginationDto) {
    return this.commentService.findByTask(taskId, query);
  }

  // Fix: C1 — workspace membership check via CommentWorkspaceGuard.
  // Existing service-level author === userId check still runs after.
  @Delete('comments/:id')
  @UseGuards(CommentWorkspaceGuard)
  delete(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.commentService.delete(id, user.id);
  }
}

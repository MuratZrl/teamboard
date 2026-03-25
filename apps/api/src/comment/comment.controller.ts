import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Request } from 'express';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('tasks/:taskId/comments')
  create(
    @Param('taskId') taskId: string,
    @Body('content') content: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.commentService.create(taskId, user.id, content);
  }

  @Get('tasks/:taskId/comments')
  findByTask(@Param('taskId') taskId: string, @Query() query: PaginationDto) {
    return this.commentService.findByTask(taskId, query);
  }

  @Delete('comments/:id')
  delete(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.commentService.delete(id, user.id);
  }
}

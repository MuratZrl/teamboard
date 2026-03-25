import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Request } from 'express';

@Controller()
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('workspaces/:id/tasks')
  @UseGuards(WorkspaceGuard)
  search(
    @Param('id') workspaceId: string,
    @Query() query: PaginationDto,
    @Query('priority') priority?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('dueBefore') dueBefore?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'updatedAt',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.taskService.searchInWorkspace(workspaceId, query, {
      priority,
      assigneeId,
      dueBefore,
      sortBy,
      sortOrder,
    });
  }

  @Post('columns/:columnId/tasks')
  create(
    @Param('columnId') columnId: string,
    @Body() body: { title: string; description?: string; priority?: any; assigneeId?: string; dueDate?: string },
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.taskService.create(columnId, user.id, body);
  }

  @Patch('tasks/:id')
  update(
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string; priority?: any; assigneeId?: string; dueDate?: string },
  ) {
    return this.taskService.update(id, body);
  }

  @Delete('tasks/:id')
  delete(@Param('id') id: string) {
    return this.taskService.delete(id);
  }

  @Patch('tasks/:id/move')
  move(
    @Param('id') id: string,
    @Body() body: { columnId: string; order: number },
  ) {
    return this.taskService.move(id, body.columnId, body.order);
  }
}

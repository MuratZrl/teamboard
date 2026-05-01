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
import {
  ColumnIdWorkspaceGuard,
  TaskWorkspaceGuard,
} from '../common/guards/resource.guard';
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

  // Fix: C1 — workspace membership check via ColumnIdWorkspaceGuard (param :columnId)
  @Post('columns/:columnId/tasks')
  @UseGuards(ColumnIdWorkspaceGuard)
  create(
    @Param('columnId') columnId: string,
    @Body() body: { title: string; description?: string; priority?: any; assigneeId?: string; dueDate?: string },
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.taskService.create(columnId, user.id, body);
  }

  // Fix: C1 — workspace membership check via TaskWorkspaceGuard
  @Patch('tasks/:id')
  @UseGuards(TaskWorkspaceGuard)
  update(
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string; priority?: any; assigneeId?: string; dueDate?: string },
  ) {
    return this.taskService.update(id, body);
  }

  // Fix: C1 — workspace membership check via TaskWorkspaceGuard
  @Delete('tasks/:id')
  @UseGuards(TaskWorkspaceGuard)
  delete(@Param('id') id: string) {
    return this.taskService.delete(id);
  }

  // Fix: C1 — workspace membership check via TaskWorkspaceGuard.
  // Note: this only verifies the source task's workspace. The target columnId
  // in the body is validated separately in task.service (cross-workspace move
  // protection — tracked as a follow-up, see summary).
  @Patch('tasks/:id/move')
  @UseGuards(TaskWorkspaceGuard)
  move(
    @Param('id') id: string,
    @Body() body: { columnId: string; order: number },
  ) {
    return this.taskService.move(id, body.columnId, body.order);
  }
}

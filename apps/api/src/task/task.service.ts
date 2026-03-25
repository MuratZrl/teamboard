import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { EventsService } from '../events/events.service';
import { ActivityService } from '../activity/activity.service';

interface CreateTaskData {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  dueDate?: string;
  labelIds?: string[];
}

interface TaskSearchFilters {
  priority?: string;
  assigneeId?: string;
  dueBefore?: string;
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly activityService: ActivityService,
  ) {}

  async create(columnId: string, createdById: string, data: CreateTaskData) {
    const maxOrder = await this.prisma.task.aggregate({
      where: { columnId },
      _max: { order: true },
    });

    const result = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        columnId,
        createdById,
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        column: { select: { board: { select: { workspaceId: true } } } },
      },
    });

    const workspaceId = result.column.board.workspaceId;
    this.eventsService.emit(workspaceId, { type: 'task.created', data: result });
    this.activityService.log('TASK_CREATED', createdById, workspaceId, JSON.stringify({ title: data.title }));

    return result;
  }

  async update(taskId: string, data: Partial<CreateTaskData>) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { column: { select: { board: { select: { workspaceId: true } } } } },
    });
    if (!task) throw new NotFoundException('Task not found');

    const result = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.labelIds !== undefined && {
          labels: { set: data.labelIds.map((id) => ({ id })) },
        }),
      },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        labels: { select: { id: true, name: true, color: true } },
      },
    });

    const workspaceId = task.column.board.workspaceId;
    this.eventsService.emit(workspaceId, { type: 'task.updated', data: result });
    this.activityService.log('TASK_UPDATED', task.createdById, workspaceId, JSON.stringify({ taskId, changes: Object.keys(data) }));

    return result;
  }

  async delete(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { column: { select: { board: { select: { workspaceId: true } } } } },
    });
    if (!task) throw new NotFoundException('Task not found');

    const result = await this.prisma.task.delete({ where: { id: taskId } });

    const workspaceId = task.column.board.workspaceId;
    this.eventsService.emit(workspaceId, { type: 'task.deleted', data: { id: taskId } });
    this.activityService.log('TASK_DELETED', task.createdById, workspaceId, JSON.stringify({ title: task.title }));

    return result;
  }

  async searchInWorkspace(workspaceId: string, dto: PaginationDto, filters: TaskSearchFilters = {}) {
    const where: any = {
      column: { board: { workspaceId } },
      ...(dto.search && { title: { contains: dto.search, mode: 'insensitive' as const } }),
    };

    if (filters.priority) {
      const priorities = filters.priority.split(',').map((p) => p.trim());
      where.priority = { in: priorities };
    }

    if (filters.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }

    if (filters.dueBefore) {
      where.dueDate = { lte: new Date(filters.dueBefore) };
    }

    const sortBy = filters.sortBy || 'updatedAt';
    const sortOrder = filters.sortOrder || 'desc';

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          column: { select: { id: true, name: true, board: { select: { id: true, name: true } } } },
        },
        skip: (dto.page - 1) * dto.limit,
        take: dto.limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.task.count({ where }),
    ]);

    return paginate(data, total, dto.page, dto.limit);
  }

  async move(taskId: string, columnId: string, order: number) {
    const result = await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: { column: { select: { board: { select: { workspaceId: true } } } } },
      });
      if (!task) throw new NotFoundException('Task not found');

      // Shift tasks in target column to make room
      await tx.task.updateMany({
        where: { columnId, order: { gte: order } },
        data: { order: { increment: 1 } },
      });

      // Move the task
      const moved = await tx.task.update({
        where: { id: taskId },
        data: { columnId, order },
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          column: { select: { board: { select: { workspaceId: true } } } },
        },
      });

      return { moved, workspaceId: task.column.board.workspaceId, createdById: task.createdById };
    });

    this.eventsService.emit(result.workspaceId, { type: 'task.moved', data: result.moved });
    this.activityService.log('TASK_MOVED', result.createdById, result.workspaceId, JSON.stringify({ taskId, columnId }));

    return result.moved;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

interface CreateTaskData {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  dueDate?: string;
}

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(columnId: string, createdById: string, data: CreateTaskData) {
    const maxOrder = await this.prisma.task.aggregate({
      where: { columnId },
      _max: { order: true },
    });

    return this.prisma.task.create({
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
      },
    });
  }

  async update(taskId: string, data: Partial<CreateTaskData>) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
      },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
      },
    });
  }

  async delete(taskId: string) {
    return this.prisma.task.delete({ where: { id: taskId } });
  }

  async searchInWorkspace(workspaceId: string, dto: PaginationDto) {
    const where = {
      column: { board: { workspaceId } },
      ...(dto.search && { title: { contains: dto.search, mode: 'insensitive' as const } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          column: { select: { id: true, name: true, board: { select: { id: true, name: true } } } },
        },
        skip: (dto.page - 1) * dto.limit,
        take: dto.limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return paginate(data, total, dto.page, dto.limit);
  }

  async move(taskId: string, columnId: string, order: number) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({ where: { id: taskId } });
      if (!task) throw new NotFoundException('Task not found');

      // Shift tasks in target column to make room
      await tx.task.updateMany({
        where: { columnId, order: { gte: order } },
        data: { order: { increment: 1 } },
      });

      // Move the task
      return tx.task.update({
        where: { id: taskId },
        data: { columnId, order },
        include: {
          assignee: { select: { id: true, name: true, image: true } },
        },
      });
    });
  }
}

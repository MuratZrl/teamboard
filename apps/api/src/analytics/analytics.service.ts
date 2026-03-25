import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspaceAnalytics(workspaceId: string) {
    const [
      tasksByStatus,
      tasksByPriority,
      tasksCreatedPerDay,
      tasksCompletedPerDay,
      memberActivity,
      overdueCount,
      totalTasks,
    ] = await Promise.all([
      this.getTasksByStatus(workspaceId),
      this.getTasksByPriority(workspaceId),
      this.getTasksCreatedPerDay(workspaceId),
      this.getTasksCompletedPerDay(workspaceId),
      this.getMemberActivity(workspaceId),
      this.getOverdueCount(workspaceId),
      this.getTotalTasks(workspaceId),
    ]);

    return {
      tasksByStatus,
      tasksByPriority,
      tasksCreatedPerDay,
      tasksCompletedPerDay,
      memberActivity,
      overdueCount,
      totalTasks,
    };
  }

  private async getTasksByStatus(workspaceId: string) {
    const columns = await this.prisma.column.findMany({
      where: { board: { workspaceId } },
      select: {
        name: true,
        _count: { select: { tasks: true } },
      },
    });

    const grouped: Record<string, number> = {};
    for (const col of columns) {
      grouped[col.name] = (grouped[col.name] || 0) + col._count.tasks;
    }
    return grouped;
  }

  private async getTasksByPriority(workspaceId: string) {
    return this.prisma.task.groupBy({
      by: ['priority'],
      _count: true,
      where: { column: { board: { workspaceId } } },
    });
  }

  private async getTasksCreatedPerDay(workspaceId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tasks = await this.prisma.task.findMany({
      where: {
        column: { board: { workspaceId } },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    });

    return this.groupByDate(tasks.map((t) => t.createdAt));
  }

  private async getTasksCompletedPerDay(workspaceId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tasks = await this.prisma.task.findMany({
      where: {
        column: {
          board: { workspaceId },
          name: 'Done',
        },
        updatedAt: { gte: thirtyDaysAgo },
      },
      select: { updatedAt: true },
    });

    return this.groupByDate(tasks.map((t) => t.updatedAt));
  }

  private async getMemberActivity(workspaceId: string) {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            createdTasks: {
              where: { column: { board: { workspaceId } } },
              select: { id: true },
            },
            comments: {
              where: { task: { column: { board: { workspaceId } } } },
              select: { id: true },
            },
          },
        },
      },
    });

    return members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      image: m.user.image,
      tasksCreated: m.user.createdTasks.length,
      comments: m.user.comments.length,
    }));
  }

  private async getOverdueCount(workspaceId: string) {
    return this.prisma.task.count({
      where: {
        column: {
          board: { workspaceId },
          name: { not: 'Done' },
        },
        dueDate: { lt: new Date() },
      },
    });
  }

  private async getTotalTasks(workspaceId: string) {
    return this.prisma.task.count({
      where: { column: { board: { workspaceId } } },
    });
  }

  private groupByDate(dates: Date[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const date of dates) {
      const key = date.toISOString().split('T')[0];
      grouped[key] = (grouped[key] || 0) + 1;
    }
    return grouped;
  }
}

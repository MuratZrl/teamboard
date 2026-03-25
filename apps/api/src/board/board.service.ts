import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_COLUMNS } from '../common/constants';

@Injectable()
export class BoardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, name: string) {
    return this.prisma.board.create({
      data: {
        name,
        workspaceId,
        columns: {
          create: DEFAULT_COLUMNS.map((col) => ({
            name: col.name,
            order: col.order,
          })),
        },
      },
      include: { columns: { orderBy: { order: 'asc' } } },
    });
  }

  async findAllByWorkspace(workspaceId: string) {
    return this.prisma.board.findMany({
      where: { workspaceId },
      include: { _count: { select: { columns: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                assignee: { select: { id: true, name: true, image: true } },
                labels: { select: { id: true, name: true, color: true } },
                _count: { select: { comments: true, attachments: true } },
              },
            },
          },
        },
      },
    });

    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async delete(boardId: string) {
    return this.prisma.board.delete({ where: { id: boardId } });
  }

  // Column CRUD

  async addColumn(boardId: string, name: string) {
    const maxOrder = await this.prisma.column.aggregate({
      where: { boardId },
      _max: { order: true },
    });

    // Temporarily remove the unique constraint issue by using a high order value
    const newOrder = (maxOrder._max.order ?? -1) + 1;

    return this.prisma.column.create({
      data: { name, order: newOrder, boardId },
    });
  }

  async deleteColumn(columnId: string) {
    const column = await this.prisma.column.findUnique({ where: { id: columnId } });
    if (!column) throw new NotFoundException('Column not found');
    return this.prisma.column.delete({ where: { id: columnId } });
  }

  async renameColumn(columnId: string, name: string) {
    return this.prisma.column.update({
      where: { id: columnId },
      data: { name },
    });
  }

  async reorderColumns(boardId: string, columnIds: string[]) {
    // Use a transaction to reorder — set all to negative first to avoid unique constraint
    await this.prisma.$transaction(async (tx) => {
      // Set all orders to negative to avoid conflicts
      for (let i = 0; i < columnIds.length; i++) {
        await tx.column.update({
          where: { id: columnIds[i] },
          data: { order: -(i + 1) },
        });
      }
      // Then set to the correct positive values
      for (let i = 0; i < columnIds.length; i++) {
        await tx.column.update({
          where: { id: columnIds[i] },
          data: { order: i },
        });
      }
    });

    return this.findById(boardId);
  }
}

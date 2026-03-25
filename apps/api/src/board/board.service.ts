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
                assignee: {
                  select: { id: true, name: true, image: true },
                },
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
}

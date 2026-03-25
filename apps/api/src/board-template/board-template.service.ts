import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BoardTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.boardTemplate.findMany();
  }

  async createBoardFromTemplate(
    workspaceId: string,
    templateId: string,
    boardName: string,
  ) {
    const template = await this.prisma.boardTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Board template not found');
    }

    const columnNames: string[] = JSON.parse(template.columns);

    return this.prisma.board.create({
      data: {
        name: boardName,
        workspaceId,
        columns: {
          create: columnNames.map((name, index) => ({
            name,
            order: index,
          })),
        },
      },
      include: { columns: { orderBy: { order: 'asc' } } },
    });
  }
}

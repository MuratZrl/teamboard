import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LabelService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, name: string, color: string) {
    return this.prisma.label.create({
      data: { name, color, workspaceId },
    });
  }

  async findByWorkspace(workspaceId: string) {
    return this.prisma.label.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  async delete(labelId: string) {
    const label = await this.prisma.label.findUnique({ where: { id: labelId } });
    if (!label) throw new NotFoundException('Label not found');
    return this.prisma.label.delete({ where: { id: labelId } });
  }
}

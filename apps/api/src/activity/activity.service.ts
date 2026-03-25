import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(action: string, userId: string, workspaceId: string, details?: string) {
    return this.prisma.activityLog.create({
      data: { action, userId, workspaceId, details },
    });
  }

  async getByWorkspace(workspaceId: string, dto: PaginationDto) {
    const where = { workspaceId };

    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (dto.page - 1) * dto.limit,
        take: dto.limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return paginate(data, total, dto.page, dto.limit);
  }
}

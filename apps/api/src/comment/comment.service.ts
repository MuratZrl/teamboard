import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(taskId: string, authorId: string, content: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.comment.create({
      data: { content, taskId, authorId },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });
  }

  async findByTask(taskId: string, dto: PaginationDto) {
    const where = { taskId };
    const [data, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (dto.page - 1) * dto.limit,
        take: dto.limit,
      }),
      this.prisma.comment.count({ where }),
    ]);
    return paginate(data, total, dto.page, dto.limit);
  }

  async delete(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Cannot delete another user\'s comment');
    return this.prisma.comment.delete({ where: { id: commentId } });
  }
}

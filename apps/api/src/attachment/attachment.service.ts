import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { R2Service } from '../r2/r2.service';

@Injectable()
export class AttachmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2Service,
  ) {}

  async upload(
    taskId: string,
    uploaderId: string,
    file: { originalname: string; buffer: Buffer; size: number; mimetype: string },
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { column: { include: { board: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');

    const ext = extractExt(file.originalname);
    const key = `${task.column.board.workspaceId}/${taskId}/${randomUUID()}.${ext}`;

    await this.r2.uploadFile(key, file.buffer, file.mimetype);

    return this.prisma.attachment.create({
      data: {
        filename: file.originalname,
        key,
        size: file.size,
        mimeType: file.mimetype,
        taskId,
        uploaderId,
      },
      include: {
        uploader: { select: { id: true, name: true } },
      },
    });
  }

  async findByTask(taskId: string) {
    return this.prisma.attachment.findMany({
      where: { taskId },
      include: { uploader: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPresignedUrl(attachmentId: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException('Attachment not found');
    const expiresIn = 900;
    const url = await this.r2.getPresignedUrl(attachment.key, expiresIn);
    return { url, expiresIn };
  }

  async delete(attachmentId: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException('Attachment not found');
    if (attachment.uploaderId !== userId) throw new ForbiddenException('Cannot delete another user\'s attachment');

    await this.r2.deleteFile(attachment.key);
    return this.prisma.attachment.delete({ where: { id: attachmentId } });
  }
}

// Returns a sanitized lowercase extension for object-key suffixes.
// Falls back to 'bin' when missing or non-alphanumeric (prevents path
// injection via crafted multipart filenames like "x.jpg/../etc").
function extractExt(originalname: string): string {
  const idx = originalname.lastIndexOf('.');
  if (idx === -1 || idx === originalname.length - 1) return 'bin';
  const ext = originalname.slice(idx + 1).toLowerCase();
  return /^[a-z0-9]+$/.test(ext) ? ext : 'bin';
}

import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttachmentService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private readonly prisma: PrismaService) {}

  async upload(
    taskId: string,
    uploaderId: string,
    file: { originalname: string; path: string; size: number; mimetype: string },
    // Fix: H3 — caller passes the validated extension; service no longer
    // trusts originalname for anything that touches disk.
    validatedExt: string,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { column: { include: { board: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');

    const destDir = path.join(this.uploadDir, task.column.board.workspaceId, taskId);
    fs.mkdirSync(destDir, { recursive: true });

    // Fix: H3 — generate the on-disk filename from a UUID + validated ext.
    // The attacker-controlled originalname is preserved only as DB metadata
    // (frontend MUST render it as text, never as HTML).
    const storedName = `${randomUUID()}${validatedExt}`;
    const destPath = path.join(destDir, storedName);

    // Fix: H3 — defense-in-depth path containment check. Even if storedName
    // ever leaks attacker control in the future, refuse to write outside
    // destDir. path.resolve normalizes any traversal segments.
    const resolvedDest = path.resolve(destPath);
    const resolvedRoot = path.resolve(destDir);
    if (!resolvedDest.startsWith(resolvedRoot + path.sep)) {
      throw new BadRequestException('Invalid file path');
    }

    fs.renameSync(file.path, destPath);

    return this.prisma.attachment.create({
      data: {
        filename: file.originalname,
        path: destPath,
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

  async getFile(attachmentId: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException('Attachment not found');
    if (!fs.existsSync(attachment.path)) throw new NotFoundException('File not found on disk');
    return attachment;
  }

  async delete(attachmentId: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException('Attachment not found');
    if (attachment.uploaderId !== userId) throw new ForbiddenException('Cannot delete another user\'s attachment');

    if (fs.existsSync(attachment.path)) fs.unlinkSync(attachment.path);
    return this.prisma.attachment.delete({ where: { id: attachmentId } });
  }
}

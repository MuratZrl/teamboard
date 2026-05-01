import {
  BadRequestException,
  Controller, Post, Get, Delete, Param, UseGuards, Req, Res,
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentService } from './attachment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AttachmentWorkspaceGuard,
  TaskIdWorkspaceGuard,
} from '../common/guards/resource.guard';
import { Request, Response } from 'express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

const tmpDir = path.join(process.cwd(), 'uploads', 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });

// Fix: H3 — explicit MIME + extension whitelist. Both must match for the upload
// to be accepted. Header-MIME alone is spoofable by the client; extension alone
// is what attackers actually use to lure. Magic-number sniffing is a stronger
// defense and is tracked as a follow-up (would require declaring `file-type`
// as a direct dependency).
const ALLOWED_TYPES: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['image/png', new Set(['.png'])],
  ['image/jpeg', new Set(['.jpg', '.jpeg'])],
  ['image/gif', new Set(['.gif'])],
  ['image/webp', new Set(['.webp'])],
  ['application/pdf', new Set(['.pdf'])],
  ['text/plain', new Set(['.txt'])],
  ['text/csv', new Set(['.csv'])],
  ['application/zip', new Set(['.zip'])],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', new Set(['.docx'])],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', new Set(['.xlsx'])],
]);

function validatedExtension(file: Express.Multer.File): string {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ALLOWED_TYPES.get(file.mimetype);
  if (!allowedExts || !allowedExts.has(ext)) {
    throw new BadRequestException(
      `File type not allowed. Got mimetype="${file.mimetype}" ext="${ext}".`,
    );
  }
  return ext;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  // Fix: C1 — workspace membership check via TaskIdWorkspaceGuard (param :taskId)
  @Post('tasks/:taskId/attachments')
  @UseGuards(TaskIdWorkspaceGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: tmpDir,
        // Fix: H3 — temp filename is also UUID-based so the attacker's
        // originalname never touches disk, even transiently.
        filename: (_req, _file, cb) => cb(null, randomUUID()),
      }),
    }),
  )
  upload(
    @Param('taskId') taskId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    // Fix: H3 — validate MIME+extension whitelist before persisting.
    const ext = validatedExtension(file);
    return this.attachmentService.upload(taskId, user.id, file, ext);
  }

  // Fix: C1 — workspace membership check via TaskIdWorkspaceGuard (param :taskId)
  @Get('tasks/:taskId/attachments')
  @UseGuards(TaskIdWorkspaceGuard)
  findByTask(@Param('taskId') taskId: string) {
    return this.attachmentService.findByTask(taskId);
  }

  // Fix: C1 — workspace membership check via AttachmentWorkspaceGuard
  @Get('attachments/:id/download')
  @UseGuards(AttachmentWorkspaceGuard)
  async download(@Param('id') id: string, @Res() res: Response) {
    const attachment = await this.attachmentService.getFile(id);
    // Fix: H3 — force download disposition + neutral content type + nosniff
    // so a maliciously-named file (in case future relaxation of the MIME
    // whitelist or a stored legacy attachment) cannot be rendered inline by
    // the browser. res.download() sets Content-Disposition: attachment for us.
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.download(attachment.path, attachment.filename);
  }

  // Fix: C1 — workspace membership check via AttachmentWorkspaceGuard.
  // Existing service-level uploader === userId check still runs after.
  @Delete('attachments/:id')
  @UseGuards(AttachmentWorkspaceGuard)
  delete(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.attachmentService.delete(id, user.id);
  }
}

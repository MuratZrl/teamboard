import {
  BadRequestException,
  Controller, Post, Get, Delete, Param, UseGuards, Req,
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentService } from './attachment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AttachmentWorkspaceGuard,
  TaskIdWorkspaceGuard,
} from '../common/guards/resource.guard';
import { Request } from 'express';
import { memoryStorage } from 'multer';
import * as path from 'path';

// Fix: H3 — explicit MIME + extension whitelist (restored; the R2 migration
// dropped it). Both must match for an upload to be accepted. Header-MIME alone
// is spoofable by the client; extension alone is what attackers use to lure.
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
      storage: memoryStorage(),
      // Fix: enforce the 10MB cap at the stream level so multer aborts before
      // buffering an oversized body into memory; the MaxFileSizeValidator below
      // remains as an explicit backstop.
      limits: { fileSize: 10 * 1024 * 1024 },
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
    // Fix: H3 — reject disallowed MIME/extension combinations with a 400 before
    // anything is uploaded to R2 or persisted.
    validatedExtension(file);
    return this.attachmentService.upload(taskId, user.id, file);
  }

  // Fix: C1 — workspace membership check via TaskIdWorkspaceGuard (param :taskId)
  @Get('tasks/:taskId/attachments')
  @UseGuards(TaskIdWorkspaceGuard)
  findByTask(@Param('taskId') taskId: string) {
    return this.attachmentService.findByTask(taskId);
  }

  // Fix: C1 — workspace membership check via AttachmentWorkspaceGuard
  @Get('attachments/:id/url')
  @UseGuards(AttachmentWorkspaceGuard)
  getUrl(@Param('id') id: string) {
    return this.attachmentService.getPresignedUrl(id);
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

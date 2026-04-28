import {
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

@Controller()
@UseGuards(JwtAuthGuard)
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  // Fix: C1 — workspace membership check via TaskIdWorkspaceGuard (param :taskId)
  @Post('tasks/:taskId/attachments')
  @UseGuards(TaskIdWorkspaceGuard)
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage() }),
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

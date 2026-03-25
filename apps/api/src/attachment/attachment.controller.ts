import {
  Controller, Post, Get, Delete, Param, UseGuards, Req, Res,
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentService } from './attachment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request, Response } from 'express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

const tmpDir = path.join(process.cwd(), 'uploads', 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });

@Controller()
@UseGuards(JwtAuthGuard)
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post('tasks/:taskId/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: tmpDir,
        filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
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
    return this.attachmentService.upload(taskId, user.id, file);
  }

  @Get('tasks/:taskId/attachments')
  findByTask(@Param('taskId') taskId: string) {
    return this.attachmentService.findByTask(taskId);
  }

  @Get('attachments/:id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const attachment = await this.attachmentService.getFile(id);
    res.download(attachment.path, attachment.filename);
  }

  @Delete('attachments/:id')
  delete(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.attachmentService.delete(id, user.id);
  }
}

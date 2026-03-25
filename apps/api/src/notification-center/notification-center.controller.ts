import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationCenterService } from './notification-center.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Request } from 'express';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationCenterController {
  constructor(
    private readonly notificationCenterService: NotificationCenterService,
  ) {}

  @Get()
  getNotifications(@Req() req: Request, @Query() dto: PaginationDto) {
    const user = req.user as { id: string };
    return this.notificationCenterService.getForUser(user.id, dto);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.notificationCenterService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.notificationCenterService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.notificationCenterService.markAllAsRead(user.id);
  }
}

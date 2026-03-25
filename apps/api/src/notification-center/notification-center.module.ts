import { Global, Module } from '@nestjs/common';
import { NotificationCenterService } from './notification-center.service';
import { NotificationCenterController } from './notification-center.controller';

@Global()
@Module({
  controllers: [NotificationCenterController],
  providers: [NotificationCenterService],
  exports: [NotificationCenterService],
})
export class NotificationCenterModule {}

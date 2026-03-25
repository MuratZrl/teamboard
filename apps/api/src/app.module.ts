import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { InvitationModule } from './invitation/invitation.module';
import { BoardModule } from './board/board.module';
import { TaskModule } from './task/task.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { CommentModule } from './comment/comment.module';
import { LabelModule } from './label/label.module';
import { AttachmentModule } from './attachment/attachment.module';
import { ActivityModule } from './activity/activity.module';
import { EventsModule } from './events/events.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{
          ttl: 60000,
          limit: config.get('NODE_ENV') === 'test' ? 1000 : 60,
        }],
      }),
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    WorkspaceModule,
    InvitationModule,
    BoardModule,
    TaskModule,
    SubscriptionModule,
    CommentModule,
    LabelModule,
    AttachmentModule,
    ActivityModule,
    EventsModule,
    AnalyticsModule,
    NotificationModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { InvitationModule } from './invitation/invitation.module';
import { BoardModule } from './board/board.module';
import { TaskModule } from './task/task.module';
import { SubscriptionModule } from './subscription/subscription.module';

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
    PrismaModule,
    AuthModule,
    WorkspaceModule,
    InvitationModule,
    BoardModule,
    TaskModule,
    SubscriptionModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

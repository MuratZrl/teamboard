import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Req,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { Request } from 'express';

@Controller()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('workspaces/:id/checkout')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  createCheckout(@Param('id') workspaceId: string) {
    return this.subscriptionService.createCheckoutSession(workspaceId);
  }

  @Post('webhooks/stripe')
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.subscriptionService.handleWebhook(req.rawBody!, signature);
  }

  @Get('workspaces/:id/subscription')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  getSubscription(@Param('id') workspaceId: string) {
    return this.subscriptionService.getSubscription(workspaceId);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  private stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = secretKey ? new Stripe(secretKey) : null;
  }

  async createCheckoutSession(workspaceId: string) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { subscription: true },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    let customerId = workspace.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        metadata: { workspaceId },
      });
      customerId = customer.id;
    }

    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const priceId = this.config.getOrThrow('STRIPE_PRO_PRICE_ID');

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/workspaces/${workspaceId}/billing?success=true`,
      cancel_url: `${frontendUrl}/workspaces/${workspaceId}/billing?canceled=true`,
      metadata: { workspaceId },
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) throw new Error('Stripe is not configured');

    const webhookSecret = this.config.getOrThrow('STRIPE_WEBHOOK_SECRET');
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspaceId;
        if (!workspaceId) break;

        await this.prisma.subscription.upsert({
          where: { workspaceId },
          create: {
            workspaceId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            status: 'ACTIVE',
          },
          update: {
            stripeSubscriptionId: session.subscription as string,
            status: 'ACTIVE',
          },
        });
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription as string;
        if (!subId) break;

        await this.prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subId },
          data: {
            status: 'ACTIVE',
            currentPeriodEnd: new Date(
              (invoice.lines.data[0]?.period.end ?? 0) * 1000,
            ),
          },
        });
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const statusMap: Record<string, string> = {
          active: 'ACTIVE',
          canceled: 'CANCELED',
          past_due: 'PAST_DUE',
          incomplete: 'INCOMPLETE',
        };
        await this.prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: (statusMap[sub.status] || 'ACTIVE') as any,
            currentPeriodEnd: new Date(((sub as any).current_period_end ?? 0) * 1000),
          },
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'CANCELED' },
        });
        break;
      }
    }

    return { received: true };
  }

  async getSubscription(workspaceId: string) {
    return this.prisma.subscription.findUnique({
      where: { workspaceId },
    });
  }
}

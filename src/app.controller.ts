import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('stripe/webhook')
  async stripeWebhook(@Body() body: any, @Headers('stripe-signature') signature: string) {
    // In a real production app, verify the signature using stripe.webhooks.constructEvent
    try {
      if (body.type === 'checkout.session.completed') {
        const session = body.data.object;
        const transactionId = session.client_reference_id; // we must pass this when creating checkout
        
        if (transactionId) {
          await this.prisma.transaction.update({
            where: { id: transactionId },
            data: { status: 'IN_ESCROW' }
          });
          console.log(`Transaction ${transactionId} updated to IN_ESCROW via Stripe Webhook`);
          
          // Also update domain status
          const txn = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
          if (txn) {
            await this.prisma.domain.update({
              where: { id: txn.domainId },
              data: { status: 'IN_ESCROW' }
            });
          }
        }
      }
      return { received: true };
    } catch (err) {
      console.error('Webhook error:', err);
      return { received: false, error: err.message };
    }
  }
}

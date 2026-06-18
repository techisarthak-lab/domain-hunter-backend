import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import Stripe from 'stripe';

@Injectable()
export class TransactionsService {
  private stripe: any;

  constructor(private prisma: PrismaService, private emailService: EmailService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
      apiVersion: '2026-05-27.dahlia' as any,
    });
  }

  async create(buyerId: string, domainId: string, amount: number) {
    // Escrow logic: Domain status changes to IN_ESCROW
    const domain = await this.prisma.domain.findUnique({ where: { id: domainId } });
    if (!domain) throw new NotFoundException('Domain not found');
    if (domain.status !== 'AVAILABLE') throw new BadRequestException('Domain is not available');

    // Commission logic (e.g., 5%)
    const commission = amount * 0.05;

    // Create Transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        buyerId,
        domainId,
        amount,
        commission,
        status: 'PENDING_PAYMENT',
      }
    });

    // Update Domain Status
    await this.prisma.domain.update({
      where: { id: domainId },
      data: { status: 'IN_ESCROW' }
    });

    const seller = await this.prisma.user.findUnique({ where: { id: domain.sellerId } });
    if (seller) {
      this.emailService.sendEscrowStarted(seller.email, domain.name);
    }

    // Create Stripe Checkout Session
    let checkoutUrl = '';
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: `Domain Escrow: ${domain.name}`,
              },
              unit_amount: Math.round(amount * 100), // Stripe expects amounts in paise/cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'https://toloud.com'}/dashboard/purchases?success=true&tx=${transaction.id}`,
        cancel_url: `${process.env.FRONTEND_URL || 'https://toloud.com'}/dashboard/purchases?canceled=true`,
        client_reference_id: transaction.id,
      });
      checkoutUrl = session.url;
    } catch (e) {
      console.error("Stripe error:", e);
    }

    const updatedTx = await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { checkoutUrl }
    });

    return updatedTx;
  }

  async findAll(userId: string, role: string) {
    if (role === 'ADMIN') {
      return this.prisma.transaction.findMany({
        include: { domain: true, buyer: { select: { id: true, email: true, fullName: true } } },
        orderBy: { createdAt: 'desc' }
      });
    }

    return this.prisma.transaction.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { domain: { sellerId: userId } }
        ]
      },
      include: { domain: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string, userId: string, role: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      include: { domain: true, buyer: { select: { email: true, fullName: true } } }
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    
    if (role !== 'ADMIN' && tx.buyerId !== userId && tx.domain.sellerId !== userId) {
      throw new UnauthorizedException('You do not have permission to view this transaction');
    }
    return tx;
  }

  async updateStatus(id: string, status: string, userId: string, role: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { id }, include: { domain: true } });
    if (!tx) throw new NotFoundException('Transaction not found');

    // Only admin can generally override states, but buyers/sellers might have specific state transitions
    if (role !== 'ADMIN') {
      // E.g., Buyer can mark 'PAYMENT_SENT'
      // E.g., Seller can mark 'DOMAIN_PUSHED'
      if (tx.buyerId === userId && status === 'PAYMENT_SENT') {
         // allow
      } else if (tx.domain.sellerId === userId && status === 'DOMAIN_PUSHED') {
         // allow
      } else if (tx.buyerId === userId && status === 'DOMAIN_RECEIVED') {
         // allow
      } else {
        throw new UnauthorizedException('You cannot set this status');
      }
    }

    const updatedTx = await this.prisma.transaction.update({
      where: { id },
      data: { status }
    });

    // If transaction is complete, domain is sold
    if (status === 'COMPLETED') {
      await this.prisma.domain.update({
        where: { id: tx.domainId },
        data: { status: 'SOLD' }
      });
      // Add funds to seller wallet minus commission
      let wallet = await this.prisma.wallet.findUnique({ where: { userId: tx.domain.sellerId }});
      if (!wallet) {
        wallet = await this.prisma.wallet.create({ data: { userId: tx.domain.sellerId }});
      }
      const finalAmount = tx.amount - tx.commission;
      await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: finalAmount } }
      });
      await this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: finalAmount,
          type: 'CREDIT',
          description: `Sale of domain ${tx.domain.name}`
        }
      });
      
      const seller = await this.prisma.user.findUnique({ where: { id: tx.domain.sellerId } });
      const buyer = await this.prisma.user.findUnique({ where: { id: tx.buyerId } });
      if (seller && buyer) {
        this.emailService.sendEscrowCompleted(seller.email, buyer.email, tx.domain.name, finalAmount);
      }
    }

    return updatedTx;
  }
}

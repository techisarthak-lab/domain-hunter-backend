import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService, private emailService: EmailService) {}

  async createOffer(buyerId: string, data: { domainId: string; amount: number; message?: string }) {
    const domain = await this.prisma.domain.findUnique({ where: { id: data.domainId } });
    if (!domain) throw new NotFoundException('Domain not found');
    if (domain.sellerId === buyerId) throw new BadRequestException('Cannot make an offer on your own domain');
    if (domain.minimumOffer && data.amount < domain.minimumOffer) {
      throw new BadRequestException(`Minimum offer is ${domain.minimumOffer}`);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Offers expire in 7 days

    return this.prisma.offer.create({
      data: {
        domainId: data.domainId,
        buyerId,
        amount: data.amount,
        message: data.message,
        expiresAt,
        status: "PENDING"
      }
    });
  }

  async getOffers(userId: string, role: string) {
    if (role === 'SELLER') {
      return this.prisma.offer.findMany({
        where: { domain: { sellerId: userId } },
        include: { domain: true, buyer: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      return this.prisma.offer.findMany({
        where: { buyerId: userId },
        include: { domain: true },
        orderBy: { createdAt: 'desc' }
      });
    }
  }

  async updateOfferStatus(offerId: string, userId: string, status: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { domain: true }
    });

    if (!offer) throw new NotFoundException('Offer not found');

    const isSeller = offer.domain.sellerId === userId;
    const isBuyer = offer.buyerId === userId;

    if (!isSeller && !isBuyer) throw new UnauthorizedException('Not authorized');

    // Only seller can accept or reject.
    if ((status === "ACCEPTED" || status === "REJECTED") && !isSeller) {
      throw new UnauthorizedException('Only seller can accept or reject');
    }

    return this.prisma.offer.update({
      where: { id: offerId },
      data: { status }
    });
  }

  async addMessage(offerId: string, userId: string, content: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { domain: true }
    });

    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.domain.sellerId !== userId && offer.buyerId !== userId) {
      throw new UnauthorizedException('Not authorized');
    }

    // Data Leak Prevention (DLP) Filter
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(\+?\d[\d -]{8,}\d)/g;
    const websiteRegex = /(https?:\/\/[^\s]+)/g;

    let safeContent = content.replace(emailRegex, '[HIDDEN BY ADMIN]');
    safeContent = safeContent.replace(phoneRegex, '[HIDDEN BY ADMIN]');
    safeContent = safeContent.replace(websiteRegex, '[HIDDEN BY ADMIN]');

    return this.prisma.offerMessage.create({
      data: {
        offerId,
        senderId: userId,
        content: safeContent
      }
    });
  }

  async getMessages(offerId: string, userId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { domain: true }
    });

    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.domain.sellerId !== userId && offer.buyerId !== userId) {
      throw new UnauthorizedException('Not authorized');
    }

    return this.prisma.offerMessage.findMany({
      where: { offerId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, fullName: true, role: true } } }
    });
  }
}

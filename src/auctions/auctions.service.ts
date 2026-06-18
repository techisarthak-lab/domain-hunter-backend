import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';


@Injectable()
export class AuctionsService {
  constructor(private prisma: PrismaService) {}

  async createAuction(sellerId: string, domainId: string, reservePrice: number, startingBid: number, durationDays: number) {
    const domain = await this.prisma.domain.findUnique({ where: { id: domainId } });
    if (!domain) throw new NotFoundException('Domain not found');
    if (domain.sellerId !== sellerId) throw new UnauthorizedException('Not authorized to auction this domain');

    const existingAuction = await this.prisma.auction.findUnique({ where: { domainId } });
    if (existingAuction && existingAuction.status === "ACTIVE") {
      throw new BadRequestException('Auction already active for this domain');
    }

    const endTime = new Date();
    endTime.setDate(endTime.getDate() + durationDays);

    return this.prisma.auction.create({
      data: {
        domainId,
        reservePrice,
        startingBid,
        currentBid: startingBid,
        endTime,
        status: "ACTIVE"
      }
    });
  }

  async placeBid(buyerId: string, auctionId: string, amount: number) {
    const auction = await this.prisma.auction.findUnique({ where: { id: auctionId }, include: { domain: true } });
    if (!auction) throw new NotFoundException('Auction not found');
    if (auction.status !== "ACTIVE") throw new BadRequestException('Auction is not active');
    if (new Date() > auction.endTime) throw new BadRequestException('Auction has ended');
    if (auction.domain.sellerId === buyerId) throw new BadRequestException('Cannot bid on your own auction');
    if (amount <= auction.currentBid) throw new BadRequestException(`Bid must be higher than ${auction.currentBid}`);

    // Update auction current bid and create bid record
    const [bid, updatedAuction] = await this.prisma.$transaction([
      this.prisma.bid.create({
        data: {
          auctionId,
          buyerId,
          amount
        }
      }),
      this.prisma.auction.update({
        where: { id: auctionId },
        data: { currentBid: amount }
      })
    ]);

    return { bid, auction: updatedAuction };
  }

  async getActiveAuctions() {
    return this.prisma.auction.findMany({
      where: { status: "ACTIVE", endTime: { gt: new Date() } },
      include: { domain: true },
      orderBy: { endTime: 'asc' }
    });
  }

  async getAuctionDetails(auctionId: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        domain: {
          include: { seller: { select: { id: true, fullName: true, rating: true, totalRatings: true } } }
        },
        bids: {
          include: { buyer: { select: { id: true, fullName: true } } },
          orderBy: { amount: 'desc' }
        }
      }
    });

    if (!auction) throw new NotFoundException('Auction not found');
    return auction;
  }
}

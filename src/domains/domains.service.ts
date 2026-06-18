import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DomainsService {
  constructor(private prisma: PrismaService) {}

  async create(sellerId: string, data: any) {
    return this.prisma.domain.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        buyNowPrice: data.buyNowPrice ? parseFloat(data.buyNowPrice) : null,
        minimumOffer: data.minimumOffer ? parseFloat(data.minimumOffer) : null,
        isFeatured: data.isFeatured || false,
        isPremium: data.isPremium || false,
        isRentToOwn: data.isRentToOwn || false,
        rentToOwnMonths: data.rentToOwnMonths ? parseInt(data.rentToOwnMonths) : null,
        theme: data.theme || 'modern',
        sellerId,
      },
    });
  }

  async createBulk(sellerId: string, domains: any[]) {
    const data = domains.map(d => ({
      name: d.name,
      category: d.category || 'General',
      buyNowPrice: d.buyNowPrice ? parseFloat(d.buyNowPrice) : null,
      sellerId
    }));
    await this.prisma.domain.createMany({ data });
    return { success: true, count: domains.length };
  }

  async verifyDns(id: string, sellerId: string) {
    const domain = await this.findOne(id);
    if (domain.sellerId !== sellerId) {
      throw new UnauthorizedException("You do not own this domain listing");
    }
    try {
      // 1. Check TXT record
      const txtRes = await fetch(`https://dns.google/resolve?name=${domain.name}&type=TXT`);
      const txtData = await txtRes.json();
      const txtVerified = txtData.Answer?.some((a: any) => a.data.includes('toloud-verify'));
      
      // 2. Check NS record (Custom Nameserver logic)
      const nsRes = await fetch(`https://dns.google/resolve?name=${domain.name}&type=NS`);
      const nsData = await nsRes.json();
      // Assume our nameserver is ns1.toloud.com or ns2.toloud.com
      const nsVerified = nsData.Answer?.some((a: any) => a.data.includes('toloud.com.'));

      if (txtVerified || nsVerified) {
         await this.prisma.domain.update({ where: { id }, data: { isOwnershipVerified: true } });
         return { success: true, message: 'Domain ownership verified successfully!' };
      }
    } catch (err) {
      console.error(err)
    }
    return { success: false, message: 'Verification failed. Please add "toloud-verify" as a TXT record, OR change your Nameservers to ns1.toloud.com and ns2.toloud.com.' };
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.DomainWhereInput;
    orderBy?: Prisma.DomainOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    return this.prisma.domain.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
          }
        }
      }
    });
  }

  async findOne(id: string) {
    const domain = await this.prisma.domain.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
          }
        }
      }
    });
    if (!domain) {
      throw new NotFoundException(`Domain with ID ${id} not found`);
    }
    return domain;
  }

  async update(id: string, sellerId: string, data: any, role?: string) {
    const domain = await this.findOne(id);
    if (domain.sellerId !== sellerId && role !== 'ADMIN') {
      throw new UnauthorizedException("You can only edit your own domains");
    }

    return this.prisma.domain.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, sellerId: string, role?: string) {
    const domain = await this.findOne(id);
    if (domain.sellerId !== sellerId && role !== 'ADMIN') {
      throw new UnauthorizedException("You can only delete your own domains");
    }

    return this.prisma.domain.delete({
      where: { id },
    });
  }
}

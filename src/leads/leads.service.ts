import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService, private emailService: EmailService) {}

  async create(data: any) {
    // Find an admin user to assign the lead to if sellerId is not provided
    let sellerId = data.sellerId;
    let admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!sellerId) {
      if (admin) {
        sellerId = admin.id;
      } else {
        // If no admin exists, create a dummy or throw error
        throw new InternalServerErrorException("No admin configured to receive leads.");
      }
    }

    const lead = await this.prisma.lead.create({
      data: {
        sellerId: sellerId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        message: data.message || null,
        domainId: data.domainId || null,
        status: 'NEW',
      }
    });

    if (admin) {
      this.emailService.sendLeadNotification(admin.email, lead);
    }

    return lead;
  }

  async findAll() {
    return this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        domain: {
          select: { name: true }
        }
      }
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.lead.update({
      where: { id },
      data: { status }
    });
  }
}

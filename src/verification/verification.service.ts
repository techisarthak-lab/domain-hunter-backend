import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

import * as crypto from 'crypto';

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  async generateToken(domainId: string, sellerId: string, method: string) {
    const domain = await this.prisma.domain.findUnique({ where: { id: domainId } });
    if (!domain) throw new NotFoundException('Domain not found');
    if (domain.sellerId !== sellerId) throw new UnauthorizedException('Not authorized');

    const token = `dh-verify=${crypto.randomBytes(16).toString('hex')}`;

    return this.prisma.domainVerification.create({
      data: {
        domainId,
        method,
        token,
        status: 'PENDING',
      }
    });
  }

  async verifyDomain(verificationId: string, sellerId: string) {
    const verification = await this.prisma.domainVerification.findUnique({
      where: { id: verificationId },
      include: { domain: true }
    });

    if (!verification) throw new NotFoundException('Verification not found');
    if (verification.domain.sellerId !== sellerId) throw new UnauthorizedException('Not authorized');
    if (verification.status === 'VERIFIED') throw new BadRequestException('Already verified');

    // MOCK VERIFICATION LOGIC
    // In a real app, use `dns` module for TXT/NS or `axios` for HTML file.
    // Here we simulate successful verification
    const isVerified = true; 

    if (isVerified) {
      await this.prisma.domainVerification.update({
        where: { id: verificationId },
        data: { status: 'VERIFIED' }
      });

      await this.prisma.domain.update({
        where: { id: verification.domainId },
        data: { isOwnershipVerified: true }
      });

      return { success: true, message: 'Domain verified successfully' };
    } else {
      await this.prisma.domainVerification.update({
        where: { id: verificationId },
        data: { status: 'FAILED' }
      });
      return { success: false, message: 'Verification failed' };
    }
  }

  async getVerifications(domainId: string, sellerId: string) {
    const domain = await this.prisma.domain.findUnique({ where: { id: domainId } });
    if (!domain) throw new NotFoundException('Domain not found');
    if (domain.sellerId !== sellerId) throw new UnauthorizedException('Not authorized');

    return this.prisma.domainVerification.findMany({
      where: { domainId },
      orderBy: { createdAt: 'desc' }
    });
  }
}

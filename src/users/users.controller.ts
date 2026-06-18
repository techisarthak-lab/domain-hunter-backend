import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService, private prisma: PrismaService) {}

  @Get('seller/:id')
  async getSellerProfile(@Param('id') id: string) {
    const seller = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        rating: true,
        totalRatings: true,
        domains: {
          where: { status: 'AVAILABLE' }
        }
      }
    });

    if (!seller) throw new NotFoundException('Seller not found');
    return seller;
  }
}

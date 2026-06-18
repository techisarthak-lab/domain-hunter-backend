import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Prisma } from '@prisma/client';

@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() createDomainDto: any) {
    const sellerId = (req.user.role === 'ADMIN' && createDomainDto.sellerId) ? createDomainDto.sellerId : req.user.userId;
    return this.domainsService.create(sellerId, createDomainDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk')
  createBulk(@Request() req: any, @Body() body: { domains: any[] }) {
    return this.domainsService.createBulk(req.user.userId, body.domains);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/verify')
  verifyDns(@Param('id') id: string, @Request() req: any) {
    return this.domainsService.verifyDns(id, req.user.userId);
  }

  @Get()
  findAll(@Query('skip') skip?: string, @Query('take') take?: string, @Query('category') category?: string) {
    const where: Prisma.DomainWhereInput = {};
    if (category) {
      where.category = category;
    }
    
    return this.domainsService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.domainsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() updateDomainDto: any) {
    return this.domainsService.update(id, req.user.userId, updateDomainDto, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.domainsService.remove(id, req.user.userId, req.user.role);
  }
}

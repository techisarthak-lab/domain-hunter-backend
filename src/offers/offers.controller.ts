import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OffersService } from './offers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';


@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  createOffer(@Request() req: any, @Body() data: { domainId: string; amount: number; message?: string }) {
    return this.offersService.createOffer(req.user.userId, data);
  }

  @Get()
  getOffers(@Request() req: any) {
    // req.user has { userId, email, role }
    return this.offersService.getOffers(req.user.userId, req.user.role);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string, 
    @Request() req: any, 
    @Body('status') status: string
  ) {
    return this.offersService.updateOfferStatus(id, req.user.userId, status);
  }

  @Post(':id/messages')
  addMessage(
    @Param('id') id: string,
    @Request() req: any,
    @Body('content') content: string
  ) {
    return this.offersService.addMessage(id, req.user.userId, content);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string, @Request() req: any) {
    return this.offersService.getMessages(id, req.user.userId);
  }
}

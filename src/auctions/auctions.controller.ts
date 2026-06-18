import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createAuction(
    @Request() req: any,
    @Body() data: { domainId: string; reservePrice: number; startingBid: number; durationDays: number }
  ) {
    return this.auctionsService.createAuction(req.user.userId, data.domainId, data.reservePrice, data.startingBid, data.durationDays);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/bids')
  placeBid(
    @Param('id') id: string,
    @Request() req: any,
    @Body('amount') amount: number
  ) {
    return this.auctionsService.placeBid(req.user.userId, id, amount);
  }

  @Get()
  getActiveAuctions() {
    return this.auctionsService.getActiveAuctions();
  }

  @Get(':id')
  getAuctionDetails(@Param('id') id: string) {
    return this.auctionsService.getAuctionDetails(id);
  }
}

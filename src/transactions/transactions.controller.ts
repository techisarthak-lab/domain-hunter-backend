import { Controller, Post, Body, UseGuards, Get, Patch, Param, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  createTransaction(@Request() req: any, @Body() body: { domainId: string, amount: number }) {
    return this.transactionsService.create(req.user.userId, body.domainId, body.amount);
  }

  @Get()
  getTransactions(@Request() req: any) {
    return this.transactionsService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  getTransaction(@Param('id') id: string, @Request() req: any) {
    return this.transactionsService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) {
    return this.transactionsService.updateStatus(id, status, req.user.userId, req.user.role);
  }
}

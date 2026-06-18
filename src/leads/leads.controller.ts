import { Controller, Post, Body, Get, UseGuards, Param, Patch } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // Public endpoint for submitting a lead (e.g. Brokerage form, Contact form)
  @Post()
  async createLead(@Body() createLeadDto: any) {
    return this.leadsService.create(createLeadDto);
  }

  // Admin endpoint to view leads
  @UseGuards(JwtAuthGuard)
  @Get()
  async getLeads() {
    return this.leadsService.findAll();
  }

  // Admin endpoint to update lead status
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateLeadStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.leadsService.updateStatus(id, status);
  }
}

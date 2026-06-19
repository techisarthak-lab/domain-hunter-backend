import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('description')
  @UseGuards(JwtAuthGuard)
  generateDescription(@Query('domainName') domainName: string, @Query('category') category: string) {
    return this.aiService.generateDescription(domainName, category);
  }

  @Get('valuation')
  getValuation(@Query('domainName') domainName: string) {
    return this.aiService.getValuation(domainName);
  }

  @Get('suggest')
  @UseGuards(JwtAuthGuard)
  suggestDomains(@Query('keyword') keyword: string) {
    return this.aiService.suggestDomains(keyword);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('description')
  generateDescription(@Query('domainName') domainName: string, @Query('category') category: string) {
    return this.aiService.generateDescription(domainName, category);
  }

  @Get('valuation')
  getValuation(@Query('domainName') domainName: string) {
    return this.aiService.getValuation(domainName);
  }

  @Get('suggest')
  suggestDomains(@Query('keyword') keyword: string) {
    return this.aiService.suggestDomains(keyword);
  }
}

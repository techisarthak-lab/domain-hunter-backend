import { Controller, Post, Body, Param, UseGuards, Request, Get } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('generate/:domainId')
  generateToken(
    @Param('domainId') domainId: string,
    @Body('method') method: string,
    @Request() req: any
  ) {
    return this.verificationService.generateToken(domainId, req.user.userId, method);
  }

  @Post('verify/:id')
  verifyDomain(@Param('id') id: string, @Request() req: any) {
    return this.verificationService.verifyDomain(id, req.user.userId);
  }

  @Get('domain/:domainId')
  getVerifications(@Param('domainId') domainId: string, @Request() req: any) {
    return this.verificationService.getVerifications(domainId, req.user.userId);
  }
}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma.module';
import { DomainsModule } from './domains/domains.module';
import { VerificationModule } from './verification/verification.module';
import { OffersModule } from './offers/offers.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WalletModule } from './wallet/wallet.module';
import { LeadsModule } from './leads/leads.module';
import { AuctionsModule } from './auctions/auctions.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, DomainsModule, VerificationModule, OffersModule, TransactionsModule, WalletModule, LeadsModule, AuctionsModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

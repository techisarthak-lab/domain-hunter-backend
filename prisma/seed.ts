import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  await prisma.transaction.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding new data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: { email: 'admin@toloud.com', passwordHash, fullName: 'Super Admin', role: 'ADMIN', isVerified: true },
  });

  const seller1 = await prisma.user.create({
    data: { email: 'seller1@test.com', passwordHash, fullName: 'Amit Sharma', role: 'SELLER', isVerified: true },
  });

  const seller2 = await prisma.user.create({
    data: { email: 'seller2@test.com', passwordHash, fullName: 'Priya Patel', role: 'SELLER', isVerified: true },
  });

  const buyer1 = await prisma.user.create({
    data: { email: 'buyer1@test.com', passwordHash, fullName: 'Rahul Kumar', role: 'BUYER', isVerified: true },
  });

  const buyer2 = await prisma.user.create({
    data: { email: 'buyer2@test.com', passwordHash, fullName: 'Neha Singh', role: 'BUYER', isVerified: true },
  });

  // 2. Create Domains
  const domains = [
    { name: 'BharatPay.in', category: 'Finance', status: 'AVAILABLE', sellerId: seller1.id, buyNowPrice: 50000 },
    { name: 'AIForge.com', category: 'Technology', status: 'AVAILABLE', sellerId: seller1.id, buyNowPrice: 150000, isFeatured: true },
    { name: 'CryptoVault.io', category: 'Web3', status: 'IN_ESCROW', sellerId: seller2.id, buyNowPrice: 200000 },
    { name: 'CloudScale.in', category: 'Technology', status: 'AVAILABLE', sellerId: seller2.id, buyNowPrice: 25000 },
    { name: 'NextGenApps.co', category: 'Startup', status: 'SOLD', sellerId: seller1.id, buyNowPrice: 75000 },
  ];

  const createdDomains = [];
  for (const d of domains) {
    createdDomains.push(await prisma.domain.create({ data: d }));
  }

  // 3. Create Offers
  await prisma.offer.create({
    data: { domainId: createdDomains[0].id, buyerId: buyer1.id, amount: 45000, status: 'PENDING', message: 'Ready to close today.', expiresAt: new Date(Date.now() + 86400000) }
  });
  await prisma.offer.create({
    data: { domainId: createdDomains[1].id, buyerId: buyer2.id, amount: 100000, status: 'REJECTED', message: 'Too low?', expiresAt: new Date(Date.now() - 86400000) }
  });
  await prisma.offer.create({
    data: { domainId: createdDomains[1].id, buyerId: buyer1.id, amount: 140000, status: 'ACCEPTED', expiresAt: new Date(Date.now() + 86400000) }
  });
  await prisma.offer.create({
    data: { domainId: createdDomains[3].id, buyerId: buyer2.id, amount: 20000, status: 'PENDING', expiresAt: new Date(Date.now() + 86400000) }
  });
  await prisma.offer.create({
    data: { domainId: createdDomains[0].id, buyerId: buyer2.id, amount: 48000, status: 'PENDING', expiresAt: new Date(Date.now() + 86400000) }
  });

  // 4. Create Escrow Transactions
  await prisma.transaction.create({
    data: { domainId: createdDomains[2].id, buyerId: buyer1.id, amount: 200000, status: 'IN_ESCROW', commission: 20000, checkoutUrl: 'https://checkout.stripe.com/test1' }
  });
  await prisma.transaction.create({
    data: { domainId: createdDomains[4].id, buyerId: buyer2.id, amount: 75000, status: 'COMPLETED', commission: 7500, checkoutUrl: 'https://checkout.stripe.com/test2' }
  });
  await prisma.transaction.create({
    data: { domainId: createdDomains[1].id, buyerId: buyer1.id, amount: 140000, status: 'PENDING_PAYMENT', commission: 14000, checkoutUrl: 'https://checkout.stripe.com/test3' }
  });
  await prisma.transaction.create({
    data: { domainId: createdDomains[0].id, buyerId: buyer2.id, amount: 50000, status: 'CANCELED', commission: 5000 }
  });
  await prisma.transaction.create({
    data: { domainId: createdDomains[3].id, buyerId: buyer1.id, amount: 25000, status: 'PENDING_PAYMENT', commission: 2500 }
  });

  // 5. Create Leads
  await prisma.lead.create({
    data: { sellerId: admin.id, name: 'Sanjay Dutt', email: 'sanjay@corp.com', phone: '9876543210', message: 'Looking for a premium finance domain', status: 'NEW' }
  });
  await prisma.lead.create({
    data: { sellerId: admin.id, name: 'Rohit Tech', email: 'rohit@tech.com', message: 'Interested in AI domains', status: 'CONTACTED' }
  });
  await prisma.lead.create({
    data: { sellerId: admin.id, name: 'Vikram Singh', email: 'vikram@invest.in', message: 'Have $50k budget for EdTech', status: 'NEW' }
  });
  await prisma.lead.create({
    data: { sellerId: seller1.id, name: 'Agent Smith', email: 'agent@broker.com', message: 'Can you lower the price for AIForge?', status: 'CONVERTED' }
  });
  await prisma.lead.create({
    data: { sellerId: seller2.id, name: 'Web3 Investor', email: 'web3@fund.io', message: 'Is CryptoVault still available?', status: 'CLOSED' }
  });

  console.log('Seeding complete! 5 records added to each main module.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

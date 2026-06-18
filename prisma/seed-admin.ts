import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'akash@bynext.com';
  const password = 'AdminPassword123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      isVerified: true
    },
    create: {
      email,
      fullName: 'Akash Admin',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      isVerified: true
    }
  });

  console.log(`Admin user seeded: ${adminUser.email}`);

  const domainList = [
    { name: "hipspl.com", price: null, category: "General", isPremium: false },
    { name: "jewellery.xyz", price: 250000, category: "Retail", isPremium: true },
    { name: "themarque-cambridge.com", price: null, category: "Real Estate", isPremium: false },
    { name: "pizzabooth.com", price: 150000, category: "Food", isPremium: true },
    { name: "locateloan.com", price: 80000, category: "Finance", isPremium: false },
    { name: "newcapture.com", price: null, category: "Technology", isPremium: false },
    { name: "bynext.com", price: 500000, category: "Technology", isPremium: true },
    { name: "toloud.com", price: null, category: "Media", isPremium: false },
    { name: "sideplease.com", price: 45000, category: "General", isPremium: false },
    { name: "organizationai.com", price: 350000, category: "AI", isPremium: true },
    { name: "periodai.com", price: null, category: "AI", isPremium: true },
    { name: "announceai.com", price: 400000, category: "AI", isPremium: true },
    { name: "pimars.com", price: null, category: "Technology", isPremium: false },
    { name: "vanmat.com", price: null, category: "Business", isPremium: false },
    { name: "meurthe.com", price: null, category: "General", isPremium: false },
    { name: "toolcent.com", price: 65000, category: "Tools", isPremium: false },
    { name: "threepoker.com", price: 120000, category: "Gaming", isPremium: true },
    { name: "magicalkit.com", price: 55000, category: "E-Commerce", isPremium: false },
    { name: "ringtone.org", price: 200000, category: "Media", isPremium: true },
    { name: "visitbooking.com", price: 300000, category: "Travel", isPremium: true },
    { name: "agentetc.com", price: null, category: "Real Estate", isPremium: false },
    { name: "schoology.ai", price: 850000, category: "AI / Education", isPremium: true },
  ];

  for (const dom of domainList) {
    await prisma.domain.upsert({
      where: { name: dom.name },
      update: {},
      create: {
        name: dom.name,
        category: dom.category,
        buyNowPrice: dom.price,
        isPremium: dom.isPremium,
        sellerId: adminUser.id,
        status: 'AVAILABLE',
        isOwnershipVerified: true
      }
    });
  }

  console.log(`Seeded ${domainList.length} domains for sale!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

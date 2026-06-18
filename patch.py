import os

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

content = content.replace('isOwnershipVerified Boolean   @default(false)', 'isOwnershipVerified Boolean   @default(false)\n  isRentToOwn      Boolean   @default(false)\n  rentToOwnMonths  Int?')

content = content.replace('buyer        User        @relation("BuyerOffers", fields: [buyerId], references: [id], onDelete: Cascade)\n}', 'buyer        User        @relation("BuyerOffers", fields: [buyerId], references: [id], onDelete: Cascade)\n  messages     OfferMessage[]\n}')

content = content.replace('totalRatings  Int           @default(0)\n}', 'totalRatings  Int           @default(0)\n  messages      OfferMessage[] @relation("UserMessages")\n}')

content += '''
model OfferMessage {
  id        String   @id @default(uuid())
  offerId   String
  senderId  String
  content   String
  createdAt DateTime @default(now())

  offer     Offer    @relation(fields: [offerId], references: [id], onDelete: Cascade)
  sender    User     @relation("UserMessages", fields: [senderId], references: [id])
}
'''

with open('prisma/schema.prisma', 'w') as f:
    f.write(content)

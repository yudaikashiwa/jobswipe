/* eslint-disable no-console */
import { PrismaClient, UserType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@example.com";
  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!exists) {
    const passwordHash = await bcrypt.hash("admin12345", 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: passwordHash,
        userType: UserType.ADMIN
      }
    });
    console.log("Seeded: admin@example.com / admin12345");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


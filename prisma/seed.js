import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Password khusus development. Jangan dipakai di server sungguhan.
const password = process.env.SEED_PASSWORD ?? "ganti-ini-123";

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  const users = [
    { name: "Owner", email: "owner@demo.com", role: "OWNER" },
    { name: "Manager", email: "manager@demo.com", role: "MANAGER" },
  ];

  for (const u of users) {
    // upsert: kalau email sudah ada, tidak dibuat dobel.
    // Jadi script ini aman dijalankan berkali-kali.
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
  }

  console.log("Seed selesai: owner@demo.com dan manager@demo.com");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
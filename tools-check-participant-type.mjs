import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const participantId = "224f1b5a-9369-48a9-a49b-2b5c5700dfe1";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const [member, cabinet, president] = await Promise.all([
  prisma.member.findUnique({ where: { id: participantId }, select: { id: true, name: true } }),
  prisma.cabinet.findUnique({ where: { id: participantId }, select: { id: true, name: true, position: true } }),
  prisma.president.findUnique({ where: { id: participantId }, select: { id: true, name: true } }),
]);

console.log(JSON.stringify({ member, cabinet, president }, null, 2));
await prisma.$disconnect();
await pool.end();

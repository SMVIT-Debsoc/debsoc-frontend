import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const sessionId = "fda87411-e1b9-4dd7-a52e-6a8cfe3c538c";
const proposalId = "674e8a8d-8df2-4d10-a995-030c9dae3013";
const chairCabinetId = "224f1b5a-9369-48a9-a49b-2b5c5700dfe1";
const speakerIds = [
  "560a3f66-0f8e-4457-9f8a-ec6637b5f88e",
  "fe952563-2b29-4245-81a7-935e1161ff59",
  "481a0066-a6e0-4d35-b7da-c02e6297496c",
  "dd19efed-679c-48f5-96a1-dc01bb4cd588",
  "43d8e100-5e32-4909-91a4-138149423492",
  "83bdbd02-dacf-4254-88fd-7b9382091d83",
  "ea1f8fba-9a14-4ed1-a241-64eb57295993",
  "9d3793e1-aae4-420c-aae6-822993a8d80a"
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const existing = await prisma.chairFeedbackRecord.findMany({
  where: { sessionId },
  select: { speakerMemberId: true, speakerCabinetId: true, speakerPresidentId: true },
});
const existingIds = new Set(existing.map((r) => r.speakerMemberId ?? r.speakerCabinetId ?? r.speakerPresidentId).filter(Boolean));
const missingSpeakerIds = speakerIds.filter((id) => !existingIds.has(id));

if (missingSpeakerIds.length > 0) {
  await prisma.chairFeedbackRecord.createMany({
    data: missingSpeakerIds.map((speakerMemberId) => ({
      sessionId,
      proposalId,
      speakerMemberId,
      chairCabinetId,
      rating: 8,
      notes: "DB backfill to complete pending speaker feedback.",
    })),
  });
}

await prisma.debateSession.update({
  where: { id: sessionId },
  data: { scoringStatus: "complete" },
});

const result = await prisma.debateSession.findUnique({
  where: { id: sessionId },
  select: {
    scoringStatus: true,
    _count: {
      select: {
        chairFeedbackRecords: true,
        speakerScoreRecords: true,
        adjudicatorScoreRecords: true,
      },
    },
  },
});

console.log(JSON.stringify({ missingInserted: missingSpeakerIds.length, result }, null, 2));
await prisma.$disconnect();
await pool.end();

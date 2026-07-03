import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const sessionId = "fda87411-e1b9-4dd7-a52e-6a8cfe3c538c";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const session = await prisma.debateSession.findUnique({
  where: { id: sessionId },
  select: {
    id: true,
    sessionDate: true,
    motionType: true,
    publishedProposalId: true,
    sessionRoleAssignments: {
      select: { memberId: true, cabinetId: true, presidentId: true, role: true, isChair: true }
    },
    publishedProposal: {
      select: {
        roomAssignments: {
          orderBy: { roomIndex: 'asc' },
          select: {
            roomIndex: true,
            teamAssignments: {
              orderBy: { bpPosition: 'asc' },
              select: {
                bpPosition: true,
                speakerAssignments: {
                  orderBy: { speakerOrder: 'asc' },
                  select: { memberId: true, cabinetId: true, presidentId: true, speakingRole: true }
                }
              }
            },
            adjudicatorAssignments: {
              select: { memberId: true, cabinetId: true, presidentId: true, isChair: true }
            }
          }
        }
      }
    },
    speakerScoreRecords: {
      select: {
        memberId: true, cabinetId: true, presidentId: true, bpPosition: true, speakingRole: true, rawScore: true, teamResultPoints: true,
        scoredByMemberId: true, scoredByCabinetId: true, scoredByPresidentId: true
      }
    },
    adjudicatorScoreRecords: {
      select: {
        adjudicatorMemberId: true, adjudicatorCabinetId: true, adjudicatorPresidentId: true, rating: true,
        chairMemberId: true, chairCabinetId: true, chairPresidentId: true
      }
    },
    chairFeedbackRecords: {
      select: { speakerMemberId: true, speakerCabinetId: true, speakerPresidentId: true, rating: true }
    }
  }
});

const ids = new Set();
const add = (...vals) => vals.forEach(v => { if (v) ids.add(v); });
session.sessionRoleAssignments.forEach(r => add(r.memberId, r.cabinetId, r.presidentId));
session.publishedProposal?.roomAssignments.forEach(room => {
  room.teamAssignments.forEach(team => team.speakerAssignments.forEach(s => add(s.memberId, s.cabinetId, s.presidentId)));
  room.adjudicatorAssignments.forEach(a => add(a.memberId, a.cabinetId, a.presidentId));
});
const idList = [...ids];
const [members, cabinets, presidents] = await Promise.all([
  prisma.member.findMany({ where: { id: { in: idList } }, select: { id: true, name: true } }),
  prisma.cabinet.findMany({ where: { id: { in: idList } }, select: { id: true, name: true } }),
  prisma.president.findMany({ where: { id: { in: idList } }, select: { id: true, name: true } }),
]);
const names = Object.fromEntries([...members, ...cabinets, ...presidents].map(x => [x.id, x.name]));
const pid = (r) => r.memberId ?? r.cabinetId ?? r.presidentId ?? r.adjudicatorMemberId ?? r.adjudicatorCabinetId ?? r.adjudicatorPresidentId ?? r.scoredByMemberId ?? r.scoredByCabinetId ?? r.scoredByPresidentId ?? r.speakerMemberId ?? r.speakerCabinetId ?? r.speakerPresidentId ?? r.chairMemberId ?? r.chairCabinetId ?? r.chairPresidentId ?? null;
console.log(JSON.stringify({
  sessionId,
  names,
  roles: session.sessionRoleAssignments.map(r => ({ participantId: pid(r), name: names[pid(r)] ?? pid(r), role: r.role, isChair: r.isChair })),
  rooms: session.publishedProposal?.roomAssignments.map(room => ({
    roomIndex: room.roomIndex,
    speakers: room.teamAssignments.flatMap(team => team.speakerAssignments.map(s => ({ participantId: pid(s), name: names[pid(s)] ?? pid(s), bpPosition: team.bpPosition, speakingRole: s.speakingRole }))),
    adjudicators: room.adjudicatorAssignments.map(a => ({ participantId: pid(a), name: names[pid(a)] ?? pid(a), isChair: a.isChair }))
  })),
  speakerScoreRecords: session.speakerScoreRecords.map(r => ({ participantId: pid(r), name: names[pid(r)] ?? pid(r), bpPosition: r.bpPosition, speakingRole: r.speakingRole, rawScore: r.rawScore, teamResultPoints: r.teamResultPoints, scoredBy: names[r.scoredByMemberId ?? r.scoredByCabinetId ?? r.scoredByPresidentId ?? ''] ?? (r.scoredByMemberId ?? r.scoredByCabinetId ?? r.scoredByPresidentId ?? null) })),
  adjudicatorScoreRecords: session.adjudicatorScoreRecords.map(r => ({ participantId: pid(r), name: names[pid(r)] ?? pid(r), rating: r.rating, chair: names[r.chairMemberId ?? r.chairCabinetId ?? r.chairPresidentId ?? ''] ?? (r.chairMemberId ?? r.chairCabinetId ?? r.chairPresidentId ?? null) })),
  chairFeedbackRecords: session.chairFeedbackRecords.map(r => ({ participantId: pid(r), name: names[pid(r)] ?? pid(r), rating: r.rating }))
}, null, 2));

await prisma.$disconnect();
await pool.end();

import "dotenv/config";
import { prisma } from "../lib/server/prisma.ts";

/**
 * Dev/testing helper: force-complete scoring for every Published session that
 * still has scoringStatus != "complete". For each such session we:
 *   1. Read the published proposal + its rooms.
 *   2. For every speaker, insert a SpeakerScoreRecord (raw + team points) and
 *      a ChairFeedbackRecord (chair -> speaker rating).
 *   3. For every panel adjudicator, insert an AdjudicatorScoreRecord
 *      (chair -> adjudicator rating).
 *   4. Flip scoringStatus on the session to "complete".
 *
 * Skips speakers/adjudicators/chair rows that already have score records so
 * running this repeatedly is safe. Run: node --experimental-strip-types
 * scripts/complete-pending-scoring.ts
 */

const DEFAULT_RAW_SPEAKER_SCORE = 75;
const DEFAULT_TEAM_RESULT_POINTS = 2;
const DEFAULT_CHAIR_FEEDBACK_RATING = 4;
const DEFAULT_ADJUDICATOR_RATING = 4;

type ParticipantRef = {
  memberId: string | null;
  cabinetId: string | null;
  presidentId: string | null;
};

function refFromSpeakerAssignment(assignment: {
  memberId: string | null;
  cabinetId: string | null;
  presidentId: string | null;
}): ParticipantRef {
  return {
    memberId: assignment.memberId ?? null,
    cabinetId: assignment.cabinetId ?? null,
    presidentId: assignment.presidentId ?? null,
  };
}

function refKey(ref: ParticipantRef): string {
  return `${ref.memberId ?? ""}|${ref.cabinetId ?? ""}|${ref.presidentId ?? ""}`;
}

async function completeSession(sessionId: string) {
  const session = await prisma.debateSession.findUnique({
    where: { id: sessionId },
    include: {
      publishedProposal: {
        include: {
          roomAssignments: {
            include: {
              teamAssignments: {
                include: { speakerAssignments: true },
              },
              adjudicatorAssignments: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    console.warn(`skip ${sessionId}: session not found`);
    return;
  }

  const proposal = session.publishedProposal;
  if (!proposal) {
    console.warn(`skip ${sessionId}: no published proposal`);
    return;
  }

  const existingSpeakerRecords = await prisma.speakerScoreRecord.findMany({
    where: { sessionId },
    select: {
      memberId: true,
      cabinetId: true,
      presidentId: true,
    },
  });
  const existingSpeakerKeys = new Set(existingSpeakerRecords.map((r) => refKey(r)));

  const existingChairFeedback = await prisma.chairFeedbackRecord.findMany({
    where: { sessionId },
    select: {
      speakerMemberId: true,
      speakerCabinetId: true,
      speakerPresidentId: true,
    },
  });
  const existingChairFeedbackKeys = new Set(
    existingChairFeedback.map((r) =>
      refKey({
        memberId: r.speakerMemberId,
        cabinetId: r.speakerCabinetId,
        presidentId: r.speakerPresidentId,
      }),
    ),
  );

  const existingAdjudicatorScores = await prisma.adjudicatorScoreRecord.findMany({
    where: { sessionId },
    select: {
      adjudicatorMemberId: true,
      adjudicatorCabinetId: true,
      adjudicatorPresidentId: true,
    },
  });
  const existingAdjudicatorKeys = new Set(
    existingAdjudicatorScores.map((r) =>
      refKey({
        memberId: r.adjudicatorMemberId,
        cabinetId: r.adjudicatorCabinetId,
        presidentId: r.adjudicatorPresidentId,
      }),
    ),
  );

  const speakerInserts: Array<Parameters<typeof prisma.speakerScoreRecord.create>[0]["data"]> = [];
  const chairFeedbackInserts: Array<Parameters<typeof prisma.chairFeedbackRecord.create>[0]["data"]> = [];
  const adjudicatorScoreInserts: Array<Parameters<typeof prisma.adjudicatorScoreRecord.create>[0]["data"]> = [];

  for (const room of proposal.roomAssignments) {
    const chair = room.adjudicatorAssignments.find((a) => a.isChair) ?? null;
    for (const team of room.teamAssignments) {
      for (const speaker of team.speakerAssignments) {
        const ref = refFromSpeakerAssignment(speaker);
        const key = refKey(ref);
        if (!existingSpeakerKeys.has(key)) {
          speakerInserts.push({
            sessionId,
            proposalId: proposal.id,
            ...ref,
            bpPosition: team.bpPosition,
            speakingRole: speaker.speakingRole,
            rawScore: DEFAULT_RAW_SPEAKER_SCORE,
            teamResultPoints: DEFAULT_TEAM_RESULT_POINTS,
            scoredByMemberId: chair?.memberId ?? null,
            scoredByCabinetId: chair?.cabinetId ?? null,
            scoredByPresidentId: chair?.presidentId ?? null,
          });
          existingSpeakerKeys.add(key);
        }
        if (chair && !existingChairFeedbackKeys.has(key)) {
          chairFeedbackInserts.push({
            sessionId,
            proposalId: proposal.id,
            speakerMemberId: ref.memberId,
            speakerCabinetId: ref.cabinetId,
            speakerPresidentId: ref.presidentId,
            chairMemberId: chair.memberId ?? null,
            chairCabinetId: chair.cabinetId ?? null,
            chairPresidentId: chair.presidentId ?? null,
            rating: DEFAULT_CHAIR_FEEDBACK_RATING,
            notes: null,
          });
          existingChairFeedbackKeys.add(key);
        }
      }
    }
    for (const adjudicator of room.adjudicatorAssignments) {
      if (adjudicator.isChair) continue;
      if (!chair) continue;
      const ref: ParticipantRef = {
        memberId: adjudicator.memberId ?? null,
        cabinetId: adjudicator.cabinetId ?? null,
        presidentId: adjudicator.presidentId ?? null,
      };
      const key = refKey(ref);
      if (existingAdjudicatorKeys.has(key)) continue;
      adjudicatorScoreInserts.push({
        sessionId,
        proposalId: proposal.id,
        chairMemberId: chair.memberId ?? null,
        chairCabinetId: chair.cabinetId ?? null,
        chairPresidentId: chair.presidentId ?? null,
        adjudicatorMemberId: ref.memberId,
        adjudicatorCabinetId: ref.cabinetId,
        adjudicatorPresidentId: ref.presidentId,
        rating: DEFAULT_ADJUDICATOR_RATING,
        notes: null,
      });
      existingAdjudicatorKeys.add(key);
    }
  }

  await prisma.$transaction(async (tx) => {
    if (speakerInserts.length > 0) {
      for (const data of speakerInserts) {
        await tx.speakerScoreRecord.create({ data });
      }
    }
    if (chairFeedbackInserts.length > 0) {
      for (const data of chairFeedbackInserts) {
        await tx.chairFeedbackRecord.create({ data });
      }
    }
    if (adjudicatorScoreInserts.length > 0) {
      for (const data of adjudicatorScoreInserts) {
        await tx.adjudicatorScoreRecord.create({ data });
      }
    }
    await tx.debateSession.update({
      where: { id: sessionId },
      data: {
        pairingStatus: "PUBLISHED",
        publicationStatus: "PUBLISHED",
        scoringStatus: "complete",
      },
    });
  });

  console.log(
    `[complete] session=${sessionId} speakers=${speakerInserts.length} chairFeedback=${chairFeedbackInserts.length} adjudicatorScores=${adjudicatorScoreInserts.length}`,
  );
}

async function main() {
  const pending = await prisma.debateSession.findMany({
    where: {
      publishedProposalId: { not: null },
      NOT: { scoringStatus: "complete" },
    },
    select: { id: true, sessionDate: true, motionType: true },
  });

  if (pending.length === 0) {
    console.log("No pending Published sessions found.");
    return;
  }

  console.log(`Found ${pending.length} pending session(s):`);
  for (const session of pending) {
    console.log(`  - ${session.id} (${session.sessionDate.toISOString().slice(0, 10)} · ${session.motionType ?? "TBD"})`);
  }

  for (const session of pending) {
    await completeSession(session.id);
  }
}

main()
  .catch((error) => {
    console.error("[complete-pending-scoring] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

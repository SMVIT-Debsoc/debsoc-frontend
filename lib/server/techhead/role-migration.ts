import type {Prisma} from "@prisma/client";

export type RoleKey = "president" | "cabinet" | "member";

type ReferenceModel =
  | "attendance"
  | "sessionRoleAssignment"
  | "teamSpeakerAssignment"
  | "roomAdjudicatorAssignment"
  | "unassignedParticipant"
  | "speakerScoreRecord"
  | "chairFeedbackRecord"
  | "adjudicatorScoreRecord"
  | "memberMetricSnapshot"
  | "pairMetricSnapshot"
  | "teamDynamicsRating"
  | "leaderboardSnapshot"
  | "sparRecord"
  | "sparTeammate";

type ParticipantColumns = {
  member: string;
  cabinet: string;
  president: string;
};

export const PARTICIPANT_REFERENCE_MAP: ReadonlyArray<{
  model: ReferenceModel;
  cols: ParticipantColumns;
}> = [
  {model: "attendance", cols: {member: "memberId", cabinet: "cabinetId", president: "presidentId"}},
  {model: "sessionRoleAssignment", cols: {member: "memberId", cabinet: "cabinetId", president: "presidentId"}},
  {model: "teamSpeakerAssignment", cols: {member: "memberId", cabinet: "cabinetId", president: "presidentId"}},
  {model: "roomAdjudicatorAssignment", cols: {member: "memberId", cabinet: "cabinetId", president: "presidentId"}},
  {model: "unassignedParticipant", cols: {member: "memberId", cabinet: "cabinetId", president: "presidentId"}},
  {model: "speakerScoreRecord", cols: {member: "memberId", cabinet: "cabinetId", president: "presidentId"}},
  {model: "speakerScoreRecord", cols: {member: "scoredByMemberId", cabinet: "scoredByCabinetId", president: "scoredByPresidentId"}},
  {model: "chairFeedbackRecord", cols: {member: "speakerMemberId", cabinet: "speakerCabinetId", president: "speakerPresidentId"}},
  {model: "chairFeedbackRecord", cols: {member: "chairMemberId", cabinet: "chairCabinetId", president: "chairPresidentId"}},
  {model: "adjudicatorScoreRecord", cols: {member: "chairMemberId", cabinet: "chairCabinetId", president: "chairPresidentId"}},
  {model: "adjudicatorScoreRecord", cols: {member: "adjudicatorMemberId", cabinet: "adjudicatorCabinetId", president: "adjudicatorPresidentId"}},
  {model: "memberMetricSnapshot", cols: {member: "memberId", cabinet: "cabinetId", president: "presidentId"}},
  {model: "pairMetricSnapshot", cols: {member: "memberAId", cabinet: "cabinetAId", president: "presidentAId"}},
  {model: "pairMetricSnapshot", cols: {member: "memberBId", cabinet: "cabinetBId", president: "presidentBId"}},
  {model: "teamDynamicsRating", cols: {member: "raterMemberId", cabinet: "raterCabinetId", president: "raterPresidentId"}},
  {model: "teamDynamicsRating", cols: {member: "teammateMemberId", cabinet: "teammateCabinetId", president: "teammatePresidentId"}},
  {model: "leaderboardSnapshot", cols: {member: "memberId", cabinet: "cabinetId", president: "presidentId"}},
  {model: "sparRecord", cols: {member: "memberId", cabinet: "cabinetId", president: "presidentId"}},
  {model: "sparRecord", cols: {member: "teammateMemberId", cabinet: "teammateCabinetId", president: "teammatePresidentId"}},
  {model: "sparTeammate", cols: {member: "memberId", cabinet: "cabinetId", president: "presidentId"}},
];

const SPAR_SUBMITTER_COLUMNS: ParticipantColumns = {
  member: "memberId",
  cabinet: "cabinetId",
  president: "presidentId",
};

type ReferenceDelegate = {
  updateMany(args: {where: Record<string, string>; data: Record<string, string | null>}): Promise<unknown>;
  count(args: {where: Record<string, string>}): Promise<number>;
};

type SparRecordDelegate = ReferenceDelegate & {
  findMany(args: {
    where: Record<string, string>;
    select: {memberId: true; cabinetId: true; presidentId: true};
  }): Promise<Array<{memberId: string | null; cabinetId: string | null; presidentId: string | null}>>;
};

function referenceDelegate(tx: Prisma.TransactionClient, model: ReferenceModel): ReferenceDelegate {
  return (tx as unknown as Record<ReferenceModel, ReferenceDelegate>)[model];
}

function sourceColumn(columns: ParticipantColumns, role: RoleKey) {
  return columns[role];
}

export function participantReferenceUpdate(
  columns: ParticipantColumns,
  fromRole: RoleKey,
  toRole: RoleKey,
  sourceId: string,
  destinationId: string,
) {
  return {
    where: {[sourceColumn(columns, fromRole)]: sourceId},
    data: {
      [sourceColumn(columns, fromRole)]: null,
      [sourceColumn(columns, toRole)]: destinationId,
    },
  };
}

/**
 * Re-links every participant reference in one transaction. Each update writes
 * the old and new columns in one SQL UPDATE, so check-constrained participant
 * rows never pass through an intermediate all-null state.
 */
export async function migrateParticipantReferences(
  tx: Prisma.TransactionClient,
  fromRole: RoleKey,
  toRole: RoleKey,
  sourceId: string,
  destinationId: string,
) {
  for (const entry of PARTICIPANT_REFERENCE_MAP) {
    const delegate = referenceDelegate(tx, entry.model);
    await delegate.updateMany(
      participantReferenceUpdate(entry.cols, fromRole, toRole, sourceId, destinationId),
    );
  }

  const residualReferences = await Promise.all(
    PARTICIPANT_REFERENCE_MAP.map(async (entry) => {
      const delegate = referenceDelegate(tx, entry.model);
      return delegate.count({where: {[sourceColumn(entry.cols, fromRole)]: sourceId}});
    }),
  );

  if (residualReferences.some((count) => count > 0)) {
    throw new Error("Role references could not be fully migrated");
  }

  const sparDelegate = referenceDelegate(tx, "sparRecord") as SparRecordDelegate;
  const destinationColumn = sourceColumn(SPAR_SUBMITTER_COLUMNS, toRole);
  const sparRecords = await sparDelegate.findMany({
    where: {[destinationColumn]: destinationId},
    select: {memberId: true, cabinetId: true, presidentId: true},
  });

  if (sparRecords.some((record) => [record.memberId, record.cabinetId, record.presidentId].filter(Boolean).length !== 1)) {
    throw new Error("SPAR submitter references could not be validated");
  }
}

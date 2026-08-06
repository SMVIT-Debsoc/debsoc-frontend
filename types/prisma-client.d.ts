// Compatibility declarations for legacy anonymous-message routes and older
// Prisma model names that are still consumed by the application.
declare module "@prisma/client" {
  export namespace Prisma { type TransactionClient = PrismaClient; }
  export class PrismaClient {
    constructor(options?: any);
    techHead: any; president: any; cabinet: any; member: any; task: any; debateSession: any; attendance: any; sessionRoleAssignment: any; pairingProposal: any; debateRoomAssignment: any; debateTeamAssignment: any; teamSpeakerAssignment: any; roomAdjudicatorAssignment: any; unassignedParticipant: any; proposalReviewLog: any; proposalRating: any; speakerScoreRecord: any; sparRecord: any; sparSpeakerScore: any; memberMetricSnapshot: any; pairMetricSnapshot: any; teamDynamicsRating: any; chairFeedbackRecord: any; adjudicatorScoreRecord: any; pairingMetricDefinition: any; pairingMetricAdjustment: any; leaderboardSnapshot: any; metricAdjustmentHistory: any; digest: any; evalScenario: any; evalRun: any; evalScenarioResult: any; tuningReviewWindow: any; session: any; user: any; account: any; verificationToken: any; anonymousMessage: any; $transaction: any;
  }
}

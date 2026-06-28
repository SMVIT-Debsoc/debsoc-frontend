import type { MemberId, MotionType, PairingObjective, SessionId } from "./pairing.ts";

export const sessionRoles = ["speaker", "adjudicator"] as const;
export type SessionRole = (typeof sessionRoles)[number];

export interface AttendancePreparationRequest {
  sessionId: SessionId;
}

export interface SessionRoleAssignmentEntry {
  memberId: MemberId;
  isPresent: boolean;
  sessionRole: SessionRole;
}

export interface MarkAttendanceRequest {
  sessionId: SessionId;
  entries: SessionRoleAssignmentEntry[];
}

export interface AttendanceRecordView {
  participantId: MemberId;
  isPresent: boolean;
  isFinalized: boolean;
  wasAssigned: boolean;
  wasUnassigned: boolean;
  unassignedReason: import("./pairing.ts").LeftoverReason | null;
}

export interface SessionRoleAssignmentView {
  participantId: MemberId;
  role: SessionRole;
  isChair: boolean;
  roleAssignedAt: string | null;
}

export interface SessionMetadataView {
  sessionId: SessionId;
  motionType: MotionType;
  motionText: string;
  pairingObjective: PairingObjective;
  pairingStatus: string;
  publicationStatus: string;
  scoringStatus: string;
}

export interface SessionPreparationContextResponse {
  session: SessionMetadataView;
  attendance: AttendanceRecordView[];
  sessionRoles: SessionRoleAssignmentView[];
}

export interface UpdateSessionRequest {
  motionType: MotionType;
  motionText: string;
  pairingObjective: PairingObjective;
  pairingStatus?: string;
}

export interface SessionScoringTaskStatus {
  participantId: MemberId;
  sessionRole: SessionRole;
  hasSubmitted: boolean;
}

export interface SessionScoringStatusResponse {
  sessionId: SessionId;
  scoringStatus: "pending" | "open" | "partial" | "complete";
  tasks: SessionScoringTaskStatus[];
}

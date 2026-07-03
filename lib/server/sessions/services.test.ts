import test from "node:test";
import assert from "node:assert/strict";

import { createAttendanceService } from "./attendance-service.ts";
import { createSessionRoleService } from "./session-role-service.ts";
import { createSessionService } from "./session-service.ts";
import type { SessionMetadataView, SessionPreparationContextResponse, SessionRoleAssignmentView } from "../../../types/session.ts";

function createInMemorySessionRepo() {
  const session: SessionMetadataView = {
    sessionId: "session-1",
    motionType: "BP",
    motionText: "This House would...",
    pairingObjective: "BALANCED",
    pairingStatus: "DRAFT",
    publicationStatus: "DRAFT",
    scoringStatus: "pending",
  };

  let attendance: SessionPreparationContextResponse["attendance"] = [];
  let sessionRoles: SessionRoleAssignmentView[] = [];

  return {
    async getSessionById(sessionId: string) {
      return sessionId === session.sessionId ? { ...session } : null;
    },
    async getSessionPreparationContext(sessionId: string) {
      if (sessionId !== session.sessionId) {
        return null;
      }

      return {
        session: { ...session },
        attendance: attendance.map((record) => ({ ...record })),
        sessionRoles: sessionRoles.map((assignment) => ({ ...assignment })),
      };
    },
    async updateSessionState(
      sessionId: string,
      data: Partial<{
        motionType: string;
        motionText: string;
        pairingObjective: string;
        pairingStatus: string;
        publicationStatus: string;
        scoringStatus: string;
      }>,
    ) {
      assert.equal(sessionId, session.sessionId);
      Object.assign(session, data);
      return {
        id: session.sessionId,
        motionType: session.motionType,
        motiontype: session.motionType,
        motionText: session.motionText,
        pairingObjective: session.pairingObjective,
        pairingStatus: session.pairingStatus,
        publicationStatus: session.publicationStatus,
        scoringStatus: session.scoringStatus,
      };
    },
    async upsertAttendanceEntries(
      sessionId: string,
      entries: Array<{ participantId: string; participantType: "member" | "cabinet" | "president"; isPresent: boolean }>,
    ) {
      assert.equal(sessionId, session.sessionId);
      const map = new Map(attendance.map((record) => [record.participantId, record]));
      for (const entry of entries) {
        map.set(entry.participantId, {
          participantId: entry.participantId,
          isPresent: entry.isPresent,
          isFinalized: false,
          wasAssigned: false,
          wasUnassigned: false,
          unassignedReason: null,
        });
      }
      attendance = [...map.values()];
      return { count: entries.length };
    },
    async replaceSessionRoles(
      sessionId: string,
      entries: Array<{ participantId: string; isPresent: boolean; sessionRole: "speaker" | "adjudicator" }>,
    ) {
      assert.equal(sessionId, session.sessionId);
      sessionRoles = entries.map((entry) => ({
        participantId: entry.participantId,
        role: entry.sessionRole,
        isChair: false,
        roleAssignedAt: "2026-01-01T00:00:00.000Z",
      }));
    },
  };
}

test("prepare -> mark -> assign-role flow stays in session-role space", async () => {
  const repo = createInMemorySessionRepo();
  const attendanceService = createAttendanceService(repo as never, {
    async getPublishedPairing() {
      return null;
    },
  });
  const sessionRoleService = createSessionRoleService(repo as never);

  const prepared = await attendanceService.prepareAttendance({ sessionId: "session-1" });
  assert.equal(prepared.session.pairingStatus, "PREPARATION");

  const marked = await attendanceService.markAttendance({
    sessionId: "session-1",
    entries: [
      { participantId: "member-1", isPresent: true, sessionRole: "speaker" },
      { participantId: "member-2", isPresent: true, sessionRole: "adjudicator" },
    ],
  });
  assert.equal(marked.attendance.length, 2);
  assert.equal(marked.sessionRoles.length, 2);

  const assigned = await sessionRoleService.assignSessionRole({
    sessionId: "session-1",
    userId: "member-2",
    role: "speaker",
  });
  assert.equal(assigned?.participantId, "member-2");
  assert.equal(assigned?.role, "speaker");
});

test("illegal lifecycle transition is guarded before generation-ready state", async () => {
  const repo = createInMemorySessionRepo();
  const sessionService = createSessionService(repo as never);

  await assert.rejects(
    sessionService.updateSessionLifecycleState({
      sessionId: "session-1",
      pairingStatus: "READY",
    }),
    /Illegal lifecycle transition|Cannot move session forward/,
  );
});

test("member scoring-status read returns an empty task list when they have no scoring obligation", async () => {
  const repo = createInMemorySessionRepo();
  const sessionService = createSessionService(repo as never, {
    async getPublishedScoringContext() {
      return {
        sessionId: "session-1",
        proposalId: "proposal-1",
        motionType: "BP",
        publicationStatus: "published",
        roles: [
          { participantId: "speaker-1", role: "speaker", isChair: false },
          { participantId: "chair-1", role: "adjudicator", isChair: true },
          { participantId: "panel-1", role: "adjudicator", isChair: false },
        ],
        rooms: [
          {
            roomIndex: 0,
            speakers: [{ participantId: "speaker-1", bpPosition: "OG", speakingRole: "PM" }],
            adjudicators: [
              { participantId: "chair-1", isChair: true },
              { participantId: "panel-1", isChair: false },
            ],
          },
        ],
      };
    },
    async getChairFeedbackBySession() {
      return [];
    },
    async getAdjudicatorScoreRecordsBySession() {
      return [];
    },
    async getSpeakerScoreRecordsBySession() {
      return [];
    },
  } as never);

  const result = await sessionService.getSessionScoringStatus({
    sessionId: "session-1",
    viewerId: "panel-1",
    viewerRole: "Member",
  });

  assert.deepEqual(result.tasks, []);
  assert.equal(result.scoringStatus, "pending");
});

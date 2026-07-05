import type { PrismaClient } from "@prisma/client";

import { prisma } from "../prisma.ts";

// Composite read for the dashboard bootstrap payload (roster + sessions with
// their accepted/published proposals and attendance). Extracted from the API
// route so all Prisma access lives in a repository and the read can be cached.
export function createDashboardRepository(client: PrismaClient = prisma) {
  async function getBootstrapData() {
    const [members, cabinet, presidents, sessions] = await Promise.all([
      client.member.findMany({
        select: { id: true, name: true, email: true, isVerified: true },
      }),
      client.cabinet.findMany({
        select: { id: true, name: true, email: true, position: true, isVerified: true },
      }),
      client.president.findMany({
        select: { id: true, name: true, email: true, isVerified: true },
      }),
      client.debateSession.findMany({
        orderBy: { sessionDate: "desc" },
        select: {
          id: true,
          sessionDate: true,
          motiontype: true,
          motionType: true,
          motionText: true,
          pairingObjective: true,
          pairingStatus: true,
          publicationStatus: true,
          scoringStatus: true,
          Chair: true,
          attendance: {
            select: {
              id: true,
              status: true,
              speakerScore: true,
              pairingCode: true,
              debatedAlone: true,
              member: { select: { id: true, name: true } },
              cabinet: { select: { id: true, name: true } },
              president: { select: { id: true, name: true } },
            },
          },
          acceptedProposal: {
            select: {
              roomAssignments: {
                orderBy: { roomIndex: "asc" },
                select: {
                  teamAssignments: {
                    select: {
                      bpPosition: true,
                      speakerAssignments: {
                        orderBy: { speakerOrder: "asc" },
                        select: {
                          speakingRole: true,
                          member: { select: { id: true, name: true } },
                          cabinet: { select: { id: true, name: true } },
                          president: { select: { id: true, name: true } },
                        },
                      },
                    },
                  },
                  adjudicatorAssignments: {
                    select: {
                      isChair: true,
                      member: { select: { id: true, name: true } },
                      cabinet: { select: { id: true, name: true } },
                      president: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
          publishedProposal: {
            select: {
              roomAssignments: {
                orderBy: { roomIndex: "asc" },
                select: {
                  teamAssignments: {
                    select: {
                      bpPosition: true,
                      speakerAssignments: {
                        orderBy: { speakerOrder: "asc" },
                        select: {
                          speakingRole: true,
                          member: { select: { id: true, name: true } },
                          cabinet: { select: { id: true, name: true } },
                          president: { select: { id: true, name: true } },
                        },
                      },
                    },
                  },
                  adjudicatorAssignments: {
                    select: {
                      isChair: true,
                      member: { select: { id: true, name: true } },
                      cabinet: { select: { id: true, name: true } },
                      president: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return { members, cabinet, presidents, sessions };
  }

  type ViewerWhere =
    | { memberId: string }
    | { cabinetId: string }
    | { presidentId: string };

  // The viewer's own attendance rows plus the sessions they were published into.
  async function getSelfAttendanceBundle(where: ViewerWhere) {
    const [attendance, publishedSessions] = await Promise.all([
      client.attendance.findMany({
        where,
        select: {
          id: true,
          memberId: true,
          cabinetId: true,
          presidentId: true,
          status: true,
          speakerScore: true,
          pairingCode: true,
          debatedAlone: true,
          session: {
            select: { id: true, sessionDate: true, motiontype: true, motionType: true, Chair: true },
          },
        },
      }),
      client.debateSession.findMany({
        where: {
          publicationStatus: "PUBLISHED",
          OR: [
            // Session-role assignments cover present participants, including
            // leftover/unassigned debaters, without forcing the wider
            // attendance-based branch on every published-session refresh.
            { sessionRoleAssignments: { some: where } },
            {
              publishedProposal: {
                roomAssignments: {
                  some: { teamAssignments: { some: { speakerAssignments: { some: where } } } },
                },
              },
            },
            {
              publishedProposal: {
                roomAssignments: { some: { adjudicatorAssignments: { some: where } } },
              },
            },
          ],
        },
        orderBy: { sessionDate: "desc" },
        select: {
          id: true,
          sessionDate: true,
          motiontype: true,
          motionType: true,
          motionText: true,
          Chair: true,
          pairingStatus: true,
          publicationStatus: true,
          scoringStatus: true,
        },
      }),
    ]);

    return { attendance, publishedSessions };
  }

  // Co-participants sharing a pairing code within one session (for "paired with").
  async function getPairingPeers(sessionId: string, pairingCode: string) {
    return client.attendance.findMany({
      where: { sessionId, pairingCode },
      select: {
        memberId: true,
        cabinetId: true,
        presidentId: true,
        member: { select: { name: true } },
        cabinet: { select: { name: true } },
        president: { select: { name: true } },
      },
    });
  }

  return { getBootstrapData, getSelfAttendanceBundle, getPairingPeers };
}

export const dashboardRepository = createDashboardRepository();


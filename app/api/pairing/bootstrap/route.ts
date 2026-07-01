import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const guard = await requireSessionUser({
    roles: ["cabinet", "President", "TechHead"],
    requireVerified: true,
  });
  if ("response" in guard) return guard.response;

  const [members, cabinet, presidents, sessions] = await Promise.all([
    prisma.member.findMany({
      select: { id: true, name: true, email: true, isVerified: true },
    }),
    prisma.cabinet.findMany({
      select: { id: true, name: true, email: true, position: true, isVerified: true },
    }),
    prisma.president.findMany({
      select: { id: true, name: true, email: true, isVerified: true },
    }),
    prisma.debateSession.findMany({
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

  return ok({ members, cabinet, presidents, sessions });
}

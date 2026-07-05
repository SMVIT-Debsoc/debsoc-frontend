import { dashboardRepository } from "../repositories/dashboard-repository.ts";
import { getOrLoad } from "../cache/cache.ts";
import { cacheKeys, CACHE_TAGS, CACHE_TTL } from "../cache/keys.ts";

// Cached dashboard bootstrap read. Carries both `sessions` and `roster` tags so
// it is invalidated by session/attendance changes and by roster changes
// (verification, role updates). The value can be large, so cache.ts keeps
// oversized payloads in L1 only rather than pushing them to Redis.
export function getDashboardBootstrap() {
  return getOrLoad(
    cacheKeys.bootstrap(),
    { tags: [CACHE_TAGS.sessions, CACHE_TAGS.roster], ...CACHE_TTL.bootstrap },
    () => dashboardRepository.getBootstrapData(),
  );
}

type ViewerRole = "Member" | "cabinet" | "President" | "TechHead";

type AttendancePeer = {
  memberId: string | null;
  cabinetId: string | null;
  presidentId: string | null;
  member: { name: string } | null;
  cabinet: { name: string } | null;
  president: { name: string } | null;
};

function matchesViewer(peer: AttendancePeer, role: ViewerRole, viewerId: string) {
  if (role === "cabinet") return peer.cabinetId === viewerId;
  if (role === "President") return peer.presidentId === viewerId;
  return peer.memberId === viewerId;
}

type SelfAttendanceRecord = {
  id: string;
  memberId: string | null;
  cabinetId: string | null;
  presidentId: string | null;
  status: string;
  speakerScore: number | null;
  pairingCode: string | null;
  debatedAlone: boolean;
  session: {
    id: string;
    sessionDate: Date | string;
    motiontype: string;
    motionType: string | null;
    Chair: string;
  };
};

type SelfPublishedSession = {
  id: string;
  sessionDate: Date | string;
  motiontype: string;
  motionType: string | null;
  motionText: string | null;
  Chair: string;
  pairingStatus: string | null;
  publicationStatus: string | null;
  scoringStatus: string | null;
};

// Cached, per-viewer "my attendance + published sessions" read used by the
// member/cabinet/president dashboards. Keyed per user; carries the `sessions`
// tag so attendance marks, publishes, and lifecycle changes invalidate it.
export function getSelfAttendance(role: ViewerRole, userId: string) {
  if (role === "TechHead") {
    return Promise.resolve({ attendance: [] as unknown[], publishedSessions: [] as unknown[] });
  }

  return getOrLoad(
    cacheKeys.selfAttendance(role, userId),
    { tags: [CACHE_TAGS.sessions], ...CACHE_TTL.attendance },
    async () => {
      const where =
        role === "cabinet"
          ? { cabinetId: userId }
          : role === "President"
            ? { presidentId: userId }
            : { memberId: userId };

      const bundle = await dashboardRepository.getSelfAttendanceBundle(where);
      const attendance = bundle.attendance as SelfAttendanceRecord[];
      const publishedSessions = bundle.publishedSessions as SelfPublishedSession[];

      attendance.sort(
        (a, b) =>
          new Date(b.session.sessionDate).getTime() - new Date(a.session.sessionDate).getTime(),
      );

      const enrichedAttendance = await Promise.all(
        attendance.map(async (record) => {
          if (!record.pairingCode || record.debatedAlone) {
            return { ...record, pairedWith: [] as string[] };
          }
          const peers = (await dashboardRepository.getPairingPeers(
            record.session.id,
            record.pairingCode,
          )) as AttendancePeer[];
          const pairedWith = peers
            .filter((peer) => !matchesViewer(peer, role, userId))
            .map((peer) => peer.member?.name ?? peer.cabinet?.name ?? peer.president?.name ?? null)
            .filter((name): name is string => Boolean(name));
          return {
            ...record,
            pairedWith,
            session: {
              ...record.session,
              motiontype: record.session.motionType ?? record.session.motiontype,
            },
          };
        }),
      );

      return {
        attendance: enrichedAttendance,
        publishedSessions: publishedSessions.map((session) => ({
          id: session.id,
          sessionDate: session.sessionDate,
          motiontype: session.motionType ?? session.motiontype,
          motionText: session.motionText,
          Chair: session.Chair,
          pairingStatus: session.pairingStatus,
          publicationStatus: session.publicationStatus,
          scoringStatus: session.scoringStatus,
        })),
      };
    },
  );
}


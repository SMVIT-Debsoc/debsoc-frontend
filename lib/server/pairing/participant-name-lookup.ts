import { prisma } from "@/lib/server/prisma";
import type { PublishedPairingView } from "@/types/pairing";

export async function resolveParticipantNames(
  publishedPairing: PublishedPairingView,
): Promise<Record<string, string>> {
  const ids = new Set<string>();
  for (const room of publishedPairing.rooms) {
    for (const team of room.teams) {
      for (const s of team.speakers) ids.add(s.participantId);
    }
    for (const a of room.adjudicators) ids.add(a.participantId);
  }
  for (const u of publishedPairing.unassignedParticipants ?? []) ids.add(u.participantId);
  if (ids.size === 0) return {};

  const idList = Array.from(ids);
  const [members, cabinet, presidents] = await Promise.all([
    prisma.member.findMany({ where: { id: { in: idList } }, select: { id: true, name: true } }),
    prisma.cabinet.findMany({ where: { id: { in: idList } }, select: { id: true, name: true } }),
    prisma.president.findMany({ where: { id: { in: idList } }, select: { id: true, name: true } }),
  ]);

  const map: Record<string, string> = {};
  for (const row of [...members, ...cabinet, ...presidents]) {
    if (row.id && row.name) map[row.id] = row.name;
  }
  return map;
}

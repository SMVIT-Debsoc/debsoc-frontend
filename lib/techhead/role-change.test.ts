import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {
  migrateParticipantReferences,
  PARTICIPANT_REFERENCE_MAP,
  participantReferenceUpdate,
} from "../server/techhead/role-migration.ts";

type Row = Record<string, string | null>;

function createReferenceHarness() {
  const sourceId = "cabinet-source";
  const destinationId = "member-destination";
  const rows = new Map<string, Row[]>();

  for (const entry of PARTICIPANT_REFERENCE_MAP) {
    const existing = rows.get(entry.model) ?? [];
    const sourceColumn = entry.cols.cabinet;
    if (entry.model === "sparRecord" && sourceColumn === "cabinetId") {
      existing.push({id: "spar-history-1", memberId: null, cabinetId: sourceId, presidentId: null});
    } else if (entry.model === "sparRecord" && sourceColumn === "teammateCabinetId") {
      existing.push({id: "spar-history-2", memberId: "other-member", cabinetId: null, presidentId: null, teammateCabinetId: sourceId});
    } else {
      existing.push({id: `${entry.model}-${sourceColumn}`, [sourceColumn]: sourceId});
    }
    rows.set(entry.model, existing);
  }

  const delegate = (model: string) => ({
    async updateMany({where, data}: {where: Row; data: Row}) {
      const table = rows.get(model) ?? [];
      const [whereColumn, whereValue] = Object.entries(where)[0] ?? [];
      for (const row of table) {
        if (whereColumn && row[whereColumn] === whereValue) Object.assign(row, data);
      }
      return {count: table.length};
    },
    async count({where}: {where: Row}) {
      const table = rows.get(model) ?? [];
      const [whereColumn, whereValue] = Object.entries(where)[0] ?? [];
      return table.filter((row) => Boolean(whereColumn) && row[whereColumn] === whereValue).length;
    },
    async findMany({where}: {where: Row}) {
      const table = rows.get(model) ?? [];
      const [whereColumn, whereValue] = Object.entries(where)[0] ?? [];
      return table.filter((row) => Boolean(whereColumn) && row[whereColumn] === whereValue);
    },
  });

  return {
    sourceId,
    destinationId,
    rows,
    tx: Object.fromEntries([...new Set(PARTICIPANT_REFERENCE_MAP.map(({model}) => model))].map((model) => [model, delegate(model)])),
  };
}

test("role migration rewrites SparRecord submitters atomically and preserves history rows", async () => {
  const harness = createReferenceHarness();

  await migrateParticipantReferences(
    harness.tx as never,
    "cabinet",
    "member",
    harness.sourceId,
    harness.destinationId,
  );

  const sparRows = harness.rows.get("sparRecord") ?? [];
  const submitter = sparRows.find((row) => row.id === "spar-history-1");
  const teammate = sparRows.find((row) => row.id === "spar-history-2");
  assert.deepEqual(
    {memberId: submitter?.memberId, cabinetId: submitter?.cabinetId, presidentId: submitter?.presidentId},
    {memberId: harness.destinationId, cabinetId: null, presidentId: null},
  );
  assert.equal(teammate?.teammateCabinetId, null);
  assert.equal(teammate?.teammateMemberId, harness.destinationId);
  assert.equal(submitter?.id, "spar-history-1");
  assert.equal(teammate?.id, "spar-history-2");
});

test("participant reference updates never disconnect before connecting", () => {
  const update = participantReferenceUpdate(
    {member: "memberId", cabinet: "cabinetId", president: "presidentId"},
    "cabinet",
    "member",
    "cabinet-source",
    "member-destination",
  );

  assert.deepEqual(update, {
    where: {cabinetId: "cabinet-source"},
    data: {cabinetId: null, memberId: "member-destination"},
  });
});

test("role migration source contract is transactional and deletes only after reference validation", async () => {
  const source = await readFile(new URL("../../lib/server/debsoc-service.ts", import.meta.url), "utf8");
  const migrationStart = source.indexOf("await migrateParticipantReferences");
  const cabinetDelete = source.indexOf("await tx.cabinet.delete", migrationStart);

  assert.match(source, /prisma\.\$transaction\(/);
  assert.ok(migrationStart > 0);
  assert.ok(cabinetDelete > migrationStart);
  assert.match(source, /tx\.member\.upsert/);
  assert.match(source, /source\.password/);
  assert.match(source, /source\.email/);
});

test("role-change route and dialog do not expose backend error bodies", async () => {
  const route = await readFile(new URL("../../app/api/techhead/change-role/route.ts", import.meta.url), "utf8");
  const dashboard = await readFile(new URL("../../components/TechHeadDashboard/index.tsx", import.meta.url), "utf8");

  assert.match(route, /catch \{[\s\S]*return error\(ROLE_CHANGE_FAILURE, 500\);/);
  assert.doesNotMatch(dashboard, /err\.message/);
  assert.match(dashboard, /Could not change this user’s role\. No records were deleted/);
  assert.match(dashboard, /role="dialog"/);
  assert.match(dashboard, /bg-primary px-4 py-3/);
  assert.match(dashboard, /event\.key === "Escape"/);
  assert.match(dashboard, /aria-modal="true"/);
});

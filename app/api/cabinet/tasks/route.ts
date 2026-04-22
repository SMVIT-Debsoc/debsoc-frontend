import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    const guard = await requireSessionUser({ roles: ["cabinet", "President"], requireVerified: true });
    if ("response" in guard) return guard.response;

    try {
      const tasks =
        guard.user.role === "cabinet"
          ? await prisma.task.findMany({ where: { assignedToId: guard.user.id } })
          : await prisma.task.findMany();

      return ok({ tasks });
    } catch (primaryError) {
      console.error("[cabinet/tasks] primary query failed", primaryError);
      try {
        const tasks = await prisma.task.findMany();
        return ok({
          tasks:
            guard.user.role === "cabinet"
              ? tasks.filter(
                  (task: { assignedToId: string | null }) =>
                    task.assignedToId === guard.user.id,
                )
              : tasks,
        });
      } catch (fallbackError) {
        console.error("[cabinet/tasks] fallback query failed", fallbackError);
        return ok({ tasks: [] });
      }
    }
  } catch (unhandledError) {
    console.error("[cabinet/tasks] unhandled GET failure", unhandledError);
    return ok({ tasks: [] });
  }
}

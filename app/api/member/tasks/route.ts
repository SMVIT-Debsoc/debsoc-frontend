import { error, ok, parseJson } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const guard = await requireSessionUser({ roles: ["Member"], requireVerified: true });
  if ("response" in guard) return guard.response;

  try {
    const tasks = await prisma.task.findMany({ where: { assignedToMemberId: guard.user.id } });
    return ok({ tasks });
  } catch (primaryError) {
    console.error("[member/tasks] primary query failed", primaryError);
    try {
      const tasks = await prisma.task.findMany();
      return ok({
        tasks: tasks.filter((task) => task.assignedToMemberId === guard.user.id),
      });
    } catch (fallbackError) {
      console.error("[member/tasks] fallback query failed", fallbackError);
      return ok({ tasks: [] });
    }
  }
}

export async function PATCH(request: Request) {
  const guard = await requireSessionUser({ roles: ["Member"], requireVerified: true });
  if ("response" in guard) return guard.response;

  const body = await parseJson<{ taskId?: string; completed?: boolean }>(request);
  if (!body.taskId || typeof body.completed !== "boolean") {
    return error("Please provide taskId and completed", 400);
  }

  const task = await prisma.task.findFirst({
    where: {
      id: body.taskId,
      assignedToMemberId: guard.user.id,
    },
  });

  if (!task) {
    return error("Task not found", 404);
  }

  const updatedTask = await prisma.task.update({
    where: { id: body.taskId },
    data: { completed: body.completed },
  });

  return ok({ task: updatedTask });
}

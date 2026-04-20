import { error, ok, parseJson } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function POST(request: Request) {
  const guard = await requireSessionUser({ roles: ["President"], requireVerified: true });
  if ("response" in guard) return guard.response;

  try {
    const body = await parseJson<{
      name?: string;
      description?: string;
      deadline?: string;
      assignedToId?: string;
      assignedToMemberId?: string;
    }>(request);

    if (!body.name || !body.description || !body.deadline) {
      return error("Please provide name, description, and deadline", 400);
    }

    if (!body.assignedToId && !body.assignedToMemberId) {
      return error("Please assign task to either a cabinet member or a member", 400);
    }

    const task = await prisma.task.create({
      data: {
        name: body.name,
        description: body.description,
        deadline: new Date(body.deadline),
        assignedToId: body.assignedToId ?? null,
        assignedToMemberId: body.assignedToMemberId ?? null,
      },
    });

    return ok({ message: "Task assigned successfully", task }, { status: 201 });
  } catch (err) {
    return error(err instanceof Error ? err.message : "Internal server error", 400);
  }
}

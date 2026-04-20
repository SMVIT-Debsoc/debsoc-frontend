import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { error } from "@/lib/server/http";
import type { DebsocRole, SessionUser } from "@/lib/server/roles";

type GuardOptions = {
  roles?: DebsocRole[];
  requireVerified?: boolean;
};

export async function requireSessionUser(options: GuardOptions = {}): Promise<
  | { user: SessionUser }
  | { response: Response }
> {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id || !user.role) {
    return { response: error("Unauthorized", 401) };
  }

  if (options.roles && !options.roles.includes(user.role)) {
    return {
      response: error(
        `Forbidden: You do not have access to this resource. Required roles: ${options.roles.join(", ")}`,
        403,
      ),
    };
  }

  if (options.requireVerified && user.role !== "TechHead" && !user.isVerified) {
    return { response: error("Forbidden: Account not verified", 403) };
  }

  return {
    user: {
      id: user.id,
      name: user.name ?? "",
      email: user.email ?? "",
      role: user.role,
      isVerified: user.isVerified,
    },
  };
}

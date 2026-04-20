export type DebsocRole = "TechHead" | "President" | "cabinet" | "Member";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: DebsocRole;
  isVerified: boolean;
};

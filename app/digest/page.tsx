import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { getAppSession } from "@/lib/server/dev-session";
import { getActiveDigest } from "@/lib/server/digest";
import { parseDigest } from "@/lib/digest/parse";
import DigestCards from "@/components/digest/DigestCards";
import type { DebsocRole } from "@/lib/server/roles";

// Never cache the page itself — the auth gate runs per request. The expensive
// DB read is cached separately inside getActiveDigest().
export const dynamic = "force-dynamic";

const ALLOWED_ROLES: DebsocRole[] = ["Member", "cabinet", "President", "TechHead"];

export default async function DigestPage() {
  const session = await getAppSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/dashboard");
  }

  if (!session.user.isVerified) {
    redirect("/unverified");
  }

  const digest = await getActiveDigest();

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      {digest ? (
        <DigestCards
          sections={parseDigest(digest.text)}
          updatedAt={digest.createdAt}
        />
      ) : (
        <EmptyState />
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Inbox className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-slate-50">
        No digest yet
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Today&rsquo;s debate digest hasn&rsquo;t arrived, or the last one has
        expired. Check back after the next weekday digest is published.
      </p>
    </section>
  );
}

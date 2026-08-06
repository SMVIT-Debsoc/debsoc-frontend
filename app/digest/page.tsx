import { redirect } from "next/navigation";
import { BookOpenText } from "lucide-react";
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
    <main className="min-h-screen bg-background text-foreground">
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
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <BookOpenText className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold text-foreground">
        Today&rsquo;s Digest is still being prepared.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Please check back later.</p>
    </section>
  );
}

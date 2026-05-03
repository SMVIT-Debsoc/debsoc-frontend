import { error, ok, parseJson } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    const data = await parseJson<Record<string, unknown>>(request);
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || process.env.NEXT_PUBLIC_HIRING_WEBHOOK_URL;

    if (!webhookUrl) {
      return ok({
        success: true,
        message: "No webhook configured, payload ignored.",
      });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(data),
      redirect: "follow",
    });

    if (!response.ok) {
      return error(`Failed to forward data: ${response.statusText}`, 500);
    }

    return ok({ success: true, message: "Registration successful" });
  } catch (err) {
    return error(err instanceof Error ? err.message : "Internal server error", 500);
  }
}

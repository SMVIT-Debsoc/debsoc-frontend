const BACKEND_BASE_URL = (
    process.env.PD_VIRTUAL_ASSISTANT_URL ??
    process.env.NEXT_PUBLIC_PD_VIRTUAL_ASSISTANT_URL ??
    process.env.NEXT_PUBLIC_VIRTUAL_OC ??
    "https://pd-virtual-assistant.vercel.app"
).replace(/\/$/, "");

export async function POST(request: Request) {
    const body = await request.text();

    const response = await fetch(`${BACKEND_BASE_URL}/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body,
    });

    const headers = new Headers({
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    });

    const retryAfter = response.headers.get("Retry-After");
    if (retryAfter) {
        headers.set("Retry-After", retryAfter);
    }

    return new Response(await response.text(), {
        status: response.status,
        headers,
    });
}

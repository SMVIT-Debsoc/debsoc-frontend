const BACKEND_BASE_URL = (
    process.env.PD_VIRTUAL_ASSISTANT_URL ??
    process.env.NEXT_PUBLIC_PD_VIRTUAL_ASSISTANT_URL ??
    process.env.NEXT_PUBLIC_VIRTUAL_OC ??
    "https://pd-virtual-assistant.vercel.app"
).replace(/\/$/, "");

export async function DELETE(request: Request) {
    const body = await request.text();

    const response = await fetch(`${BACKEND_BASE_URL}/session/reset`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body,
    });

    return new Response(await response.text(), {
        status: response.status,
        headers: {
            "Content-Type": response.headers.get("Content-Type") ?? "application/json",
        },
    });
}

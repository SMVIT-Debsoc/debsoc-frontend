import { NextResponse } from "next/server";

export function ok(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }
  if (!headers.has("Pragma")) {
    headers.set("Pragma", "no-cache");
  }
  if (!headers.has("Expires")) {
    headers.set("Expires", "0");
  }

  return NextResponse.json(data, {
    ...init,
    headers,
  });
}

export function error(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ message, ...extra }, { status });
}

export async function parseJson<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed for ${url}`;
    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) message = data.message;
    } catch {
      // Preserve the endpoint-level fallback when the response is not JSON.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

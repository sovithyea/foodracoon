import { NextResponse } from "next/server";

export function BadRequest(msg: string): NextResponse {
  return NextResponse.json({ error: msg }, { status: 400 });
}

/**
 * Parse request body as JSON, enforcing an allowlist of field names.
 * Extra keys not in `allowed` cause a 400. Malformed JSON causes a 400.
 */
export async function parseBody<T extends Record<string, unknown>>(
  request: Request,
  allowed: (keyof T)[],
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    const text = await request.text();
    if (!text.trim()) return { ok: true, data: {} as T };
    raw = JSON.parse(text);
  } catch {
    return { ok: false, response: BadRequest("Malformed JSON") };
  }

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, response: BadRequest("Request body must be a JSON object") };
  }

  const unexpected = Object.keys(raw).filter(
    (k) => !(allowed as string[]).includes(k),
  );
  if (unexpected.length > 0) {
    return { ok: false, response: BadRequest(`Unexpected fields: ${unexpected.join(", ")}`) };
  }

  const data = {} as T;
  for (const key of allowed) {
    if (key in (raw as Record<string, unknown>)) {
      (data as Record<string, unknown>)[key as string] =
        (raw as Record<string, unknown>)[key as string];
    }
  }
  return { ok: true, data };
}

/**
 * Returns true if the request origin/referer matches the request host,
 * or if neither header is present (non-browser / server-to-server call).
 */
export function checkOrigin(request: Request): boolean {
  const host = request.headers.get("host");
  if (!host) return true;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  return true;
}

export function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

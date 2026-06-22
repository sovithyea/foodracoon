type Window = { count: number; resetAt: number };

const store = new Map<string, Window>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

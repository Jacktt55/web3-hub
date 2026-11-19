/**
 * Tiny localStorage cache for live data — the rate-limit fallback.
 * When a public endpoint answers 429 (or is offline), the app serves
 * the last good value within its TTL instead of going blank or
 * showing a stale seed. Cache lives in the visitor's own browser.
 */
export function saveCache<T>(key: string, data: T): void {
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ at: Date.now(), data }),
    );
  } catch {
    // storage full / unavailable — cache is best-effort
  }
}

export function loadCache<T>(key: string, maxAgeMs: number): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: T };
    if (typeof parsed.at !== 'number') return null;
    if (Date.now() - parsed.at > maxAgeMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

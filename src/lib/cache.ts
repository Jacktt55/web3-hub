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

/**
 * 60-second localStorage cache wrapper for public JSON APIs
 * (DefiLlama prices/yields): a page refresh or tab switch within the
 * window reuses the stored response instead of hitting the API again.
 * On fetch failure it serves any stored value (any age) as a last
 * resort and only throws when there is nothing stored at all.
 */
export async function cachedFetchJson<T>(
  key: string,
  url: string,
  ttlMs: number,
  timeoutMs: number,
): Promise<T> {
  const fresh = loadCache<T>(key, ttlMs);
  if (fresh !== null) return fresh;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as T;
    saveCache(key, json);
    return json;
  } catch (err) {
    const stale = loadCache<T>(key, Number.MAX_SAFE_INTEGER);
    if (stale !== null) return stale;
    throw err;
  }
}

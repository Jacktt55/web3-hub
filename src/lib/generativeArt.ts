/**
 * Deterministic generative SVG artwork (data URI).
 * One seed → one unique composition, so a demo collection never shows
 * a broken image link. Vector SVG stays crisp at any size.
 */
export function generativeArt(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = (n: number): number => {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296 * n;
  };

  const hue = Math.floor(rand(360));
  const hue2 = (hue + 40 + Math.floor(rand(80))) % 360;
  const shapes: string[] = [];
  const count = 4 + Math.floor(rand(3));
  for (let i = 0; i < count; i++) {
    const x = 40 + rand(432);
    const y = 40 + rand(432);
    const r = 24 + rand(90);
    const fill = `hsl(${Math.floor(hue + rand(60) - 30)}, ${65 + Math.floor(rand(25))}%, ${50 + Math.floor(rand(20))}%)`;
    const opacity = (0.55 + rand(0.4)).toFixed(2);
    if (i % 3 === 0) {
      shapes.push(
        `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(0)}" fill="${fill}" fill-opacity="${opacity}"/>`,
      );
    } else if (i % 3 === 1) {
      shapes.push(
        `<rect x="${(x - r).toFixed(0)}" y="${(y - r).toFixed(0)}" width="${(r * 2).toFixed(0)}" height="${(r * 2).toFixed(0)}" rx="${(r / 3).toFixed(0)}" fill="${fill}" fill-opacity="${opacity}"/>`,
      );
    } else {
      shapes.push(
        `<polygon points="${x.toFixed(0)},${(y - r).toFixed(0)} ${(x + r).toFixed(0)},${(y + r).toFixed(0)} ${(x - r).toFixed(0)},${(y + r).toFixed(0)}" fill="${fill}" fill-opacity="${opacity}"/>`,
      );
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,14%)"/><stop offset="1" stop-color="hsl(${hue2},70%,26%)"/></linearGradient></defs><rect width="512" height="512" fill="url(#g)"/>${shapes.join('')}<circle cx="256" cy="256" r="86" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="3"/><circle cx="256" cy="256" r="52" fill="rgba(255,255,255,0.12)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

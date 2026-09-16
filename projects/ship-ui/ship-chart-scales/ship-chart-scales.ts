/**
 * Pure, dependency-free helpers shared by every Ship chart: scales, ticks and
 * SVG path builders. Import only what you use; nothing here has side effects.
 */

/** Maps a numeric domain onto a numeric range. */
export interface ShipLinearScale {
  (value: number): number;
  domain: [number, number];
  range: [number, number];
  invert(position: number): number;
}

/** A point in chart space. */
export interface ShipPoint {
  x: number;
  y: number;
}

export type ShipCurve = 'linear' | 'monotone' | 'step';

/** Smallest and largest finite value, or `[0, 1]` when there is none. */
export function extent(values: readonly number[]): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return min === Infinity ? [0, 1] : [min, max];
}

/** Linear scale. A degenerate domain (`min === max`) maps to the middle of the range. */
export function linearScale(domain: [number, number], range: [number, number]): ShipLinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  const scale = ((value: number) =>
    span === 0 ? (r0 + r1) / 2 : r0 + ((value - d0) / span) * (r1 - r0)) as ShipLinearScale;
  scale.domain = domain;
  scale.range = range;
  scale.invert = (position) => (r1 - r0 === 0 ? d0 : d0 + ((position - r0) / (r1 - r0)) * span);
  return scale;
}

/** Rounds a step to 1, 2, 5 or 10 times a power of ten (`niceTicks` uses it). */
export function niceStep(rawStep: number): number {
  if (rawStep <= 0 || !Number.isFinite(rawStep)) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const fraction = rawStep / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

/** Human-friendly tick values covering the domain, about `count` of them. */
export function niceTicks(domain: [number, number], count = 5): number[] {
  const [min, max] = domain[0] <= domain[1] ? domain : [domain[1], domain[0]];
  if (min === max) return [min];
  const step = niceStep((max - min) / Math.max(1, count));
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= max + step / 1e6; value += step) ticks.push(Number(value.toFixed(12)));
  return ticks;
}

/** Widens a domain to nice tick boundaries so the extremes are not glued to the edge. */
export function niceDomain(domain: [number, number], count = 5): [number, number] {
  const [min, max] = domain;
  if (min === max) return [min - 1, max + 1];
  const step = niceStep((max - min) / Math.max(1, count));
  return [Math.floor(min / step) * step, Math.ceil(max / step) * step];
}

/** SVG path `d` for a line through the points. */
export function linePath(points: readonly ShipPoint[], curve: ShipCurve = 'linear'): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${fmt(points[0].x)},${fmt(points[0].y)}`;
  switch (curve) {
    case 'monotone':
      return monotonePath(points);
    case 'step':
      return stepPath(points);
    default:
      return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmt(p.x)},${fmt(p.y)}`).join('');
  }
}

/** SVG path `d` for the area between the line and `baseline` (a y position). */
export function areaPath(points: readonly ShipPoint[], baseline: number, curve: ShipCurve = 'linear'): string {
  if (points.length === 0) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath(points, curve)}L${fmt(last.x)},${fmt(baseline)}L${fmt(first.x)},${fmt(baseline)}Z`;
}

/** Fritsch–Carlson monotone cubic interpolation: smooth without overshooting the data. */
function monotonePath(points: readonly ShipPoint[]): string {
  const n = points.length;
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1].x - points[i].x;
    dy[i] = points[i + 1].y - points[i].y;
    m[i] = dx[i] === 0 ? 0 : dy[i] / dx[i];
  }
  const tangents: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    tangents[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  }
  tangents[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / m[i];
    const b = tangents[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      tangents[i] = t * a * m[i];
      tangents[i + 1] = t * b * m[i];
    }
  }
  let d = `M${fmt(points[0].x)},${fmt(points[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const h = dx[i] / 3;
    d += `C${fmt(p0.x + h)},${fmt(p0.y + tangents[i] * h)},${fmt(p1.x - h)},${fmt(p1.y - tangents[i + 1] * h)},${fmt(p1.x)},${fmt(p1.y)}`;
  }
  return d;
}

function stepPath(points: readonly ShipPoint[]): string {
  let d = `M${fmt(points[0].x)},${fmt(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    const mid = (points[i - 1].x + points[i].x) / 2;
    d += `L${fmt(mid)},${fmt(points[i - 1].y)}L${fmt(mid)},${fmt(points[i].y)}L${fmt(points[i].x)},${fmt(points[i].y)}`;
  }
  return d;
}

function fmt(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}

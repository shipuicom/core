import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
} from '@angular/core';
import { areaPath, extent, linearScale, linePath, ShipCurve, ShipPoint } from '@ship-ui/core/ship-chart-scales';

/** Palette the sparkline can inherit. Matches Ship's `ShipColor` without importing core. */
export type ShipChartSparklineColor = 'primary' | 'accent' | 'warn' | 'error' | 'success' | '';

/**
 * A tiny standalone line chart: one series, no axes, no runtime dependencies
 * beyond `@ship-ui/core/ship-chart-scales`. It scales to whatever box it is
 * given and is styled entirely through custom properties on the host.
 *
 * With `animate`, data changes tween: a value appended on the right slides in,
 * a value dropped from the left slides out, and the line eases to its new scale.
 *
 * ```html
 * <sh-chart-sparkline [data]="[3, 5, 2, 8, 6]" />
 * <sh-chart-sparkline [data]="values" color="success" curve="monotone" area dot />
 * <sh-chart-sparkline [data]="live()" animate dot />
 * ```
 */
@Component({
  selector: 'sh-chart-sparkline',
  template: `
    <svg [attr.viewBox]="viewBox()" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      @if (area()) {
        <path class="area" [attr.d]="areaD()" />
      }
      <path class="line" [attr.d]="lineD()" />
    </svg>
    @if (dot() && last(); as point) {
      <span class="dot" [style.--x]="point.x" [style.--y]="point.y"></span>
    }
  `,
  styles: `
    :host {
      --chart-stroke: var(--primary-8, #3b82f6);
      --chart-fill: var(--primary-3, #bfdbfe);
      --chart-fill-opacity: 0.6;
      --chart-stroke-width: 2;
      --chart-dot-size: 6px;
      --chart-h: 2rem;
      /* Vertical inset so a stroke on the highest or lowest value is not cut in half. */
      --chart-pad: calc(var(--chart-stroke-width) * 0.5px + 1px);

      display: inline-block;
      position: relative;
      box-sizing: border-box;
      width: 100%;
      height: var(--chart-h);
      padding: var(--chart-pad) 0;
      line-height: 0;
    }

    :host(.accent) {
      --chart-stroke: var(--accent-8, #8b5cf6);
      --chart-fill: var(--accent-3, #ddd6fe);
    }
    :host(.success) {
      --chart-stroke: var(--success-8, #10b981);
      --chart-fill: var(--success-3, #a7f3d0);
    }
    :host(.warn) {
      --chart-stroke: var(--warn-8, #f59e0b);
      --chart-fill: var(--warn-3, #fde68a);
    }
    :host(.error) {
      --chart-stroke: var(--error-8, #ef4444);
      --chart-fill: var(--error-3, #fecaca);
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    :host(.animate) svg {
      overflow: hidden;
    }

    :host(.animate) .dot {
      transition: none;
    }

    .line {
      fill: none;
      stroke: var(--chart-stroke);
      stroke-width: var(--chart-stroke-width);
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }

    .area {
      fill: var(--chart-fill);
      fill-opacity: var(--chart-fill-opacity);
      stroke: none;
    }

    .dot {
      position: absolute;
      left: calc(var(--x) * 1%);
      top: calc(var(--chart-pad) + (100% - 2 * var(--chart-pad)) * var(--y) / 100);
      width: var(--chart-dot-size);
      height: var(--chart-dot-size);
      border-radius: 50%;
      background: var(--chart-stroke);
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[attr.aria-label]': 'label()',
    '[class]': 'color()',
    '[class.animate]': 'animate()',
  },
})
export class ShipChartSparkline {
  /** The values to plot, left to right. Non-finite entries are skipped. */
  data = input.required<readonly number[]>();
  /** Palette color to inherit. Any custom property set on the host still wins. */
  color = input<ShipChartSparklineColor>('');
  /** Line interpolation. */
  curve = input<ShipCurve>('linear');
  /** Fill the area under the line. */
  area = input(false, { transform: booleanAttribute });
  /** Mark the last value with a dot. */
  dot = input(false, { transform: booleanAttribute });
  /** Fixed lower bound of the value axis; defaults to the data minimum. */
  min = input(undefined, {
    transform: (v: unknown) => (v === undefined || v === null || v === '' ? undefined : numberAttribute(v)),
  });
  /** Fixed upper bound of the value axis; defaults to the data maximum. */
  max = input(undefined, {
    transform: (v: unknown) => (v === undefined || v === null || v === '' ? undefined : numberAttribute(v)),
  });
  /** Accessible description. Defaults to a short summary of the values. */
  ariaLabel = input<string | null>(null);
  /** Tween data changes: new values slide in on the right, dropped values slide out on the left. */
  animate = input(false, { transform: booleanAttribute });
  /** Length of that tween in milliseconds. */
  animationDuration = input(300, { transform: numberAttribute });

  #document = inject(DOCUMENT);
  #frame: number | null = null;

  /** Points in a 0..100 box; y grows downwards like SVG. */
  points = computed(() => {
    const values = this.data().filter((value) => Number.isFinite(value));
    if (values.length === 0) return [];
    const [dataMin, dataMax] = extent(values);
    const y = linearScale([this.min() ?? dataMin, this.max() ?? dataMax], [100, 0]);
    const x = linearScale([0, Math.max(1, values.length - 1)], [0, 100]);
    return values.map((value, index) => ({ x: x(index), y: y(value) }));
  });

  /** What is currently drawn: equals `points()` unless a tween is in flight. */
  drawn = signal<readonly ShipPoint[]>([]);
  #drawnData: readonly number[] = [];

  viewBox = computed(() => '0 0 100 100');
  lineD = computed(() => linePath(this.drawn(), this.curve()));
  areaD = computed(() => areaPath(this.drawn(), 100, this.curve()));
  last = computed(() => {
    const point = this.drawn().at(-1) ?? null;
    return point && point.x <= 100 ? point : null;
  });

  constructor() {
    effect(() => {
      const target = this.points();
      const data = this.data();
      const animate = this.animate();
      untracked(() => this.#show(target, data, animate));
    });
    inject(DestroyRef).onDestroy(() => this.#stop());
  }

  #show(target: readonly ShipPoint[], data: readonly number[], animate: boolean) {
    this.#stop();
    const view = this.#document.defaultView;
    const previous = this.drawn();
    const canAnimate =
      animate && !!view?.requestAnimationFrame && previous.length > 0 && target.length > 0 && !this.#reducedMotion();

    if (!canAnimate) {
      this.drawn.set(target);
      this.#drawnData = data;
      return;
    }

    const [from, to] = alignSparklinePoints(previous, this.#drawnData, target, data);
    const duration = Math.max(0, this.animationDuration());
    const start = view.performance.now();
    const step = () => {
      const t = duration === 0 ? 1 : Math.min(1, (view.performance.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      this.drawn.set(from.map((p, i) => ({ x: p.x + (to[i].x - p.x) * eased, y: p.y + (to[i].y - p.y) * eased })));
      if (t < 1) this.#frame = view.requestAnimationFrame(step);
      else {
        this.#frame = null;
        this.drawn.set(target);
      }
    };
    this.#drawnData = data;
    this.#frame = view.requestAnimationFrame(step);
  }

  #stop() {
    if (this.#frame !== null) {
      this.#document.defaultView?.cancelAnimationFrame(this.#frame);
      this.#frame = null;
    }
  }

  #reducedMotion() {
    return !!this.#document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  label = computed(() => {
    if (this.ariaLabel()) return this.ariaLabel();
    const values = this.data().filter((value) => Number.isFinite(value));
    if (values.length === 0) return 'Empty sparkline';
    const [min, max] = extent(values);
    return `Sparkline of ${values.length} values from ${min} to ${max}, latest ${values.at(-1)}`;
  });
}

/**
 * Pairs the points currently drawn with the points to draw so every index can
 * be tweened. Handles the streaming cases explicitly: a value dropped on the
 * left exits to `x < 0`, a value appended on the right enters from `x > 100`.
 * Anything else is resampled to a common length.
 */
export function alignSparklinePoints(
  fromPoints: readonly ShipPoint[],
  fromData: readonly number[],
  toPoints: readonly ShipPoint[],
  toData: readonly number[]
): [ShipPoint[], ShipPoint[]] {
  const dropped = countDropped(fromData, toData);
  const kept = fromData.length - dropped;
  const appended = toData.length - kept;

  if (kept > 0 && (dropped > 0 || appended > 0)) {
    const toStep = toPoints.length > 1 ? 100 / (toPoints.length - 1) : 100;
    const fromStep = fromPoints.length > 1 ? 100 / (fromPoints.length - 1) : 100;
    const from: ShipPoint[] = [];
    const to: ShipPoint[] = [];
    // Values that leave on the left: keep their old position, move off to the left.
    for (let i = 0; i < dropped; i++) {
      from.push(fromPoints[i]);
      to.push({ x: (i - dropped) * toStep, y: fromPoints[i].y });
    }
    // Values present in both: old position to new position.
    for (let i = 0; i < kept; i++) {
      from.push(fromPoints[dropped + i]);
      to.push(toPoints[i]);
    }
    // Values that arrive on the right: start just outside, slide to their slot.
    for (let i = 0; i < appended; i++) {
      const target = toPoints[kept + i];
      from.push({ x: 100 + (i + 1) * fromStep, y: target.y });
      to.push(target);
    }
    return [from, to];
  }

  const length = Math.max(fromPoints.length, toPoints.length);
  return [resample(fromPoints, length), resample(toPoints, length)];
}

/** How many leading values of `from` are gone in `to` (the window slid). */
function countDropped(from: readonly number[], to: readonly number[]): number {
  for (let dropped = 0; dropped <= from.length; dropped++) {
    const kept = from.length - dropped;
    if (kept > to.length) continue;
    let matches = true;
    for (let i = 0; i < kept; i++) {
      if (from[dropped + i] !== to[i]) {
        matches = false;
        break;
      }
    }
    if (matches) return dropped;
  }
  return from.length;
}

function resample(points: readonly ShipPoint[], length: number): ShipPoint[] {
  if (points.length === length) return [...points];
  if (points.length === 1) return Array.from({ length }, () => points[0]);
  return Array.from({ length }, (_, i) => {
    const position = (i / Math.max(1, length - 1)) * (points.length - 1);
    const index = Math.floor(position);
    const next = Math.min(points.length - 1, index + 1);
    const t = position - index;
    return {
      x: points[index].x + (points[next].x - points[index].x) * t,
      y: points[index].y + (points[next].y - points[index].y) * t,
    };
  });
}

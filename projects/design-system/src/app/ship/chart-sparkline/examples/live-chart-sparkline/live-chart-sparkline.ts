import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipChartSparkline } from '@ship-ui/core/ship-chart-sparkline';

@Component({
  selector: 'app-live-chart-sparkline',
  imports: [ShipChartSparkline, ShipButton],
  templateUrl: './live-chart-sparkline.html',
  styleUrl: './live-chart-sparkline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveChartSparkline {
  values = signal([42, 47, 45, 51, 49, 55, 58, 54, 60, 63]);
  running = signal(true);
  #timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.start();
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  /** Drops the oldest value and appends a new one, like a metric ticking in. */
  tick() {
    this.values.update((values) => {
      const last = values[values.length - 1];
      const next = Math.max(20, Math.min(90, last + Math.round((Math.random() - 0.45) * 14)));
      return [...values.slice(1), next];
    });
  }

  toggle() {
    this.running() ? this.stop() : this.start();
  }

  start() {
    if (typeof window === 'undefined') return;
    this.stop();
    this.#timer = setInterval(() => this.tick(), 1200);
    this.running.set(true);
  }

  stop() {
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = null;
    this.running.set(false);
  }
}

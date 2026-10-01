import { ChangeDetectionStrategy, Component, computed, input, numberAttribute, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipLayoutStatRingVariant } from '@ship-ui/core';

/**
 * Progress KPI: a value drawn as a ring. Give it `value` (and `max`, default
 * 100); the ring fills to the fraction. Slots: `p` (label), an optional
 * `h3`/`[value]` shown inside the ring (defaults to the percentage), an
 * optional `sh-icon` and a `[footer]`/`small` line. The slotted value and
 * label read as ordinary content; set `label` to announce the ring as one
 * image with that name instead.
 */
@Component({
  selector: 'sh-lo-stat-ring',
  styleUrl: './ship-stat-ring.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="ring" [style.--ring-pct]="percent()" [attr.role]="label() ? 'img' : null" [attr.aria-label]="label() || null">
      <div class="center">
        <ng-content select="sh-icon, [icon]" />
        <ng-content select="h2, h3, [value]" />
        <span class="pct">{{ percentLabel() }}</span>
      </div>
    </div>
    <div class="text">
      <ng-content select="p, [label]:not(sh-progress-bar)" />
      <ng-content select="sh-chip, [delta]" />
      <div class="footer"><ng-content select="[footer], small" /></div>
    </div>
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipLayoutStatRing {
  /** Current value. */
  value = input(0, { transform: (v: unknown) => numberAttribute(v, 0) });
  /** Value that fills the ring completely. */
  max = input(100, { transform: numberAttribute });
  /** Names the ring as a single image (hiding its slotted content from assistive tech); leave unset to let the slotted value/label read as content. */
  label = input<string>('');
  /** Ring color (`ShipColor`), defaults to primary. */
  color = input<ShipColor | null>(null);
  /** Visual variant: `type-b` large ring with the label underneath, `type-c` compact inline row. Project default via `ShipConfig.layoutStatRing.variant`. */
  variant = input<ShipLayoutStatRingVariant | null>(null);

  percent = computed(() => {
    const max = this.max() || 1;
    return Math.max(0, Math.min(100, Math.round((this.value() / max) * 100)));
  });
  percentLabel = computed(() => `${this.percent()}%`);

  hostClasses = shipComponentClasses('layoutStatRing', { variant: this.variant, color: this.color });
}

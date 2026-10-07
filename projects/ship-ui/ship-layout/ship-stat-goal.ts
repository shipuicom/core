import { ChangeDetectionStrategy, Component, computed, effect, input, numberAttribute, signal, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses, contentProjectionSignal, generateUniqueId } from '@ship-ui/core';
import { ShipColor, ShipLayoutStatGoalVariant } from '@ship-ui/core';

/**
 * Progress toward a target: "$204k of $300k". Give it `value` and `max`; it
 * draws the bar itself. Slots: `p` (label), `h2`/`h3`
 * (the formatted current value), `[target]` (the formatted goal, shown after
 * the value), an optional `sh-icon` and a `small`/`[footer]` line.
 */
@Component({
  selector: 'sh-lo-stat-goal',
  styleUrl: './ship-stat-goal.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="head">
      <ng-content select="sh-icon, [icon]" />
      <ng-content select="p, [label]" />
    </div>
    <div class="value">
      <ng-content select="h2, h3, [value]" />
      <span class="target"><ng-content select="[target]" /></span>
    </div>
    <div
      class="bar"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-valuenow]="percent()"
      [attr.aria-label]="label() || null"
      [attr.aria-labelledby]="labelledBy()"
      [style.--goal-pct]="percent()">
      @if (variant() === 'type-b') {
        @for (segment of segments; track segment) {
          <i [class.on]="segment < filledSegments()"></i>
        }
      }
    </div>
    <div class="footer"><ng-content select="small, [footer]" /></div>
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipLayoutStatGoal {
  /** Current progress. */
  value = input(0, { transform: (v: unknown) => numberAttribute(v, 0) });
  /** The target; the bar is full at this value. */
  max = input(100, { transform: numberAttribute });
  // Without `label`, the slotted `p`/`[label]` names the bar.
  slottedLabel = contentProjectionSignal<HTMLElement>('p, [label]', { childList: true }, 0);
  labelledBy = signal<string | null>(null);
  #labelEffect = effect(() => {
    const el = this.slottedLabel();
    if (!el || this.label()) {
      this.labelledBy.set(null);
      return;
    }
    if (!el.id) el.id = `sh-lo-stat-goal-label-${generateUniqueId()}`;
    this.labelledBy.set(el.id);
  });

  /** Accessible name for the progress bar (e.g. "Quarterly sales goal"); the slotted `p` is used when unset. */
  label = input<string>('');
  /** Bar color (`ShipColor`); defaults to primary. */
  color = input<ShipColor | null>(null);
  /** Visual variant: `type-b` draws the bar as ten segments, `type-c` compact without a card. Project default via `ShipConfig.layoutStatGoal.variant`. */
  variant = input<ShipLayoutStatGoalVariant | null>(null);

  percent = computed(() => {
    const max = this.max() || 1;
    return Math.max(0, Math.min(100, Math.round((this.value() / max) * 100)));
  });

  protected segments = Array.from({ length: 10 }, (_, i) => i);
  protected filledSegments = computed(() => Math.round(this.percent() / 10));

  hostClasses = shipComponentClasses('layoutStatGoal', { variant: this.variant, color: this.color });
}

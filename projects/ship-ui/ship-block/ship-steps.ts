import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockStepsVariant, ShipColor } from '@ship-ui/core';

/**
 * "How it works": a header (`[eyebrow]`/`sh-chip`, `h2`, `p`, `[actions]`) and one `sh-bl-step` per step, numbered
 * automatically. Set `--steps-cols` for another column count in `type-c`.
 */
@Component({
  selector: 'sh-bl-steps',
  styleUrl: './ship-steps.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="inner">
      <div class="head">
        <ng-content select="[eyebrow], sh-chip" />
        <ng-content select="h2" />
        <ng-content select="p, [description]" />
        <div class="actions"><ng-content select="[actions]" /></div>
      </div>
      <div class="items" role="list"><ng-content /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipBlockSteps {
  /** Visual variant: default a row of numbered steps joined by a line, `type-b` a vertical timeline beside the header, `type-c` a grid of cards with large numbers. Project default via `ShipConfig.blockSteps.variant`. */
  variant = input<ShipBlockStepsVariant | null>(null);
  /** Accent (`ShipColor`) for the eyebrow and the step markers; defaults to primary. */
  color = input<ShipColor | null>(null);

  hostClasses = shipComponentClasses('blockSteps', { variant: this.variant, color: this.color });
}

/**
 * One step of `sh-bl-steps`: an optional `sh-icon`/`[marker]` (without one the step shows its number), `h3`, `p`,
 * then anything else (a link).
 */
@Component({
  selector: 'sh-bl-step',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="marker" aria-hidden="true"><ng-content select="sh-icon, [marker]" /></div>
    <div class="text">
      <ng-content select="h3, [title]" />
      <ng-content select="p, [description]" />
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
  },
})
export class ShipBlockStep {}

import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipBlockFaqVariant, ShipColor } from '@ship-ui/core';

/**
 * Frequently asked questions: a header (`[eyebrow]`/`sh-chip`, `h2`, `p`, `[actions]`) and native `details`
 * elements, one per question: `<details><summary>Question</summary><p>Answer</p></details>`. Add `name="faq"` to the
 * `details` to keep one open at a time.
 */
@Component({
  selector: 'sh-bl-faq',
  styleUrl: './ship-faq.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="inner">
      <div class="head">
        <ng-content select="[eyebrow], sh-chip" />
        <ng-content select="h2" />
        <ng-content select="p, [description]" />
        <div class="actions"><ng-content select="[actions]" /></div>
      </div>
      <div class="items"><ng-content /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipBlockFaq {
  /** Visual variant: default a centered header over a single divided list, `type-b` the header in a sticky column beside the list, `type-c` every question on its own card in a two-column grid. Project default via `ShipConfig.blockFaq.variant`. */
  variant = input<ShipBlockFaqVariant | null>(null);
  /** Accent (`ShipColor`) for the eyebrow and the open/close indicator; defaults to primary. */
  color = input<ShipColor | null>(null);

  hostClasses = shipComponentClasses('blockFaq', { variant: this.variant, color: this.color });
}

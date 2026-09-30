import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipLayoutSettingVariant } from '@ship-ui/core';

/**
 * One setting in a settings form: `label` and `p` (description) on the
 * left, the control(s) on the right; stacks on narrow screens. Consecutive
 * settings inside a `sh-card` or `sh-lo-section` are divided automatically.
 */
@Component({
  selector: 'sh-lo-setting',
  styleUrl: './ship-setting.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="text">
      <ng-content select="label, h3, h4" />
      <ng-content select="p, [description]" />
    </div>
    <div class="control"><ng-content /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipLayoutSetting {
  /** Visual variant (`type-b`, `type-c`, or default). Project default via `ShipConfig.layoutSetting.variant`. */
  variant = input<ShipLayoutSettingVariant | null>(null);

  hostClasses = shipComponentClasses('layoutSetting', { variant: this.variant });
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipLayoutSettingVariant } from '@ship-ui/core';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipLayoutSetting } from '@ship-ui/core/ship-layout';
import { ShipToggle } from '@ship-ui/core/ship-toggle';

@Component({
  selector: 'app-setting-sandbox',
  imports: [ShipLayoutSetting, ShipCard, ShipFormField, ShipToggle],
  templateUrl: './setting-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingSandbox {
  variant = input<ShipLayoutSettingVariant>('');
}

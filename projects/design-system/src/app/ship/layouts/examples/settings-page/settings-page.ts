import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipLayoutPage, ShipLayoutSection, ShipLayoutSetting } from '@ship-ui/core/ship-layout';
import { ShipToggle } from '@ship-ui/core/ship-toggle';

@Component({
  selector: 'app-settings-page-example',
  imports: [ShipLayoutPage, ShipLayoutSection, ShipLayoutSetting, ShipCard, ShipButton, ShipFormField, ShipToggle],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageExample {}

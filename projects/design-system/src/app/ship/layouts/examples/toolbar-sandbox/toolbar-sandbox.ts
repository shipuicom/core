import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipLayoutToolbarVariant } from '@ship-ui/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';
import { ShipDivider } from '@ship-ui/core/ship-divider';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipLayoutToolbar } from '@ship-ui/core/ship-layout';
import { ShipMenu } from '@ship-ui/core/ship-menu';
import { ShipTooltip } from '@ship-ui/core/ship-tooltip';

@Component({
  selector: 'app-toolbar-sandbox',
  imports: [ShipLayoutToolbar, ShipButton, ShipIcon, ShipCheckbox, ShipDivider, ShipMenu, ShipTooltip],
  templateUrl: './toolbar-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarSandbox {
  variant = input<ShipLayoutToolbarVariant>('');
}

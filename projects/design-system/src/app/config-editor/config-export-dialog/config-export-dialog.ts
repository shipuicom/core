import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { Highlight } from '../../previewer/highlight/highlight';
import { ShipConfigExport } from '../../core/services/ship-config-export';

@Component({
  selector: 'app-config-export-dialog',
  imports: [Highlight, ShipButton],
  templateUrl: './config-export-dialog.html',
  styleUrl: './config-export-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigExportDialog {
  data = input.required<ShipConfigExport>();
  closed = output<void>();
}

import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipConfigImport, parseShipConfigImport } from '../../core/services/ship-config-export';

@Component({
  selector: 'app-config-import-dialog',
  imports: [FormsModule, ShipButton, ShipFormField],
  templateUrl: './config-import-dialog.html',
  styleUrl: './config-import-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigImportDialog {
  closed = output<ShipConfigImport | undefined>();

  text = signal('');
  parsed = computed(() => (this.text().trim() ? parseShipConfigImport(this.text()) : null));
  error = computed(() => {
    const p = this.parsed();
    return p && 'error' in p ? p.error : null;
  });

  async readFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.text.set(await file.text());
  }

  import() {
    const p = this.parsed();
    if (p && !('error' in p)) this.closed.emit(p);
  }
}

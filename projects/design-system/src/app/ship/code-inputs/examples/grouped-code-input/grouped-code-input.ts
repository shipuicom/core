import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCodeInput, ShipCodeInputDivider } from '@ship-ui/core/ship-code-input';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-grouped-code-input',
  imports: [ShipCodeInput, ShipCodeInputDivider, ShipIcon],
  templateUrl: './grouped-code-input.html',
  styleUrl: './grouped-code-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupedCodeInput {
  code = signal('');
  dashed = signal('');
}

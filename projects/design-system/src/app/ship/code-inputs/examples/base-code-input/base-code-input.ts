import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCodeInput } from '@ship-ui/core/ship-code-input';

@Component({
  selector: 'app-base-code-input',
  imports: [ShipCodeInput, ShipButton],
  templateUrl: './base-code-input.html',
  styleUrl: './base-code-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseCodeInput {
  code = signal('');
  submitted = signal('');
}

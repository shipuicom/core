import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipCodeInputGroup } from '@ship-ui/core/ship-code-input';
import { ShipFormField } from '@ship-ui/core/ship-form-field';

@Component({
  selector: 'app-directive-code-input',
  imports: [ShipCodeInputGroup, ShipFormField],
  templateUrl: './directive-code-input.html',
  styleUrl: './directive-code-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectiveCodeInput {
  code = signal('');
}

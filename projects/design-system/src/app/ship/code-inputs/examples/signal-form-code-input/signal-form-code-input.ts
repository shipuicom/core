import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { ShipCodeInput } from '@ship-ui/core/ship-code-input';

@Component({
  selector: 'app-signal-form-code-input',
  imports: [FormField, ShipCodeInput],
  templateUrl: './signal-form-code-input.html',
  styleUrl: './signal-form-code-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalFormCodeInput {
  code = signal('');
  codeForm = form(this.code, (path) => {
    required(path, { message: 'Enter the code' });
    minLength(path, 6, { message: 'The code has 6 digits' });
  });

  verified = signal(false);

  verify(code: string) {
    // Pretend the server accepts any code that is all the same digit.
    this.verified.set(/^(\d)\1{5}$/.test(code));
  }
}

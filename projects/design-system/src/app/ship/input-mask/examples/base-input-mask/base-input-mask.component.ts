import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ShipFormFieldComponent, ShipIconComponent, ShipInputMaskDirective } from 'ship-ui';

@Component({
  selector: 'app-base-input-mask',
  imports: [ShipFormFieldComponent, ShipIconComponent, ShipInputMaskDirective],
  templateUrl: './base-input-mask.component.html',
  styleUrl: './base-input-mask.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DecimalPipe],
})
export class BaseInputMaskComponent {
  #decimalPipe = inject(DecimalPipe);

  maskingFunction = (cleanValue: string) => {
    return this.#decimalPipe.transform(cleanValue, '1.0-2');
  };
}

import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ShipFormField, ShipIcon, ShipInputMask } from 'ship-ui';

@Component({
  selector: 'app-base-input-mask',
  imports: [ShipFormField, ShipIcon, ShipInputMask],
  templateUrl: './base-input-mask.html',
  styleUrl: './base-input-mask.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DecimalPipe],
})
export class BaseInputMaskComponent {
  #decimalPipe = inject(DecimalPipe);

  maskingFunction = (cleanValue: string) => {
    return this.#decimalPipe.transform(cleanValue, '1.0-2');
  };
}

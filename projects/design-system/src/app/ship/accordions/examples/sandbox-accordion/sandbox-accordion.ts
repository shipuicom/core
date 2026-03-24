import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipAccordion, ShipButton, ShipFormField, ShipSelect, ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-sandbox-accordion',
  imports: [FormsModule, ShipAccordion, ShipToggle, ShipSelect, ShipFormField, ShipButton],
  templateUrl: './sandbox-accordion.html',
  styleUrl: './sandbox-accordion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxAccordion {
  openPanels = signal<string>('panel1');
  allowMultiple = signal<boolean>(false);
  variantType = signal<string | null>(null);

  availableVariants = [
    { value: '', label: 'Default' },
    { value: 'type-b', label: 'Type B' },
  ];

  availablePanels = ['panel1', 'panel2', 'panel3'];
  selectedPanelsArray = signal<string[]>(['panel1']);

  constructor() {
    effect(() => {
      const arrStr = this.selectedPanelsArray().join(',');
      if (this.openPanels() !== arrStr) {
        this.openPanels.set(arrStr);
      }
    });

    effect(() => {
      const valStr = this.openPanels();
      const currentArr = valStr ? valStr.split(',').filter((x) => x) : [];
      if (currentArr.join(',') !== this.selectedPanelsArray().join(',')) {
        this.selectedPanelsArray.set(currentArr);
      }
    });
  }
}

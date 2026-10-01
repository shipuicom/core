import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipAccordionVariant } from '@ship-ui/core';
import { ShipSelect } from '@ship-ui/core/ship-select';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Previewer } from '../../previewer/previewer';
import { BaseAccordion } from './examples/base-accordion/base-accordion';
import { SandboxAccordion } from './examples/sandbox-accordion/sandbox-accordion';
import { TypeBAccordion } from './examples/type-b-accordion/type-b-accordion';

@Component({
  selector: 'app-accordions-examples',
  imports: [FormsModule, Previewer, ShipToggle, ShipSelect, SandboxAccordion, BaseAccordion, TypeBAccordion],
  templateUrl: './accordions-examples.html',
  styleUrl: './accordions-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AccordionsExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  openPanels = signal<string>('panel1');
  allowMultiple = signal<boolean>(false);
  variantType = signal<ShipAccordionVariant | null>(null);

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

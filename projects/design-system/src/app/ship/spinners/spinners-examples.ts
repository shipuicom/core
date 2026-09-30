import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';
import { Previewer } from '../../previewer/previewer';
import { SandboxSpinner } from './examples/sandbox-spinner/sandbox-spinner';

@Component({
  selector: 'app-spinners-examples',
  imports: [FormsModule, Previewer, ShipRangeSlider, SandboxSpinner],
  template: `
    <app-previewer path="/spinners/examples/sandbox-spinner/sandbox-spinner" title="Sandbox">
      <ng-container controls>
        <sh-range-slider class="primary raised" unit="px">
          <label for="spinner-size-demo">Set spinner size</label>
          <input id="spinner-size-demo" type="range" step="2" min="24" max="120" [(ngModel)]="size" />
        </sh-range-slider>

        <sh-range-slider class="primary raised" unit="px">
          <label for="spinner-thickness-demo">Spinner thickness</label>
          <input id="spinner-thickness-demo" type="range" step="1" min="1" max="10" [(ngModel)]="thickness" />
        </sh-range-slider>
      </ng-container>

      <app-sandbox-spinner class="example" [size]="size()" [thickness]="thickness()" />
    </app-previewer>
  `,
  styleUrl: './spinners-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpinnersExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  size = signal(40);
  thickness = signal(5);
}

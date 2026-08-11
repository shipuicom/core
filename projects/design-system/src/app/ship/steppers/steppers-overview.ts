import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAlert } from '@ship-ui/core/ship-alert';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicStepper } from './examples/basic-stepper/basic-stepper';

@Component({
  selector: 'app-steppers-overview',
  imports: [Previewer, PropertyViewer, BasicStepper, ShipAlert],
  templateUrl: './steppers-overview.html',
  styleUrl: './steppers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SteppersOverview {}

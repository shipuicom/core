import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { SandboxAccordion } from './examples/sandbox-accordion/sandbox-accordion';

@Component({
  selector: 'app-accordions',
  imports: [
    Previewer,
    PropertyViewer,
    SandboxAccordion,
  ],
  templateUrl: './accordions.html',
  styleUrl: './accordions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Accordions {}

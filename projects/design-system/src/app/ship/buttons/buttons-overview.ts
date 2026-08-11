import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicButton } from './examples/basic-button/basic-button';

@Component({
  selector: 'app-buttons-overview',
  imports: [Previewer, PropertyViewer, BasicButton],
  templateUrl: './buttons-overview.html',
  styleUrl: './buttons-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonsOverview {}

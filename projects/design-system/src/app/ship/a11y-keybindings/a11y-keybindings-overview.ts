import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicKeybindingsComponent } from './examples/basic-keybindings/basic-keybindings';

@Component({
  selector: 'app-a11y-keybindings-overview',
  imports: [Previewer, PropertyViewer, BasicKeybindingsComponent],
  templateUrl: './a11y-keybindings-overview.html',
  styleUrl: './a11y-keybindings-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class A11yKeybindingsOverview {}

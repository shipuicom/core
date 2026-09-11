import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseCodeInput } from './examples/base-code-input/base-code-input';

@Component({
  selector: 'app-code-inputs-overview',
  imports: [Previewer, PropertyViewer, BaseCodeInput],
  templateUrl: './code-inputs-overview.html',
  styleUrl: './code-inputs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CodeInputsOverview {}

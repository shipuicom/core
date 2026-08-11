import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { SandboxIcon } from './examples/sandbox-icon/sandbox-icon';

@Component({
  selector: 'app-icons-examples',
  imports: [Previewer, SandboxIcon],
  templateUrl: './icons-examples.html',
  styleUrl: './icons-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class IconsExamples {}

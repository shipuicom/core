import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { DefaultSidenav } from './examples/default-sidenav/default-sidenav';
import { OverlaySidenav } from './examples/overlay-sidenav/overlay-sidenav';
import { SandboxSidenav } from './examples/sandbox-sidenav/sandbox-sidenav';
import { SimpleSidenav } from './examples/simple-sidenav/simple-sidenav';

@Component({
  selector: 'app-sidenavs-examples',
  imports: [Previewer, SandboxSidenav, DefaultSidenav, SimpleSidenav, OverlaySidenav],
  templateUrl: './sidenavs-examples.html',
  styleUrl: './sidenavs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SidenavsExamples {}

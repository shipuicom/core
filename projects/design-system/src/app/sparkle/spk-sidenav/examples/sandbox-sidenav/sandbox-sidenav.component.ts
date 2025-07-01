import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SparkleButtonGroupComponent,
  SparkleSidenavComponent,
  SparkleSidenavType,
  SparkleToggleComponent,
} from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-sandbox-sidenav',
  imports: [FormsModule, SparkleSidenavComponent, SparkleButtonGroupComponent, SparkleToggleComponent],
  templateUrl: './sandbox-sidenav.component.html',
  styleUrl: './sandbox-sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxSidenavComponent {
  sidenavType = signal<SparkleSidenavType>('simple');
  isNavOpen = signal(false);
  disableDrag = signal(false);
}

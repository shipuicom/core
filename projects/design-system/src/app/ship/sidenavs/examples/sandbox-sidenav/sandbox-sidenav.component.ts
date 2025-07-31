import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButtonGroupComponent, ShipSidenavComponent, ShipSidenavType, ShipToggleComponent } from 'ship-ui';

@Component({
  selector: 'app-sandbox-sidenav',
  imports: [FormsModule, ShipSidenavComponent, ShipButtonGroupComponent, ShipToggleComponent],
  templateUrl: './sandbox-sidenav.component.html',
  styleUrl: './sandbox-sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxSidenavComponent {
  sidenavType = signal<ShipSidenavType>('simple');
  isNavOpen = signal(false);
  disableDrag = signal(false);
}

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleSidenavComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-sidenav',
  imports: [SparkleSidenavComponent],
  templateUrl: './spk-sidenav.component.html',
  styleUrl: './spk-sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkSidenavComponent {
  sidenavType = signal('overlay');
}

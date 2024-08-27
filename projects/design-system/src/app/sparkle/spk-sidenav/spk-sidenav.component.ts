import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleSidenavComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-sidenav',
  standalone: true,
  imports: [SparkleSidenavComponent],
  templateUrl: './spk-sidenav.component.html',
  styleUrl: './spk-sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkSidenavComponent {
  constructor() {}

  ngOnInit() {
    for (let count = 0; count < 1000; count++) {
      console.log('count: ', count);

      const hi = () => {};
    }
  }
}

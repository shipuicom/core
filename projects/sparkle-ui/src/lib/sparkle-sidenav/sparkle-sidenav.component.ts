import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'spk-sidenav',
  standalone: true,
  imports: [],
  template: `
    <div class="sidenav">
      <ng-content select="[sidenav]"></ng-content>
    </div>

    <div class="main-wrap">
      <main>
        <ng-content></ng-content>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleSidenavComponent {}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LayoutState } from './layout.state';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class LayoutComponent {
  #layoutState = inject(LayoutState);

  isDarkMode = this.#layoutState.isDarkMode;

  toggleBodyClass() {
    this.#layoutState.toggleBodyClass();
  }
}

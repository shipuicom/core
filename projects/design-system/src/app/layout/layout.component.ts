import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  SparkleButtonComponent,
  SparkleIconComponent,
  SparkleListComponent,
  SparkleSidenavComponent,
} from '../../../../sparkle-ui/src/public-api';
import { LayoutState } from './layout.state';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    SparkleSidenavComponent,
    SparkleListComponent,
    SparkleIconComponent,
    SparkleButtonComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LayoutComponent {
  #layoutState = inject(LayoutState);

  isOpen = signal(false);
  isNavOpen = this.#layoutState.isNavOpen;
  isDarkMode = this.#layoutState.isDarkMode;

  toggleBodyClass() {
    this.#layoutState.toggleBodyClass();
  }

  toggleNav() {
    this.#layoutState.toggleNav();
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
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
    MatButtonModule,
    SparkleIconComponent,
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

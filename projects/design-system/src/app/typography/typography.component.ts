import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { LayoutState } from '../layout/layout.state';

@Component({
  selector: 'app-typography',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './typography.component.html',
  styleUrl: './typography.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TypographyComponent {
  #layoutState = inject(LayoutState);

  isDarkMode = this.#layoutState.isDarkMode;
}

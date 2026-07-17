import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipThemeToggle } from '@ship-ui/core/ship-theme-toggle';

@Component({
  selector: 'app-styled-theme-toggle',
  standalone: true,
  imports: [ShipThemeToggle],
  templateUrl: './styled-theme-toggle.html',
  styleUrl: './styled-theme-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StyledThemeToggle {}

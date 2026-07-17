import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipThemeToggle } from '@ship-ui/core/ship-theme-toggle';

@Component({
  selector: 'app-basic-theme-toggle',
  standalone: true,
  imports: [ShipThemeToggle],
  templateUrl: './basic-theme-toggle.html',
  styleUrl: './basic-theme-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicThemeToggle {}

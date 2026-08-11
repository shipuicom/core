import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-a11y-keybindings',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './a11y-keybindings.html',
  styleUrl: './a11y-keybindings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class A11yKeybindingsComponent {}

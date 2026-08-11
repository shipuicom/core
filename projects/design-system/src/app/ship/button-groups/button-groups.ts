import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-button-groups',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './button-groups.html',
  styleUrl: './button-groups.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonGroupComponent {}

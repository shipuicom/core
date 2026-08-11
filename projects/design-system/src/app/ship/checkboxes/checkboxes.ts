import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-checkboxes',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './checkboxes.html',
  styleUrl: './checkboxes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Checkboxes {}

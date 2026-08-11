import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-dividers',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './dividers.html',
  styleUrl: './dividers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Dividers {}

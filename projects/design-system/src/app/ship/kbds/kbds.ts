import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-kbds',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './kbds.html',
  styleUrl: './kbds.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Kbds {}

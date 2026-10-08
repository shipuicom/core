import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-blocks',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './blocks.html',
  styleUrl: './blocks.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Blocks {}

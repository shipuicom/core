import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-avatars',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './avatars.html',
  styleUrl: './avatars.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Avatars {}

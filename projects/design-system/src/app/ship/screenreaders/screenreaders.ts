import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-screenreaders',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './screenreaders.html',
  styleUrl: './screenreaders.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Screenreaders {}

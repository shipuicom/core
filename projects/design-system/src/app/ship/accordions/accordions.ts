import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-accordions',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './accordions.html',
  styleUrl: './accordions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Accordions {}

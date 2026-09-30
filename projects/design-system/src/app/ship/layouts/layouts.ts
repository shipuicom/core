import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-layouts',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layouts.html',
  styleUrl: './layouts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Layouts {}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-datepickers',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './datepickers.html',
  styleUrl: './datepickers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Datepickers {}

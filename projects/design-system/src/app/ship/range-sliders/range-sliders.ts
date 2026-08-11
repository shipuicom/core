import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-range-sliders',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './range-sliders.html',
  styleUrl: './range-sliders.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RangeSliders {}

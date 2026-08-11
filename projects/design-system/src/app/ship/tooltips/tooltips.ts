import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-tooltips',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './tooltips.html',
  styleUrl: './tooltips.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Tooltips {}

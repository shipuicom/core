import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-blueprints',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './blueprints.html',
  styleUrl: './blueprints.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Blueprints {}

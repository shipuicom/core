import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-sheets',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './sheets.html',
  styleUrl: './sheets.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Sheets {}

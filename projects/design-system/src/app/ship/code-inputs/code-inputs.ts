import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-code-inputs',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './code-inputs.html',
  styleUrl: './code-inputs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CodeInputs {}

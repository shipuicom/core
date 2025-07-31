import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipDividerComponent } from '@ship-ui/core';

@Component({
  selector: 'app-text-divider',
  standalone: true,
  imports: [ShipDividerComponent],
  templateUrl: './text-divider.component.html',
  styleUrl: './text-divider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextDividerComponent {}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleDividerComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-base-divider',
  standalone: true,
  imports: [SparkleDividerComponent],
  templateUrl: './base-divider.component.html',
  styleUrl: './base-divider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseDividerComponent {}

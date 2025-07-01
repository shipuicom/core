import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleDividerComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-text-divider',
  standalone: true,
  imports: [SparkleDividerComponent],
  templateUrl: './text-divider.component.html',
  styleUrl: './text-divider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextDividerComponent {}

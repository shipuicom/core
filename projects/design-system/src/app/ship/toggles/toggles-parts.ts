import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-toggles-parts',
  imports: [ApiReference],
  template: `
    <p>A related card component with a built-in toggle.</p>
    <app-api-reference name="ShipToggleCard" />
  `,
  styleUrl: './toggles-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TogglesParts {}

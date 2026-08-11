import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-icons-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipIcon" />`,
  styleUrl: './icons-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class IconsApi {}

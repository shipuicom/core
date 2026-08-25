import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-screenreaders-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipScreenreader" />`,
  styleUrl: './screenreaders-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ScreenreadersApi {}

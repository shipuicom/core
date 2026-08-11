import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-buttons-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipButton" />`,
  styleUrl: './buttons-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonsApi {}

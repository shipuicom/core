import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-dialogs-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipDialog" />`,
  styleUrl: './dialogs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DialogsApi {}

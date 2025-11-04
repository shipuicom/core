import { ChangeDetectionStrategy, Component, input, TemplateRef, viewChild } from '@angular/core';
import { ShipButton } from 'ship-ui';

@Component({
  selector: 'app-tab',
  imports: [ShipButton],
  templateUrl: './tab.component.html',
  styleUrl: './tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TabComponent {
  id = input.required();

  myDialog = viewChild.required<TemplateRef<any>>('myDialog');

  openDialog() {}
}

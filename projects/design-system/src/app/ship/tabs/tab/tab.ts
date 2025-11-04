import { ChangeDetectionStrategy, Component, input, TemplateRef, viewChild } from '@angular/core';
import { ShipButton } from 'ship-ui';

@Component({
  selector: 'app-tab',
  imports: [ShipButton],
  templateUrl: './tab.html',
  styleUrl: './tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Tab {
  id = input.required();

  myDialog = viewChild.required<TemplateRef<any>>('myDialog');

  openDialog() {}
}

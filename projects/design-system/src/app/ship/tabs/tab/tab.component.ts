import { ChangeDetectionStrategy, Component, input, TemplateRef, viewChild } from '@angular/core';
import { ShipButtonComponent } from '@ship-ui/core';

@Component({
  selector: 'app-tab',
  imports: [ShipButtonComponent],
  templateUrl: './tab.component.html',
  styleUrl: './tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TabComponent {
  id = input.required();

  myDialog = viewChild.required<TemplateRef<any>>('myDialog');

  openDialog() {}
}

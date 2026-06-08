import { ChangeDetectionStrategy, Component, inject, input, TemplateRef, viewChild } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipDialogService } from '@ship-ui/core/ship-dialog';

@Component({
  selector: 'app-tab',
  imports: [ShipButton],
  templateUrl: './tab.html',
  styleUrl: './tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Tab {
  #dialog = inject(ShipDialogService);
  id = input.required();

  myDialog = viewChild.required<TemplateRef<any>>('myDialog');

  openDialog() {
    this.#dialog.open(this.myDialog());
  }
}

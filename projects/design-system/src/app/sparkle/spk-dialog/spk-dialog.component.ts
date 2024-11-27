import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SparkleButtonComponent, SparkleDialogService } from '../../../../../sparkle-ui/src/public-api';
import SpkDatepickerComponent from '../spk-datepicker/spk-datepicker.component';

@Component({
  selector: 'app-spk-dialog',
  imports: [SparkleButtonComponent],
  templateUrl: './spk-dialog.component.html',
  styleUrl: './spk-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkDialogComponent {
  #dialog = inject(SparkleDialogService);
  isOpen = signal(false);

  openDynamicDialog() {
    const comp = this.#dialog.open(SpkDatepickerComponent, {
      data: { someDate: new Date(), someOtherDate: new Date() },

      // closed: (data: any) => {
      //   console.log('closed: ', data);
      // },
    });
  }
}

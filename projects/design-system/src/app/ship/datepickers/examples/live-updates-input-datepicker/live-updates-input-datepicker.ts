import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipDatepickerInput } from '@ship-ui/core/ship-datepicker';

@Component({
  selector: 'app-live-updates-input-datepicker',
  standalone: true,
  imports: [FormsModule, ShipDatepickerInput, DatePipe],
  templateUrl: './live-updates-input-datepicker.html',
  styleUrl: './live-updates-input-datepicker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveUpdatesInputDatepicker implements OnDestroy {
  // Advanced by one day every second from OUTSIDE the component. The masked field
  // and the popover calendar must both reflect the model on every tick.
  date = signal<Date | null>(new Date());

  #timer = setInterval(
    () =>
      this.date.update((current) => {
        const next = new Date(current ?? new Date());
        next.setDate(next.getDate() + 1);
        return next;
      }),
    1000
  );

  ngOnDestroy() {
    clearInterval(this.#timer);
  }
}

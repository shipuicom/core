import { ChangeDetectionStrategy, Component, ElementRef, inject, input, ViewEncapsulation } from '@angular/core';
import { ShipColor, shipComponentClasses, ShipSheetVariant } from '@ship-ui/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipAlertService } from './ship-alert.service';

export type ShipAlertType = 'error' | 'success' | 'warn' | 'primary' | 'accent' | 'question';

@Component({
  selector: 'sh-alert',
  styleUrl: './ship-alert.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  template: `
    <div class="alert">
      <div #ref class="icon" [style.display]="!ref.children.length ? 'none' : 'block'">
        <ng-content select="[icon]" />
        <ng-content select="sh-icon" />
      </div>

      <div class="icon">
        @let _alertClasses = hostClasses();

        @if (_alertClasses.includes('primary')) {
          <sh-icon class="state-icon">info</sh-icon>
        } @else if (_alertClasses.includes('accent')) {
          <sh-icon class="state-icon">info</sh-icon>
        } @else if (_alertClasses.includes('warn')) {
          <sh-icon class="state-icon">warning</sh-icon>
        } @else if (_alertClasses.includes('error')) {
          <sh-icon class="state-icon">warning-octagon</sh-icon>
        } @else if (_alertClasses.includes('success')) {
          <sh-icon class="state-icon">check-circle</sh-icon>
        } @else {
          <sh-icon class="state-icon">question</sh-icon>
        }
      </div>

      <div class="title">
        <ng-content select="[title]" />
        <ng-content />
      </div>

      @if (id()) {
        <sh-icon class="close-icon" (click)="removeAlert()">plus</sh-icon>
      }

      <div class="actions">
        <ng-content select="button" />
        <ng-content select="[actions]" />
      </div>

      <div class="content">
        <ng-content select="[content]" />
        <ng-content select="p" />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sh-sheet',
    '[class]': 'hostClasses()',
    '[attr.role]': 'color() === "warn" || color() === "error" ? "alert" : "status"',
  },
})
export class ShipAlert {
  /** Semantic color scale (`primary`, `accent`, `warn`, `error`, `success`); drives the state icon and `alert`/`status` role. */
  color = input<ShipColor | null>(null);
  /** Visual variant (`simple`, `outlined`, `flat`, `raised`). */
  variant = input<ShipSheetVariant | null>(null);

  hostClasses = shipComponentClasses('alert', {
    color: this.color,
    variant: this.variant,
  });

  _el = inject(ElementRef);
  /** Owning `ShipAlertService` used to dismiss this alert when rendered from the alert history. */
  alertService = input<ShipAlertService | null>(null);
  /** Unique alert id; when set, renders the close button and enables dismissal. */
  id = input<string | null>(null);

  /** Remove this alert from the associated `alertService` by its `id`. */
  removeAlert() {
    if (this.id() && this.alertService()) {
      this.alertService()?.removeAlert(this.id() as string);
    }
  }
}

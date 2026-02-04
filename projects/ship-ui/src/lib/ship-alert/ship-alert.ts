import { ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';
import { ShipIcon } from '../ship-icon/ship-icon';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipColor, ShipSheetVariant } from '../utilities/ship-types';
import { ShipAlertService } from './ship-alert.service';

export type ShipAlertType = 'error' | 'success' | 'warn' | 'primary' | 'accent' | 'question';

@Component({
  selector: 'sh-alert',
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
  },
})
export class ShipAlert {
  color = input<ShipColor | null>(null);
  variant = input<ShipSheetVariant | null>(null);

  hostClasses = shipComponentClasses('alert', {
    color: this.color,
    variant: this.variant,
  });

  _el = inject(ElementRef); // Used by alert container
  alertService = input<ShipAlertService | null>(null);
  id = input<string | null>(null);

  removeAlert() {
    if (this.id() && this.alertService()) {
      this.alertService()?.removeAlert(this.id() as string);
    }
  }
}

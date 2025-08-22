import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input } from '@angular/core';
import { ShipIconComponent } from '../ship-icon/ship-icon.component';
import { ShipAlertService } from './ship-alert.service';

export type ShipAlertType = 'error' | 'success' | 'warn' | 'primary' | 'accent' | 'question';

@Component({
  selector: 'sh-alert',
  imports: [ShipIconComponent],
  template: `
    <div class="alert">
      <div #ref class="icon" [style.display]="!ref.children.length ? 'none' : 'block'">
        <ng-content select="[icon]" />
        <ng-content select="sh-icon" />
      </div>

      <div class="icon">
        @let _alertClasses = alertClasses();

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

      <div class="content">
        <ng-content select="[content]" />
        <ng-content select="p" />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sh-sheet',
  },
})
export class ShipAlertComponent {
  _el = inject(ElementRef); // Used by alert container
  alertService = input<ShipAlertService | null>(null);
  id = input<string | null>(null);

  alertClasses = computed(() => this._el.nativeElement.classList.toString());

  removeAlert() {
    if (this.id() && this.alertService()) {
      this.alertService()?.removeAlert(this.id() as string);
    }
  }
}

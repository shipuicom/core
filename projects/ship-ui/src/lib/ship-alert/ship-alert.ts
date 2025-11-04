import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, signal } from '@angular/core';
import { ShipIcon } from '../ship-icon/ship-icon';
import { classMutationSignal } from '../utilities/class-mutation-signal';
import { SHIP_CONFIG } from '../utilities/ship-config';
import { ShipAlertService } from './ship-alert.service';

export type ShipAlertType = 'error' | 'success' | 'warn' | 'primary' | 'accent' | 'question';

const POSSIBLE_VARIANTS = ['simple', 'outlined', 'flat', 'raised'];

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
        @let _alertClasses = currentClasses();

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
    '[class]': 'activeClass()',
  },
})
export class ShipAlert {
  #shConfig = inject(SHIP_CONFIG, { optional: true });
  variant = signal<string>(this.#shConfig?.alertVariant ?? '');
  _el = inject(ElementRef); // Used by alert container
  alertService = input<ShipAlertService | null>(null);
  id = input<string | null>(null);

  currentClasses = classMutationSignal();
  activeClass = computed(() => {
    const variant = this.variant();
    const _current = `${this.currentClasses()} sh-sheet`;

    if (!variant) return _current;

    const hasVariant = POSSIBLE_VARIANTS.find((x) => this.currentClasses().includes(x));
    return hasVariant ? _current : `${_current} ${variant}`;
  });

  removeAlert() {
    if (this.id() && this.alertService()) {
      this.alertService()?.removeAlert(this.id() as string);
    }
  }
}

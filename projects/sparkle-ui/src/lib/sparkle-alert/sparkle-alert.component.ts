import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input } from '@angular/core';
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';
import { SparkleAlertService } from './sparkle-alert.service';

export type SparkleAlertType = 'error' | 'success' | 'warn' | 'primary' | 'accent' | 'question';

@Component({
  selector: 'spk-alert',
  imports: [SparkleIconComponent],
  template: `
    <div class="alert">
      <div #ref class="icon" [style.display]="!ref.children.length ? 'none' : 'block'">
        <ng-content select="[icon]"></ng-content>
      </div>

      <div class="icon">
        @let _alertClasses = alertClasses();

        @if (_alertClasses.includes('primary')) {
          <spk-icon class="state-icon">info</spk-icon>
        } @else if (_alertClasses.includes('accent')) {
          <spk-icon class="state-icon">info</spk-icon>
        } @else if (_alertClasses.includes('warn')) {
          <spk-icon class="state-icon">warning</spk-icon>
        } @else if (_alertClasses.includes('error')) {
          <spk-icon class="state-icon">warning-octagon</spk-icon>
        } @else if (_alertClasses.includes('success')) {
          <spk-icon class="state-icon">check-circle</spk-icon>
        } @else {
          <spk-icon class="state-icon">question</spk-icon>
        }
      </div>

      <div class="title">
        <ng-content select="[title]"></ng-content>
        <ng-content></ng-content>
      </div>

      @if (id()) {
        <spk-icon class="close-icon" (click)="removeAlert()">plus</spk-icon>
      }

      <div class="content">
        <ng-content select="[content]"></ng-content>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleAlertComponent {
  _el = inject(ElementRef); // Used by alert container
  alertService = input<SparkleAlertService | null>(null);
  id = input<string | null>(null);

  alertClasses = computed(() => this._el.nativeElement.classList.toString());

  removeAlert() {
    if (this.id() && this.alertService()) {
      this.alertService()?.removeAlert(this.id() as string);
    }
  }
}

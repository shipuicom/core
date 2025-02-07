import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  HostBinding,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

@Component({
  selector: 'spk-range-slider',
  imports: [],
  template: `
    <div class="label">
      <ng-content select="label"></ng-content>
    </div>

    <div class="input-wrap">
      <div class="min-indicator">{{ inputState().min }}{{ unit() }}</div>

      <div class="track-wrap" (click)="trackEvent($event)">
        <ng-content></ng-content>
        <div class="track">
          <div class="track-filled" [style]="trackFilledStyle()"></div>
        </div>
        <div class="thumb-wrap" [style]="thumbWrapStyle()">
          <div class="thumb" [style]="thumbStyle()">
            <div class="value-indicator">{{ value() }}{{ unit() }}</div>
          </div>
        </div>
      </div>

      <div class="max-indicator">{{ inputState().max }}{{ unit() }}</div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleRangeSliderComponent {
  #selfRef = inject(ElementRef<SparkleRangeSliderComponent>);
  #observer: MutationObserver | null = null;

  unit = input<string>('');
  value = model<number>(0);
  inputState = signal({
    min: 0,
    max: 100,
    // value: 0,
  });

  @HostBinding('class.has-input')
  get inputField(): HTMLInputElement | null {
    return this.#selfRef.nativeElement.querySelector('input[type="range"]') ?? null;
  }

  inputEffect = effect(() => {
    const newVal = this.value();

    if (this.inputField && newVal !== parseInt(this.inputField.value)) {
      this.inputField!.value = newVal + '';
    }
  });

  trackEvent(e: Event) {
    if (this.inputField?.readOnly) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  ngOnInit() {
    if (this.inputField) {
      this.inputState.set({
        max: parseInt(this.inputField!.max ?? '') ?? 100,
        min: parseInt(this.inputField!.min ?? '') ?? 0,
      });

      this.value.set(parseInt(this.inputField!.value ?? '') ?? 0);

      this.inputField.oninput = (e) => {
        this.value.set(parseInt(this.inputField!.value ?? '') ?? 0);
      };

      const MUTATION_FIELDS = ['min', 'max', 'value'];

      if (typeof MutationObserver !== 'undefined') {
        this.#observer = new MutationObserver((mutationList, _) => {
          for (const mutation of mutationList) {
            if (mutation.type === 'attributes' && MUTATION_FIELDS.includes(mutation.attributeName ?? '')) {
              this.inputState.set({
                max: parseInt(this.inputField!.max ?? '') ?? 100,
                min: parseInt(this.inputField!.min ?? '') ?? 0,
              });

              this.value.set(parseInt(this.inputField!.value ?? '') ?? 0);
            }
          }
        });

        this.#observer.observe(this.inputField, { attributes: true, childList: false, subtree: false });
      }
    } else {
      console.error('No input field found');
    }
  }

  thumbWrapStyle() {
    return {
      left: `${(this.value() / this.inputState().max) * 100}%`,
    };
  }

  thumbStyle() {
    return {
      transform: `translateX(-${(this.value() / this.inputState().max) * 100}%)`,
    };
  }

  trackFilledStyle() {
    return {
      width: `${(this.value() / this.inputState().max) * 100}%`,
    };
  }

  ngOnDestroy() {
    if (this.#observer) {
      this.#observer.disconnect();
    }
  }
}

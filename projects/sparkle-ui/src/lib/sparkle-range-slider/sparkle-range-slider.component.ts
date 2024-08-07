import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, inject, input, signal } from '@angular/core';

@Component({
  selector: 'spk-range-slider',
  standalone: true,
  imports: [],
  template: `
    <div class="label">
      <ng-content select="[spkLabel]"></ng-content>
    </div>

    <div class="input-wrap">
      <div class="min-indicator">{{ inputState().min }}{{ unit() }}</div>

      <div class="track-wrap">
        <div class="track">
          <div class="track-filled" [style]="trackFilledStyle()"></div>
        </div>
        <ng-content></ng-content>
        <div class="thumb-wrap" [style]="thumbWrapStyle()">
          <div class="thumb" [style]="thumbStyle()">
            <div class="value-indicator">{{ inputState().value }}{{ unit() }}</div>
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
  inputState = signal({
    min: 0,
    max: 100,
    value: 0,
  });

  @HostBinding('class.has-input')
  get inputField(): HTMLInputElement | null {
    return this.#selfRef.nativeElement.querySelector('input[type="range"]') ?? null;
  }

  ngOnInit() {
    if (this.inputField) {
      this.inputState.set({
        max: parseInt(this.inputField!.max ?? '') ?? 100,
        min: parseInt(this.inputField!.min ?? '') ?? 0,
        value: parseInt(this.inputField!.value ?? '') ?? 0,
      });

      this.inputField.oninput = (e) => {
        this.inputState.update((state) => ({ ...state, value: parseInt((e.target as HTMLInputElement).value) ?? 0 }));
      };

      const MUTATION_FIELDS = ['min', 'max'];

      this.#observer = new MutationObserver((mutationList, _) => {
        for (const mutation of mutationList) {
          if (mutation.type === 'attributes' && MUTATION_FIELDS.includes(mutation.attributeName ?? '')) {
            this.inputState.set({
              value: parseInt(this.inputField!.value ?? ''),
              max: parseInt(this.inputField!.max ?? '') ?? 0,
              min: parseInt(this.inputField!.min ?? '') ?? 0,
            });

            this.inputField!.value = this.inputState().value + '';
          }
        }
      });

      this.#observer.observe(this.inputField, { attributes: true, childList: false, subtree: false });
    } else {
      console.warn('No input field found');
    }
  }

  thumbWrapStyle() {
    return {
      left: `${(this.inputState().value / this.inputState().max) * 100}%`,
    };
  }

  thumbStyle() {
    return {
      transform: `translateX(-${(this.inputState().value / this.inputState().max) * 100}%)`,
    };
  }

  trackFilledStyle() {
    return {
      width: `${(this.inputState().value / this.inputState().max) * 100}%`,
    };
  }

  // valueIndicatorStyle() {
  //   return {
  //     left: `${(this.inputState().value / this.inputState().max) * 100}%`,
  //   };
  // }

  ngOnDestroy() {
    if (this.#observer) {
      this.#observer.disconnect();
    }
  }
}

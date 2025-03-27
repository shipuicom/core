import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
        <ng-content select="input[type=range]"></ng-content>

        <div class="track">
          <div class="track-filled" [style.width.%]="trackFilledPercentage()"></div>
        </div>

        <div class="thumb-wrap" [style.left.%]="thumbPositionPercentage()">
          <div class="thumb">
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
  #selfRef = inject(ElementRef<HTMLElement>);
  #observer: MutationObserver | null = null;
  #inputElement: HTMLInputElement | null = null;
  #initialDefaultValue = 0;

  unit = input<string>('');
  value = model<number>(this.#initialDefaultValue);

  inputState = signal({
    min: 0,
    max: 100,
    step: 1,
  });

  @HostBinding('class.has-input')
  get hasInputElement(): boolean {
    return !!this.#inputElement;
  }

  syncModelToInputEffect = effect(() => {
    const modelValue = this.value();
    if (this.#inputElement) {
      const currentInputValue = parseFloat(this.#inputElement.value);
      if (isNaN(currentInputValue) || String(currentInputValue) !== String(modelValue)) {
        this.#inputElement.value = String(modelValue);
      }
    }
  });

  ngAfterViewInit() {
    this.#inputElement = this.#selfRef.nativeElement.querySelector('input[type="range"]');

    if (this.#inputElement) {
      this.#inputElement.oninput = () => {
        const inputValue = parseFloat(this.#inputElement!.value ?? '0');

        console.log(inputValue);
        if (!isNaN(inputValue)) {
          const { min, max } = this.inputState();
          this.value.set(Math.max(min, Math.min(max, inputValue)));
        }
      };

      queueMicrotask(() => this.updateStateFromInput(true));

      this.setupMutationObserver();
    } else {
      console.error('SparkleRangeSliderComponent: No <input type="range"> element found projected inside.');
    }
  }

  ngOnDestroy() {
    if (this.#observer) {
      this.#observer.disconnect();
    }
    if (this.#inputElement) {
      this.#inputElement.oninput = null;
    }
  }

  trackEvent(e: MouseEvent) {
    if (!this.#inputElement || this.#inputElement.readOnly || this.#inputElement.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (
      e.target === this.#inputElement ||
      (e.target as HTMLElement)?.closest('.thumb, .min-indicator, .max-indicator')
    ) {
      return;
    }

    const trackWrap = e.currentTarget as HTMLElement;
    const rect = trackWrap.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const { min, max, step } = this.inputState();
    const range = max - min;

    if (width > 0 && range !== 0 && step > 0) {
      let proportionalValue = (clickX / width) * range + min;
      const numSteps = (proportionalValue - min) / step;
      let nearestStepValue = min + Math.round(numSteps) * step;

      const decimals = this.countDecimals(step);
      nearestStepValue = parseFloat(nearestStepValue.toFixed(decimals));

      const clampedValue = Math.max(min, Math.min(max, nearestStepValue));

      this.value.set(clampedValue);
    }
  }

  private updateStateFromInput(isInitialCall = false) {
    if (!this.#inputElement) return;

    const min = parseFloat(this.#inputElement.min ?? '0') ?? 0;
    const max = parseFloat(this.#inputElement.max ?? '100') ?? 100;
    const stepAttr = this.#inputElement.step;
    let step = 1;
    if (stepAttr && stepAttr.toLowerCase() !== 'any') {
      const parsedStep = parseFloat(stepAttr);
      if (!isNaN(parsedStep) && parsedStep > 0) {
        step = parsedStep;
      }
    }

    this.inputState.set({ min, max, step });

    const inputElementValue = parseFloat(this.#inputElement.value ?? String(min)) ?? min;

    if (isInitialCall && this.value() !== this.#initialDefaultValue) {
      const modelValue = this.value();
      const clampedModelValue = Math.max(min, Math.min(max, modelValue));

      if (inputElementValue !== clampedModelValue) {
        this.#inputElement.value = String(clampedModelValue);
      }
      if (modelValue !== clampedModelValue) {
        this.value.set(clampedModelValue);
      }
    } else {
      const clampedInputElementValue = Math.max(min, Math.min(max, inputElementValue));
      if (this.value() !== clampedInputElementValue) {
        this.value.set(clampedInputElementValue);
      }
    }
  }

  private setupMutationObserver() {
    if (!this.#inputElement || typeof MutationObserver === 'undefined') {
      return;
    }

    const MUTATION_ATTRIBUTES = ['min', 'max', 'step', 'value', 'readonly', 'disabled'];

    this.#observer = new MutationObserver((mutationList) => {
      let needsStateUpdate = false;
      for (const mutation of mutationList) {
        if (mutation.type === 'attributes' && MUTATION_ATTRIBUTES.includes(mutation.attributeName ?? '')) {
          needsStateUpdate = true;
          break;
        }
      }
      if (needsStateUpdate) {
        this.updateStateFromInput(false);
      }
    });

    this.#observer.observe(this.#inputElement, { attributes: true });
  }

  private countDecimals(value: number): number {
    if (isNaN(value) || Math.floor(value) === value) return 0;
    const str = value.toString();
    const decimalPart = str.split('.')[1];
    return decimalPart ? decimalPart.length : 0;
  }

  getPrecision(): number {
    const step = this.inputState().step;
    return this.countDecimals(step);
  }

  valuePercentage = computed(() => {
    const { min, max } = this.inputState();
    const currentValue = this.value() ?? min;
    if (isNaN(currentValue)) return 0;

    const range = max - min;
    if (range === 0) return 0;

    const percentage = ((currentValue - min) / range) * 100;
    return Math.max(0, Math.min(100, percentage));
  });

  trackFilledPercentage = computed(() => this.valuePercentage());
  thumbPositionPercentage = computed(() => this.valuePercentage());
}

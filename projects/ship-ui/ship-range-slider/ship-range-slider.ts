import { afterNextRender, ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, model, signal, untracked, ViewEncapsulation } from '@angular/core';
import { contentProjectionSignal, nativeInputValueSignal, shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipSize, ShipRangeSliderVariant } from '@ship-ui/core';

@Component({
  selector: 'sh-range-slider',
  styleUrl: './ship-range-slider.scss',
  encapsulation: ViewEncapsulation.None,
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
  host: {
    '[class.sh-range-slider]': 'true',
    '[class.has-input]': 'hasInput()',
    '[class]': 'hostClasses()',
  },
})
export class ShipRangeSlider {
  constructor() {
    // Associate a projected <label> with the projected range input (same
    // wiring as sh-form-field) so the slider has an accessible name.
    afterNextRender(() => {
      const el = this.#a11ySelfRef.nativeElement as HTMLElement;
      const inputEl = el.querySelector('input[type=range]');
      const labelEl = el.querySelector('label');
      if (!inputEl || !labelEl) return;
      if (!inputEl.id) inputEl.id = `sh-input-${Math.random().toString(36).substring(2, 9)}`;
      if (!labelEl.getAttribute('for')) labelEl.setAttribute('for', inputEl.id);
    });
  }

  #a11ySelfRef = inject(ElementRef);
  hasInput = signal(false);
  #selfRef = inject(ElementRef<HTMLElement>);
  #inputElement: HTMLInputElement | null = null;
  #initialDefaultValue = 0;

  /** Unit suffix appended to the displayed min, max and current values (e.g. `%`, `px`). */
  unit = input<string>('');
  /** Two-way bound current value of the slider, kept in sync with the projected range input. */
  value = model<number>(this.#initialDefaultValue);

  inputState = signal({
    min: 0,
    max: 100,
    step: 1,
  });

  /** Color theme of the slider (`ShipColor`). */
  color = input<ShipColor | null>(null);
  /** Visual variant of the slider (`ShipRangeSliderVariant`). */
  variant = input<ShipRangeSliderVariant | null>(null);
  /** Size of the slider (`ShipSize`). */
  size = input<ShipSize | null>(null);
  /** When `true`, renders the slider with sharp (non-rounded) corners. */
  sharp = input<boolean | undefined>(undefined);
  /** When `true`, always shows the value indicator instead of only while interacting. */
  alwaysShow = input<boolean | undefined>(undefined);

  hostClasses = shipComponentClasses('rangeSlider', {
    color: this.color,
    variant: this.variant,
    size: this.size,
    sharp: this.sharp,
    alwaysShow: this.alwaysShow,
  });

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

  #inputSignal = contentProjectionSignal<HTMLInputElement>('input[type="range"]', undefined, 0);

  // Read the projected range input's attributes → inputState, (re)seed on attach, and watch
  // for min/max/step changes. Declared BEFORE #valueSync so init reconciliation lands before
  // the model→DOM write-back the primitive registers.
  #setupEffect = effect((onCleanup) => {
    const input = this.#inputSignal();
    this.#inputElement = input ?? null;

    if (!input) {
      this.hasInput.set(false);
      return;
    }

    this.hasInput.set(true);
    untracked(() => this.#updateStateFromInput(true));

    if (typeof MutationObserver === 'undefined') return;

    const MUTATION_ATTRIBUTES = ['min', 'max', 'step', 'value', 'readonly', 'disabled'];
    const observer = new MutationObserver((mutationList) => {
      if (mutationList.some((m) => m.type === 'attributes' && MUTATION_ATTRIBUTES.includes(m.attributeName ?? ''))) {
        this.#updateStateFromInput(false);
      }
    });
    observer.observe(input, { attributes: true, attributeFilter: MUTATION_ATTRIBUTES });
    onCleanup(() => observer.disconnect());
  });

  // Adopt the public `value` model as the input-backed store: drag / programmatic input →
  // parse + clamp → model; model changes → String() → the range input (via the primitive).
  #valueSync = nativeInputValueSignal<number>(this.#inputSignal, {
    signal: this.value,
    transform: (v) => {
      const n = parseFloat(v);
      return isNaN(n) ? untracked(this.value) : this.#clamp(n);
    },
    compare: (a, b) => a === b,
  });

  #clamp(value: number): number {
    const { min, max } = this.inputState();
    return Math.max(min, Math.min(max, value));
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

      const decimals = this.#countDecimals(step);
      nearestStepValue = parseFloat(nearestStepValue.toFixed(decimals));

      const clampedValue = Math.max(min, Math.min(max, nearestStepValue));

      this.value.set(clampedValue);
    }
  }

  #updateStateFromInput(isInitialCall = false) {
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

  #countDecimals(value: number): number {
    if (isNaN(value) || Math.floor(value) === value) return 0;
    const str = value.toString();
    const decimalPart = str.split('.')[1];
    return decimalPart ? decimalPart.length : 0;
  }
}

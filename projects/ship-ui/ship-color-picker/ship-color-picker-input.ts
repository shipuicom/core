import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import {
  classMutationSignal,
  contentProjectionSignal,
  nativeInputValueSignal,
  hslToRgbExact,
  rgbaToHex8,
  rgbToHex,
  rgbToHsl,
  ShipColor,
  ShipFormFieldVariant,
  ShipSize,
} from '@ship-ui/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipFormFieldPopover } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipColorPicker } from './ship-color-picker';

const FORMAT_PREFIX: Record<string, RegExp> = {
  rgb: /^rgb\(/i,
  rgba: /^rgba\(/i,
  hex: /^#[0-9a-f]{6}$/i,
  hex8: /^#[0-9a-f]{8}$/i,
  hsl: /^hsl\(/i,
  hsla: /^hsla\(/i,
};

/** Whether `text` is already written in the requested output `format`. */
function matchesFormat(text: string, format: string): boolean {
  return FORMAT_PREFIX[format]?.test(text) ?? false;
}

@Component({
  selector: 'sh-color-picker-input',
  styleUrl: './ship-color-picker.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipFormFieldPopover, ShipColorPicker, ShipIcon, ShipButton],
  template: `
    <sh-form-field-popover
      (closed)="close()"
      [(isOpen)]="isOpen"
      [class]="currentClass()"
      [variant]="variant()"
      [size]="size()"
      [color]="color()"
      [readonly]="readonly()">
      <ng-content select="label" ngProjectAs="label" />

      <ng-content select="[prefix]" ngProjectAs="[prefix]" />
      <ng-content select="[textPrefix]" ngProjectAs="[textPrefix]" />

      <div id="input-wrap" class="input-container" ngProjectAs="input">
        <ng-content select="input" />

        <div class="color-indicator" [style.--indicator-color]="formattedColorString()"></div>

        @if (isEyeDropperSupported && showEyeDropper()) {
          <button size="xsmall" tabindex="-1" variant="outlined" shButton (click)="openEyeDropper($event)">
            <sh-icon>eyedropper</sh-icon>
          </button>
        }
      </div>

      <ng-content select="[textSuffix]" ngProjectAs="[textSuffix]" />
      <ng-content select="[suffix]" ngProjectAs="[suffix]" />

      <div popoverContent>
        @if (this.isOpen()) {
          <sh-color-picker
            [renderingType]="renderingType()"
            [direction]="'horizontal'"
            [(selectedColor)]="internalColorTuple"
            [hue]="internalHue()"
            [(alpha)]="internalAlpha"
            (currentColor)="onMainColorChange($event)" />

          @if (renderingType() !== 'hsl') {
            <sh-color-picker
              renderingType="hue"
              [direction]="'horizontal'"
              [hue]="internalHue()"
              [selectedColor]="pureHueColor()"
              (currentColor)="onHuePickerChange($event)" />
          }

          @if (hasAlpha()) {
            <sh-color-picker
              renderingType="alpha"
              [direction]="'horizontal'"
              [(alpha)]="internalAlpha"
              [(selectedColor)]="internalColorTuple" />
          }
        }
      </div>
    </sh-form-field-popover>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // SSG: the popoverContent div projects into sh-popover's closed `@if`
    // branch, which the hydration serializer can't map (NG0502) — skip
    // hydration so this subtree client-renders instead.
    ngSkipHydration: 'true',
    // `patch` collapses the field to just the color swatch (a compact trigger);
    // the swatch opens the picker popover on click. Styled in the scss.
    '[class.patch]': 'patch()',
  },
})
export class ShipColorPickerInput {
  #document = inject(DOCUMENT);

  /** Which picker surface the popover renders (`hsl`, `grid`, `hue`, `rgb`, `saturation`, `alpha`). */
  renderingType = input<'hsl' | 'grid' | 'hue' | 'rgb' | 'saturation' | 'alpha'>('hsl');
  /** Output color string format (`rgb`, `rgba`, `hex`, `hex8`, `hsl`, `hsla`). */
  format = input<'rgb' | 'rgba' | 'hex' | 'hex8' | 'hsl' | 'hsla'>('rgb');

  /** Semantic color scale (`primary`, `accent`, `warn`, `error`, `success`). */
  color = input<ShipColor | null>(null);
  /** Visual variant of the form field. */
  variant = input<ShipFormFieldVariant | null>(null);
  /** Size preset. */
  size = input<ShipSize | null>(null);
  /** Render in a non-interactive read-only state. */
  readonly = input<boolean>(false);
  /**
   * Compact "swatch only" appearance: the field renders as a single color patch
   * that opens the picker popover when clicked. The text input is still present
   * (hidden) so `[(ngModel)]` value binding works exactly as in the full field.
   */
  patch = input<boolean>(false);

  /** Emits the formatted color string when the picker popover closes. */
  closed = output<string>();

  /** Two-way open state of the picker popover. */
  isOpen = model<boolean>(false);
  currentClass = classMutationSignal();

  isEyeDropperSupported = typeof window !== 'undefined' && 'EyeDropper' in window;
  /** Show the eyedropper button when the browser supports the EyeDropper API. */
  showEyeDropper = input<boolean>(true);

  internalHue = signal(0);
  internalAlpha = signal(1);
  internalColorTuple = signal<[number, number, number, number?]>([255, 255, 255, 1]);

  hasAlpha = computed(() => ['rgba', 'hex8', 'hsla'].includes(this.format()));

  /**
   * The last string parsed into `internalColorTuple`, kept while that tuple is still the one it produced.
   * 8-bit RGB cannot represent every colour (hsl(30, 10%, 46%) re-derives as hsl(28, 10%, 46%)), so a seeded or
   * typed string that is already in the output format is echoed verbatim instead of re-rounded; the moment the
   * picker, hue slider or eyedropper produce a new tuple the derived string takes over again.
   */
  #exact = signal<{ text: string; tuple: [number, number, number, number?] } | null>(null);

  formattedColorString = computed(() => {
    const format = this.format();
    const tuple = this.internalColorTuple();
    const exact = this.#exact();
    if (exact && exact.tuple === tuple && matchesFormat(exact.text, format)) return exact.text;
    const [r, g, b, aRaw] = tuple;
    const a = aRaw ?? 1;

    switch (format) {
      case 'rgb':
        return `rgb(${r}, ${g}, ${b})`;
      case 'rgba':
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      case 'hex':
        return rgbToHex(r, g, b);
      case 'hex8':
        return rgbaToHex8(r, g, b, a);
      case 'hsl':
        return rgbToHsl(r, g, b).string;
      case 'hsla': {
        const hsl = rgbToHsl(r, g, b);
        return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})`;
      }
      default:
        return `rgb(${r}, ${g}, ${b})`;
    }
  });

  #inputEl = contentProjectionSignal<HTMLInputElement>('#input-wrap input', undefined, 0);
  #focused = signal(false);

  /** Raw edit-buffer bound to the projected text input; decoded to the color tuple below. */
  #colorText = nativeInputValueSignal<string>(this.#inputEl);

  // Decode: whatever sits in the field (typed or seeded) → color tuple.
  #parseEffect = effect(() => {
    const text = this.#colorText();
    if (text) this.#parseAndSetColor(text);
  });

  // Encode: reflect the canonical formatted string back into the field, but never while the
  // user is editing it — mirrors the old `activeElement !== input` guard.
  #canonicalizeEffect = effect(() => {
    const str = this.formattedColorString();
    if (this.#focused()) return;
    this.#colorText.set(str);
  });

  pureHueColor = computed<[number, number, number]>(() => {
    return hslToRgbExact(this.internalHue(), 100, 50);
  });

  onMainColorChange(colorObj: any) {
    if (colorObj.hue !== undefined) {
      if (this.renderingType() === 'hsl' && colorObj.saturation > 0) {
        this.internalHue.set(colorObj.hue);
      }
    }
  }

  onHuePickerChange(colorObj: any) {
    if (colorObj.hue !== undefined && colorObj.hue !== this.internalHue()) {
      this.internalHue.set(colorObj.hue);
    }
  }

  async openEyeDropper(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    try {
      // @ts-ignore
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result && result.sRGBHex) {
        this.#parseAndSetColor(result.sRGBHex);
      }
    } catch (e) {
      // User cancelled
    }
  }

  close() {
    this.closed.emit(this.formattedColorString());
  }

  #inputSetupEffect = effect((onCleanup) => {
    const input = this.#inputEl();
    if (!input) return;

    input.autocomplete = 'off';

    const onFocus = () => {
      this.#focused.set(true);
      this.isOpen.set(true);
    };
    const onBlur = () => this.#focused.set(false);

    input.addEventListener('focus', onFocus);
    input.addEventListener('blur', onBlur);

    onCleanup(() => {
      input.removeEventListener('focus', onFocus);
      input.removeEventListener('blur', onBlur);
    });
  });

  #parseAndSetColor(colorStr: string) {
    if (!colorStr) return;
    if (colorStr === untracked(() => this.formattedColorString())) return;

    const div = this.#document.createElement('div');
    div.style.color = colorStr;
    if (div.style.color === '') return; // Not a valid color format

    this.#document.body.appendChild(div);
    const computedColor = getComputedStyle(div).color;
    this.#document.body.removeChild(div);

    const rgbaMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1], 10);
      const g = parseInt(rgbaMatch[2], 10);
      const b = parseInt(rgbaMatch[3], 10);
      const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;

      const current = untracked(() => this.internalColorTuple());
      const changed = current[0] !== r || current[1] !== g || current[2] !== b || (current[3] ?? 1) !== a;
      const tuple: [number, number, number, number?] = changed ? [r, g, b, a] : current;
      this.#exact.set({ text: colorStr.trim(), tuple });
      if (changed) {
        this.internalColorTuple.set(tuple);
        this.internalAlpha.set(a);

        // Also update hue so the hue slider matches the typed color!
        const max = Math.max(r, g, b) / 255;
        const min = Math.min(r, g, b) / 255;
        if (max !== min) {
          const d = max - min;
          let h = 0;
          switch (max) {
            case r / 255:
              h = (g / 255 - b / 255) / d + (g / 255 < b / 255 ? 6 : 0);
              break;
            case g / 255:
              h = (b / 255 - r / 255) / d + 2;
              break;
            case b / 255:
              h = (r / 255 - g / 255) / d + 4;
              break;
          }
          h /= 6;
          this.internalHue.set(Math.floor(h * 360));
        }
      }
    }
  }
}

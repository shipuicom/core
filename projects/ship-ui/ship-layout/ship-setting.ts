import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, input, ViewEncapsulation } from '@angular/core';
import { generateUniqueId, shipComponentClasses } from '@ship-ui/core';
import { ShipLayoutSettingVariant } from '@ship-ui/core';

/**
 * One setting in a settings form: `label` and `p` (description) on the
 * left, the control(s) on the right; stacks on narrow screens. Consecutive
 * settings inside a `sh-card` or `sh-lo-section` are divided automatically.
 * The slotted `label` names the control: an unlabelled `sh-toggle`, `sh-checkbox`,
 * `sh-select` or native input in the control slot gets `aria-labelledby` pointing at it.
 */
@Component({
  selector: 'sh-lo-setting',
  styleUrl: './ship-setting.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="text">
      <ng-content select="label, h3, h4" />
      <ng-content select="p, [description]" />
    </div>
    <div class="control"><ng-content /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipLayoutSetting {
  #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Visual variant (`type-b`, `type-c`, or default). Project default via `ShipConfig.layoutSetting.variant`. */
  variant = input<ShipLayoutSettingVariant | null>(null);

  hostClasses = shipComponentClasses('layoutSetting', { variant: this.variant });

  constructor() {
    afterNextRender(() => this.#nameControl());
  }

  // A `<label>` only names a control through `for`/nesting; here the two sit in separate
  // slots, so point the first focusable control at the label unless the consumer named it.
  #nameControl() {
    const label = this.#host.querySelector<HTMLElement>(':scope > .text > :is(label, h3, h4)');
    const control = this.#host.querySelector<HTMLElement>(
      '.control :is(input, select, textarea, [role="switch"], [role="checkbox"], [role="combobox"], [role="slider"])'
    );
    if (!label || !control) return;
    if (label instanceof HTMLLabelElement && label.htmlFor) return;
    if ('labels' in control && (control as HTMLInputElement).labels?.length) return;
    if (control.getAttribute('aria-label')) return;
    // sh-toggle/sh-checkbox stamp aria-labelledby on themselves; only keep it when it resolves to actual text.
    const named = control.getAttribute('aria-labelledby');
    if (named && named.split(/\s+/).some(id => this.#host.ownerDocument.getElementById(id)?.textContent?.trim())) return;
    if (!label.id) label.id = `sh-lo-setting-${generateUniqueId()}`;
    control.setAttribute('aria-labelledby', label.id);
  }
}

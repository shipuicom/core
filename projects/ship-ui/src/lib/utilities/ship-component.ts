import { computed, inject, Signal } from '@angular/core';
import { SHIP_CONFIG, ShipComponentConfig, ShipConfig } from './ship-config';

/** `ShipConfig` keys whose value is a per component config (not a global like `fontSize` or `colors`). */
export type ShipComponentConfigKey = {
  [K in keyof ShipConfig]-?: NonNullable<ShipConfig[K]> extends ShipComponentConfig ? K : never;
}[keyof ShipConfig];

/**
 * The host class list of a component: `color`, `variant`, `size` and the boolean flags, each falling back to the
 * project default in `ShipConfig[componentName]`. No class is emitted for an input that is unset in both.
 */
export function shipComponentClasses(
  componentName: ShipComponentConfigKey,
  inputs: {
    color?: Signal<string | null | undefined>;
    variant?: Signal<string | null | undefined>;
    size?: Signal<string | null | undefined>;
    sharp?: Signal<boolean | null | undefined>;
    dynamic?: Signal<boolean | null | undefined>;
    readonly?: Signal<boolean | null | undefined>;
    alwaysShow?: Signal<boolean | null | undefined>;
  }
) {
  const config = inject(SHIP_CONFIG, { optional: true });

  return computed(() => {
    const componentConfig: ShipComponentConfig | undefined = config?.[componentName];

    const variant = inputs.variant?.() || componentConfig?.variant;
    const color = inputs.color?.() || componentConfig?.color;
    const size = inputs.size?.() || componentConfig?.size;
    const sharp = (inputs.sharp?.() ?? componentConfig?.sharp) || false;
    const dynamic = (inputs.dynamic?.() ?? componentConfig?.dynamic) || false;
    const readonly = (inputs.readonly?.() ?? componentConfig?.readonly) || false;
    const alwaysShow = (inputs.alwaysShow?.() ?? componentConfig?.alwaysShow) || false;

    const classList: string[] = [];

    if (color) classList.push(color);
    if (variant) classList.push(variant);
    if (size) classList.push(size);
    if (sharp) classList.push('sharp');
    if (dynamic) classList.push('dynamic');
    if (readonly) classList.push('readonly');
    if (alwaysShow) classList.push('always-show');

    return classList.join(' ');
  });
}

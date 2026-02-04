import { computed, inject, Signal } from '@angular/core';
import { SHIP_CONFIG } from './ship-config';

export function shipComponentClasses(
  componentName: string,
  inputs: {
    color?: Signal<any>;
    variant?: Signal<any>;
    size?: Signal<any>;
    sharp?: Signal<any>;
    dynamic?: Signal<any>;
    readonly?: Signal<any>;
  }
) {
  const config = inject(SHIP_CONFIG, { optional: true });

  return computed(() => {
    const componentConfig = (config as any)?.[componentName];

    // Resolve variant (Input > Component Config > Global Legacy Mappings > empty)
    let variant = inputs.variant?.();
    if (!variant) {
      variant = componentConfig?.variant;
    }

    // Legacy mapping for alert
    if (!variant && componentName === 'alert' && config?.alertVariant) {
      variant = config.alertVariant;
    }

    // Legacy mapping for card
    if (!variant && componentName === 'card' && config?.cardType) {
      variant = config.cardType;
    }

    // Legacy mapping for table
    if (!variant && componentName === 'table' && config?.tableType) {
      variant = config.tableType;
    }

    // Resolve color (Input > Component Config > empty)
    const color = inputs.color?.() || componentConfig?.color;

    // Resolve size (Input > Component Config > empty)
    const size = inputs.size?.() || componentConfig?.size;

    // Resolve sharp (Input > Component Config > false)
    const sharp = (inputs.sharp?.() ?? componentConfig?.sharp) || false;

    // Resolve dynamic (Input > Component Config > false)
    const dynamic = (inputs.dynamic?.() ?? componentConfig?.dynamic) || false;

    // Resolve readonly (Input > Component Config > false)
    const readonly = (inputs.readonly?.() ?? componentConfig?.readonly) || false;

    const classList: string[] = [];

    if (color) classList.push(color);
    if (variant) {
      // Handle type-a, type-b etc. If it doesn't already have the prefix but it's meant to be one of those
      if (['a', 'b', 'c', 'd'].includes(variant)) {
        classList.push(`type-${variant}`);
      } else {
        classList.push(variant);
      }
    }
    if (size) classList.push(size);
    if (sharp) classList.push('sharp');
    if (dynamic) classList.push('dynamic');
    if (readonly) classList.push('readonly');

    return classList.join(' ');
  });
}

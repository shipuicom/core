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
    alwaysShow?: Signal<any>;
  }
) {
  const config = inject(SHIP_CONFIG, { optional: true });

  return computed(() => {
    const componentConfig = (config as any)?.[componentName];

    
    let variant = inputs.variant?.();
    if (!variant) {
      variant = componentConfig?.variant;
    }

    
    if (!variant && componentName === 'alert' && config?.alertVariant) {
      variant = config.alertVariant;
    }

    
    if (!variant && componentName === 'card' && config?.cardType) {
      variant = config.cardType;
    }

    
    if (!variant && componentName === 'table' && config?.tableType) {
      variant = config.tableType;
    }

    
    const color = inputs.color?.() || componentConfig?.color;

    if (!variant) {
      variant = 'base';
    }

    
    const size = inputs.size?.() || componentConfig?.size;

    
    const sharp = (inputs.sharp?.() ?? componentConfig?.sharp) || false;

    
    const dynamic = (inputs.dynamic?.() ?? componentConfig?.dynamic) || false;

    
    const readonly = (inputs.readonly?.() ?? componentConfig?.readonly) || false;

    
    const alwaysShow = (inputs.alwaysShow?.() ?? componentConfig?.alwaysShow) || false;

    const classList: string[] = [];

    if (color) classList.push(color);
    if (variant) {
      
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
    if (alwaysShow) classList.push('always-show');

    return classList.join(' ');
  });
}

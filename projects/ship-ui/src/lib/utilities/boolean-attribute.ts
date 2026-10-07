import { booleanAttribute } from '@angular/core';

/**
 * `booleanAttribute` for inputs whose unset state must stay `undefined` so a `ShipConfig` default can take over:
 * `<sh-chip sharp>` → `true`, `[sharp]="false"` → `false`, nothing / `null` → `undefined`.
 */
export function optionalBooleanAttribute(value: unknown): boolean | undefined {
  return value == null ? undefined : booleanAttribute(value);
}

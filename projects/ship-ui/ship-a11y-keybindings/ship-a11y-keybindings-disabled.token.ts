import { InjectionToken } from '@angular/core';

export const SHIP_A11Y_KEYBINDINGS_DISABLED = new InjectionToken<boolean>('SHIP_A11Y_KEYBINDINGS_DISABLED', {
  providedIn: 'root',
  factory: () => false,
});

import { booleanAttribute, Component, computed, inject, input, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'sh-kbd, [sh-kbd]',
  standalone: true,
  template: `
    @for (key of displayKeys(); track $index) {
      <span class="key-part">{{ key }}</span>
      @if (!isMac() && !$last) {
        <span class="separator">+</span>
      }
    }
    @if (hasContent()) {
      @if (!isMac() && displayKeys().length > 0) {
        <span class="separator">+</span>
      }
      <span class="content">
        <ng-content></ng-content>
      </span>
    }
  `,
  styleUrl: './ship-kbd.scss',
})
export class ShipKbd {
  #platformId = inject(PLATFORM_ID);

  /** Show the Meta key (`⌘` on Mac, `Win` otherwise). */
  meta = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  /** Show the Shift key (`⇧` on Mac, `Shift` otherwise). */
  shift = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  /** Show the Alt key (`⌥` on Mac, `Alt` otherwise). */
  alt = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  /** Show the Control key (`⌃` on Mac, `Ctrl` otherwise). */
  ctrl = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  /** Show the platform command key: `⌘` on Mac, `Ctrl` otherwise. */
  ctrlOrCmd = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  /** Show the Enter key (`↵` on Mac, `Enter` otherwise). */
  enter = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  /** Show the Escape key (`⎋` on Mac, `Esc` otherwise). */
  escape = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  /** Show the Backspace key (`⌫` on Mac, `Backspace` otherwise). */
  backspace = input<boolean, string | boolean>(false, { transform: booleanAttribute });

  isMac = computed(() => {
    if (!isPlatformBrowser(this.#platformId)) return false;
    return navigator.userAgent.toLowerCase().includes('mac');
  });

  hasContent = computed(() => {
    
    
    
    
    
    return true; 
  });

  displayKeys = computed(() => {
    const keys: string[] = [];
    const mac = this.isMac();

    if (this.ctrlOrCmd()) keys.push(mac ? '⌘' : 'Ctrl');
    if (this.meta()) keys.push(mac ? '⌘' : 'Win');
    if (this.ctrl()) keys.push(mac ? '⌃' : 'Ctrl');
    if (this.alt()) keys.push(mac ? '⌥' : 'Alt');
    if (this.shift()) keys.push(mac ? '⇧' : 'Shift');
    if (this.enter()) keys.push(mac ? '↵' : 'Enter');
    if (this.escape()) keys.push(mac ? '⎋' : 'Esc');
    if (this.backspace()) keys.push(mac ? '⌫' : 'Backspace');

    
    return Array.from(new Set(keys));
  });
}

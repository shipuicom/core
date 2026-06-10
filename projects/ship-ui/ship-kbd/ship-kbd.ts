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

  meta = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  shift = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  alt = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  ctrl = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  enter = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  escape = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  backspace = input<boolean, string | boolean>(false, { transform: booleanAttribute });

  isMac = computed(() => {
    if (!isPlatformBrowser(this.#platformId)) return false;
    return navigator.userAgent.toLowerCase().includes('mac');
  });

  hasContent = computed(() => {
    // If there is any content, it will be projected. We just need to render the separator
    // if there are modifiers before it. Angular ng-content always renders if projected,
    // so we assume true if they use the component with innerHTML (which we can't easily check
    // statically, but we can assume if it's used as a wrapper, there's content).
    // Actually, we can check if any modifiers exist to prepend. 
    return true; 
  });

  displayKeys = computed(() => {
    const keys: string[] = [];
    const mac = this.isMac();

    if (this.meta()) keys.push(mac ? '⌘' : 'Win');
    if (this.ctrl()) keys.push(mac ? '⌃' : 'Ctrl');
    if (this.alt()) keys.push(mac ? '⌥' : 'Alt');
    if (this.shift()) keys.push(mac ? '⇧' : 'Shift');
    if (this.enter()) keys.push(mac ? '↵' : 'Enter');
    if (this.escape()) keys.push(mac ? '⎋' : 'Esc');
    if (this.backspace()) keys.push(mac ? '⌫' : 'Backspace');

    // Remove duplicates if they specify both meta and ctrl on windows (which both map to Ctrl)
    return Array.from(new Set(keys));
  });
}

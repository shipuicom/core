import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ShipA11yPoliteness = 'polite' | 'assertive';

/**
 * Screen-reader announcements for state changes the DOM doesn't voice on its
 * own — a selection sweep in `sh-spreadsheet`, a toast appearing, a block
 * conversion in `sh-editor`.
 *
 * One visually-hidden `aria-live` region per politeness level is lazily
 * appended to `<body>` and reused for every announcement. The message is
 * written on a short timer after clearing the region: assistive tech only
 * speaks *changes*, so announcing the same string twice (or in quick
 * succession) needs the clear-then-set cycle.
 *
 * `'polite'` (default) waits for the screen reader to finish what it is
 * saying; reserve `'assertive'` for messages that lose their meaning if
 * delayed (errors, destructive results).
 */
@Injectable({ providedIn: 'root' })
export class ShipA11yAnnouncerService {
  #document = inject(DOCUMENT);
  #platformId = inject(PLATFORM_ID);

  #regions = new Map<ShipA11yPoliteness, HTMLElement>();
  #pending: ReturnType<typeof setTimeout> | null = null;

  /** Queue `message` for the screen reader. No-op during server-side rendering. */
  announce(message: string, politeness: ShipA11yPoliteness = 'polite'): void {
    if (!isPlatformBrowser(this.#platformId) || !message) return;

    const region = this.#region(politeness);
    // Clear first so repeating the same message still produces a change the
    // screen reader will voice; the timer lets that clear actually land.
    region.textContent = '';
    if (this.#pending) clearTimeout(this.#pending);
    this.#pending = setTimeout(() => {
      this.#pending = null;
      region.textContent = message;
    }, 100);
  }

  /** Empty both live regions (e.g. before tearing down a noisy interaction). */
  clear(): void {
    if (this.#pending) {
      clearTimeout(this.#pending);
      this.#pending = null;
    }
    for (const region of this.#regions.values()) region.textContent = '';
  }

  #region(politeness: ShipA11yPoliteness): HTMLElement {
    let region = this.#regions.get(politeness);
    if (region) return region;

    region = this.#document.createElement('div');
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('data-ship-announcer', politeness);
    // Visually hidden but present in the accessibility tree — display:none
    // or visibility:hidden would mute it.
    Object.assign(region.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      margin: '-1px',
      padding: '0',
      border: '0',
      clip: 'rect(0 0 0 0)',
      clipPath: 'inset(50%)',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    });
    this.#document.body.appendChild(region);
    this.#regions.set(politeness, region);
    return region;
  }

  ngOnDestroy(): void {
    if (this.#pending) clearTimeout(this.#pending);
    for (const region of this.#regions.values()) region.remove();
    this.#regions.clear();
  }
}

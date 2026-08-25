import { DOCUMENT, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { isAccHidden } from './accname';
import { observeLiveRegions } from './live-regions';
import { ShipSpeech } from './speech';
import { buildUtterance, ShipScreenreaderSource, ShipScreenreaderUtterance } from './utterance';
import { generateUniqueId } from '@ship-ui/core';

const LOG_CAP = 200;

/**
 * Console / automation handle exposed as `window.shipScreenreader` while the
 * service is instantiated — lets a developer, an e2e test, or an AI agent
 * drive the simulator without touching Angular:
 *
 * ```js
 * shipScreenreader.enable();
 * shipScreenreader.say('#save');                       // "Save, button"
 * shipScreenreader.expect('#save', 'Save, button');    // { pass: true, actual: "Save, button" }
 * shipScreenreader.focus('#email');                    // focuses + returns the announcement
 * shipScreenreader.log();                              // transcript [{text, source, timestamp}]
 * ```
 */
export interface ShipScreenreaderHandle {
  enable(): void;
  disable(): void;
  enabled(): boolean;
  /** The announcement for an element (selector or Element) without logging or focusing it. */
  say(target: Element | string): string;
  /** Focus the element and return what was announced. */
  focus(target: Element | string): string;
  /** Assert an element's announcement; returns the verdict plus the actual phrase. */
  expect(target: Element | string, expected: string): { pass: boolean; actual: string; expected: string };
  log(): Array<{ text: string; source: ShipScreenreaderSource; timestamp: number }>;
  clear(): void;
}

declare global {
  interface Window {
    shipScreenreader?: ShipScreenreaderHandle;
  }
}

/**
 * Screen-reader *simulator* for accessibility debugging: computes what
 * assistive tech would announce (accessible name, role, states, value,
 * position per WCAG/ARIA) for focus moves and `aria-live` region changes,
 * keeps a transcript signal, and can voice it via SpeechSynthesis.
 *
 * This is a dev tool — it approximates NVDA/VoiceOver behaviour; it is not
 * a substitute for testing with real screen readers.
 */
@Injectable({ providedIn: 'root' })
export class ShipScreenreaderService {
  #document = inject(DOCUMENT);
  #platformId = inject(PLATFORM_ID);
  #speech = new ShipSpeech();

  #enabled = signal(false);
  #speechEnabled = signal(false);
  #log = signal<ShipScreenreaderUtterance[]>([]);

  #teardowns: Array<() => void> = [];
  #lastText = '';
  #lastAt = 0;

  /** Whether the simulator is currently listening. */
  readonly enabled = this.#enabled.asReadonly();
  /** Whether announcements are also voiced via SpeechSynthesis. */
  readonly speechEnabled = this.#speechEnabled.asReadonly();
  /** Transcript of announcements, oldest first, capped at 200 entries. */
  readonly log = this.#log.asReadonly();
  /** False when the browser has no SpeechSynthesis support. */
  readonly speechSupported = this.#speech.supported;

  /** Start listening for focus moves and live-region changes. SSR no-op. */
  enable(): void {
    if (!isPlatformBrowser(this.#platformId) || this.#enabled()) return;

    const onFocus = (event: FocusEvent) => this.#handleFocus(event);
    this.#document.addEventListener('focusin', onFocus, true);
    this.#teardowns.push(() => this.#document.removeEventListener('focusin', onFocus, true));

    this.#teardowns.push(
      observeLiveRegions(this.#document, (text, politeness) =>
        this.announce(text, politeness === 'assertive' ? 'live-assertive' : 'live-polite'),
      ),
    );

    this.#enabled.set(true);
  }

  /** Stop listening and cancel any queued speech. */
  disable(): void {
    for (const teardown of this.#teardowns) teardown();
    this.#teardowns = [];
    this.#speech.cancel();
    this.#enabled.set(false);
  }

  toggleSpeech(on?: boolean): void {
    const next = on ?? !this.#speechEnabled();
    this.#speechEnabled.set(next && this.#speech.supported);
    if (!next) this.#speech.cancel();
  }

  clearLog(): void {
    this.#log.set([]);
  }

  /** Push a text announcement, as a live region change or manually. */
  announce(text: string, source: ShipScreenreaderSource = 'manual'): void {
    if (!text) return;
    this.#push({ id: generateUniqueId(), text, source, timestamp: Date.now() });
  }

  /**
   * What the simulator would announce for `target` (Element or selector) —
   * computed on demand, nothing is logged or focused. Empty string when the
   * element is missing or hidden from assistive tech.
   */
  utteranceFor(target: Element | string): string {
    const el = this.#resolve(target);
    if (!el || isAccHidden(el)) return '';
    return buildUtterance(el).text;
  }

  #resolve(target: Element | string): Element | null {
    if (typeof target !== 'string') return target;
    if (!isPlatformBrowser(this.#platformId)) return null;
    return this.#document.querySelector(target);
  }

  constructor() {
    // Automation handle for devtools consoles, e2e tests and AI agents.
    if (isPlatformBrowser(this.#platformId)) {
      this.#document.defaultView!.shipScreenreader = {
        enable: () => this.enable(),
        disable: () => this.disable(),
        enabled: () => this.enabled(),
        say: (target) => this.utteranceFor(target),
        focus: (target) => {
          const el = this.#resolve(target);
          (el as HTMLElement | null)?.focus?.();
          return this.utteranceFor(target);
        },
        expect: (target, expected) => {
          const actual = this.utteranceFor(target);
          return { pass: actual === expected, actual, expected };
        },
        log: () => this.log().map(({ text, source, timestamp }) => ({ text, source, timestamp })),
        clear: () => this.clearLog(),
      };
    }
  }

  #handleFocus(event: FocusEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('[data-ship-screenreader]')) return;
    if (isAccHidden(target)) return;

    const utterance = buildUtterance(target, 'focus');
    if (!utterance.text) return;
    this.#push(utterance);
  }

  #push(utterance: ShipScreenreaderUtterance): void {
    // Dedupe identical back-to-back announcements (double focus events,
    // clear-then-set live regions).
    const now = Date.now();
    if (utterance.text === this.#lastText && now - this.#lastAt < 100) return;
    this.#lastText = utterance.text;
    this.#lastAt = now;

    this.#log.update((entries) => [...entries, utterance].slice(-LOG_CAP));

    if (this.#speechEnabled()) {
      // Focus moves and assertive regions interrupt, polite ones queue —
      // mirroring real screen-reader behaviour.
      const interrupt = utterance.source !== 'live-polite';
      this.#speech.speak(utterance.text, { interrupt });
    }
  }

  ngOnDestroy(): void {
    this.disable();
  }
}

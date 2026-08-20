/**
 * Thin wrapper around the browser SpeechSynthesis API. Feature-detected:
 * `supported` is false in jsdom/SSR and the whole class no-ops there.
 */
export class ShipSpeech {
  readonly supported: boolean;
  #rate = 1;
  #voice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /** Voice `text`; `interrupt` cancels anything queued or speaking first. */
  speak(text: string, options: { interrupt?: boolean } = {}): void {
    if (!this.supported || !text) return;
    if (options.interrupt) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.#rate;
    if (this.#voice) utterance.voice = this.#voice;
    window.speechSynthesis.speak(utterance);
  }

  cancel(): void {
    if (this.supported) window.speechSynthesis.cancel();
  }

  /** Speech rate, 0.1–10 (SpeechSynthesis clamps further). */
  setRate(rate: number): void {
    this.#rate = Math.min(10, Math.max(0.1, rate));
  }

  setVoice(voice: SpeechSynthesisVoice | null): void {
    this.#voice = voice;
  }

  voices(): SpeechSynthesisVoice[] {
    return this.supported ? window.speechSynthesis.getVoices() : [];
  }
}

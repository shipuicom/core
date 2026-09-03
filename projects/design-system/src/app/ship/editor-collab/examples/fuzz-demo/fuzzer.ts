import { signal } from '@angular/core';
import { EditorEngineService, logicalToPos } from '@ship-ui/core/ship-editor';

const WORDS = ['ship', 'collab', 'rebase', 'signal', 'editor', 'op'];

/** Storms an engine with random inserts and deletes. Demo only. */
export class Fuzzer {
  running = signal(false);
  ops = signal(0);
  #timer: ReturnType<typeof setInterval> | null = null;
  #stop: ReturnType<typeof setTimeout> | null = null;

  toggle(on: boolean, engine: () => EditorEngineService | undefined) {
    this.running.set(on);
    if (this.#timer) clearInterval(this.#timer);
    if (this.#stop) clearTimeout(this.#stop);
    this.#timer = null;
    this.#stop = null;
    if (!on) return;

    this.ops.set(0);
    this.#timer = setInterval(() => this.#step(engine()), 250);
    this.#stop = setTimeout(() => this.toggle(false, engine), 60_000);
  }

  #step(engine: EditorEngineService | undefined) {
    if (!engine) return;
    const doc = engine.document();
    if (JSON.stringify(doc).length > 20_000) return this.running.set(false);

    const blockIndex = Math.floor(Math.random() * doc.length);
    const text = (doc[blockIndex].content as { text?: string }[]).map((n) => n.text ?? '').join('');
    const offset = Math.floor(Math.random() * (text.length + 1));
    const at = logicalToPos(doc, { blockIndex, inlineIndex: 0, offset });

    if (Math.random() < 0.75 || text.length < 8) {
      engine.selection.live.set({ from: at, to: at });
      engine.insertText(` ${WORDS[Math.floor(Math.random() * WORDS.length)]}`);
    } else {
      const len = 1 + Math.floor(Math.random() * Math.min(5, text.length - offset));
      engine.selection.live.set({ from: at, to: Math.min(at + len, at + (text.length - offset)) });
      engine.deleteRange();
    }
    this.ops.update((n) => n + 1);
  }
}

/** Tiny stable checksum so two editors can visually compare documents. */
export function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36).padStart(7, '0');
}

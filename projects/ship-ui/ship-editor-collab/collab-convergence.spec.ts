// @vitest-environment jsdom

import { Injector, runInInjectionContext, signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { EditorEngineService } from '../ship-editor/editor-engine.service';
import { EditorSelectionService } from '../ship-editor/selection.service';
import { logicalToPos } from '../ship-editor/editor-flat-positions';
import { ParagraphBehavior } from '../ship-editor/standard-behaviors';
import { ASTDocument } from '../ship-editor/editor.types';
import { ShipEditorCollab } from './ship-editor-collab';
import { CollabMessage, CollabTransport } from './collab-protocol';

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const p = (text: string): ASTDocument[number] => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const json = (engine: EditorEngineService) => JSON.stringify(engine.document());

/** In-memory hub: queues per receiver so delivery can be deferred and interleaved. */
class Hub {
  #subscribers: { id: string; cb: (m: CollabMessage) => void; queue: CollabMessage[] }[] = [];

  transport(id: string): CollabTransport {
    const hub = this;
    return {
      send(message) {
        for (const sub of hub.#subscribers) if (sub.id !== id) sub.queue.push(structuredClone(message));
      },
      subscribe(cb) {
        const entry = { id, cb, queue: [] as CollabMessage[] };
        hub.#subscribers.push(entry);
        return () => hub.#subscribers.splice(hub.#subscribers.indexOf(entry), 1);
      },
      connected: signal(true),
    };
  }

  /** Deliver every queued message (repeatedly, since applies can enqueue more). */
  flush() {
    for (let round = 0; round < 50; round++) {
      let delivered = false;
      for (const sub of this.#subscribers) {
        while (sub.queue.length) {
          delivered = true;
          sub.cb(sub.queue.shift()!);
        }
      }
      if (!delivered) return;
    }
  }

  /** Deliver exactly one pending message for the given receiver, if any. */
  deliverOne(id: string) {
    const sub = this.#subscribers.find((s) => s.id === id);
    const message = sub?.queue.shift();
    if (sub && message) sub.cb(message);
  }

  pending(id: string) {
    return this.#subscribers.find((s) => s.id === id)?.queue.length ?? 0;
  }
}

function makeSite(hub: Hub, clientId: string, doc: ASTDocument) {
  const injector = Injector.create({
    providers: [{ provide: EditorSelectionService, useValue: new EditorSelectionService() }],
  });
  const engine = runInInjectionContext(injector, () => new EditorEngineService());
  engine.register(new ParagraphBehavior());
  engine.load(structuredClone(doc));
  const collab = runInInjectionContext(injector, () => new ShipEditorCollab());
  collab.attach(engine, { transport: hub.transport(clientId), clientId, presenceThrottleMs: 0 });
  // attach broadcast join/presence; drop those for determinism in op tests
  hub.flush();
  const typeAt = (blockIndex: number, offset: number, text: string) => {
    const at = logicalToPos(engine.document(), { blockIndex, inlineIndex: 0, offset });
    engine.selection.live.set({ from: at, to: at });
    engine.insertText(text);
    collab.flushLocal();
  };
  return { engine, collab, typeAt };
}

const BASE: ASTDocument = [p('alpha bravo'), p('charlie delta')];

describe('ShipEditorCollab convergence', () => {
  it('replicates sequential edits both ways', () => {
    const hub = new Hub();
    const a = makeSite(hub, 'aaa', BASE);
    const b = makeSite(hub, 'bbb', BASE);

    a.typeAt(0, 5, 'X');
    hub.flush();
    b.typeAt(1, 0, 'Y');
    hub.flush();

    expect(json(a.engine)).toBe(json(b.engine));
    expect(JSON.stringify(a.engine.document())).toContain('alphaX bravo');
    expect(JSON.stringify(a.engine.document())).toContain('Ycharlie delta');
  });

  it('converges when edits cross in flight (concurrent inserts, same block)', () => {
    const hub = new Hub();
    const a = makeSite(hub, 'aaa', BASE);
    const b = makeSite(hub, 'bbb', BASE);

    // Both type before seeing each other's op.
    a.typeAt(0, 0, 'A');
    b.typeAt(0, 11, 'B');
    hub.flush();

    expect(json(a.engine)).toBe(json(b.engine));
    expect(JSON.stringify(a.engine.document())).toContain('Aalpha bravoB');
  });

  it('converges under randomized concurrent typing with reordered delivery', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rnd = mulberry32(seed);
      const hub = new Hub();
      const a = makeSite(hub, 'aaa', BASE);
      const b = makeSite(hub, 'bbb', BASE);
      const sites = [a, b];
      const ids = ['aaa', 'bbb'];

      for (let step = 0; step < 30; step++) {
        const roll = rnd();
        if (roll < 0.55) {
          const site = sites[Math.floor(rnd() * 2)];
          const doc = site.engine.document();
          const blockIndex = Math.floor(rnd() * doc.length);
          const text = (doc[blockIndex].content as { text?: string }[]).map((n) => n.text ?? '').join('');
          site.typeAt(blockIndex, Math.floor(rnd() * (text.length + 1)), 'abcXYZ'[Math.floor(rnd() * 6)]);
        } else {
          hub.deliverOne(ids[Math.floor(rnd() * 2)]);
        }
      }
      hub.flush();

      expect(json(a.engine), `seed ${seed}`).toBe(json(b.engine));
    }
  });

  it('undo removes only local edits after convergence', () => {
    const hub = new Hub();
    const a = makeSite(hub, 'aaa', [p('base')]);
    const b = makeSite(hub, 'bbb', [p('base')]);

    a.typeAt(0, 4, '111');
    hub.flush();
    b.typeAt(0, 0, '222');
    hub.flush();
    expect(json(a.engine)).toBe(json(b.engine));
    expect(JSON.stringify(a.engine.document())).toContain('222base111');

    while (a.engine.canUndo()) {
      a.engine.undo();
      a.collab.flushLocal();
    }
    hub.flush();

    // A's local edit is gone, B's remote edit survives — on both sites.
    expect(JSON.stringify(a.engine.document())).toContain('222base');
    expect(JSON.stringify(a.engine.document())).not.toContain('111');
    expect(json(a.engine)).toBe(json(b.engine));
  });

  it('a remote op arriving before the local flush does not swallow the local edit', () => {
    const hub = new Hub();
    const a = makeSite(hub, 'aaa', BASE);
    const b = makeSite(hub, 'bbb', BASE);

    // A types but its version effect has not flushed yet…
    const at = logicalToPos(a.engine.document(), { blockIndex: 0, inlineIndex: 0, offset: 0 });
    a.engine.selection.live.set({ from: at, to: at });
    a.engine.insertText('LOCAL');
    // …and B's concurrent op is delivered first. The service must broadcast
    // the pending local edit before applying the remote one.
    b.typeAt(1, 0, 'REMOTE');
    hub.flush();
    a.collab.flushLocal();
    hub.flush();

    expect(JSON.stringify(a.engine.document())).toContain('LOCAL');
    expect(JSON.stringify(b.engine.document())).toContain('LOCAL');
    expect(json(a.engine)).toBe(json(b.engine));
  });

  it('a late joiner receives a snapshot and then converges', () => {
    const hub = new Hub();
    const a = makeSite(hub, 'aaa', BASE);
    a.typeAt(0, 11, '!');
    hub.flush();

    const c = makeSite(hub, 'ccc', [p('placeholder')]);
    hub.flush();
    expect(json(c.engine)).toBe(json(a.engine));

    a.typeAt(1, 0, 'Z');
    c.typeAt(0, 0, 'Q');
    hub.flush();
    expect(json(c.engine)).toBe(json(a.engine));
  });
});

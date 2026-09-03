import { Component, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { ShipEditor } from '@ship-ui/core/ship-editor';
import { CollabMessage, CollabTransport, ShEditorCollabDirective } from '@ship-ui/core/ship-editor-collab';

/**
 * In-memory hub as a service. Every transport it hands out reaches the
 * others; delivery is deferred a tick to behave like a network.
 *
 * Provide it on the component that owns the editors. Angular destroys the
 * service with that component, and `ngOnDestroy` disconnects every transport
 * — `shCollab` only destroys transports it created from a string, so a
 * transport you bind is yours to clean up.
 */
@Injectable()
export class MemoryHub implements OnDestroy {
  #peers = new Set<MemoryPeer>();

  transport(): CollabTransport {
    const peer = new MemoryPeer(this.#peers);
    this.#peers.add(peer);
    return peer;
  }

  ngOnDestroy() {
    for (const peer of this.#peers) peer.destroy();
  }
}

class MemoryPeer implements CollabTransport {
  #callback: ((message: CollabMessage) => void) | null = null;
  #connected = signal(true);
  readonly connected = this.#connected.asReadonly();

  constructor(private peers: Set<MemoryPeer>) {}

  send(message: CollabMessage) {
    if (!this.#connected()) return;
    const copy = structuredClone(message);
    for (const peer of this.peers) if (peer !== this) setTimeout(() => peer.#callback?.(copy));
  }

  subscribe(callback: (message: CollabMessage) => void) {
    this.#callback = callback;
    return () => (this.#callback = null);
  }

  destroy() {
    this.#connected.set(false);
    this.#callback = null;
    this.peers.delete(this);
  }
}

/** Two editors on one page, one hub. */
@Component({
  selector: 'memory-transport-example',
  imports: [ShipEditor, ShEditorCollabDirective],
  providers: [MemoryHub],
  templateUrl: './memory-transport.html',
  styleUrl: './memory-transport.scss',
})
export class MemoryTransport {
  hub = inject(MemoryHub);
  left = this.hub.transport();
  right = this.hub.transport();
  doc = `<p>Type here, the other editor follows.</p>`;
}

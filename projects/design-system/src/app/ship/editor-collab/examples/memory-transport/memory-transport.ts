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
  #transports = new Set<CollabTransport & { deliver: (message: CollabMessage) => void }>();

  transport(): CollabTransport {
    let callback: ((message: CollabMessage) => void) | null = null;
    const connected = signal(true);

    const transport = {
      connected: connected.asReadonly(),
      deliver: (message: CollabMessage) => callback?.(message),
      send: (message: CollabMessage) => {
        if (!connected()) return;
        const copy = structuredClone(message);
        for (const other of this.#transports) if (other !== transport) setTimeout(() => other.deliver(copy));
      },
      subscribe: (cb: (message: CollabMessage) => void) => {
        callback = cb;
        return () => (callback = null);
      },
      destroy: () => {
        connected.set(false);
        callback = null;
        this.#transports.delete(transport);
      },
    };

    this.#transports.add(transport);
    return transport;
  }

  ngOnDestroy() {
    for (const transport of [...this.#transports]) transport.destroy!();
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

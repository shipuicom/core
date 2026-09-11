import { signal } from '@angular/core';
import { CollabMessage, CollabTransport } from './collab-protocol';

/**
 * Same-origin transport over `BroadcastChannel` — tabs and windows of the
 * same browser profile share the document without any server. SSR-safe: on
 * the server it is a disconnected no-op.
 *
 * Ordering is per-sender only (no total order, no acks), which the collab
 * service handles exactly for two peers and best-effort beyond. For
 * production multi-peer collaboration, implement {@link CollabTransport}
 * over a server relay that assigns a total order.
 */
export class BroadcastChannelTransport implements CollabTransport {
  #channel: BroadcastChannel | null = null;
  #connected = signal(false);
  readonly connected = this.#connected.asReadonly();

  constructor(channelName: string) {
    if (typeof BroadcastChannel !== 'undefined') {
      this.#channel = new BroadcastChannel(channelName);
      this.#connected.set(true);
    }
  }

  send(message: CollabMessage): void {
    this.#channel?.postMessage(message);
  }

  subscribe(callback: (message: CollabMessage) => void): () => void {
    const channel = this.#channel;
    if (!channel) return () => {};
    const handler = (event: MessageEvent) => callback(event.data as CollabMessage);
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
  }

  destroy(): void {
    this.#connected.set(false);
    this.#channel?.close();
    this.#channel = null;
  }
}

import { signal } from '@angular/core';
import { CollabMessage, CollabTransport } from './collab-protocol';

export interface WebSocketTransportOptions {
  /** Reconnect after connection loss (default true). */
  reconnect?: boolean;
  /** Base reconnect delay in ms, doubled per attempt up to 30 s (default 500). */
  reconnectDelayMs?: number;
  /** WebSocket subprotocols, forwarded to the constructor. */
  protocols?: string | string[];
}

/**
 * {@link CollabTransport} over a WebSocket relay.
 *
 * The relay's only job is fan-out in arrival order: broadcast every message
 * to every other socket on the same document channel (see
 * `scripts/collab-relay.ts` for a ~40-line reference server). Because the
 * relay serializes delivery it establishes a de-facto total order, which
 * makes this transport suitable for more than two peers.
 *
 * Messages sent while disconnected are queued and flushed on (re)connect.
 * SSR-safe: without a `WebSocket` global the transport stays disconnected.
 */
export class WebSocketTransport implements CollabTransport {
  #url: string;
  #options: WebSocketTransportOptions;
  #ws: WebSocket | null = null;
  #callbacks = new Set<(message: CollabMessage) => void>();
  #queue: CollabMessage[] = [];
  #attempts = 0;
  #destroyed = false;
  #reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  #connected = signal(false);
  readonly connected = this.#connected.asReadonly();

  constructor(url: string, options: WebSocketTransportOptions = {}) {
    this.#url = url;
    this.#options = options;
    if (typeof WebSocket !== 'undefined') this.#connect();
  }

  #connect(): void {
    if (this.#destroyed) return;
    const ws = new WebSocket(this.#url, this.#options.protocols);
    this.#ws = ws;

    ws.onopen = () => {
      this.#attempts = 0;
      this.#connected.set(true);
      for (const message of this.#queue.splice(0)) ws.send(JSON.stringify(message));
    };
    ws.onmessage = (event) => {
      let message: CollabMessage;
      try {
        message = JSON.parse(String(event.data));
      } catch {
        return;
      }
      for (const callback of this.#callbacks) callback(message);
    };
    ws.onclose = () => {
      this.#connected.set(false);
      this.#ws = null;
      if (this.#destroyed || this.#options.reconnect === false) return;
      const delay = Math.min(30_000, (this.#options.reconnectDelayMs ?? 500) * 2 ** this.#attempts++);
      this.#reconnectTimer = setTimeout(() => this.#connect(), delay);
    };
  }

  send(message: CollabMessage): void {
    if (this.#ws?.readyState === WebSocket.OPEN) this.#ws.send(JSON.stringify(message));
    else this.#queue.push(message);
  }

  subscribe(callback: (message: CollabMessage) => void): () => void {
    this.#callbacks.add(callback);
    return () => this.#callbacks.delete(callback);
  }

  destroy(): void {
    this.#destroyed = true;
    if (this.#reconnectTimer) clearTimeout(this.#reconnectTimer);
    this.#connected.set(false);
    this.#ws?.close();
    this.#ws = null;
    this.#callbacks.clear();
    this.#queue = [];
  }
}

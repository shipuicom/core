/**
 * Reference relay for `WebSocketTransport` (@ship-ui/core/ship-editor-collab).
 *
 *   bun scripts/collab-relay.ts            # ws://localhost:8787/<channel>
 *
 * One channel per URL path; every message fans out to every other socket on
 * the channel in arrival order — that serialization is the total order the
 * collab clients rebase against. The relay never inspects message contents.
 */
const PORT = Number(process.env['COLLAB_RELAY_PORT'] ?? 8787);

type Peer = { socket: unknown; send: (data: string) => void };
const channels = new Map<string, Set<Peer>>();

Bun.serve<{ channel: string }, object>({
  port: PORT,
  fetch(request, server) {
    const channel = new URL(request.url).pathname;
    if (server.upgrade(request, { data: { channel } })) return;
    return new Response('ship-ui collab relay: connect via WebSocket', { status: 426 });
  },
  websocket: {
    open(ws) {
      const peers = channels.get(ws.data.channel) ?? new Set();
      channels.set(ws.data.channel, peers);
      peers.add(ws as unknown as Peer);
    },
    message(ws, data) {
      const peers = channels.get(ws.data.channel);
      if (!peers) return;
      const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
      for (const peer of peers) {
        if (peer !== (ws as unknown as Peer)) (peer as { send: (d: string) => void }).send(text);
      }
    },
    close(ws) {
      const peers = channels.get(ws.data.channel);
      peers?.delete(ws as unknown as Peer);
      if (peers && peers.size === 0) channels.delete(ws.data.channel);
    },
  },
});

console.log(`collab relay listening on ws://localhost:${PORT}/<channel>`);

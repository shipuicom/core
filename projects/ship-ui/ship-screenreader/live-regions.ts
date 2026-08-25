import { isAccHidden } from './accname';

export type ShipLiveCallback = (text: string, politeness: 'polite' | 'assertive') => void;

const REGION_SELECTOR = '[aria-live], [role="alert"], [role="status"], [role="log"]';

/**
 * Watch `doc.body` for live-region changes the way assistive tech does:
 * mutations are attributed to their governing `aria-live` (or alert/status/
 * log) region, batched per region for 50 ms (so clear-then-set cycles voice
 * once), and reported with the region's effective politeness. Returns a
 * teardown function.
 */
export function observeLiveRegions(doc: Document, callback: ShipLiveCallback): () => void {
  const pending = new Map<Element, { timer: ReturnType<typeof setTimeout>; added: Node[] }>();

  const flush = (region: Element) => {
    const entry = pending.get(region);
    pending.delete(region);
    if (!entry || !region.isConnected || isAccHidden(region)) return;

    const atomic = region.getAttribute('aria-atomic') === 'true';
    const text = atomic
      ? (region.textContent ?? '')
      : entry.added.map((node) => node.textContent ?? '').join(' ');
    const trimmed = text.replace(/\s+/g, ' ').trim();
    if (!trimmed) return;

    callback(trimmed, politenessOf(region));
  };

  const schedule = (region: Element, added: Node[]) => {
    const entry = pending.get(region);
    if (entry) {
      clearTimeout(entry.timer);
      entry.added.push(...added);
      entry.timer = setTimeout(() => flush(region), 50);
    } else {
      pending.set(region, { added: [...added], timer: setTimeout(() => flush(region), 50) });
    }
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const origin =
        mutation.target.nodeType === Node.ELEMENT_NODE
          ? (mutation.target as Element)
          : mutation.target.parentElement;
      const region = origin?.closest(REGION_SELECTOR);
      if (!region || region.getAttribute('aria-live') === 'off') continue;
      // Skip the simulator's own panel — it must never announce itself.
      if (region.closest('[data-ship-screenreader]')) continue;

      const relevant = (region.getAttribute('aria-relevant') ?? 'additions text').split(/\s+/);
      const isRemovalOnly =
        mutation.type === 'childList' && mutation.addedNodes.length === 0;
      if (isRemovalOnly && !relevant.includes('removals') && !relevant.includes('all')) continue;

      const added =
        mutation.type === 'characterData' ? [mutation.target] : Array.from(mutation.addedNodes);
      schedule(region, added);
    }
  });

  observer.observe(doc.body, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-live'],
  });

  return () => {
    observer.disconnect();
    for (const entry of pending.values()) clearTimeout(entry.timer);
    pending.clear();
  };
}

function politenessOf(region: Element): 'polite' | 'assertive' {
  const live = region.getAttribute('aria-live');
  if (live === 'assertive') return 'assertive';
  if (live === 'polite') return 'polite';
  return region.getAttribute('role') === 'alert' ? 'assertive' : 'polite';
}

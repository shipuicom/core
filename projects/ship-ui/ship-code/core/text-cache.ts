// Internal: not exported from public-api.

/**
 * Documents are immutable, so a document's text never changes: `getText` caches it per document identity. The
 * editor serializes once per pause in typing, and commands that search the text (add next occurrence) reuse it.
 */
const cache = new WeakMap<object, string>();
let serializations = 0;

export function cachedText(doc: object, build: () => string): string {
  let text = cache.get(doc);
  if (text === undefined) {
    serializations++;
    text = build();
    cache.set(doc, text);
  }
  return text;
}

/** How many documents have been serialized so far: lets a spec assert an edit or render path never serializes. */
export function textSerializations(): number {
  return serializations;
}

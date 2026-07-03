# ShipEditor — Actionable Implementation Plan

This document details the critical security, performance, and UX stability enhancements for the custom WYSIWYG editor (`ShipEditor`).

---

## 🚀 Implementation Roadmap

- [x] **Phase 1: Caret Selection Hardening** (UX Stability)
- [x] **Phase 2: Security Hardening (Lightweight Isomorphic Sanitization)** (Security)
- [x] **Phase 3: Performance Scaling for Large Documents** (Performance)
- [x] **Phase 4: Markdown Parser Fidelity Enhancements** (Data Integrity)

---

## 🛠️ Detailed Phases

### Phase 1: Caret Selection Hardening

#### Objective

Establish baseline caretaker stability and prevent cursor/caret jumping when targeting empty or layout-fallback blocks.

#### The Problem

When a user targets an empty block (e.g., via `ArrowUp` or `ArrowDown`), browsers interpret a range boundary pinned directly to a parent wrapper node (`node: targetEl`, `offset: 0`) inconsistently. In Chromium and WebKit environments, this can result in the browser caret disappearing completely, jumping down to the bottom bounding rectangle of the editor wrapper, or locking input focus.

#### Action Item

Modify `mapLogicalToDOMPosition` inside `ship-editor-core.ts` to recognize when a block evaluates to empty, and explicitly force the selection boundary onto the inner leaf node text position or the explicit `<br>` element node, ensuring structural layout predictability.

#### Implementation Recipe

Refine `mapLogicalToDOMPosition` in [ship-editor-core.ts](file:///Users/simon/Documents/dev/ship-ui/projects/ship-ui/ship-editor/ship-editor-core.ts):

```typescript
export function mapLogicalToDOMPosition(
  editor: HTMLElement,
  pos: LogicalPosition,
  doc: ShipEditorDocument
): { node: Node; offset: number } | null {
  const blockElements = Array.from(editor.children) as HTMLElement[];
  const topBlockEl = blockElements[pos.blockIndex];
  if (!topBlockEl) return null;

  let targetEl: HTMLElement = topBlockEl;
  if (typeof pos.listItemIndex === 'number') {
    const tagName = topBlockEl.tagName.toLowerCase();
    if (tagName === 'ul' || tagName === 'ol') {
      const liElements = Array.from(topBlockEl.querySelectorAll(':scope > li')) as HTMLElement[];
      const liEl = liElements[pos.listItemIndex];
      if (liEl) targetEl = liEl;
    }
  }

  // Explicit fix for empty block nodes containing layout fallbacks (<br>)
  const textNodes: Text[] = [];
  const walk = (n: Node) => {
    if (n.nodeType === 3) {
      textNodes.push(n as Text);
    } else {
      for (const child of Array.from(n.childNodes)) {
        walk(child);
      }
    }
  };
  walk(targetEl);

  if (textNodes.length > 0) {
    const txtNode = textNodes[Math.min(pos.inlineIndex, textNodes.length - 1)];
    const len = txtNode.textContent?.length || 0;
    return { node: txtNode, offset: Math.min(pos.offset, len) };
  }

  // REFINED FALLBACK: Enforce selection focus on the explicit <br> element node if available
  const brElement = targetEl.querySelector('br');
  if (brElement) {
    return { node: brElement, offset: 0 };
  }

  const firstChild = targetEl.firstChild;
  if (firstChild) {
    return { node: firstChild, offset: 0 };
  }

  return { node: targetEl, offset: 0 };
}
```

---

### Phase 2: Security Hardening (Lightweight Isomorphic Sanitization)

#### Objective

Eradicate Cross-Site Scripting (XSS) code vectors inside the HTML parsing pipelines without introducing heavy third-party dependencies.

#### The Vulnerability Path

The editor allows users to initialize content or switch view modes via raw strings using `htmlToJSON`. Inside `ship-editor-core.ts`, this uses standard DOM parsing APIs:

```typescript
export function htmlToJSON(html: string, docObj: Document = globalThis.document): ShipEditorDocument {
  const doc: ShipEditorDocument = [];
  const temp = docObj.createElement('div');
  temp.innerHTML = html; // ⚠️ Vulnerable execution hook on client environment
  // ...
}
```

If malicious markup containing standard executable payload traps (e.g., `<img src="invalid" onerror="alert(document.cookie)">` or `<iframe src="javascript:evil()">`) is written directly into the value model, passed via `setHTML()`, or pasted directly into the textarea code viewer, the line `temp.innerHTML = html` executes that payload instantly on the user's browser before the tokenization loop runs.

#### Action Item

Introduce a lean, native, high-performance regex-based sanitizer function inside `ship-editor-core.ts` to scrub raw HTML input before assigning it to the DOM template element.

#### Implementation Recipe

1. Add this utility method inside [ship-editor-core.ts](file:///Users/simon/Documents/dev/ship-ui/projects/ship-ui/ship-editor/ship-editor-core.ts):

```typescript
/**
 * Ultra-lightweight HTML sanitizer designed to scrub common script elements
 * and inline event listeners prior to executing internal DOM conversions.
 */
export function sanitizeHTML(rawHtml: string): string {
  if (!rawHtml) return '';

  return (
    rawHtml
      // 1. Strip explicit script block structures completely
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // 2. Strip standard dangerous iframe boundaries
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // 3. Strip dangerous inline event hooks (e.g., onload, onerror, onclick)
      .replace(/\s+on[a-z]+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*[^>\s]+/gi, '')
      // 4. Scrub explicit javascript pseudo-protocol formats
      .replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"')
  );
}
```

2. Integrate the sanitizer directly into `htmlToJSON` inside [ship-editor-core.ts](file:///Users/simon/Documents/dev/ship-ui/projects/ship-ui/ship-editor/ship-editor-core.ts):

```typescript
export function htmlToJSON(html: string, docObj: Document = globalThis.document): ShipEditorDocument {
  const doc: ShipEditorDocument = [];
  const temp = docObj.createElement('div');

  // Clean markup before assigning it to the DOM tree
  temp.innerHTML = sanitizeHTML(html);

  const children = Array.from(temp.childNodes);
  // ... continue with standard structural tree verification ...
}
```

---

### Phase 3: Performance Scaling for Large Documents

#### Objective

Reduce typing latency during long editing sessions by eliminating redundant layout computations on every character entry.

#### The Performance Trap

In `onDOMInput()`, a complete state compilation and synchronization loop fires on every single keystroke:

```typescript
onDOMInput() {
  this.#updateValueFromDOM(); // ⚠️ Pulls innerHTML, compiles full AST, emits sync tokens
  // ...
  this.#typingTimeout = setTimeout(() => {
    this.#saveHistory(); // ⚠️ Deep-clones document state array
  }, 500);
}
```

For brief structural snippets, this execution flow runs under a few milliseconds. However, if a user imports a complex 5,000-word document, grabbing the complete innerHTML text node array, parsing it into JSON AST formats, normalizing it, and generating corresponding markdown output on every keystroke creates noticeable frame delay and typing latency, especially on mobile devices or lower-spec machines.

#### Action Item

Decouple the client-side keyboard update lifecycle from the complete document serialization logic. Allow the internal text node state to update instantly, while debouncing the heavier AST synchronization, markdown string compilation, and validation processes.

#### Implementation Recipe

Refine state synchronization management inside [ship-editor.ts](file:///Users/simon/Documents/dev/ship-ui/projects/ship-ui/ship-editor/ship-editor.ts):

```typescript
// 1. Introduce a granular state flag to manage compilation pacing
#isThrottledSyncPending = false;

onDOMInput() {
  // Update internal metrics (character and word tracking) instantly via local evaluations
  const editor = this.editorRef()?.nativeElement;
  if (editor) {
    const textContent = editor.textContent || '';
    this.charCount.set(textContent.length);
    this.wordCount.set(textContent.trim() === '' ? 0 : textContent.trim().split(/\s+/).length);
  }

  // Enforce immediate saving of macro state histories on spacebar or phrase completions
  const selection = window.getSelection();
  let saveImmediately = false;
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    if (textNode.nodeType === 3) {
      const char = textNode.textContent?.charAt(range.startOffset - 1);
      if (char && /[\s.,!?;/]/.test(char)) {
        saveImmediately = true;
      }
    }
  }

  if (this.#typingTimeout) {
    clearTimeout(this.#typingTimeout);
  }

  if (saveImmediately) {
    this.#updateValueFromDOM();
    this.#saveHistory();
  } else {
    // Debounce the heavy full-document AST generation and validation pipelines
    this.#typingTimeout = setTimeout(() => {
      this.#updateValueFromDOM();
      this.#saveHistory();
    }, 150); // Balanced gap preventing input interruption
  }
}
```

---

### Phase 4: Markdown Parser Fidelity Enhancements

#### Objective

Harden the native Markdown compiler against content merging errors, malformed layout tokens, and escaping failures inside code fence boundaries.

#### The Problem

The current custom markdown converter divides logical blocks by isolating clear double-newline configurations:

```typescript
const blocks = markdown.split(/\n\s*\n/);
```

If an author writes or pastes a comprehensive multi-line code block (`pre` node structure) that contains a deliberate double-newline sequence inside the code contents, the parser splits it into multiple independent code chunks, corrupting the document's structure and layout.

#### Action Item

Upgrade the Markdown block pre-processor loop inside `ship-editor-core.ts` to identify and protect active code fence regions (``````) before applying structural splits.

#### Implementation Recipe

Refine `markdownToHTML` inside [ship-editor-core.ts](file:///Users/simon/Documents/dev/ship-ui/projects/ship-ui/ship-editor/ship-editor-core.ts):

````typescript
export function markdownToHTML(markdown: string): string {
  if (!markdown) return '';

  // REFINED: Parse lines sequentially to safeguard code blocks
  const lines = markdown.split('\n');
  const blocks: string[] = [];
  let currentBlock: string[] = [];
  let isInsideCodeFence = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      isInsideCodeFence = !isInsideCodeFence;
    }

    if (!isInsideCodeFence && line.trim() === '') {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }

  let html = '';
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;

  for (let block of blocks) {
    block = block.trim();
    if (!block) continue;

    // Standard conversion logic remains untouched but operates with correct structural blocks
    // ...
  }

  if (inList) {
    html += listType === 'ul' ? '</ul>' : '</ol>';
  }

  return html;
}
````

---

## 📊 Roadmap Matrix

| Phase       | Core Target Element        | Impact Rating              | Estimated Effort                    | Risk Profile                            |
| :---------- | :------------------------- | :------------------------- | :---------------------------------- | :-------------------------------------- |
| **Phase 1** | Caret Selection Hardening  | 🔴 High (UX stability)     | 🟢 Low (Small algorithm fix)        | Low (No schema changes)                 |
| **Phase 2** | Pre-parsing XSS Stripper   | 🔴 Critical (Security)     | 🟢 Low (Light regex validation)     | Medium (Ensure tags remain un-scrubbed) |
| **Phase 3** | Input Debounce Realignment | 🟡 Medium (Performance)    | 🟡 Medium (Event restructuring)     | High (Requires rigorous cursor checks)  |
| **Phase 4** | Markdown Fence Guardian    | 🟡 Medium (Data integrity) | 🟢 Low (Context parsing array loop) | Low (Fidelity upgrade only)             |

---

## 🏁 Next Steps

1. **Phase 1 & Phase 2**: Implement inside `ship-editor-core.ts` immediately to establish security and cursor stability.
2. **Phase 3**: Integrate timing tweaks inside `ship-editor.ts` and verify input latency with large text samples.
3. **Phase 4**: Add tests passing multi-line code examples into the Markdown compiler to validate fence protection logic.

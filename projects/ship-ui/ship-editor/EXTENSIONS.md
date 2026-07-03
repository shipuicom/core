# 🧩 ShipEditor Extension Guide

ShipEditor is designed with a powerful, modular extension system. Every block (paragraph, image, heading) and mark (bold, link, highlight) is an extension.

## 🧱 Block Extensions

Block extensions define top-level structural elements.

```typescript
export interface ShipEditorBlockExtension {
  type: string;           // AST block type (e.g., 'image')
  keybinding?: string;    // Global hotkey name
  activeClassName?: string; // CSS class added when caret is inside

  /** Convert AST block to HTML string for the editor */
  toHTML?: (block: ShipEditorBlock, contentHtml: string) => string;

  /** Convert DOM element back to AST block */
  parseHTML?: (el: HTMLElement) => ShipEditorBlock | null;

  /** 
   * Scoped keyboard handling. 
   * Return a new document/position to handle, or false to skip.
   */
  onBlockKeydown?: (event: KeyboardEvent | InputEvent, ctx: ShipEditorBlockContext) => BlockKeydownResult | false;

  /** Scoped click handling (e.g. for triggering custom overlays or properties) */
  onBlockClick?: (event: MouseEvent, ctx: ShipEditorBlockContext) => void;

  /** Lifecycle hooks */
  onInit?: (editor: ShipEditorInstance) => void;
  onDestroy?: (editor: ShipEditorInstance) => void;

  /** Post-render hook for direct DOM manipulation (e.g. adding overlay UI) */
  onBlockRender?: (el: HTMLElement, block: ShipEditorBlock, index: number) => void;
}
```

### Example: Image Extension with Click Support

```typescript
export const imageBlockExtension: ShipEditorBlockExtension = {
  type: 'image',
  onBlockClick: (event, ctx) => {
    console.log('Image clicked at index:', ctx.position.blockIndex);
    // You could open a custom dialog or show resize handles here
  },
  onBlockRender: (el, block) => {
    // Add a 'caption' overlay manually if desired
    const overlay = document.createElement('div');
    overlay.className = 'image-caption';
    overlay.innerText = block.attrs?.alt || '';
    el.appendChild(overlay);
  },
  toHTML: (block) => `<img src="${block.attrs.src}" alt="${block.attrs.alt}">`,
  parseHTML: (el) => el.tagName === 'IMG' ? { type: 'image', attrs: { src: el.src } } : null
};
```

---

## ✒️ Mark Extensions

Mark extensions define inline styles (formatting).

```typescript
export interface ShipEditorMarkExtension {
  type: string;
  tagName: string;        // The wrapping tag (e.g., 'strong')
  className?: string;     // Optional class for the tag
  keybinding?: string;    
  onKeyAction?: (editor: ShipEditorInstance) => boolean | void;
  parseHTML: (el: HTMLElement) => ShipEditorMark | null;
}
```

---

## 🔀 Extending Existing Extensions

You can create **specialized variants** of existing block types by registering a new extension that shares the same HTML element but uses a more specific selector. This is how the built-in `info-callout` extends `blockquote`.

### How It Works

The registry iterates extensions in order. The **first** `parseHTML` that returns a non-null result wins. By registering your specialized extension so it's checked **before** the base extension, your more specific match takes priority while the base extension still handles the generic case.

**Registration order matters.** `registerBlock()` uses a **prepend** strategy — the last extension registered is checked first during parsing. So register the base extension first, then the specialization:

```typescript
// The defaults array controls registration order.
// registerBlock() prepends, so LATER entries are checked FIRST during parsing.
export const defaultBlockExtensions = [
  quoteBlockExtension,        // registered first → checked second
  infoCalloutBlockExtension,  // registered second → checked first ✓
];
```

### Pattern: Specialization via CSS Classes

The key technique: use the **same HTML element** but differentiate with a CSS class in both `toHTML` and `parseHTML`.

```
Base extension:    <blockquote>content</blockquote>
Specialized:       <blockquote class="sh-editor-callout sh-editor-callout-info">💡 content</blockquote>
```

The specialized `parseHTML` checks for the class first. If it matches, it claims the element. If not, the base `quote` extension handles it as a plain blockquote.

### Built-in Example: Info Callout

The `info-callout` is a styled variant of `blockquote` with a lightbulb prefix and info-colored styling:

```typescript
export const infoCalloutBlockExtension: ShipEditorBlockExtension = {
  type: 'info-callout',

  toHTML: (block, contentHtml) => {
    // Same <blockquote> element, differentiated by class + icon prefix
    return `<blockquote class="sh-editor-callout sh-editor-callout-info">` +
      `<span class="sh-editor-callout-icon" contenteditable="false">💡</span>` +
      `${contentHtml || '<br>'}` +
      `</blockquote>`;
  },

  parseHTML: (el) => {
    // Only match blockquotes that have the callout class
    if (
      el.tagName.toLowerCase() === 'blockquote' &&
      el.classList.contains('sh-editor-callout')
    ) {
      // Strip the icon span before parsing inline content
      const clone = el.cloneNode(true) as HTMLElement;
      const iconSpan = clone.querySelector('.sh-editor-callout-icon');
      if (iconSpan) iconSpan.remove();
      return {
        type: 'info-callout',
        content: parseInlineNodes(clone),
      };
    }
    return null;  // Falls through to quoteBlockExtension
  },
};
```

### Custom Example: Warning Callout

Following the same pattern, you can create additional callout variants:

```typescript
const warningCalloutExtension: ShipEditorBlockExtension = {
  type: 'warning-callout',

  toHTML: (block, contentHtml) => {
    return `<blockquote class="sh-editor-callout sh-editor-callout-warning">` +
      `<span class="sh-editor-callout-icon" contenteditable="false">⚠️</span>` +
      `${contentHtml || '<br>'}` +
      `</blockquote>`;
  },

  parseHTML: (el) => {
    if (
      el.tagName.toLowerCase() === 'blockquote' &&
      el.classList.contains('sh-editor-callout-warning')
    ) {
      const clone = el.cloneNode(true) as HTMLElement;
      const iconSpan = clone.querySelector('.sh-editor-callout-icon');
      if (iconSpan) iconSpan.remove();
      return {
        type: 'warning-callout',
        content: parseInlineNodes(clone),
      };
    }
    return null;
  },
};

// Register after defaults so it's checked before both quote and info-callout
registry.registerBlock(warningCalloutExtension);
```

### Guidelines

| Concern | Approach |
|---------|----------|
| **Same HTML element** | Differentiate with CSS classes (e.g. `sh-editor-callout-warning`) |
| **Decorative content** | Use `contenteditable="false"` on icon/badge spans so users can't edit them |
| **Parse order** | Register specialized extensions **after** the base so they're checked first |
| **Fallthrough** | Return `null` from `parseHTML` when the element doesn't match your variant — the base extension picks it up |
| **Clone before mutating** | Always `el.cloneNode(true)` before removing decorative elements in `parseHTML` |

---

## ⚙️ Extension Configuration

Extensions carry an optional `config` bag for extension-specific settings. Use `configureExtension()` to create a copy with overridden config:

```typescript
import { configureExtension, imageBlockExtension } from 'ship-ui/ship-editor';

// Override image defaults (originally: defaultMode='custom', defaultSize='medium')
const myImage = configureExtension(imageBlockExtension, {
  defaultMode: 'content',
  defaultSize: 'auto',
});
```

### Available Config Options

| Extension | Config Key | Default | Options |
|-----------|-----------|---------|---------|
| `imageBlockExtension` | `defaultMode` | `'custom'` | `'content'`, `'theater'`, `'custom'` |
| `imageBlockExtension` | `defaultSize` | `'medium'` | `'auto'`, `'small'`, `'medium'`, `'large'` |

---

## 📦 Registration

### Using the `[extensions]` Input (Recommended)

Pass a custom array of block extensions to the editor. This replaces the default block extensions entirely, giving you full control:

```typescript
import {
  defaultBlockExtensions,
  configureExtension,
  imageBlockExtension,
  ShipEditorBlockExtension,
} from 'ship-ui/ship-editor';

@Component({
  template: `<sh-editor [extensions]="myExtensions" />`,
})
export class MyComponent {
  // Override image defaults: full-width, auto-sized
  myExtensions: ShipEditorBlockExtension[] = [
    ...defaultBlockExtensions.filter(e => e.type !== 'image'),
    configureExtension(imageBlockExtension, {
      defaultMode: 'content',
      defaultSize: 'auto',
    }),
  ];
}
```

### Adding Custom Extensions Alongside Defaults

```typescript
myExtensions = [
  ...defaultBlockExtensions,
  myCustomCalloutExtension,
  myCustomTableExtension,
];
```

### Using the Registry Directly

For dynamic registration (e.g., plugins loaded at runtime), inject the `ShipEditorRegistry`:

```typescript
@Component({ ... })
export class MyComponent {
  constructor(private registry: ShipEditorRegistry) {
    this.registry.registerBlock(myCustomExtension);
  }
}
```

### Exported Extensions

All built-in extensions are exported individually for composition:

| Export | Type |
|--------|------|
| `paragraphBlockExtension` | Paragraph blocks |
| `headingBlockExtension` | H1–H6 headings |
| `quoteBlockExtension` | Blockquotes |
| `infoCalloutBlockExtension` | Info callout (blockquote variant) |
| `codeBlockBlockExtension` | Fenced code blocks |
| `imageBlockExtension` | Images with mode/size config |
| `defaultBlockExtensions` | Array of all defaults |
| `configureExtension()` | Helper to override extension config |

---

## 🎯 Scoped Interactions

Scoped interactions (`onBlockKeydown`, `onBlockClick`) are essential for complex blocks like:
- **Code Blocks**: Handling `Tab` for indentation instead of focus loss.
- **Tables**: Handling arrow keys for cell navigation.
- **Images**: Handling clicks for resizing or alignment.
- **Callouts**: Handling `Enter` to stay within the block vs exiting.

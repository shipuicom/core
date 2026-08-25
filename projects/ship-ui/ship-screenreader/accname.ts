/**
 * Pragmatic subset of the W3C Accessible Name computation (accname-1.2).
 * Precedence: aria-labelledby > aria-label > native labelling (label/alt/
 * figcaption/legend/value) > subtree text > title. Skips CSS-generated
 * content and embedded-control substitution — enough fidelity for a debug
 * simulator, not a full implementation.
 */

/**
 * True when `el` (or an ancestor) is removed from the accessibility tree:
 * `aria-hidden="true"`, `inert`, the `hidden` attribute, or inline
 * display/visibility hiding. Stylesheet-driven hiding is only detected in
 * real browsers via `getComputedStyle`; jsdom fixtures should hide inline.
 */
export function isAccHidden(el: Element): boolean {
  for (let node: Element | null = el; node; node = node.parentElement) {
    if (node.getAttribute('aria-hidden') === 'true') return true;
    if (node.hasAttribute('inert') || node.hasAttribute('hidden')) return true;
    const style = node.ownerDocument.defaultView?.getComputedStyle?.(node);
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return true;
  }
  return false;
}

/** Compute the accessible name of `el`. Returns `''` when it has none. */
export function computeAccessibleName(el: Element): string {
  return nameFor(el, new Set(), {}).replace(/\s+/g, ' ').trim();
}

interface NameOpts {
  /** Element was reached via traversal/reference — name from content even for generic roles. */
  forceContent?: boolean;
  /** Inside a hidden-but-directly-referenced subtree — hiding no longer prunes. */
  ignoreHidden?: boolean;
  /** Referenced elements never consult their own aria-labelledby (non-recursive per spec). */
  noLabelledby?: boolean;
}

function nameFor(el: Element, visited: Set<Element>, opts: NameOpts): string {
  if (visited.has(el)) return '';
  visited.add(el);

  if (!opts.noLabelledby) {
    const ids = el.getAttribute('aria-labelledby')?.trim().split(/\s+/) ?? [];
    if (ids.length) {
      const parts = ids
        .map((id) => el.ownerDocument.getElementById(id))
        .filter((ref): ref is HTMLElement => !!ref)
        // A hidden element that is *directly referenced* still contributes,
        // and hiding inside that subtree no longer prunes (accname step 2A).
        // An element referencing itself resolves one level (its aria-label /
        // content) rather than looping — drop it from `visited` for that.
        .map((ref) => {
          const refVisited = ref === el ? new Set([...visited].filter((v) => v !== el)) : visited;
          return nameFor(ref, refVisited, { forceContent: true, noLabelledby: true, ignoreHidden: isAccHidden(ref) });
        })
        .filter((part) => part.trim());
      if (parts.length) return parts.map((part) => part.trim()).join(' ');
    }
  }

  const ariaLabel = el.getAttribute('aria-label')?.trim();
  if (ariaLabel) return ariaLabel;

  const native = nativeName(el, visited);
  if (native.trim()) return native;

  if (opts.forceContent || namesFromContent(el)) {
    const text = subtreeText(el, visited, opts.ignoreHidden ?? false);
    if (text.trim()) return text;
  }

  return el.getAttribute('title')?.trim() ?? '';
}

function nativeName(el: Element, visited: Set<Element>): string {
  const tag = el.tagName.toLowerCase();

  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    const input = el as HTMLInputElement;
    // Associated <label> elements: for/id or wrapping.
    const labels = (input.labels ?? []) as ArrayLike<HTMLLabelElement>;
    const fromLabels = Array.from(labels)
      .map((label) => subtreeText(label, new Set(visited), false))
      .filter(Boolean)
      .join(' ');
    if (fromLabels) return fromLabels;
    if (tag === 'input') {
      const type = (input.type || 'text').toLowerCase();
      if ((type === 'submit' || type === 'reset' || type === 'button') && input.value) {
        return input.value;
      }
      if (type === 'image') return input.alt || input.value;
    }
    return input.placeholder?.trim() ?? '';
  }

  if (tag === 'img' || tag === 'area') return el.getAttribute('alt')?.trim() ?? '';

  if (tag === 'fieldset') {
    const legend = el.querySelector(':scope > legend');
    if (legend) return subtreeText(legend, new Set(visited), false);
  }

  if (tag === 'figure') {
    const caption = el.querySelector(':scope > figcaption');
    if (caption) return subtreeText(caption, new Set(visited), false);
  }

  return '';
}

const CONTENT_NAME_TAGS = new Set([
  'a', 'button', 'summary', 'option', 'label', 'legend', 'figcaption', 'caption',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'th', 'td', 'output',
]);

const CONTENT_NAME_ROLES = new Set([
  'button', 'link', 'checkbox', 'radio', 'option', 'menuitem', 'menuitemcheckbox',
  'menuitemradio', 'tab', 'switch', 'treeitem', 'heading', 'tooltip', 'gridcell',
  'columnheader', 'rowheader', 'cell', 'row',
]);

function namesFromContent(el: Element): boolean {
  const role = el.getAttribute('role')?.trim().split(/\s+/)[0];
  if (role) return CONTENT_NAME_ROLES.has(role);
  const tag = el.tagName.toLowerCase();
  // An <a> without href is a generic, not a link — no name from content.
  if (tag === 'a') return el.hasAttribute('href');
  return CONTENT_NAME_TAGS.has(tag);
}

// `visited` only guards aria-labelledby re-entry; plain DOM descent cannot
// cycle, so children are traversed unconditionally. Spec details verified
// against WPT comp_hidden_not_referenced / comp_name_from_content:
// - display:none prunes the subtree; visibility:hidden only mutes the
//   element's own text — descendants can be visibility:visible again.
// - Inline children join without extra spaces; non-inline children add them.
// - Element children go through the full name computation (their aria-label,
//   labelledby, alt … win over their text).
function subtreeText(el: Element, visited: Set<Element>, ignoreHidden: boolean): string {
  const style = el.ownerDocument.defaultView?.getComputedStyle?.(el);
  let textMuted = false;
  if (!ignoreHidden) {
    if (el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('hidden')) return '';
    if (style?.display === 'none') return '';
    textMuted = style?.visibility === 'hidden';
  }

  let text = '';
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      if (!textMuted) text += child.textContent ?? '';
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child as Element;
      const childText = nameFor(childEl, visited, { forceContent: true, ignoreHidden });
      const pad = isInline(childEl) ? '' : ' ';
      text += pad + childText + pad;
    }
  }
  // Collapse but do NOT trim: boundary whitespace inside a child ("an ")
  // is significant when siblings join without padding; the top-level
  // computeAccessibleName does the final trim.
  return text.replace(/\s+/g, ' ');
}

function isInline(el: Element): boolean {
  const display = el.ownerDocument.defaultView?.getComputedStyle?.(el)?.display;
  return display === 'inline' || display === 'contents';
}

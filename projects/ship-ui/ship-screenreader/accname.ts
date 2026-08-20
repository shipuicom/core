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
  return nameFor(el, new Set(), true).replace(/\s+/g, ' ').trim();
}

function nameFor(el: Element, visited: Set<Element>, allowLabelledby: boolean): string {
  if (visited.has(el)) return '';
  visited.add(el);

  // aria-labelledby is non-recursive: referenced elements contribute their
  // aria-label or subtree text, never their own labelledby.
  if (allowLabelledby) {
    const ids = el.getAttribute('aria-labelledby')?.trim().split(/\s+/) ?? [];
    if (ids.length) {
      const parts = ids
        .map((id) => el.ownerDocument.getElementById(id))
        .filter((ref): ref is HTMLElement => !!ref)
        .map((ref) => nameFor(ref, visited, false))
        .filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
  }

  const ariaLabel = el.getAttribute('aria-label')?.trim();
  if (ariaLabel) return ariaLabel;

  const native = nativeName(el, visited);
  if (native) return native;

  // A referenced element (via labelledby) always contributes its subtree
  // text; an element naming itself only does so for content-named roles.
  if (!allowLabelledby || namesFromContent(el)) {
    const text = subtreeText(el, visited);
    if (text) return text;
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
      .map((label) => subtreeText(label, new Set(visited)))
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
    if (legend) return subtreeText(legend, new Set(visited));
  }

  if (tag === 'figure') {
    const caption = el.querySelector(':scope > figcaption');
    if (caption) return subtreeText(caption, new Set(visited));
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
  return CONTENT_NAME_TAGS.has(el.tagName.toLowerCase());
}

// `visited` only guards aria-labelledby re-entry; plain DOM descent cannot
// cycle, so children are traversed unconditionally.
function subtreeText(el: Element, visited: Set<Element>): string {
  if (el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('hidden')) return '';
  const style = el.ownerDocument.defaultView?.getComputedStyle?.(el);
  if (style && (style.display === 'none' || style.visibility === 'hidden')) return '';

  const ariaLabel = el.getAttribute('aria-label')?.trim();
  if (ariaLabel) return ariaLabel;
  if (el.tagName.toLowerCase() === 'img') return el.getAttribute('alt')?.trim() ?? '';

  let text = '';
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) text += child.textContent ?? '';
    else if (child.nodeType === Node.ELEMENT_NODE) text += ' ' + subtreeText(child as Element, visited) + ' ';
  }
  return text.replace(/\s+/g, ' ').trim();
}

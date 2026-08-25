/**
 * State, value and position extraction for the utterance — phrased the way
 * NVDA/VoiceOver voice them ("dimmed", "collapsed", "not checked", …).
 */

export function computeStates(el: Element, role: string): string[] {
  const states: string[] = [];
  const attr = (name: string) => el.getAttribute(name);

  const disabled =
    attr('aria-disabled') === 'true' ||
    (el as HTMLInputElement).disabled === true;
  if (disabled) states.push('dimmed');

  const expanded = attr('aria-expanded');
  if (expanded === 'true') states.push('expanded');
  else if (expanded === 'false') states.push('collapsed');

  const checked = checkedState(el, role);
  if (checked) states.push(checked);

  const pressed = attr('aria-pressed');
  if (pressed === 'true') states.push('pressed');
  else if (pressed === 'false') states.push('not pressed');

  if (attr('aria-selected') === 'true') states.push('selected');

  const required = attr('aria-required') === 'true' || (el as HTMLInputElement).required === true;
  if (required) states.push('required');

  const invalid = attr('aria-invalid');
  if (invalid && invalid !== 'false') states.push('invalid');

  const current = attr('aria-current');
  if (current && current !== 'false') states.push('current item');

  if (attr('aria-readonly') === 'true' || (el as HTMLInputElement).readOnly === true) {
    states.push('read only');
  }

  if (attr('aria-haspopup') === 'true' || attr('aria-haspopup') === 'menu') {
    states.push('menu pop-up');
  }

  return states;
}

function checkedState(el: Element, role: string): string | null {
  const aria = el.getAttribute('aria-checked');
  if (aria === 'mixed') return 'mixed';
  if (aria === 'true') return 'checked';
  if (aria === 'false') return 'not checked';

  if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
    if (el.indeterminate) return 'mixed';
    return el.checked ? 'checked' : 'not checked';
  }
  if (role === 'checkbox' || role === 'radio' || role === 'switch') return 'not checked';
  return null;
}

/** The announced value of a form control, or `null` when there is none. */
export function computeValue(el: Element): string | null {
  const valuetext = el.getAttribute('aria-valuetext');
  if (valuetext) return valuetext;
  const valuenow = el.getAttribute('aria-valuenow');
  if (valuenow) return valuenow;

  if (el instanceof HTMLSelectElement) {
    return el.selectedOptions[0]?.textContent?.trim() || null;
  }
  if (el instanceof HTMLTextAreaElement) return el.value || null;
  if (el instanceof HTMLInputElement) {
    const type = (el.type || 'text').toLowerCase();
    if (type === 'checkbox' || type === 'radio' || type === 'button' || type === 'submit' || type === 'reset' || type === 'image') {
      return null;
    }
    if (!el.value) return null;
    return type === 'password' ? '•'.repeat(el.value.length) : el.value;
  }
  return null;
}

export interface ShipScreenreaderPosition {
  level?: number;
  pos?: number;
  size?: number;
}

const POSITIONAL_ROLES = new Set(['option', 'listitem', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'tab', 'radio', 'treeitem', 'row']);

/** Heading level and/or position-in-set, or `null` when neither applies. */
export function computePosition(el: Element, role: string): ShipScreenreaderPosition | null {
  if (role === 'heading') {
    const tagLevel = /^h([1-6])$/i.exec(el.tagName)?.[1];
    const level = Number(el.getAttribute('aria-level') ?? tagLevel ?? 2);
    return { level };
  }

  if (!POSITIONAL_ROLES.has(role)) return null;

  const posinset = Number(el.getAttribute('aria-posinset'));
  const setsize = Number(el.getAttribute('aria-setsize'));
  if (posinset > 0 && setsize > 0) return { pos: posinset, size: setsize };

  // Radio groups are collected by name across the form/document.
  if (el instanceof HTMLInputElement && el.type === 'radio' && el.name) {
    const scope: ParentNode = el.form ?? el.ownerDocument;
    const group = Array.from(scope.querySelectorAll<HTMLInputElement>('input[type="radio"]')).filter(
      (radio) => radio.name === el.name,
    );
    const pos = group.indexOf(el);
    if (pos !== -1 && group.length > 1) return { pos: pos + 1, size: group.length };
    return null;
  }

  // Otherwise count same-role siblings in the DOM.
  const parent = el.parentElement;
  if (!parent) return null;
  const siblings = Array.from(parent.children).filter(
    (sibling) => roleOf(sibling) === role,
  );
  const pos = siblings.indexOf(el);
  if (pos === -1 || siblings.length < 2) return null;
  return { pos: pos + 1, size: siblings.length };
}

// Local, cheap role check for sibling counting (avoids circular import).
function roleOf(el: Element): string {
  const explicit = el.getAttribute('role')?.trim().split(/\s+/)[0];
  if (explicit) return explicit;
  const tag = el.tagName.toLowerCase();
  if (tag === 'li') return 'listitem';
  if (tag === 'option') return 'option';
  if (el instanceof HTMLInputElement && el.type === 'radio') return 'radio';
  return '';
}

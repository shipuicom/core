import { generateUniqueId } from '@ship-ui/core';
import { computeAccessibleName } from './accname';
import { computeRole } from './role';
import { computePosition, computeStates, computeValue } from './states';

export type ShipScreenreaderSource = 'focus' | 'live-polite' | 'live-assertive' | 'manual';

export interface ShipScreenreaderUtterance {
  id: string;
  /** The full phrase as a screen reader would voice it. */
  text: string;
  source: ShipScreenreaderSource;
  timestamp: number;
  target?: Element;
}

/** Spoken names for roles whose ARIA token differs from SR phrasing. */
const ROLE_PHRASES: Record<string, string> = {
  textbox: 'edit text',
  searchbox: 'search edit text',
  combobox: 'combo box',
  spinbutton: 'spin button',
  progressbar: 'progress bar',
  menuitem: 'menu item',
  menuitemcheckbox: 'menu item checkbox',
  menuitemradio: 'menu item radio',
  listitem: 'list item',
  contentinfo: 'content information',
  img: 'image',
  treeitem: 'tree item',
};

/**
 * Compose the announcement for `el` in NVDA/VoiceOver hybrid order:
 * name, role, states, value, level / position — comma-joined, empty parts
 * skipped. E.g. `Save, button` · `Accept terms, checkbox, checked` ·
 * `Overview, heading, level 2` · `Apples, option, selected, 2 of 5`.
 */
export function buildUtterance(el: Element, source: ShipScreenreaderSource = 'focus'): ShipScreenreaderUtterance {
  const role = computeRole(el);
  const parts: string[] = [];

  const name = computeAccessibleName(el);
  if (name) parts.push(name);
  if (role) parts.push(ROLE_PHRASES[role] ?? role);
  parts.push(...computeStates(el, role));

  const value = computeValue(el);
  if (value) parts.push(value);

  const position = computePosition(el, role);
  if (position?.level) parts.push(`level ${position.level}`);
  else if (position?.pos) parts.push(`${position.pos} of ${position.size}`);

  return {
    id: generateUniqueId(),
    text: parts.join(', '),
    source,
    timestamp: Date.now(),
    target: el,
  };
}

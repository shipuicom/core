/**
 * Implicit ARIA role mapping — a pragmatic subset of the HTML-AAM spec
 * covering the elements the simulator is likely to meet. An explicit `role`
 * attribute always wins (first token).
 */
export const IMPLICIT_ROLES: Record<string, string> = {
  a: '', // link only with href — handled in computeRole
  article: 'article',
  aside: 'complementary',
  button: 'button',
  datalist: 'listbox',
  dialog: 'dialog',
  fieldset: 'group',
  figure: 'figure',
  footer: 'contentinfo',
  form: 'form',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
  header: 'banner',
  hr: 'separator',
  img: 'img',
  li: 'listitem',
  main: 'main',
  menu: 'list',
  meter: 'meter',
  nav: 'navigation',
  ol: 'list',
  option: 'option',
  output: 'status',
  progress: 'progressbar',
  section: 'region',
  select: 'listbox',
  summary: 'button',
  table: 'table',
  tbody: 'rowgroup',
  td: 'cell',
  textarea: 'textbox',
  tfoot: 'rowgroup',
  th: 'columnheader',
  thead: 'rowgroup',
  tr: 'row',
  ul: 'list',
};

/** Implicit roles for `<input>` keyed by `type`. */
export const INPUT_ROLES: Record<string, string> = {
  button: 'button',
  checkbox: 'checkbox',
  email: 'textbox',
  image: 'button',
  number: 'spinbutton',
  radio: 'radio',
  range: 'slider',
  reset: 'button',
  search: 'searchbox',
  submit: 'button',
  tel: 'textbox',
  text: 'textbox',
  url: 'textbox',
  password: 'textbox',
};

/**
 * Resolve the ARIA role of `el`: explicit `role` attribute first (first
 * token), otherwise the implicit role for its tag. Returns `''` when the
 * element has no interesting role (generic containers).
 */
export function computeRole(el: Element): string {
  const explicit = el.getAttribute('role')?.trim().split(/\s+/)[0];
  if (explicit) return explicit;

  const tag = el.tagName.toLowerCase();
  if (tag === 'a') return el.hasAttribute('href') ? 'link' : '';
  if (tag === 'input') {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    return INPUT_ROLES[type] ?? 'textbox';
  }
  if (tag === 'select') {
    return (el as HTMLSelectElement).multiple || Number(el.getAttribute('size')) > 1
      ? 'listbox'
      : 'combobox';
  }
  return IMPLICIT_ROLES[tag] ?? '';
}

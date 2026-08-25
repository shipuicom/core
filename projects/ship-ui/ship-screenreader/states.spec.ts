import { afterEach, describe, expect, it } from 'vitest';
import { computePosition, computeStates, computeValue } from './states';
import { computeRole } from './role';

function mount(html: string): Element {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  return host.querySelector('[data-test]') ?? host.firstElementChild!;
}

afterEach(() => {
  document.body.innerHTML = '';
});

function statesOf(html: string): string[] {
  const el = mount(html);
  return computeStates(el, computeRole(el));
}

describe('computeStates', () => {
  it('announces disabled as dimmed', () => {
    expect(statesOf('<button disabled>x</button>')).toContain('dimmed');
    expect(statesOf('<div role="button" aria-disabled="true">x</div>')).toContain('dimmed');
  });

  it('announces aria-expanded', () => {
    expect(statesOf('<button aria-expanded="true">x</button>')).toContain('expanded');
    expect(statesOf('<button aria-expanded="false">x</button>')).toContain('collapsed');
    expect(statesOf('<button>x</button>')).toEqual([]);
  });

  it('announces checkbox state, including unchecked and mixed', () => {
    expect(statesOf('<input type="checkbox" checked>')).toContain('checked');
    expect(statesOf('<input type="checkbox">')).toContain('not checked');
    expect(statesOf('<div role="checkbox" aria-checked="mixed">x</div>')).toContain('mixed');
    expect(statesOf('<div role="switch">x</div>')).toContain('not checked');
  });

  it('announces pressed, selected, required, invalid, current, readonly', () => {
    expect(statesOf('<button aria-pressed="true">x</button>')).toContain('pressed');
    expect(statesOf('<div role="option" aria-selected="true">x</div>')).toContain('selected');
    expect(statesOf('<input required>')).toContain('required');
    expect(statesOf('<input aria-invalid="true">')).toContain('invalid');
    expect(statesOf('<a href="/" aria-current="page">x</a>')).toContain('current item');
    expect(statesOf('<input readonly>')).toContain('read only');
  });
});

describe('computeValue', () => {
  it('reads input and textarea values', () => {
    const input = mount('<input value="hello">') as HTMLInputElement;
    expect(computeValue(input)).toBe('hello');
    const empty = mount('<input>') as HTMLInputElement;
    expect(computeValue(empty)).toBeNull();
  });

  it('masks password values', () => {
    const input = mount('<input type="password" value="secret">') as HTMLInputElement;
    expect(computeValue(input)).toBe('••••••');
  });

  it('ignores checkbox/button values', () => {
    expect(computeValue(mount('<input type="checkbox" value="on">'))).toBeNull();
    expect(computeValue(mount('<input type="submit" value="Send">'))).toBeNull();
  });

  it('reads the selected option of a select', () => {
    const select = mount('<select><option>Ape</option><option selected>Bee</option></select>');
    expect(computeValue(select)).toBe('Bee');
  });

  it('prefers aria-valuetext, then aria-valuenow', () => {
    expect(computeValue(mount('<div role="slider" aria-valuenow="4" aria-valuetext="4 stars"></div>'))).toBe('4 stars');
    expect(computeValue(mount('<div role="slider" aria-valuenow="4"></div>'))).toBe('4');
  });
});

describe('computePosition', () => {
  it('reads heading level from tag and aria-level', () => {
    expect(computePosition(mount('<h3>x</h3>'), 'heading')).toEqual({ level: 3 });
    expect(computePosition(mount('<div role="heading" aria-level="4">x</div>'), 'heading')).toEqual({ level: 4 });
    expect(computePosition(mount('<div role="heading">x</div>'), 'heading')).toEqual({ level: 2 });
  });

  it('prefers aria-posinset/setsize', () => {
    const el = mount('<div role="option" aria-posinset="7" aria-setsize="9">x</div>');
    expect(computePosition(el, 'option')).toEqual({ pos: 7, size: 9 });
  });

  it('counts same-role DOM siblings', () => {
    const el = mount('<ul><li>a</li><li data-test>b</li><li>c</li></ul>');
    expect(computePosition(el, 'listitem')).toEqual({ pos: 2, size: 3 });
  });

  it('counts radios by name group', () => {
    const el = mount(`
      <input type="radio" name="size" value="s">
      <input data-test type="radio" name="size" value="m">
      <input type="radio" name="size" value="l">
      <input type="radio" name="other">
    `);
    expect(computePosition(el, 'radio')).toEqual({ pos: 2, size: 3 });
  });

  it('returns null for a lone item or non-positional role', () => {
    expect(computePosition(mount('<ul><li data-test>a</li></ul>'), 'listitem')).toBeNull();
    expect(computePosition(mount('<button>x</button>'), 'button')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { SHIP_DARK } from './ship-dark';
import { SHIP_LIGHT } from './ship-light';
import { ShipCodeTheme, resolveScope } from './theme-resolver';

const theme: ShipCodeTheme = {
  name: 'test',
  type: 'dark',
  colors: { 'editor.foreground': '#default' },
  tokenColors: [
    { scope: 'keyword', settings: { foreground: '#keyword' } },
    { scope: 'keyword.control', settings: { foreground: '#control' } },
    { scope: 'comment', settings: { foreground: '#comment', fontStyle: 'italic' } },
    { scope: ['string', 'constant.numeric'], settings: { foreground: '#literal' } },
    { scope: 'source.ts string', settings: { foreground: '#ts-string' } },
    { scope: 'markup.bold', settings: { fontStyle: 'bold underline' } },
  ],
};

describe('resolveScope', () => {
  it("resolves `keyword.control.ts` to the theme's keyword color (most specific rule)", () => {
    const styled = resolveScope(['source.ts', 'keyword.control.ts'], theme);
    expect(styled.foreground).toBe('#control');
  });

  it('a more specific selector wins over a general one, regardless of rule order', () => {
    // 'keyword' (1 segment) vs 'keyword.control' (2 segments) on the same scope.
    expect(resolveScope(['keyword.control.conditional'], theme).foreground).toBe('#control');
    // Only the general rule matches a bare keyword scope.
    expect(resolveScope(['keyword.other'], theme).foreground).toBe('#keyword');
  });

  it('a match deeper in the scope stack wins over an outer match', () => {
    // 'string' matches at depth 2; 'keyword' at depth 1 — string wins.
    const styled = resolveScope(['text.html', 'keyword.control', 'string.quoted'], theme);
    expect(styled.foreground).toBe('#literal');
  });

  it('descendant selectors require the outer scope and outrank the plain rule at the same depth', () => {
    expect(resolveScope(['source.ts', 'string.quoted.ts'], theme).foreground).toBe('#ts-string');
    expect(resolveScope(['source.css', 'string.quoted.css'], theme).foreground).toBe('#literal');
  });

  it("fontStyle 'italic' is applied when the theme specifies it", () => {
    const styled = resolveScope(['comment.line.ts'], theme);
    expect(styled.italic).toBe(true);
    expect(styled.bold).toBe(false);
    expect(styled.foreground).toBe('#comment');
  });

  it('compound font styles parse into flags', () => {
    const styled = resolveScope(['markup.bold'], theme);
    expect(styled.bold).toBe(true);
    expect(styled.underline).toBe(true);
    expect(styled.italic).toBe(false);
  });

  it('an unmatched scope falls back to the default editor foreground', () => {
    const styled = resolveScope(['meta.unknown.thing'], theme);
    expect(styled.foreground).toBe('#default');
    expect(styled.italic).toBe(false);
  });

  it('segment matching stops at dot boundaries', () => {
    // 'keyword' must not match 'keywordish.control'.
    expect(resolveScope(['keywordish.control'], theme).foreground).toBe('#default');
  });

  it('array scopes act as alternatives', () => {
    expect(resolveScope(['constant.numeric.decimal'], theme).foreground).toBe('#literal');
  });

  it('results are cached per theme and stack', () => {
    const a = resolveScope(['keyword.control'], theme);
    const b = resolveScope(['keyword.control'], theme);
    expect(a).toBe(b);
  });
});

describe('ship themes', () => {
  const CATEGORIES = [
    ['comment.line.ts'],
    ['string.quoted.single.ts'],
    ['constant.numeric.decimal.ts'],
    ['keyword.control.ts'],
    ['storage.type.ts'],
    ['entity.name.function.ts'],
    ['entity.name.type.class.ts'],
    ['entity.name.tag.html'],
    ['entity.other.attribute-name.html'],
    ['variable.other.readwrite.ts'],
    ['punctuation.separator.comma.ts'],
  ];

  it('ship-dark has rules for all major scope categories', () => {
    for (const scopes of CATEGORIES) {
      const styled = resolveScope(scopes, SHIP_DARK);
      expect(styled.foreground, scopes.join()).not.toBe('');
      expect(styled.foreground, scopes.join()).not.toBe(SHIP_DARK.colors!['editor.foreground']);
    }
  });

  it('ship-light has rules for all major scope categories', () => {
    for (const scopes of CATEGORIES) {
      const styled = resolveScope(scopes, SHIP_LIGHT);
      expect(styled.foreground, scopes.join()).not.toBe('');
      expect(styled.foreground, scopes.join()).not.toBe(SHIP_LIGHT.colors!['editor.foreground']);
    }
  });

  it('comments are italic in both themes', () => {
    expect(resolveScope(['comment.block.ts'], SHIP_DARK).italic).toBe(true);
    expect(resolveScope(['comment.block.ts'], SHIP_LIGHT).italic).toBe(true);
  });
});

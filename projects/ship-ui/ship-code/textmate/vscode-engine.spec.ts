// @vitest-environment node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { getGrammar } from '../grammars/registry';
import { classForScopes } from './scope-classes';
import { LanguageTokenizer, TokenizerEngine } from './types';
import { createVSCodeEngine } from './vscode-engine';

let engine: TokenizerEngine;
let ts: LanguageTokenizer;

beforeAll(async () => {
  // Runner-proof path: both `ng test` and standalone vitest run from the repo
  // root, while module URLs get rewritten by the test transform.
  const wasm = readFileSync(join(process.cwd(), 'projects/ship-ui/ship-code/vendor/vscode-oniguruma/onig.wasm'));
  engine = await createVSCodeEngine({ wasm: wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength) });
  ts = (await engine.loadLanguage('typescript'))!;
});

describe('grammar registry', () => {
  it("getGrammar('typescript') maps to source.ts", () => {
    expect(getGrammar('typescript')?.scopeName).toBe('source.ts');
    expect(getGrammar('ts')?.scopeName).toBe('source.ts');
    expect(getGrammar('html')?.scopeName).toBe('text.html.basic');
    expect(getGrammar('css')?.scopeName).toBe('source.css');
    expect(getGrammar('json')?.scopeName).toBe('source.json');
  });

  it("getGrammar('unknown') returns null", () => {
    expect(getGrammar('unknown')).toBeNull();
  });
});

describe('vscode-textmate engine', () => {
  it('loads a bound tokenizer for known languages, null for unknown', async () => {
    expect(ts).toBeTruthy();
    expect(await engine.loadLanguage('unknown')).toBeNull();
  });

  it("tokenizes `const x = 5;` — `const` carries storage.type", () => {
    const { tokens } = ts.tokenizeLine('const x = 5;', null);
    const constToken = tokens.find((t) => t.start === 0 && t.end === 5);
    expect(constToken).toBeTruthy();
    expect(constToken!.scopes.some((s) => s.startsWith('storage.type'))).toBe(true);
    const five = tokens.find((t) => t.start === 10 && t.end === 11);
    expect(five!.scopes.some((s) => s.startsWith('constant.numeric'))).toBe(true);
  });

  it('tokenizes `// comment` with a comment.line scope', () => {
    const { tokens } = ts.tokenizeLine('// comment', null);
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.every((t) => t.scopes.some((s) => s.startsWith('comment.line')))).toBe(true);
  });

  it('carries the scope stack across a multi-line template string', () => {
    const line1 = ts.tokenizeLine('const s = `hello', null);
    const line2 = ts.tokenizeLine('still inside', line1.endState);
    const line3 = ts.tokenizeLine('done`;', line2.endState);
    expect(line2.tokens[0].scopes.some((s) => s.startsWith('string.template'))).toBe(true);
    // After the closing backtick the string scope is gone.
    const after = ts.tokenizeLine('const x = 1;', line3.endState);
    expect(after.tokens[0].scopes.some((s) => s.startsWith('string'))).toBe(false);
  });

  it('tokenizing an empty line returns an empty token array', () => {
    expect(ts.tokenizeLine('', null).tokens).toEqual([]);
  });

  it('end states are comparable — identical prefixes produce equal stacks', () => {
    const a = ts.tokenizeLine('const x = 1;', null);
    const b = ts.tokenizeLine('const x = 1;', null);
    expect(a.endState.equals(b.endState)).toBe(true);
    const open = ts.tokenizeLine('const s = `open', null);
    expect(a.endState.equals(open.endState)).toBe(false);
  });

  it('scope classes: keywords, strings, comments and numbers get distinct classes', () => {
    const { tokens } = ts.tokenizeLine("const s = 'txt'; // note", null);
    const classes = tokens.map((t) => classForScopes(t.scopes));
    expect(classes).toContain('sh-tok-keyword');
    expect(classes).toContain('sh-tok-string');
    expect(classes).toContain('sh-tok-comment');
  });

  it('other vendored grammars bind: css and json tokenize', async () => {
    const css = (await engine.loadLanguage('css'))!;
    const cssTokens = css.tokenizeLine('.cls { color: red; }', null).tokens;
    expect(cssTokens.some((t) => t.scopes.some((s) => s.includes('entity.other.attribute-name.class')))).toBe(true);
    const json = (await engine.loadLanguage('json'))!;
    const jsonTokens = json.tokenizeLine('{ "a": 1 }', null).tokens;
    expect(jsonTokens.some((t) => t.scopes.some((s) => s.includes('support.type.property-name')))).toBe(true);
  });
});

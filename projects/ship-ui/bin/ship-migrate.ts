#!/usr/bin/env node
/**
 * Rewrites a consumer's templates and styles for a ShipUI release's renames.
 *
 *   ship-migrate --src ./src            # rewrite in place, print what changed
 *   ship-migrate --src ./src --dry-run  # print only
 *   ship-migrate --src ./src --to 0.26  # a specific release (default: all known, in order)
 *
 * Rules live in ./migrations/<version>.ts so later releases append a file instead of forking this script.
 * Anything the script cannot decide (an ambiguous class name, a removed input inside a bound expression)
 * is reported as a warning with file:line rather than rewritten.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import rules026 from './migrations/0.26';
import type { MigrationRules } from './migrations/types';

export type { MigrationRules };
/** One entry per release, oldest first; a new release adds ./migrations/<version>.ts here. */
export const MIGRATIONS: MigrationRules[] = [rules026];

export interface Change {
  line: number;
  rule: string;
  detail: string;
}
export interface Warning {
  line: number;
  rule: string;
  detail: string;
}
export interface FileResult {
  text: string;
  changes: Change[];
  warnings: Warning[];
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

/**
 * The same text with comments and string contents replaced by spaces (length preserved), so that braces, `>` and
 * tag names inside them cannot confuse the scope checks below. `//` after `:` (a URL) is not a comment.
 */
function blank(text: string): string {
  const pad = (m: string) => m.replace(/[^\n]/g, ' ');
  return text
    .replace(/\/\*[\s\S]*?\*\//g, pad)
    .replace(/(?<!:)\/\/[^\n]*/g, pad)
    .replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, (m) => m[0] + pad(m.slice(1, -1)) + m[0]);
}

/** Selectors of every block enclosing `index` in a (blanked) stylesheet, outermost last, joined with spaces. */
function enclosingSelectors(text: string, index: number): string {
  const selectors: string[] = [];
  let depth = 0;
  for (let i = index; i >= 0; i--) {
    const c = text[i];
    if (c === '}') depth++;
    else if (c === '{') {
      if (depth === 0) {
        let s = i - 1;
        while (s >= 0 && !'{};'.includes(text[s])) s--;
        selectors.push(text.slice(s + 1, i));
      } else depth--;
    }
  }
  return selectors.join(' ');
}

/** Name of the open tag `index` sits inside (between `<tag` and its `>`), or null when it is in text content. */
function enclosingTag(text: string, index: number): string | null {
  const lt = text.lastIndexOf('<', index);
  if (lt < 0) return null;
  const between = text.slice(lt, index);
  // A `>` inside a quoted attribute value (`[x]="a > b"`) does not close the tag; the text is already blanked.
  if (between.includes('>')) return null;
  return between.match(/^<([a-zA-Z][\w-]*)/)?.[1] ?? null;
}

/** Whether the match at `index` is inside a rule for `tag` (styles) or on a `<tag …>` element (templates). */
function targets(blanked: string, raw: string, index: number, tag: string, isStyle: boolean, ext: string): boolean {
  const inRule = (text: string) => new RegExp(`(?<![\\w-])${esc(tag)}(?![\\w-])`).test(enclosingSelectors(text, index));
  if (isStyle) return inRule(blanked);
  if (enclosingTag(blanked, index) === tag) return true;
  // In a `.ts` file the template and `styles:` are string literals, which blanking hides: look at the raw text too.
  return ext === '.ts' && (enclosingTag(raw, index) === tag || inRule(raw));
}

/** Whether `index` (start of a token of `length`) is in selector position: inside a rule prelude that ends in `{`. */
function inSelector(blanked: string, index: number, length: number): boolean {
  const before = blanked[index - 1];
  if (before === '$' || before === '@') return false;
  for (let i = index + length; i < blanked.length; i++) {
    const c = blanked[i];
    if (c === '{') return true;
    if (c === ';' || c === '}') return false;
  }
  return false;
}
const STYLE_EXT = new Set(['.scss', '.sass', '.css', '.less']);
const TEMPLATE_EXT = new Set(['.html', '.ts']);

/** Applies one release's rules to one file's text. Pure: returns the new text plus a change log. */
export function migrateSource(text: string, ext: string, rules: MigrationRules): FileResult {
  const changes: Change[] = [];
  const warnings: Warning[] = [];
  let out = text;
  const isStyle = STYLE_EXT.has(ext);
  const isTemplate = TEMPLATE_EXT.has(ext);

  const replaceAll = (re: RegExp, to: string | ((...m: string[]) => string), rule: string, detail: (m: string) => string) => {
    out = out.replace(re, (...args) => {
      const match = args[0] as string;
      const offset = args[args.length - 2] as number;
      changes.push({ line: lineOf(out, offset), rule, detail: detail(match) });
      return typeof to === 'string' ? to : to(...(args.slice(0, -2) as string[]));
    });
  };

  // CSS custom properties appear in styles and in templates ([style.--x], style="--x: …").
  for (const { from, to } of rules.cssVarPrefixes ?? []) {
    replaceAll(new RegExp(esc(from) + '(?=[a-z0-9-])', 'g'), to, 'css-var', (m) => `${m}… → ${to}…`);
  }
  // Generic names (`--miw`, `--overlay`) are only renamed where they target the component: inside a rule whose
  // selector names the tag, or on that tag in a template. Anywhere else may be the consumer's own variable.
  for (const { from, to, requires } of rules.cssVars ?? []) {
    const re = new RegExp(esc(from) + '(?![a-z0-9-])', 'g');
    if (!re.test(out)) continue;
    re.lastIndex = 0;
    const src = out;
    const blanked = blank(src);
    out = src.replace(re, (match, offset: number) => {
      if (requires && !targets(blanked, src, offset, requires, isStyle, ext)) {
        warnings.push({ line: lineOf(src, offset), rule: 'css-var', detail: `${from} → ${to} only where it targets ${requires}; this one is not inside a ${requires} rule or tag, left as is` });
        return match;
      }
      changes.push({ line: lineOf(src, offset), rule: 'css-var', detail: `${from} → ${to}` });
      return to;
    });
  }

  if (isStyle) {
    for (const { pattern, message } of rules.styleWarnings ?? []) {
      for (const m of out.matchAll(new RegExp(pattern, 'g'))) warnings.push({ line: lineOf(out, m.index!), rule: 'css-var', detail: message });
    }
    for (const { from, to } of rules.sassFlags ?? []) {
      replaceAll(new RegExp(esc(from) + '(?![A-Za-z0-9_-])', 'g'), to, 'sass-flag', () => `${from} → ${to}`);
    }
    // Renamed elements used as selectors (`ship-theme-toggle { … }`); not in strings, urls, comments or variables.
    for (const { from, to } of rules.selectors ?? []) {
      const re = new RegExp(`(?<![\\w$@-])${esc(from)}(?![\\w-])`, 'g');
      if (!re.test(out)) continue;
      re.lastIndex = 0;
      const src = out;
      const blanked = blank(src);
      out = src.replace(re, (match, offset: number) => {
        if (blanked.slice(offset, offset + match.length) !== match || !inSelector(blanked, offset, match.length)) return match;
        changes.push({ line: lineOf(src, offset), rule: 'selector', detail: `${from} → ${to}` });
        return to;
      });
    }
  }

  if (isTemplate) {
    for (const { from, to } of rules.selectors ?? []) {
      replaceAll(new RegExp(`(</?)${esc(from)}(?![a-z0-9-])`, 'g'), (_m, bracket) => bracket + to, 'selector', () => `<${from}> → <${to}>`);
    }

    // Class renames only on the listed tags: `class="a warning b"` and `[class.warning]="…"`.
    for (const { from, to, on } of rules.classes ?? []) {
      const tags = on.map(esc).join('|');
      const openTag = new RegExp(`<(?:${tags})(?![a-z0-9-])[^>]*>`, 'g');
      out = out.replace(openTag, (tag, offset: number) => {
        let next = tag;
        next = next.replace(new RegExp(`(class="[^"]*?)(?<![\\w-])${esc(from)}(?![\\w-])`, 'g'), `$1${to}`);
        next = next.replace(new RegExp(`\\[class\\.${esc(from)}\\]`, 'g'), `[class.${to}]`);
        if (next !== tag) changes.push({ line: lineOf(out, offset), rule: 'class', detail: `.${from} → .${to}` });
        return next;
      });
      // The same token elsewhere may be the consumer's own class: point at it, do not touch it.
      for (const m of out.matchAll(new RegExp(`class="[^"]*(?<![\\w-])${esc(from)}(?![\\w-])[^"]*"`, 'g'))) {
        warnings.push({ line: lineOf(out, m.index!), rule: 'class', detail: `"${from}" on an element that is not ${on.join('/')} — rename to "${to}" if it is a ShipUI colour` });
      }
    }

    // Removed inputs: drop the static or bound attribute from the tag, report the rest.
    for (const { tag, input } of rules.removedInputs ?? []) {
      const openTag = new RegExp(`<${esc(tag)}(?![a-z0-9-])[^>]*>`, 'g');
      out = out.replace(openTag, (t, offset: number) => {
        const attr = new RegExp(`\\s+\\[?${esc(input)}\\]?="[^"]*"`, 'g');
        const next = t.replace(attr, '');
        if (next !== t) changes.push({ line: lineOf(out, offset), rule: 'removed-input', detail: `<${tag} ${input}> removed (it had no effect)` });
        return next;
      });
    }
  }

  if (ext === '.ts') {
    for (const { from, to } of rules.identifiers ?? []) {
      replaceAll(new RegExp(`\\b${esc(from)}\\b`, 'g'), to, 'identifier', () => `${from} → ${to}`);
    }
    for (const { pattern, message } of rules.tsWarnings ?? []) {
      for (const m of out.matchAll(new RegExp(pattern, 'g'))) warnings.push({ line: lineOf(out, m.index!), rule: 'config', detail: message });
    }
  }

  return { text: out, changes, warnings };
}

// ---------------------------------------------------------------------------------------------

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (STYLE_EXT.has(extname(name)) || TEMPLATE_EXT.has(extname(name))) out.push(p);
  }
  return out;
}

export function main(argv: string[]) {
  const arg = (name: string) => {
    const i = argv.findIndex((a) => a === name || a.startsWith(name + '='));
    if (i < 0) return undefined;
    return argv[i].includes('=') ? argv[i].split('=')[1] : argv[i + 1];
  };
  const src = resolve(process.cwd(), arg('--src') ?? 'src');
  const dryRun = argv.includes('--dry-run');
  const to = arg('--to');
  const selected = to ? MIGRATIONS.filter((m) => m.version.startsWith(to)) : MIGRATIONS;
  if (selected.length === 0) {
    console.error(`No migration for "${to}". Known: ${MIGRATIONS.map((m) => m.version).join(', ')}`);
    process.exit(2);
  }

  let files = 0;
  let changed = 0;
  let totalChanges = 0;
  let totalWarnings = 0;
  for (const file of walk(src)) {
    files++;
    const original = readFileSync(file, 'utf8');
    let text = original;
    const changes: Change[] = [];
    const warnings: Warning[] = [];
    for (const rules of selected) {
      const r = migrateSource(text, extname(file), rules);
      text = r.text;
      changes.push(...r.changes);
      warnings.push(...r.warnings);
    }
    if (changes.length === 0 && warnings.length === 0) continue;
    const rel = relative(process.cwd(), file);
    if (changes.length) {
      changed++;
      totalChanges += changes.length;
      console.log(`${dryRun ? '○' : '●'} ${rel}`);
      for (const c of changes) console.log(`    :${c.line}  ${c.detail}`);
      if (!dryRun && text !== original) writeFileSync(file, text);
    }
    if (warnings.length) {
      totalWarnings += warnings.length;
      if (!changes.length) console.log(`  ${rel}`);
      for (const w of warnings) console.log(`    :${w.line}  ⚠ ${w.detail}`);
    }
  }
  console.log();
  console.log(
    `${selected.map((m) => m.version).join(' + ')}: ${files} files scanned, ${changed} ${dryRun ? 'would change' : 'changed'} (${totalChanges} edits), ${totalWarnings} warnings to review.`,
  );
}

if (process.argv[1] && /ship-migrate(\.m?[jt]s)?$/.test(process.argv[1])) {
  main(process.argv.slice(2));
}

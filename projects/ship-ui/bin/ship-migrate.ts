#!/usr/bin/env node
/**
 * Rewrites a consumer's templates and styles for a ShipUI release's renames.
 *
 *   ship-migrate --src ./src            # rewrite in place, print what changed
 *   ship-migrate ./src                  # same: one positional argument is the source folder
 *   ship-migrate --src ./src --dry-run  # print only
 *   ship-migrate --src ./src --to 0.26  # a specific release (default: all known, in order)
 *   ship-migrate --help                 # usage; any argument it does not know stops it before touching a file
 *
 * Rules live in ./migrations/<version>.ts so later releases append a file instead of forking this script.
 * Anything the script cannot decide (an ambiguous class name, a removed input inside a bound expression)
 * is reported as a warning with file:line rather than rewritten.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
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

const LINE_COMMENT_EXT = new Set(['.ts', '.scss', '.sass', '.less']);

/**
 * The same text with comments and string contents replaced by spaces (length preserved), so that braces, `>` and
 * tag names inside them cannot confuse the scope checks below. One pass, leftmost token wins, so a `//` inside a
 * string is part of the string. `//` is a comment only where the language has line comments (not HTML or CSS),
 * and not after `:` or `(` (a URL). A template literal in `.ts` is blanked with the HTML rules so its tags stay visible.
 */
function blank(text: string, ext: string, { singleQuotes = true } = {}): string {
  if (ext === '.html') return blankHtml(text, singleQuotes);
  const pad = (m: string) => m.replace(/[^\n]/g, ' ');
  const alts = ['\\/\\*[\\s\\S]*?\\*\\/', '"(?:[^"\\\\\\n]|\\\\.)*"'];
  if (singleQuotes) alts.push("'(?:[^'\\\\\\n]|\\\\.)*'");
  if (LINE_COMMENT_EXT.has(ext)) alts.push('(?<![:(])\\/\\/[^\\n]*');
  if (ext === '.ts') alts.push('`(?:[^`\\\\]|\\\\.)*`');
  return text.replace(new RegExp(alts.join('|'), 'g'), (m) => {
    if (m[0] === '`') return '`' + blank(m.slice(1, -1), '.html', { singleQuotes }) + '`';
    if (m[0] === '/') return pad(m);
    return m[0] + pad(m.slice(1, -1)) + m[0];
  });
}

/**
 * HTML flavour of blank(): comments are blanked, and quotes start a string only inside a tag (attribute values)
 * or an `{{ … }}` interpolation, so an apostrophe in text content (`<p>Don't</p>`) cannot swallow the tags after it.
 */
function blankHtml(text: string, singleQuotes: boolean): string {
  const out = text.split('');
  const padRange = (from: number, to: number) => {
    for (let k = from; k < to; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  let i = 0;
  let mode: 'text' | 'tag' | 'interp' = 'text';
  while (i < text.length) {
    const c = text[i];
    if (mode === 'text') {
      if (text.startsWith('<!--', i)) {
        const end = text.indexOf('-->', i + 4);
        const stop = end < 0 ? text.length : end + 3;
        padRange(i, stop);
        i = stop;
        continue;
      }
      if (c === '<' && /[a-zA-Z\/]/.test(text[i + 1] ?? '')) mode = 'tag';
      else if (text.startsWith('{{', i)) {
        mode = 'interp';
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (c === '"' || (c === "'" && singleQuotes)) {
      // In a tag a quote opens a string only as an attribute value (right after `=`): an apostrophe inside an
      // unquoted value (`alt=don't`) is just a character. In an interpolation any quote is a JS string.
      let prev = i - 1;
      while (prev >= 0 && /\s/.test(text[prev]!)) prev--;
      if (mode === 'tag' && text[prev] !== '=') {
        i++;
        continue;
      }
      let j = i + 1;
      // A string ends at its closing quote; one that never closes (before the end of the interpolation, or the end
      // of the file in a tag) is treated as a plain character rather than swallowing everything after it.
      const limit = mode === 'interp' ? (text.indexOf('}}', i) < 0 ? text.length : text.indexOf('}}', i)) : text.length;
      while (j < limit && text[j] !== c) j += text[j] === '\\' && mode === 'interp' ? 2 : 1;
      // A real attribute value's closing quote is followed by whitespace, `>`, `/`, the end, or (Angular allows no
      // space between attributes) another attribute name that is itself followed by `=`, whitespace, `>`, `/` or the
      // end: `[x]="a > b"(change)="f()"`. Anything else means the opening quote never closed and matched a quote
      // further on (`title="oops>` … `class="warning"`, where `warning` is followed by a quote): read the opening
      // quote as a plain character instead. Values may span lines and contain markup either way.
      if (j >= limit || (mode === 'tag' && !/^(?:$|[\s>\/]|[^\s"'>\/=]+(?:$|[\s=>\/]))/.test(text.slice(j + 1, j + 200)))) {
        i++;
        continue;
      }
      padRange(i + 1, j);
      i = j + 1;
      continue;
    }
    if (mode === 'tag' && c === '>') mode = 'text';
    else if (mode === 'interp' && text.startsWith('}}', i)) {
      mode = 'text';
      i += 2;
      continue;
    }
    i++;
  }
  return out.join('');
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
    const tags = requires === undefined ? [] : Array.isArray(requires) ? requires : [requires];
    const scope = tags.join(' / ');
    const re = new RegExp(esc(from) + '(?![a-z0-9-])', 'g');
    if (!re.test(out)) continue;
    re.lastIndex = 0;
    const src = out;
    const blanked = blank(src, ext);
    out = src.replace(re, (match, offset: number) => {
      if (tags.length && !tags.some((tag) => targets(blanked, src, offset, tag, isStyle, ext))) {
        warnings.push({ line: lineOf(src, offset), rule: 'css-var', detail: `${from} → ${to} only where it targets ${scope}; this one is not inside a ${scope} rule or tag, left as is` });
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
      const blanked = blank(src, ext);
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

    // Open tags are located on the blanked text so a `>` inside an attribute value cannot end them early; the
    // rewrite itself runs on the raw tag. In .ts the (often single-quoted) template literal must stay visible.
    const replaceOpenTags = (re: RegExp, fn: (tag: string, offset: number, blankedTag: string) => string) => {
      const src = out;
      const blanked = blank(src, ext, { singleQuotes: ext !== '.ts' });
      let result = '';
      let last = 0;
      for (const m of blanked.matchAll(re)) {
        const end = m.index! + m[0].length;
        result += src.slice(last, m.index!) + fn(src.slice(m.index!, end), m.index!, m[0]);
        last = end;
      }
      out = result + src.slice(last);
    };

    // Class renames only on the listed tags: `class="a warning b"` and `[class.warning]="…"`.
    // `class=` with either quote; every token in the list is renamed, whitespace kept as written.
    // Quoted (`class="a warning"`, `class='a'`) or unquoted (`class=warning`, one token by definition).
    // An unquoted value ends at whitespace or `>`, and at the `/` of a self-closing `/>` (Angular's lexer agrees).
    const classAttr = /((?:\s|(?<=["']))class=)(?:(["'])([^"']*)\2|((?:[^\s"'=<>`\/]|\/(?!>))+))/g;
    const classList = (m: RegExpMatchArray | string[]) => (m[3] ?? m[4] ?? '') as string;
    const renameTokens = (list: string, from: string, to: string) => list.replace(/[^\s]+/g, (token) => (token === from ? to : token));
    for (const { from, to, on } of rules.classes ?? []) {
      const tags = on.map(esc).join('|');
      replaceOpenTags(new RegExp(`<(?:${tags})(?![a-z0-9-])[^>]*>`, 'g'), (tag, offset) => {
        let next = tag;
        next = next.replace(classAttr, (_m, lead, quote, quoted, bare) =>
          quote ? lead + quote + renameTokens(quoted, from, to) + quote : lead + renameTokens(bare, from, to)
        );
        next = next.replace(new RegExp(`\\[class\\.${esc(from)}\\]`, 'g'), `[class.${to}]`);
        if (next !== tag) changes.push({ line: lineOf(out, offset), rule: 'class', detail: `.${from} → .${to}` });
        return next;
      });
      // The same token elsewhere may be the consumer's own class: point at it, do not touch it.
      for (const m of out.matchAll(classAttr)) {
        if (!classList(m).split(/\s+/).includes(from)) continue;
        warnings.push({ line: lineOf(out, m.index!), rule: 'class', detail: `"${from}" on an element that is not ${on.join('/')} — rename to "${to}" if it is a ShipUI colour` });
      }
      // Class lists the script cannot rewrite: interpolated (`class="{{ ok ? '' : 'warning' }}"`) or bound
      // (`[class]`, `[ngClass]`, `[className]`) expressions that mention the token.
      const tokenRe = new RegExp(`(?<![\\w-])${esc(from)}(?![\\w-])`);
      const exprAttr = /(?:\s|(?<=["']))(class|\[class\]|\[ngClass\]|\[className\])=(?:"([^"]*)"|'([^']*)')/g;
      for (const m of out.matchAll(exprAttr)) {
        const value = m[2] ?? m[3] ?? '';
        if (m[1] === 'class' && !value.includes('{{')) continue;
        if (!tokenRe.test(value)) continue;
        warnings.push({ line: lineOf(out, m.index!), rule: 'class', detail: `"${from}" inside a ${m[1]} expression — rename it to "${to}" by hand if it is a ShipUI colour on ${on.join('/')}` });
      }
    }

    // Attribute names count after whitespace or straight after a closing quote (Angular needs no space between).
    // Removed inputs: drop the attribute from the tag — static (`color="x"`, `color='x'`, `color=x`, bare `color`)
    // or bound (`[color]="x"`) — and report any other form (`bind-color`, `[(color)]`, `[attr.color]`).
    // Attributes are found on the blanked tag so text inside another attribute's value is never matched.
    for (const { tag, input } of rules.removedInputs ?? []) {
      const name = esc(input);
      const attr = new RegExp(`(?:\\s+|(?<=["']))(?:\\[${name}\\]|${name})(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s"'=<>\`/]+))?(?=[\\s/>])`, 'g');
      const leftover = new RegExp(`(?:(?:\\s|(?<=["']))bind-|\\[\\(|\\[attr\\.)${name}(?![\\w-])`);
      replaceOpenTags(new RegExp(`<${esc(tag)}(?![a-z0-9-])[^>]*>`, 'g'), (t, offset, b) => {
        let next = '';
        let nextBlanked = '';
        let last = 0;
        for (const m of b.matchAll(attr)) {
          next += t.slice(last, m.index!);
          nextBlanked += b.slice(last, m.index!);
          last = m.index! + m[0].length;
        }
        next += t.slice(last);
        nextBlanked += b.slice(last);
        if (next !== t) changes.push({ line: lineOf(out, offset), rule: 'removed-input', detail: `<${tag} ${input}> removed (it had no effect)` });
        if (leftover.test(nextBlanked.replace(/^<[\\w-]+/, ''))) {
          warnings.push({ line: lineOf(out, offset), rule: 'removed-input', detail: `<${tag}> no longer has a ${input} input; remove this binding by hand` });
        }
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

/** The package this script ships in (projects/ship-ui in the repo, the package root once published). */
const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Flags `@use '@ship-ui/core/styles' with (...)` accepts, and the ones it accepts but does not act on yet. */
export function styleFlags(pkgRoot = PKG_ROOT): { known: Set<string>; reserved: Set<string> } | null {
  // Bundled or test runners may relocate this file: fall back to the package installed in the project being migrated.
  const roots = [pkgRoot, resolve(process.cwd(), 'node_modules/@ship-ui/core'), resolve(process.cwd(), 'projects/ship-ui')];
  const root = roots.find((r) => existsSync(join(r, 'styles/index.scss')) && existsSync(join(r, 'styles/skins/_index.scss')));
  if (!root) return null;
  const index = join(root, 'styles/index.scss');
  const skins = join(root, 'styles/skins/_index.scss');
  const indexSrc = readFileSync(index, 'utf8');
  const known = new Set([...indexSrc.matchAll(/^\$([A-Za-z0-9_]+)\s*:[^;]*!default/gm)].map((m) => '$' + m[1]));
  const emitted = new Set([...readFileSync(skins, 'utf8').matchAll(/enabled\(([a-zA-Z]+)\)/g)].map((m) => m[1]));
  const reserved = new Set<string>();
  for (const m of indexSrc.matchAll(/^\s+([a-zA-Z]+):\s*(\$ship[A-Za-z]+)/gm)) {
    if (!emitted.has(m[1]!) && m[1] !== 'sortable') reserved.add(m[2]!);
  }
  return { known, reserved };
}

/**
 * Things the per-file rules cannot see: the project must load the global stylesheet (components no longer style
 * their own variants and colours), and the flags it passes must exist and do something.
 */
// The package entry (`@ship-ui/core/styles`) or a path into the library's styles folder (a workspace / the docs app).
const STYLES_USE = /@use\s+['"](?:@ship-ui\/core\/styles(?:\/core)?|[^'"]*ship-ui\/styles(?:\/(?:index|core)(?:\.scss)?)?)['"]/;
const STYLES_WITH = new RegExp(STYLES_USE.source + '\\s+with\\s*\\(([\\s\\S]*?)\\)\\s*;');

export function projectChecks(styleSources: Array<{ file: string; text: string }>, flags = styleFlags()): string[] {
  const notes: string[] = [];
  const entries = styleSources.filter(({ text }) => STYLES_USE.test(text));
  if (styleSources.length && entries.length === 0) {
    notes.push(
      `no stylesheet does \`@use '@ship-ui/core/styles'\` — since 0.26 the components' variant and colour classes are only styled by that global sheet; add it (or \`@use '@ship-ui/core/styles' with (...)\`) to your root styles`,
    );
  }
  if (!flags) return notes;
  for (const { file, text } of entries) {
    const block = text.match(STYLES_WITH)?.[1];
    if (!block) continue;
    for (const m of block.matchAll(/(\$[A-Za-z0-9_]+)\s*:/g)) {
      const flag = m[1]!;
      if (!flags.known.has(flag)) notes.push(`${file}: \`${flag}\` is not a flag of @ship-ui/core/styles (Sass will reject it)`);
      else if (flags.reserved.has(flag)) notes.push(`${file}: \`${flag}\` is accepted but not honoured yet (that component's styles still live in its own stylesheet)`);
    }
  }
  return notes;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (STYLE_EXT.has(extname(name)) || TEMPLATE_EXT.has(extname(name))) out.push(p);
  }
  return out;
}

const USAGE = `Usage: ship-migrate [folder] [--src <folder>] [--dry-run] [--to <version>]

Rewrites templates and styles under the folder (default: ./src) for ShipUI's renames, in place.
  --dry-run       print what would change, write nothing
  --to <version>  apply only that release's rules (known: ${MIGRATIONS.map((m) => m.version).join(', ')})
  --help, -h      show this help

Changes to make by hand are listed in node_modules/@ship-ui/core/MIGRATION.md.`;

/** Strict argument parsing: the script rewrites files, so anything it does not understand stops it instead. */
function parseArgs(argv: string[]): { help: true } | { help: false; src?: string; dryRun: boolean; to?: string } | { error: string } {
  let src: string | undefined;
  let to: string | undefined;
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const [flag, inline] = a.startsWith('--') && a.includes('=') ? [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a, undefined];
    const value = () => {
      const v = inline ?? argv[++i];
      if (v === undefined || v === '' || v.startsWith('-')) throw new Error(`${flag} needs a value`);
      return v;
    };
    // A switch takes no value: `--dry-run=false` is a mistake, not a way to turn it off.
    const noValue = () => {
      if (inline !== undefined) throw new Error(`${flag} takes no value`);
    };
    try {
      if (flag === '--help' || flag === '-h') {
        noValue();
        return { help: true };
      } else if (flag === '--dry-run') {
        noValue();
        dryRun = true;
      }
      else if (flag === '--src') src = value();
      else if (flag === '--to') to = value();
      else if (flag.startsWith('-')) return { error: `unknown option ${flag}` };
      else if (src === undefined) src = flag;
      else return { error: `unexpected argument ${flag} (the source folder is already ${src})` };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
  return { help: false, src, dryRun, to };
}

export function main(argv: string[]) {
  const parsed = parseArgs(argv);
  if ('error' in parsed) {
    console.error(`ship-migrate: ${parsed.error}\n\n${USAGE}`);
    process.exit(2);
  }
  if (parsed.help) {
    console.log(USAGE);
    return;
  }
  const src = resolve(process.cwd(), parsed.src ?? 'src');
  const dryRun = parsed.dryRun;
  const to = parsed.to;
  if (!existsSync(src) || !statSync(src).isDirectory()) {
    console.error(`ship-migrate: no folder at ${src}. Pass the folder that holds your templates and styles: ship-migrate --src <folder>`);
    process.exit(1);
  }
  const selected = to ? MIGRATIONS.filter((m) => m.version.startsWith(to)) : MIGRATIONS;
  if (selected.length === 0) {
    console.error(`No migration for "${to}". Known: ${MIGRATIONS.map((m) => m.version).join(', ')}`);
    process.exit(2);
  }

  const allFiles = walk(src);
  const styleSources = allFiles
    .filter((f) => STYLE_EXT.has(extname(f)))
    .map((f) => ({ file: relative(process.cwd(), f), text: readFileSync(f, 'utf8') }));
  const projectNotes = projectChecks(styleSources);
  if (projectNotes.length) {
    console.log('Project');
    for (const n of projectNotes) console.log(`    ⚠ ${n}`);
    console.log();
  }

  let files = 0;
  let changed = 0;
  let totalChanges = 0;
  let totalWarnings = projectNotes.length;
  for (const file of allFiles) {
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

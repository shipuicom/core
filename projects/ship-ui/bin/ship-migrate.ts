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
  for (const { from, to, requires } of rules.cssVars ?? []) {
    const re = () => new RegExp(esc(from) + '(?![a-z0-9-])', 'g');
    if (!re().test(out)) continue;
    if (requires && !out.includes(requires)) {
      for (const m of out.matchAll(re())) {
        warnings.push({ line: lineOf(out, m.index!), rule: 'css-var', detail: `${from} → ${to} only if it targets ${requires}; file does not mention ${requires}, left as is` });
      }
      continue;
    }
    replaceAll(re(), to, 'css-var', () => `${from} → ${to}`);
  }

  if (isStyle) {
    for (const { from, to } of rules.sassFlags ?? []) {
      replaceAll(new RegExp(esc(from) + '(?![A-Za-z0-9_-])', 'g'), to, 'sass-flag', () => `${from} → ${to}`);
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

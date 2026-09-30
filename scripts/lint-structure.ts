/**
 * Checks every ship-ui package against projects/ship-ui/COMPONENT-STRUCTURE.md.
 *
 *   bun run lint:structure            # errors only (exit 1 when any)
 *   bun run lint:structure --warnings # also print the TS-convention warnings (phase 2 rules)
 *   bun run lint:structure --json     # machine-readable
 *   bun run lint:structure ship-toggle ship-radio   # only these packages
 *
 * A line ending in `// structure-lint: allow` (scss: `// structure-lint: allow`) is skipped by the line rules.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const ROOT = join(import.meta.dir, '..');
const LIB = join(ROOT, 'projects/ship-ui');
const STYLES = join(LIB, 'styles');
const CORE_STYLE_FILES = [
  'index.scss',
  'core.scss',
  'core/core/variables.scss',
  'core/core/loader.scss',
  'core/core/layout.scss',
  'core/core/typography.scss',
  'core/core.scss',
  'skins/_sheet.scss',
].map((f) => join(STYLES, f));

const args = process.argv.slice(2);
const SHOW_WARNINGS = args.includes('--warnings');
const JSON_OUT = args.includes('--json');
const ONLY = new Set(args.filter((a) => !a.startsWith('--')));

const COLOR_CLASSES = new Set(['primary', 'accent', 'warn', 'error', 'success']);
const BAD_COLOR_CLASSES = ['warning', 'danger', 'info'];
const ALLOW = /structure-lint:\s*allow/;

type Level = 'error' | 'warn';
type Finding = { pkg: string; rule: string; level: Level; file: string; line?: number; msg: string };
const findings: Finding[] = [];
const report = (pkg: string, rule: string, level: Level, file: string, msg: string, line?: number) =>
  findings.push({ pkg, rule, level, file: relative(ROOT, file), line, msg });

// ---------------------------------------------------------------------------------------------
// helpers

const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'benchmarks' || name === 'vendor' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

/** Blank out line and block comments so string/regex rules do not fire on prose. Keeps line count intact. */
const stripComments = (scss: string) =>
  scss.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));

const declaredVars = (scss: string) => new Set([...scss.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]!));
const usedVars = (scss: string) => [...scss.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map((m) => ({ name: m[1]!, index: m.index! }));

/** Top-level statements of a scss file: [kind, text, startIndex]. Brace-matched, comment-stripped. */
function topLevel(scss: string): Array<{ text: string; index: number }> {
  const out: Array<{ text: string; index: number }> = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < scss.length; i++) {
    const ch = scss[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        out.push({ text: scss.slice(start, i + 1).trim(), index: start });
        start = i + 1;
      }
    } else if (ch === ';' && depth === 0) {
      out.push({ text: scss.slice(start, i + 1).trim(), index: start });
      start = i + 1;
    }
  }
  return out.filter((s) => s.text.length > 0);
}

// ---------------------------------------------------------------------------------------------
// global knowledge: every custom property defined anywhere in the lib is a legal public token

const packages = readdirSync(LIB)
  .filter((d) => /^(ship|sh)-/.test(d) && statSync(join(LIB, d)).isDirectory())
  .filter((d) => existsSync(join(LIB, d, 'ng-package.json')) || existsSync(join(LIB, d, 'ng-package.json.disabled')))
  .filter((d) => ONLY.size === 0 || ONLY.has(d))
  .sort();

const globalDefined = new Set<string>();
for (const f of CORE_STYLE_FILES) if (existsSync(f)) for (const v of declaredVars(readFileSync(f, 'utf8'))) globalDefined.add(v);
const allPkgDirs = readdirSync(LIB).filter((d) => /^(ship|sh)-/.test(d) && statSync(join(LIB, d)).isDirectory());
for (const d of allPkgDirs) {
  for (const f of walk(join(LIB, d))) {
    if (f.endsWith('.scss')) for (const v of declaredVars(stripComments(readFileSync(f, 'utf8')))) globalDefined.add(v);
    if (f.endsWith('.ts') || f.endsWith('.html')) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/setProperty\(\s*["'\x60](--[a-z0-9-]+)/gi)) globalDefined.add(m[1]!);
      for (const m of src.matchAll(/\[style\.(--[a-z0-9-]+)(?:\.[a-z%]+)?\]/gi)) globalDefined.add(m[1]!);
      for (const m of src.matchAll(/(--[a-z0-9-]+)\s*:\s*\$\{/gi)) globalDefined.add(m[1]!);
      for (const m of src.matchAll(/style="[^"]*(--[a-z0-9-]+)\s*:/gi)) globalDefined.add(m[1]!);
    }
  }
}
// Consumer-facing tokens documented as overridable but never declared with a default.
for (const v of ['--chip-c', '--chip-ic', '--achievement-c', '--stat-c', '--trend-c', '--goal-c', '--ring-c', '--ach-c']) globalDefined.add(v);

// ---------------------------------------------------------------------------------------------
// rules

function lintScss(pkg: string, file: string, flagName: string) {
  const raw = readFileSync(file, 'utf8');
  const scss = stripComments(raw);
  const lines = raw.split('\n');
  // `// structure-lint: allow <rule>` in the file header disables one rule for the whole file (say why next to it).
  const fileAllow = new Set([...raw.matchAll(/structure-lint:\s*allow\s+([a-z-]+)/g)].map((m) => m[1]!));
  const allowed = (line: number) => ALLOW.test(lines[line - 1] ?? '');
  // Mixin-only partials (`_name.scss`) need no flag of their own.
  const isPartial = basename(file).startsWith('_');

  const stmts = topLevel(scss);
  if (!/^@use\s+['"](\.\.\/)*helpers(\.scss)?['"]\s+as\s+\*/.test(stmts[0]?.text ?? '')) {
    report(pkg, 'helpers-use', 'error', file, `first statement must be "@use 'helpers' as *;"`, 1);
  }

  const flagDecl = new RegExp(`^\\$(ship[A-Za-z]+)\\s*:\\s*(true|false)\\s*!default`);
  const flags = stmts.map((s) => s.text.match(flagDecl)?.[1]).filter(Boolean) as string[];
  const guards = stmts.filter((s) => /^@if\s+\$ship[A-Za-z]+\s*==\s*true\s*\{/.test(s.text));
  if (!isPartial && flags.length === 0) report(pkg, 'flag', 'error', file, `missing "$${flagName}: true !default;"`);
  if (!isPartial && guards.length === 0) report(pkg, 'guard', 'error', file, `missing "@if $${flagName} == true { … }" around all rules`);

  for (const s of stmts) {
    if (/^@(use|forward|import)\b/.test(s.text)) {
      if (/@use\s+['"]\.\.\/(ship|sh)-/.test(s.text) && !fileAllow.has('cross-use'))
        report(pkg, 'cross-use', 'error', file, `imports another package's scss: ${s.text.split('\n')[0]}`, lineOf(scss, s.index));
      continue;
    }
    if (/^\$[A-Za-z0-9-]+\s*:/.test(s.text)) continue;
    if (/^@if\s+\$ship/.test(s.text)) continue;
    // Mixins, functions and placeholders emit nothing until used, so they may sit outside the guard.
    if (/^(@mixin|@function|%)/.test(s.text)) continue;
    if (allowed(lineOf(scss, s.index))) continue;
    report(pkg, 'guard-leak', 'error', file, `outside the flag guard: ${s.text.split('\n')[0].slice(0, 60)}`, lineOf(scss, s.index));
  }

  for (const m of scss.matchAll(/#[0-9a-fA-F]{3,8}\b|(?:hsla?|rgba?|oklch|lab|lch)\((?!\s*from\b)/g)) {
    if (fileAllow.has('color-literal')) break;
    const line = lineOf(scss, m.index!);
    if (allowed(line)) continue;
    // `#{...}` interpolation and `#` inside url() are not colours.
    if (m[0].startsWith('#') && scss[m.index! + 1] === '{') continue;
    const before = scss.slice(Math.max(0, m.index! - 40), m.index!);
    if (/url\([^)]*$/.test(before)) continue;
    report(pkg, 'color-literal', 'error', file, `colour literal "${m[0]}"; use a palette token`, line);
  }

  const localDefined = declaredVars(scss);
  for (const { name, index } of usedVars(scss)) {
    if (localDefined.has(name) || globalDefined.has(name)) continue;
    const line = lineOf(scss, index);
    if (allowed(line)) continue;
    report(pkg, 'undefined-var', 'error', file, `"var(${name})" is never defined`, line);
  }

  for (const bad of BAD_COLOR_CLASSES) {
    for (const m of scss.matchAll(new RegExp(`\\.${bad}(?![a-zA-Z0-9_-])`, 'g'))) {
      const line = lineOf(scss, m.index!);
      if (allowed(line)) continue;
      report(pkg, 'color-class', 'error', file, `".${bad}" is not a ship colour; use ${bad === 'danger' ? 'error' : bad === 'warning' ? 'warn' : 'primary'}`, line);
    }
  }

  for (const m of scss.matchAll(/(?<![\w.-])(\d+(?:\.\d+)?)px\b/g)) {
    const n = Number(m[1]);
    if (n <= 2) continue;
    const line = lineOf(scss, m.index!);
    if (allowed(line)) continue;
    report(pkg, 'px-literal', 'warn', file, `"${m[0]}"; use p2r()`, line);
  }
}

function lintTs(pkg: string, file: string) {
  const src = readFileSync(file, 'utf8');
  const name = basename(file);
  if (name.endsWith('.spec.ts')) return;
  if (/\.module\.ts$/.test(name)) report(pkg, 'module-file', 'warn', file, 'NgModule files are not used');
  if (/^sh-/.test(name)) report(pkg, 'file-naming', 'warn', file, 'file prefix must be `ship-`');
  if (/\.(component|directive)\.ts$/.test(name)) report(pkg, 'file-naming', 'warn', file, 'drop the `.component`/`.directive` suffix');

  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);
  const lineAt = (node: ts.Node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

  const visit = (node: ts.Node) => {
    if (ts.isClassDeclaration(node)) {
      for (const dec of ts.getDecorators(node) ?? []) {
        if (!ts.isCallExpression(dec.expression) || !ts.isIdentifier(dec.expression.expression)) continue;
        const kind = dec.expression.expression.text;
        const meta = dec.expression.arguments[0];
        const obj = meta && ts.isObjectLiteralExpression(meta) ? meta : undefined;
        const prop = (n: string) =>
          obj?.properties.find((p) => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === n) as
            | ts.PropertyAssignment
            | undefined;
        if (kind === 'Component' || kind === 'Directive') {
          const standalone = prop('standalone');
          if (standalone && standalone.initializer.kind === ts.SyntaxKind.TrueKeyword)
            report(pkg, 'standalone-flag', 'warn', file, `${node.name?.text}: drop "standalone: true" (default)`, lineAt(standalone));
        }
        if (kind === 'Component') {
          const enc = prop('encapsulation');
          if (!enc || !/ViewEncapsulation\.None/.test(enc.initializer.getText(sf)))
            report(pkg, 'encapsulation', 'warn', file, `${node.name?.text}: needs "encapsulation: ViewEncapsulation.None"`, lineAt(node));
          const cd = prop('changeDetection');
          if (!cd || !/OnPush/.test(cd.initializer.getText(sf)))
            report(pkg, 'onpush', 'warn', file, `${node.name?.text}: needs "changeDetection: ChangeDetectionStrategy.OnPush"`, lineAt(node));
        }
      }
      for (const member of node.members) {
        for (const dec of ts.getDecorators(member) ?? []) {
          const text = dec.expression.getText(sf);
          if (/^HostListener\(/.test(text)) report(pkg, 'host-listener', 'warn', file, 'use the `host` metadata object', lineAt(dec));
          if (/^(Input|Output|ViewChild|ViewChildren|ContentChild|ContentChildren)\(/.test(text))
            report(pkg, 'decorator-api', 'warn', file, `"@${text.split('(')[0]}" → signal API`, lineAt(dec));
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  for (const m of src.matchAll(/Math\.random\(\)/g)) {
    const line = lineOf(src, m.index!);
    if (ALLOW.test(src.split('\n')[line - 1] ?? '')) continue;
    report(pkg, 'random-id', 'warn', file, 'use generateUniqueId()', line);
  }
}

// ---------------------------------------------------------------------------------------------

const pascal = (s: string) => s.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());

for (const pkg of packages) {
  const dir = join(LIB, pkg);
  const files = walk(dir);
  const flagName = 'ship' + pascal(pkg.replace(/^(ship|sh)-/, ''));
  for (const f of files) {
    if (f.endsWith('.scss')) lintScss(pkg, f, flagName);
    else if (f.endsWith('.ts')) lintTs(pkg, f);
  }
}

// ---------------------------------------------------------------------------------------------
// the global stylesheet must compile: catches a skin registered without its @use, a bad flag map, etc.
{
  const entry = join(STYLES, 'index.scss');
  const r = spawnSync(join(ROOT, 'node_modules/.bin/sass'), ['--load-path=' + STYLES, '--no-source-map', '--quiet', entry], { encoding: 'utf8' });
  if (r.status !== 0) {
    const msg = (r.stderr || r.stdout || '').split('\n').find((l) => l.trim()) ?? 'sass failed';
    report('styles', 'stylesheet-compile', 'error', entry, msg.trim());
  }
}

// ---------------------------------------------------------------------------------------------
// output

const errors = findings.filter((f) => f.level === 'error');
const warns = findings.filter((f) => f.level === 'warn');

if (JSON_OUT) {
  console.log(JSON.stringify({ errors, warnings: warns }, null, 2));
} else {
  const byPkg = new Map<string, { e: number; w: number }>();
  for (const p of packages) byPkg.set(p, { e: 0, w: 0 });
  for (const f of findings) {
    const c = byPkg.get(f.pkg)!;
    if (f.level === 'error') c.e++;
    else c.w++;
  }
  const width = Math.max(...packages.map((p) => p.length));
  console.log(`${'package'.padEnd(width)}  errors  warnings`);
  for (const [p, c] of byPkg) if (c.e || (SHOW_WARNINGS && c.w)) console.log(`${p.padEnd(width)}  ${String(c.e).padStart(6)}  ${String(c.w).padStart(8)}`);
  console.log();
  const shown = SHOW_WARNINGS ? findings : errors;
  const byRule = new Map<string, number>();
  for (const f of shown) byRule.set(f.rule, (byRule.get(f.rule) ?? 0) + 1);
  for (const f of shown.sort((a, b) => a.pkg.localeCompare(b.pkg) || a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0))) {
    console.log(`${f.level === 'error' ? '✗' : '!'} ${f.file}${f.line ? ':' + f.line : ''}  [${f.rule}] ${f.msg}`);
  }
  console.log();
  console.log(`${errors.length} errors, ${warns.length} warnings · by rule: ${[...byRule].map(([r, n]) => `${r}=${n}`).join(' ')}`);
}
process.exit(errors.length ? 1 : 0);

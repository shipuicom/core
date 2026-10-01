/**
 * Checks the latest ship-migrate rules against what actually changed between a released ref and the working tree.
 *
 *   bun run lint:migration                 # from the latest v* tag
 *   bun run lint:migration --from 0.25.12  # from a specific ref (tag, commit, branch)
 *
 * Two directions:
 *   rules → reality: every `from` must have existed at the release and every `to` must exist now, so a rule can only
 *                    ever rewrite names consumers really have (15 rules once renamed Sass flags that never shipped);
 *   reality → rules: every consumer-visible removal (element selector, input, exported identifier, host-level CSS
 *                    custom property, configurable Sass flag) must be covered by a rule or named in MIGRATION.md.
 * Exit 1 on any error.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { MIGRATIONS } from '../projects/ship-ui/bin/ship-migrate';

const ROOT = join(import.meta.dir, '..');
const LIB = 'projects/ship-ui';
const args = process.argv.slice(2);
const argOf = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const git = (...a: string[]) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/**
 * The previous release: the newest commit titled with a bare version, skipping HEAD itself (at publish time HEAD is
 * the new bump, and consumers are on the one before it).
 */
function lastRelease(): string {
  const headSha = git('rev-parse', 'HEAD').trim();
  for (const line of git('log', '--format=%H %s', '-500').split('\n')) {
    const [sha, subject] = [line.slice(0, 40), line.slice(41).trim()];
    if (sha !== headSha && /^\d+\.\d+\.\d+$/.test(subject)) return `${sha.slice(0, 8)} (${subject})`;
  }
  return git('describe', '--tags', '--abbrev=0').trim();
}
const FROM_ARG = argOf('--from') ?? lastRelease();
const FROM = FROM_ARG.split(' ')[0]!;
const rules = MIGRATIONS[MIGRATIONS.length - 1];
const migrationDoc = readFileSync(join(ROOT, LIB, 'MIGRATION.md'), 'utf8');

// ---------------------------------------------------------------------------------------------
// inventories

interface Inventory {
  selectors: Set<string>;
  /** selector → input names */
  inputs: Map<string, Set<string>>;
  exported: Set<string>;
  /** Tokens declared (`--x:`) or read (`var(--x)`) anywhere: what a rule's `from` may name. */
  cssVars: Set<string>;
  /** Tokens declared somewhere: the ones whose disappearance consumers can notice. */
  declared: Set<string>;
  flags: Set<string>;
}

const isLibSource = (p: string) =>
  p.startsWith(LIB + '/') && !p.includes('/bin/') && !p.includes('/node_modules/') && !/\.spec\.ts$/.test(p) && /\.(ts|scss|html)$/.test(p);

/** Custom properties a TS/HTML file sets at runtime (`setProperty('--x'`, `[style.--x]`, `--x: ${…}`, `style="--x:"`). */
function runtimeVars(src: string, into: Set<string>) {
  for (const m of src.matchAll(/setProperty\(\s*["'`](--[a-z0-9-]+)/gi)) into.add(m[1]!.toLowerCase());
  for (const m of src.matchAll(/\[style\.(--[a-z0-9-]+)(?:\.[a-z%]+)?\]/gi)) into.add(m[1]!.toLowerCase());
  for (const m of src.matchAll(/(--[a-z0-9-]+)\s*:\s*\$\{/gi)) into.add(m[1]!.toLowerCase());
  for (const m of src.matchAll(/style="[^"]*(--[a-z0-9-]+)\s*:/gi)) into.add(m[1]!.toLowerCase());
}

function inventory(read: (path: string) => string, paths: string[]): Inventory {
  const inv: Inventory = { selectors: new Set(), inputs: new Map(), exported: new Set(), cssVars: new Set(), declared: new Set(), flags: new Set() };
  for (const p of paths) {
    const src = read(p);
    if (p.endsWith('.ts')) {
      // One component per `@Component({ selector })` block: attribute the inputs that follow it until the next decorator.
      const blocks = src.split(/(?=@(?:Component|Directive)\()/);
      for (const block of blocks) {
        const sel = block.match(/selector:\s*['"`]([^'"`]+)['"`]/)?.[1];
        const names = sel ? sel.split(',').map((s) => s.trim().replace(/^\[|\]$/g, '')) : [];
        for (const n of names) inv.selectors.add(n);
        const found = new Set<string>();
        for (const m of block.matchAll(/^\s+(\w+)\s*=\s*(?:input|model)(?:\.required)?[<(]/gm)) found.add(m[1]!);
        for (const m of block.matchAll(/@Input\([^)]*\)\s*(?:set\s+)?(\w+)/g)) found.add(m[1]!);
        for (const n of names) {
          const set = inv.inputs.get(n) ?? new Set();
          for (const f of found) set.add(f);
          inv.inputs.set(n, set);
        }
      }
      for (const m of src.matchAll(/^export\s+(?:abstract\s+)?(?:class|function|const|let|type|interface|enum)\s+(\w+)/gm)) inv.exported.add(m[1]!);
    }
    if (p.endsWith('.ts') || p.endsWith('.html')) {
      runtimeVars(src, inv.cssVars);
      runtimeVars(src, inv.declared);
    }
    if (p.endsWith('.scss')) {
      const clean = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      for (const m of clean.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
        inv.cssVars.add(m[1]!.toLowerCase());
        inv.declared.add(m[1]!.toLowerCase());
      }
      // `var(--x, fallback)` with no declaration is still a public override point.
      for (const m of clean.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) inv.cssVars.add(m[1]!.toLowerCase());
      if (p === `${LIB}/styles/index.scss`) for (const m of clean.matchAll(/^\$([A-Za-z0-9_]+)\s*:[^;]*!default/gm)) inv.flags.add('$' + m[1]!);
    }
  }
  return inv;
}

const prevPaths = git('ls-tree', '-r', '--name-only', FROM, '--', LIB).split('\n').filter(isLibSource);
const prev = inventory((p) => git('show', `${FROM}:${p}`), prevPaths);

const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};
const headPaths = walk(join(ROOT, LIB)).map((p) => relative(ROOT, p)).filter(isLibSource);
const head = inventory((p) => readFileSync(join(ROOT, p), 'utf8'), headPaths);
// Palette steps and the like are generated by Sass loops now, so the compiled global sheet is the source of truth.
{
  const r = spawnSync(join(ROOT, 'node_modules/.bin/sass'), ['--load-path=' + join(ROOT, LIB, 'styles'), '--no-source-map', '--quiet', join(ROOT, LIB, 'styles/index.scss')], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) {
    console.error(`sass failed on ${LIB}/styles/index.scss:\n${r.stderr}`);
    process.exit(2);
  }
  for (const m of r.stdout.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
    head.cssVars.add(m[1]!.toLowerCase());
    head.declared.add(m[1]!.toLowerCase());
  }
  for (const m of r.stdout.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) head.cssVars.add(m[1]!.toLowerCase());
}

/** A token's name as it was before the prefix renames (`--crumb-p` was `--breadcrumbs-p`), so chained rules validate. */
const beforePrefixes = (v: string) => {
  for (const { from, to } of rules.cssVarPrefixes ?? []) if (v.startsWith(to)) return from + v.slice(to.length);
  return v;
};
const existedBefore = (v: string) => prev.cssVars.has(v) || prev.cssVars.has(beforePrefixes(v));

// ---------------------------------------------------------------------------------------------
// checks

const errors: string[] = [];
const err = (s: string) => errors.push(s);
const documented = (name: string) => migrationDoc.includes(name);
const warnedBy = (patterns: Array<{ pattern: string }> | undefined, name: string) =>
  (patterns ?? []).some((w) => new RegExp(w.pattern).test(name));

// rules → reality
for (const { from, to } of rules.selectors ?? []) {
  if (!prev.selectors.has(from)) err(`selectors: "${from}" was not a selector at ${FROM}`);
  if (!head.selectors.has(to)) err(`selectors: "${to}" is not a selector now`);
}
for (const { tag, input } of rules.removedInputs ?? []) {
  if (!prev.inputs.get(tag)?.has(input)) err(`removedInputs: <${tag} ${input}> did not exist at ${FROM}`);
  if (head.inputs.get(tag)?.has(input)) err(`removedInputs: <${tag} ${input}> still exists now`);
}
for (const { from, to } of rules.cssVars ?? []) {
  if (!existedBefore(from)) err(`cssVars: ${from} did not exist at ${FROM}`);
  if (head.cssVars.has(from)) err(`cssVars: ${from} is still declared now (renaming it would break a live token)`);
  if (!head.cssVars.has(to)) err(`cssVars: ${to} is not declared now`);
}
for (const { from, to } of rules.cssVarPrefixes ?? []) {
  if (![...prev.cssVars].some((v) => v.startsWith(from))) err(`cssVarPrefixes: no ${from}* token existed at ${FROM}`);
  if ([...head.cssVars].some((v) => v.startsWith(from))) err(`cssVarPrefixes: ${from}* tokens still exist now`);
  if (![...head.cssVars].some((v) => v.startsWith(to))) err(`cssVarPrefixes: no ${to}* token exists now`);
}
for (const { from, to } of rules.sassFlags ?? []) {
  if (!prev.flags.has(from)) err(`sassFlags: ${from} was not a configurable flag (styles/index.scss) at ${FROM}`);
  if (!head.flags.has(to)) err(`sassFlags: ${to} is not a configurable flag now`);
}
for (const { pattern, message } of rules.styleWarnings ?? []) {
  const token = pattern.match(/^(--[a-z0-9-]+)/)?.[1];
  if (!token) continue;
  if (!existedBefore(token)) err(`styleWarnings: ${token} did not exist at ${FROM} ("${message}")`);
  if (head.cssVars.has(token)) err(`styleWarnings: ${token} is still declared now, the warning is misleading`);
}
for (const { from, to } of rules.identifiers ?? []) {
  if (!prev.exported.has(from)) err(`identifiers: ${from} was not exported at ${FROM}`);
  if (!head.exported.has(to)) err(`identifiers: ${to} is not exported now`);
}

// reality → rules
const selectorRules = new Set((rules.selectors ?? []).map((r) => r.from));
for (const s of prev.selectors) {
  if (head.selectors.has(s) || selectorRules.has(s) || documented(s)) continue;
  err(`removed selector "${s}" has no selectors rule and is not in MIGRATION.md`);
}
const removedInputRules = new Set((rules.removedInputs ?? []).map((r) => `${r.tag} ${r.input}`));
for (const [sel, inputs] of prev.inputs) {
  if (!head.selectors.has(sel)) continue;
  for (const i of inputs) {
    if (head.inputs.get(sel)?.has(i) || removedInputRules.has(`${sel} ${i}`) || documented(i)) continue;
    err(`<${sel}> lost input "${i}" with no removedInputs rule and no MIGRATION.md mention`);
  }
}
const identifierRules = new Set((rules.identifiers ?? []).map((r) => r.from));
for (const name of prev.exported) {
  if (head.exported.has(name) || identifierRules.has(name) || warnedBy(rules.tsWarnings, name) || documented(name)) continue;
  err(`exported "${name}" is gone with no identifiers rule, tsWarning or MIGRATION.md mention`);
}
const varCovered = (v: string) =>
  (rules.cssVars ?? []).some((r) => r.from === v) ||
  (rules.cssVarPrefixes ?? []).some((r) => v.startsWith(r.from)) ||
  warnedBy(rules.styleWarnings, v) ||
  documented(v);
for (const v of prev.declared) {
  if (head.cssVars.has(v) || varCovered(v)) continue;
  err(`token ${v} is no longer declared and has no cssVars/cssVarPrefixes/styleWarnings rule or MIGRATION.md mention`);
}
const flagRules = new Set((rules.sassFlags ?? []).map((r) => r.from));
for (const f of prev.flags) {
  if (head.flags.has(f) || flagRules.has(f) || documented(f)) continue;
  err(`flag ${f} is no longer configurable and has no sassFlags rule or MIGRATION.md mention`);
}

// ---------------------------------------------------------------------------------------------

console.log(`ship-migrate ${rules.version} checked against ${FROM_ARG} → working tree`);
console.log(
  `  ${prev.selectors.size}→${head.selectors.size} selectors, ${prev.exported.size}→${head.exported.size} exports, ` +
    `${prev.cssVars.size}→${head.cssVars.size} tokens, ${prev.flags.size}→${head.flags.size} flags`,
);
for (const e of errors) console.log(`✗ ${e}`);
console.log(errors.length ? `${errors.length} errors` : 'rules and MIGRATION.md cover every change');
process.exit(errors.length ? 1 : 0);

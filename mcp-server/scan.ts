import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const rootPath = path.join(__dirname, '..');
const SHIP_UI = path.join(rootPath, 'projects/ship-ui');
const STYLES_PATH = path.join(SHIP_UI, 'styles/components');
const EXAMPLES_PATH = path.join(rootPath, 'projects/design-system/src/app/ship');
const TYPES_FILE = path.join(SHIP_UI, 'src/lib/utilities/ship-types.ts');
const VARIABLES_FILE = path.join(SHIP_UI, 'styles/core/core/variables.scss');
const SHEET_FILE = path.join(STYLES_PATH, 'ship-sheet.utility.scss');

const DEFAULT_OUTPUT = path.join(SHIP_UI, 'assets/mcp/components.json');
const LOCAL_OUTPUT = path.join(__dirname, 'components.json');
const DEFAULT_SNIPPETS = path.join(rootPath, '.vscode/ship-ui-components.code-snippets');

const OUTPUT_FILE = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_OUTPUT;
const SNIPPETS_FILE = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_SNIPPETS;

if (!fs.existsSync(path.dirname(OUTPUT_FILE))) fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
if (!fs.existsSync(path.dirname(SNIPPETS_FILE))) fs.mkdirSync(path.dirname(SNIPPETS_FILE), { recursive: true });

interface Input {
  name: string;
  type: string;
  description?: string;
  defaultValue?: string;
  options?: string[];
  twoWay?: boolean;
}
interface ComponentData {
  name: string;
  selector: string;
  selectorAliases?: string[];
  package?: string;
  kind: 'component' | 'directive' | 'service';
  path: string;
  description?: string;
  keywords?: string[];
  inputs: Input[];
  outputs: { name: string; type: string; description?: string }[];
  methods: { name: string; parameters: string; returnType: string; description?: string }[];
  cssVariables: { name: string; defaultValue?: string; description?: string }[];
  examples: { name: string; html: string; ts: string }[];
}
interface Snippet {
  prefix: string;
  body: string[];
  description?: string;
}

const LIFECYCLE = new Set([
  'constructor',
  'ngOnInit',
  'ngOnDestroy',
  'ngOnChanges',
  'ngAfterViewInit',
  'ngAfterViewChecked',
  'ngAfterContentInit',
  'ngAfterContentChecked',
  'ngDoCheck',
]);
// ControlValueAccessor plumbing — public by contract but never called by consumers.
const CVA = new Set(['writeValue', 'registerOnChange', 'registerOnTouched', 'setDisabledState']);

// Exported-but-internal classes: the editor's auto-rendered overlays and its
// engine/selection services. Consumers never instantiate these directly, so
// they are excluded from the documented API surface.
const INTERNAL = new Set([
  'ShipEditorContextualToolbar',
  'ShipEditorImagePopover',
  'ShipEditorImageResize',
  'ShipEditorLinkPopover',
  'ShipEditorSlashMenu',
  'EditorEngineService',
  'EditorSelectionService',
]);

// Public-but-internal helper methods that carry no detectable signal (they take
// primitive/DOM args, aren't wired into a template, and some are exercised by
// unit tests so can't be made private). Excluded from the documented API.
const INTERNAL_METHODS: Record<string, Set<string>> = {
  ShipSortable: new Set([
    'getIndexOfElement',
    'processDragEnter',
    'processDragLeave',
    'processDragOver',
    'cancelTouchDrag',
    'getVisualIndexOfElement',
    'dragEnd',
  ]),
  ShipBlueprint: new Set(['endNodeDrag', 'endPan']),
  ShipAlertContainer: new Set(['getElementHeight', 'transformY']),
};

// --- Known union types (for input options) --------------------------------

function parseKnownTypes(): Record<string, string[]> {
  const types: Record<string, string[]> = {};
  if (!fs.existsSync(TYPES_FILE)) return types;
  const content = fs.readFileSync(TYPES_FILE, 'utf-8');

  const arrayMap: Record<string, string[]> = {};
  for (const m of content.matchAll(/export const (__SHIP_[A-Z_]+)\s*=\s*\[([\s\S]*?)\]\s*as\s*const;/g)) {
    // Keep intentional empty-string members (e.g. the "" default variant).
    arrayMap[m[1]!] = m[2]!
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .map((v) => v.replace(/^['"]|['"]$/g, ''));
  }
  for (const m of content.matchAll(/export type (\w+)\s*=\s*([\s\S]*?);/g)) {
    const name = m[1]!;
    const def = m[2]!;
    const typeofMatch = def.match(/typeof (__SHIP_[A-Z_]+)\)?\s*\[number\]/);
    if (typeofMatch && arrayMap[typeofMatch[1]!]) {
      types[name] = arrayMap[typeofMatch[1]!]!;
    } else {
      const values = def
        .split('|')
        .map((v) => v.trim())
        .filter((v) => v.startsWith("'") || v.startsWith('"'))
        .map((v) => v.replace(/['"]/g, ''));
      if (values.length > 0) types[name] = values;
    }
  }
  return types;
}

function optionsFor(typeText: string | undefined, known: Record<string, string[]>): string[] | undefined {
  if (!typeText) return undefined;
  for (const part of typeText.split('|').map((s) => s.trim())) {
    const base = part.replace(/\[\]$/, '').trim();
    if (known[base]) return known[base];
  }
  if (typeText.includes('|')) {
    const lits = [...typeText.matchAll(/'([^']*)'|"([^"]*)"/g)].map((m) => m[1] ?? m[2] ?? '');
    if (lits.length > 0) return lits;
  }
  return undefined;
}

// --- CSS variables --------------------------------------------------------

function scssVars(file: string): ComponentData['cssVariables'] {
  const out: ComponentData['cssVariables'] = [];
  if (!fs.existsSync(file)) return out;
  const content = fs.readFileSync(file, 'utf-8');
  for (const m of content.matchAll(/(--[\w-]+):\s*([^;!]+)/g)) {
    if (m[1] && !out.some((v) => v.name === m[1])) out.push({ name: m[1], defaultValue: m[2]?.trim() });
  }
  return out;
}

// --- AST helpers ----------------------------------------------------------

const sk = ts.SyntaxKind;

function decoratorCall(node: ts.Node, names: string[]): ts.CallExpression | undefined {
  if (!ts.canHaveDecorators(node)) return undefined;
  for (const dec of ts.getDecorators(node as ts.HasDecorators) ?? []) {
    const e = dec.expression;
    if (ts.isCallExpression(e) && ts.isIdentifier(e.expression) && names.includes(e.expression.text)) return e;
    if (ts.isIdentifier(e) && names.includes(e.text)) return undefined; // bare decorator, no meta
  }
  return undefined;
}
function hasDecorator(node: ts.Node, names: string[]): boolean {
  if (!ts.canHaveDecorators(node)) return false;
  for (const dec of ts.getDecorators(node as ts.HasDecorators) ?? []) {
    const e = dec.expression;
    const id = ts.isCallExpression(e) ? e.expression : e;
    if (ts.isIdentifier(id) && names.includes(id.text)) return true;
  }
  return false;
}
function hasModifier(node: ts.Node, kinds: ts.SyntaxKind[]): boolean {
  const mods = ts.canHaveModifiers(node) ? ts.getModifiers(node as ts.HasModifiers) : undefined;
  return !!mods?.some((m) => kinds.includes(m.kind));
}
function metaProp(obj: ts.ObjectLiteralExpression | undefined, name: string): ts.Expression | undefined {
  if (!obj) return undefined;
  for (const p of obj.properties) {
    if (ts.isPropertyAssignment(p) && p.name.getText() === name) return p.initializer;
  }
  return undefined;
}
function litText(node: ts.Expression | undefined): string | undefined {
  if (!node) return undefined;
  if (ts.isStringLiteralLike(node)) return node.text;
  return undefined;
}
function jsdoc(node: ts.Node): string {
  const parts = ts.getJSDocCommentsAndTags(node);
  for (const p of parts) {
    if (ts.isJSDoc(p) && p.comment) return typeof p.comment === 'string' ? p.comment.trim() : '';
  }
  return '';
}

// Collect method names referenced as event-handlers in a `host` metadata object.
function hostHandlers(hostObj: ts.Expression | undefined): Set<string> {
  const out = new Set<string>();
  if (!hostObj || !ts.isObjectLiteralExpression(hostObj)) return out;
  for (const p of hostObj.properties) {
    if (!ts.isPropertyAssignment(p)) continue;
    const key = p.name.getText().replace(/['"]/g, '');
    if (/^\(.*\)$/.test(key) || key.startsWith('@')) {
      const val = litText(p.initializer) ?? '';
      for (const m of val.matchAll(/(\w+)\s*\(/g)) out.add(m[1]!);
    }
  }
  return out;
}
// Collect every method name invoked anywhere in an Angular template — event
// handlers ((click)="x()"), property bindings ([style]="y()") and interpolations
// ({{ z() }}). A method wired into the view is internal glue, not public API.
function templateHandlers(html: string): Set<string> {
  const out = new Set<string>();
  for (const m of html.matchAll(/(\w+)\s*\(/g)) out.add(m[1]!);
  return out;
}

function inferType(arg: ts.Expression | undefined): string {
  if (!arg) return 'unknown';
  switch (arg.kind) {
    case sk.TrueKeyword:
    case sk.FalseKeyword:
      return 'boolean';
    case sk.NumericLiteral:
      return 'number';
    case sk.StringLiteral:
    case sk.NoSubstitutionTemplateLiteral:
      return 'string';
    case sk.ArrayLiteralExpression:
      return 'any[]';
    case sk.NullKeyword:
      return 'any';
    case sk.ObjectLiteralExpression:
      return 'object';
  }
  return 'unknown';
}

// Resolve every .ts file reachable from an entry-point public-api.ts by
// following `export ... from './rel'` chains. This is the public-API boundary.
function publicFiles(entryDir: string): string[] {
  const start = path.join(entryDir, 'public-api.ts');
  if (!fs.existsSync(start)) return [];
  const seen = new Set<string>();
  const files: string[] = [];
  const queue = [start];
  while (queue.length) {
    const file = queue.shift()!;
    if (seen.has(file) || !fs.existsSync(file)) continue;
    seen.add(file);
    const src = fs.readFileSync(file, 'utf-8');
    let hasClass = false;
    for (const m of src.matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)) {
      const rel = m[1]!;
      const cand = [rel + '.ts', path.join(rel, 'index.ts'), rel];
      for (const c of cand) {
        const abs = path.resolve(path.dirname(file), c);
        if (fs.existsSync(abs) && abs.endsWith('.ts')) {
          queue.push(abs);
          break;
        }
      }
    }
    if (/@(Component|Directive|Injectable)\b/.test(src)) hasClass = true;
    if (hasClass && file !== start) files.push(file);
  }
  return files;
}

// --- Per-class extraction -------------------------------------------------

function extractClass(
  cls: ts.ClassDeclaration,
  sf: ts.SourceFile,
  filePath: string,
  entryDir: string,
  known: Record<string, string[]>
): ComponentData | null {
  const name = cls.name?.text;
  if (!name || INTERNAL.has(name)) return null;

  const comp = decoratorCall(cls, ['Component']);
  const dir = decoratorCall(cls, ['Directive']);
  const inj = decoratorCall(cls, ['Injectable']);
  const kind: ComponentData['kind'] = comp ? 'component' : dir ? 'directive' : inj ? 'service' : 'component';
  const decoCall = comp ?? dir ?? inj;
  if (!comp && !dir && !inj) return null;

  const meta =
    decoCall && decoCall.arguments[0] && ts.isObjectLiteralExpression(decoCall.arguments[0])
      ? (decoCall.arguments[0] as ts.ObjectLiteralExpression)
      : undefined;

  let selectorRaw = litText(metaProp(meta, 'selector'));
  if (!selectorRaw && inj) {
    selectorRaw = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
  if (!selectorRaw) return null;
  const selectorTokens = selectorRaw.split(',').map((s) => s.trim()).filter(Boolean);
  const selector = selectorTokens[0]!;
  const selectorAliases = selectorTokens.slice(1);

  // Event-handler names to exclude from the public method list.
  const excludedHandlers = hostHandlers(metaProp(meta, 'host'));
  const inlineTemplate = litText(metaProp(meta, 'template'));
  const templateUrl = litText(metaProp(meta, 'templateUrl'));
  let templateHtml = inlineTemplate ?? '';
  if (templateUrl) {
    const tp = path.resolve(path.dirname(filePath), templateUrl);
    if (fs.existsSync(tp)) templateHtml = fs.readFileSync(tp, 'utf-8');
  }
  for (const h of templateHandlers(templateHtml)) excludedHandlers.add(h);

  const inputs: Input[] = [];
  const outputs: ComponentData['outputs'] = [];
  const methods: ComponentData['methods'] = [];

  for (const member of cls.members) {
    // Signal input / model / output
    if (ts.isPropertyDeclaration(member) && member.initializer && ts.isCallExpression(member.initializer)) {
      const call = member.initializer;
      const callee = call.expression.getText(sf); // 'input', 'input.required', 'model', 'output', ...
      const memberName = member.name.getText(sf);
      const isInput = callee === 'input' || callee === 'input.required';
      const isModel = callee === 'model' || callee === 'model.required';
      const isOutput = callee === 'output';
      const required = callee.endsWith('.required');

      if (isInput || isModel || isOutput) {
        const typeArg = call.typeArguments?.[0]?.getText(sf);
        // find alias in any object-literal arg
        let alias: string | undefined;
        for (const a of call.arguments) {
          if (ts.isObjectLiteralExpression(a)) {
            const al = litText(metaProp(a, 'alias'));
            if (al) alias = al;
          }
        }
        if (isOutput) {
          outputs.push({ name: alias ?? memberName, type: typeArg ?? 'void', description: jsdoc(member) });
          continue;
        }
        // default: first arg unless it's the (only) options object of a required signal
        let defaultValue: string | undefined;
        const first = call.arguments[0];
        if (first && !(required && ts.isObjectLiteralExpression(first))) {
          defaultValue = first.getText(sf);
        }
        const type = typeArg ?? inferType(first);
        inputs.push({
          name: alias ?? memberName,
          type,
          description: jsdoc(member),
          defaultValue,
          options: optionsFor(typeArg, known),
          twoWay: isModel || undefined,
        });
        continue;
      }
    }

    // Traditional @Input()/@Output()
    if ((ts.isPropertyDeclaration(member) || ts.isGetAccessor(member) || ts.isSetAccessor(member))) {
      if (hasDecorator(member, ['Input'])) {
        const type = member.type?.getText(sf) ?? 'any';
        inputs.push({
          name: member.name.getText(sf),
          type,
          description: jsdoc(member),
          options: optionsFor(type, known),
        });
        continue;
      }
      if (hasDecorator(member, ['Output'])) {
        outputs.push({ name: member.name.getText(sf), type: 'any', description: jsdoc(member) });
        continue;
      }
    }

    // Public methods (consumer-facing only)
    if (ts.isMethodDeclaration(member)) {
      if (ts.isPrivateIdentifier(member.name)) continue;
      if (hasModifier(member, [sk.PrivateKeyword, sk.ProtectedKeyword])) continue;
      const mName = member.name.getText(sf);
      if (LIFECYCLE.has(mName) || CVA.has(mName)) continue;
      if (INTERNAL_METHODS[name]?.has(mName)) continue;
      if (hasDecorator(member, ['HostListener'])) continue;
      if (excludedHandlers.has(mName)) continue;
      // DOM event handlers / canvas-render helpers are internal wiring, not API.
      const firstParamType = member.parameters[0]?.type?.getText(sf) ?? '';
      if (/Event|Touch|CanvasRenderingContext2D/.test(firstParamType)) continue;
      const params = member.parameters.map((p) => p.getText(sf)).join(', ');
      methods.push({
        name: mName,
        parameters: params,
        returnType: member.type?.getText(sf) ?? 'void',
        description: jsdoc(member),
      });
    }
  }

  // Dedupe by name, preferring a variant that carries a description. Overloaded
  // methods appear multiple times (signatures + implementation) and the JSDoc
  // lives on the first signature — keep it rather than the undocumented impl.
  const dedupe = <T extends { name: string; description?: string }>(arr: T[]) => {
    const map = new Map<string, T>();
    for (const x of arr) {
      const prev = map.get(x.name);
      if (!prev || (!prev.description?.trim() && x.description?.trim())) map.set(x.name, x);
    }
    return Array.from(map.values());
  };

  // CSS variables from declared styleUrl(s) + the styles/components mapping.
  const cssVariables: ComponentData['cssVariables'] = [];
  const addVars = (file: string) => {
    for (const v of scssVars(file)) if (!cssVariables.some((x) => x.name === v.name)) cssVariables.push(v);
  };
  const styleUrl = litText(metaProp(meta, 'styleUrl'));
  if (styleUrl) addVars(path.resolve(path.dirname(filePath), styleUrl));
  const styleUrlsNode = metaProp(meta, 'styleUrls');
  if (styleUrlsNode && ts.isArrayLiteralExpression(styleUrlsNode)) {
    for (const el of styleUrlsNode.elements) {
      const u = litText(el);
      if (u) addVars(path.resolve(path.dirname(filePath), u));
    }
  }
  // Legacy mapping for components whose vars live in styles/components/.
  const mappedScss = selector.replace(/^\[?sh-?/, 'ship-').replace(/\]$/, '') + '.scss';
  addVars(path.join(STYLES_PATH, mappedScss));

  return {
    name,
    selector,
    selectorAliases: selectorAliases.length ? selectorAliases : undefined,
    package: `@ship-ui/core/${path.basename(entryDir)}`,
    kind,
    path: path.relative(rootPath, filePath),
    inputs: dedupe(inputs),
    outputs: dedupe(outputs),
    methods: dedupe(methods),
    cssVariables,
    examples: [],
  };
}

// --- Docs (description / keywords / examples) -----------------------------

function attachDocs(comp: ComponentData, entryDir: string) {
  const base = path.basename(entryDir).replace(/^ship-/, '');
  const normalized = comp.selector
    .replace(/[\[\]]/g, '')
    .replace(/^sh-?/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
  // Only the entry's primary element gets the docs page (avoids duplicating
  // examples onto sibling directives / sub-components in the same file).
  if (normalized !== base && normalized !== base + 's') return;

  const terms = [base + 's', base];
  let docsDir = '';
  for (const t of terms) {
    const p = path.join(EXAMPLES_PATH, t);
    if (fs.existsSync(p)) {
      docsDir = p;
      break;
    }
  }
  if (!docsDir) return;

  const docFiles = fs.readdirSync(docsDir);
  const mainHtml = docFiles.find((f) => f.endsWith('.html') && !f.includes('example'));
  if (mainHtml) {
    const docContent = fs.readFileSync(path.join(docsDir, mainHtml), 'utf-8');
    const m = docContent.match(/<app-property-viewer>([\s\S]*?)<\/app-property-viewer>/);
    if (m?.[1]) {
      comp.description = m[1]
        .replace(/<section>/g, '')
        .replace(/<\/section>/g, '\n\n')
        .replace(/<h4>(.*?)<\/h4>/g, '### $1\n')
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n')
        .replace(/<code>(.*?)<\/code>/g, '`$1`')
        .replace(/<b>(.*?)<\/b>/g, '**$1**')
        .replace(/<li>(.*?)<\/li>/g, '- $1')
        .replace(/<ul>/g, '')
        .replace(/<\/ul>/g, '\n')
        .replace(/<br\s*\/?>/g, '\n')
        .split('\n')
        .map((l) => l.trim())
        .filter((l, i, arr) => l !== '' || (i > 0 && arr[i - 1] !== ''))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }
    const kw = docContent.match(/<!--\s*@keywords:?\s*(.*?)\s*-->/i);
    if (kw?.[1]) comp.keywords = kw[1].split(',').map((k) => k.trim()).filter(Boolean);
  }

  const exDir = path.join(docsDir, 'examples');
  if (fs.existsSync(exDir)) {
    for (const eDir of fs.readdirSync(exDir)) {
      const eDirPath = path.join(exDir, eDir);
      if (!fs.statSync(eDirPath).isDirectory()) continue;
      const eFiles = fs.readdirSync(eDirPath);
      const html = eFiles.find((f) => f.endsWith('.html'));
      const tsf = eFiles.find((f) => f.endsWith('.ts'));
      if (html && tsf) {
        comp.examples.push({
          name: eDir,
          html: fs.readFileSync(path.join(eDirPath, html), 'utf-8'),
          ts: fs.readFileSync(path.join(eDirPath, tsf), 'utf-8'),
        });
      }
    }
  }
}

// --- Snippets -------------------------------------------------------------

function buildSnippet(comp: ComponentData, snippets: Record<string, Snippet>) {
  const selector = comp.selector;
  const isAttribute = selector.startsWith('[');
  const selectorBase = selector.replace(/[\[\]]/g, '');
  const tag = isAttribute ? (selector === '[shButton]' ? 'button' : 'div') : selector;

  snippets[`${comp.name}: Basic`] = {
    prefix: selectorBase,
    body: isAttribute ? [`<${tag} ${selectorBase}>$0</${tag}>`] : [`<${selectorBase}>$0</${selectorBase}>`],
    description: `Basic usage of ${comp.name}`,
  };

  const commonInputs = comp.inputs.filter((i) => ['color', 'variant', 'size', 'readonly'].includes(i.name));
  if (commonInputs.length > 0) {
    const attrs = commonInputs
      .map((i, idx) =>
        i.options && i.options.length > 0
          ? `${i.name}="\${${idx + 1}|${i.options.filter(Boolean).join(',')}|}"`
          : `[${i.name}]="\${${idx + 1}:${i.defaultValue || "''"}}"`
      )
      .join(' ');
    snippets[`${comp.name}: With Options`] = {
      prefix: `${selectorBase}-full`,
      body: isAttribute
        ? [`<${tag} ${selectorBase} ${attrs}>`, '  $0', `</${tag}>`]
        : [`<${selectorBase} ${attrs}>`, '  $0', `</${selectorBase}>`],
      description: `Full usage of ${comp.name} with common options`,
    };
  }
}

// --- Main -----------------------------------------------------------------

function scan() {
  const known = parseKnownTypes();
  const components: ComponentData[] = [];
  const snippets: Record<string, Snippet> = {};

  const entryDirs = fs
    .readdirSync(SHIP_UI)
    .map((d) => path.join(SHIP_UI, d))
    .filter((p) => fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'public-api.ts')));

  for (const entryDir of entryDirs) {
    for (const file of publicFiles(entryDir)) {
      const src = fs.readFileSync(file, 'utf-8');
      const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);
      for (const stmt of sf.statements) {
        if (!ts.isClassDeclaration(stmt)) continue;
        const comp = extractClass(stmt, sf, file, entryDir, known);
        if (!comp) continue;
        attachDocs(comp, entryDir);
        buildSnippet(comp, snippets);
        components.push(comp);
      }
    }
  }

  components.sort((a, b) => a.selector.localeCompare(b.selector));

  components.push({
    name: 'GlobalVariables',
    selector: 'global-variables',
    kind: 'service',
    path: path.relative(rootPath, VARIABLES_FILE),
    description: 'Global CSS variables for ShipUI including colors, typography, and spacing.',
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: scssVars(VARIABLES_FILE),
    examples: [],
  });
  components.push({
    name: 'SheetVariables',
    selector: 'sheet-variables',
    kind: 'service',
    path: path.relative(rootPath, SHEET_FILE),
    description:
      'Common CSS variables for components using the "sh-sheet" class. These variables control background, border, and color scales for different variants.',
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: scssVars(SHEET_FILE),
    examples: [],
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(components, null, 2));
  if (OUTPUT_FILE !== LOCAL_OUTPUT) fs.writeFileSync(LOCAL_OUTPUT, JSON.stringify(components, null, 2));
  fs.writeFileSync(SNIPPETS_FILE, JSON.stringify(snippets, null, 2));
  console.log(`Scanned ${components.length} components (${entryDirs.length} entry points).`);
  console.log(`Generated metadata in ${OUTPUT_FILE}`);
  console.log(`Generated snippets in ${SNIPPETS_FILE}`);
}

scan();

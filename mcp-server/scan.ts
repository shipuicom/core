import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const rootPath = path.join(__dirname, '..');
const LIB_PATH = path.join(rootPath, 'projects/ship-ui/src/lib');
const STYLES_PATH = path.join(rootPath, 'projects/ship-ui/styles/components');
const EXAMPLES_PATH = path.join(rootPath, 'projects/design-system/src/app/ship');
const TYPES_FILE = path.join(rootPath, 'projects/ship-ui/src/lib/utilities/ship-types.ts');
const VARIABLES_FILE = path.join(rootPath, 'projects/ship-ui/styles/core/core/variables.scss');
const SHEET_FILE = path.join(rootPath, 'projects/ship-ui/styles/components/ship-sheet.utility.scss');

// Default outputs to the library project so they get bundled
const DEFAULT_OUTPUT = path.join(rootPath, 'projects/ship-ui/assets/mcp/components.json');
const LOCAL_OUTPUT = path.join(__dirname, 'components.json');
const DEFAULT_SNIPPETS = path.join(rootPath, 'projects/ship-ui/snippets/ship-ui.code-snippets');

const OUTPUT_FILE = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_OUTPUT;
const SNIPPETS_FILE = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_SNIPPETS;

// Ensure directories exist
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
if (!fs.existsSync(path.dirname(SNIPPETS_FILE))) fs.mkdirSync(path.dirname(SNIPPETS_FILE), { recursive: true });

interface ComponentData {
  name: string;
  selector: string;
  path: string;
  description?: string;
  inputs: { name: string; type: string; description?: string; defaultValue?: string; options?: string[] }[];
  outputs: { name: string; type: string; description?: string }[];
  methods: { name: string; parameters: string; returnType: string; description?: string }[];
  cssVariables: { name: string; defaultValue?: string; description?: string }[];
  examples: {
    name: string;
    html: string;
    ts: string;
  }[];
}

interface Snippet {
  prefix: string;
  body: string[];
  description?: string;
}

function getJsDoc(content: string, propertyName: string): string {
  const regex = new RegExp(`\\/\\*\\*([\\s\\S]*?)\\*\\/\\s*.*${propertyName}`, 'g');
  const match = regex.exec(content);
  if (match && match[1]) {
    return match[1]
      .split('\n')
      .map((line) => line.trim().replace(/^\*\s?/, ''))
      .filter((line) => line !== '')
      .join(' ');
  }
  return '';
}

function parseTypes() {
  const types: Record<string, string[]> = {};
  if (fs.existsSync(TYPES_FILE)) {
    const content = fs.readFileSync(TYPES_FILE, 'utf-8');
    const typeMatches = content.matchAll(/export type (\w+) = ([\s\S]*?);/g);
    for (const match of typeMatches) {
      const name = match[1];
      const definition = match[2];
      if (name && definition) {
        const values = definition
          .split('|')
          .map((v) => v.trim())
          .filter((v: string) => v.startsWith("'") || v.startsWith('"'))
          .map((v: string) => v.replace(/['"]/g, ''));
        types[name] = values;
      }
    }
  }
  return types;
}

function getOptions(type: string, knownTypes: Record<string, string[]>): string[] | undefined {
  const parts = type.split('|').map((p) => p.trim());
  for (const part of parts) {
    if (knownTypes[part]) {
      return knownTypes[part];
    }
  }
  return undefined;
}

function getGlobalVariables(): ComponentData['cssVariables'] {
  const variables: ComponentData['cssVariables'] = [];
  if (fs.existsSync(VARIABLES_FILE)) {
    const content = fs.readFileSync(VARIABLES_FILE, 'utf-8');
    const varMatches = content.matchAll(/^\s*(--[\w-]+):\s*([^;!]+)/gm);
    for (const match of varMatches) {
      if (match[1] && !variables.some((v) => v.name === match[1])) {
        variables.push({
          name: match[1],
          defaultValue: match[2]?.trim(),
        });
      }
    }
  }
  return variables;
}

function getSheetVariables(): ComponentData['cssVariables'] {
  const variables: ComponentData['cssVariables'] = [];
  if (fs.existsSync(SHEET_FILE)) {
    const content = fs.readFileSync(SHEET_FILE, 'utf-8');
    const varMatches = content.matchAll(/(--sheet-[\w-]+):\s*([^;!]+)/g);
    for (const match of varMatches) {
      if (match[1] && !variables.some((v) => v.name === match[1])) {
        variables.push({
          name: match[1],
          defaultValue: match[2]?.trim(),
        });
      }
    }
  }
  return variables;
}

function scanComponents() {
  const components: ComponentData[] = [];
  const allSnippets: Record<string, Snippet> = {};
  const knownTypes = parseTypes();

  function traverse(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        traverse(filePath);
      } else if (file.endsWith('.ts') && !file.endsWith('.spec.ts')) {
        const content = fs.readFileSync(filePath, 'utf-8');

        if (content.includes('@Component') || content.includes('@Directive') || content.includes('@Injectable')) {
          const selectorMatch = content.match(/selector:\s*['"](.*?)['"]/);
          const classNameMatch = content.match(/export class (\w+)/);

          if (classNameMatch) {
            const name = classNameMatch[1];
            if (!name) continue;

            let selector = selectorMatch ? selectorMatch[1] : '';

            if (!selector && content.includes('@Injectable')) {
              // Generate a selector for services so they can be searched
              selector = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
              if (!selector.endsWith('-service') && name.endsWith('Service')) selector += '-service';
            }

            if (!selector) continue;

            // Extract inputs
            const inputs: ComponentData['inputs'] = [];

            // Signal inputs
            const signalInputMatches = content.matchAll(/(\w+)\s*=\s*input(?:<(.*?)>)?\s*\(([\s\S]*?)\)/g);
            for (const match of signalInputMatches) {
              if (match[1]) {
                let inputName = match[1];
                const type = match[2]?.trim() || 'any';
                const args = match[3] || '';

                const aliasMatch = args.match(/alias:\s*['"](.*?)['"]/);
                if (aliasMatch && aliasMatch[1]) {
                  inputName = aliasMatch[1];
                }

                let defaultValue = args.split(',')[0]?.trim();
                inputs.push({
                  name: inputName,
                  type,
                  description: getJsDoc(content, match[1]),
                  defaultValue: defaultValue === '' ? undefined : defaultValue,
                  options: getOptions(type, knownTypes),
                });
              }
            }

            // Traditional inputs
            const decoratorInputMatches = content.matchAll(
              /@Input\s*\(\s*.*?\s*\)\s*(?:@\w+\s*\(\s*.*?\s*\)\s*)*(\w+)(?:\s*:\s*([^;=]*))?(?:\s*=\s*([^;]*)?)?/g
            );
            for (const match of decoratorInputMatches) {
              if (match[1]) {
                const type = match[2]?.trim() || 'any';
                inputs.push({
                  name: match[1],
                  type,
                  description: getJsDoc(content, match[1]),
                  defaultValue: match[3]?.trim(),
                  options: getOptions(type, knownTypes),
                });
              }
            }

            // Models
            const modelMatches = content.matchAll(/(\w+)\s*=\s*model(?:<(.*?)>)?\s*\(([\s\S]*?)\)/g);
            for (const match of modelMatches) {
              if (match[1]) {
                let inputName = match[1];
                const type = match[2]?.trim() || 'any';
                const args = match[3] || '';

                const aliasMatch = args.match(/alias:\s*['"](.*?)['"]/);
                if (aliasMatch && aliasMatch[1]) {
                  inputName = aliasMatch[1];
                }

                inputs.push({
                  name: inputName,
                  type,
                  description: getJsDoc(content, match[1]),
                  defaultValue: args.split(',')[0]?.trim(),
                  options: getOptions(type, knownTypes),
                });
              }
            }

            const uniqueInputs = Array.from(new Map(inputs.map((i) => [i.name, i])).values());

            // Extract outputs
            const outputs: ComponentData['outputs'] = [];

            // Signal outputs
            const signalOutputMatches = content.matchAll(/(\w+)\s*=\s*output(?:<(.*?)>)?\s*\(([\s\S]*?)\)/g);
            for (const match of signalOutputMatches) {
              if (match[1]) {
                let outputName = match[1];
                const aliasMatch = match[3]?.match(/alias:\s*['"](.*?)['"]/);
                if (aliasMatch && aliasMatch[1]) {
                  outputName = aliasMatch[1];
                }

                outputs.push({
                  name: outputName,
                  type: match[2]?.trim() || 'any',
                  description: getJsDoc(content, match[1]),
                });
              }
            }

            // Traditional outputs
            const decoratorOutputMatches = content.matchAll(/@Output\s*\(\s*.*?\s*\)\s*(\w+)/g);
            for (const match of decoratorOutputMatches) {
              if (match[1]) {
                outputs.push({
                  name: match[1],
                  type: 'any',
                  description: getJsDoc(content, match[1]),
                });
              }
            }

            const uniqueOutputs = Array.from(new Map(outputs.map((o) => [o.name, o])).values());

            // Extract methods
            const methods: ComponentData['methods'] = [];

            // This is a naive regex but should capture most public methods in our codebase
            // We look for method definitions that aren't inputs/outputs/models/etc
            const methodMatches = content.matchAll(
              /^(?:\s+)?(?:public\s+)?(\w+)\s*(?:<[\s\S]*?>)?\s*\(([\s\S]*?)\)\s*(?::\s*([^\{]*))?\s*{/gm
            );
            for (const match of methodMatches) {
              const methodName = match[1];
              if (!methodName) continue;

              // Filter out known lifecycle hooks and other properties
              if (
                [
                  'constructor',
                  'ngOnInit',
                  'ngOnDestroy',
                  'ngOnChanges',
                  'ngAfterViewInit',
                  'if',
                  'for',
                  'switch',
                  'setTimeout',
                  'setInterval',
                  'queueMicrotask',
                ].includes(methodName)
              )
                continue;
              if (uniqueInputs.some((i) => i.name === methodName)) continue;
              if (uniqueOutputs.some((o) => o.name === methodName)) continue;

              methods.push({
                name: methodName,
                parameters: match[2]?.trim() || '',
                returnType: match[3]?.trim() || 'any',
                description: getJsDoc(content, methodName),
              });
            }

            const uniqueMethods = Array.from(new Map(methods.map((m) => [m.name, m])).values());

            // Extract CSS variables from SCSS
            const cssVariables: ComponentData['cssVariables'] = [];

            let scssFileName = selector.replace(/^\[?sh-?/, 'ship-').replace(/\]$/, '') + '.scss';
            if (selector === '[shButton]') scssFileName = 'ship-button.scss';
            else if (selector === '[shSortable]') scssFileName = 'ship-sortable.scss';
            else if (selector === '[shGridSortable]') scssFileName = 'ship-sortable.scss';
            else if (selector === '[shDragDrop]') scssFileName = 'ship-file-upload.scss';
            else if (selector === '[shResize]') scssFileName = 'ship-table.scss';
            else if (selector === '[shSort]') scssFileName = 'ship-table.scss';
            if (name === 'ShipToggleCard') scssFileName = 'ship-toggle-card.scss';

            const scssPath = path.join(STYLES_PATH, scssFileName);
            if (fs.existsSync(scssPath)) {
              const scssContent = fs.readFileSync(scssPath, 'utf-8');

              const varMatches = scssContent.matchAll(/(--[\w-]+):\s*([^;!]+)/g);
              for (const match of varMatches) {
                if (match[1] && !cssVariables.some((v) => v.name === match[1])) {
                  cssVariables.push({
                    name: match[1],
                    defaultValue: match[2]?.trim(),
                  });
                }
              }
            }

            // Try to find examples and description
            const examples: ComponentData['examples'] = [];
            let description = '';

            const lastDir = dir.split(path.sep).pop();
            const searchTerms = [
              lastDir ? lastDir.replace('ship-', '') + 's' : undefined,
              lastDir ? lastDir.replace('ship-', '') : undefined,
              selector.replace(/^\[?sh-?/, '').replace(/\]$/, '') + 's',
              selector.replace(/^\[?sh-?/, '').replace(/\]$/, ''),
            ].filter((t): t is string => !!t);

            let componentDocsPath = '';
            for (const term of searchTerms) {
              const p = path.join(EXAMPLES_PATH, term);
              if (fs.existsSync(p)) {
                componentDocsPath = p;
                break;
              }
            }

            if (componentDocsPath) {
              const docFiles = fs.readdirSync(componentDocsPath);
              const mainHtmlFile = docFiles.find((f: string) => f.endsWith('.html') && !f.includes('example'));
              if (mainHtmlFile) {
                const docContent = fs.readFileSync(path.join(componentDocsPath, mainHtmlFile), 'utf-8');
                const propViewerMatch = docContent.match(/<app-property-viewer>([\s\S]*?)<\/app-property-viewer>/);
                if (propViewerMatch && propViewerMatch[1]) {
                  description = propViewerMatch[1]
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
                    .map((line: string) => line.trim())
                    .filter((line: string, i: number, arr: string[]) => line !== '' || (i > 0 && arr[i - 1] !== ''))
                    .join('\n')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();
                }
              }

              const componentExamplePath = path.join(componentDocsPath, 'examples');
              if (fs.existsSync(componentExamplePath)) {
                const exampleDirs = fs.readdirSync(componentExamplePath);
                for (const eDir of exampleDirs) {
                  const eDirPath = path.join(componentExamplePath, eDir);
                  if (fs.statSync(eDirPath).isDirectory()) {
                    const eFiles = fs.readdirSync(eDirPath);
                    const htmlFile = eFiles.find((f: string) => f.endsWith('.html'));
                    const tsFile = eFiles.find((f: string) => f.endsWith('.ts'));

                    if (htmlFile && tsFile) {
                      examples.push({
                        name: eDir,
                        html: fs.readFileSync(path.join(eDirPath, htmlFile), 'utf-8'),
                        ts: fs.readFileSync(path.join(eDirPath, tsFile), 'utf-8'),
                      });
                    }
                  }
                }
              }
            }

            // Detect sh-sheet usage
            const usesSheet = content.includes('sh-sheet');
            if (usesSheet) {
              description =
                (description ? description + '\n\n' : '') +
                ':::info\nThis component utilizes the **Ship Sheet** utility for its visual structure. It supports standard sheet variations and is affected by global sheet variables.\n:::';
            }

            // Generate snippets
            const tag = selector.startsWith('[') ? (selector === '[shButton]' ? 'button' : 'div') : selector;
            const isAttribute = selector.startsWith('[');
            const selectorBase = selector.replace(/[\[\]]/g, '');

            // Basic snippet
            allSnippets[`${name}: Basic`] = {
              prefix: selectorBase,
              body: isAttribute ? [`<${tag} ${selectorBase}>$0</${tag}>`] : [`<${selectorBase}>$0</${selectorBase}>`],
              description: `Basic usage of ${name}`,
            };

            // Full snippet with common inputs
            const commonInputs = uniqueInputs.filter((i) => ['color', 'variant', 'size', 'readonly'].includes(i.name));
            if (commonInputs.length > 0) {
              const attrs = commonInputs
                .map((i, idx) => {
                  if (i.options && i.options.length > 0) {
                    return `[${i.name}]="\${${idx + 1}|${i.options.join(',')}|}"`;
                  }
                  return `[${i.name}]="\${${idx + 1}:${i.defaultValue || "''"}}"`;
                })
                .join(' ');

              allSnippets[`${name}: With Options`] = {
                prefix: `${selectorBase}-full`,
                body: isAttribute
                  ? [`<${tag} ${selectorBase} ${attrs}>`, '  $0', `</${tag}>`]
                  : [`<${selectorBase} ${attrs}>`, '  $0', `</${selectorBase}>`],
                description: `Full usage of ${name} with common options`,
              };
            }

            components.push({
              name,
              selector,
              path: path.relative(path.join(process.cwd(), '..'), filePath),
              description,
              inputs: uniqueInputs,
              outputs: uniqueOutputs,
              methods: uniqueMethods,
              cssVariables,
              examples,
            });
          }
        }
      }
    }
  }

  traverse(LIB_PATH);

  // Add global variables as a virtual component
  const globalVariables = getGlobalVariables();
  components.push({
    name: 'GlobalVariables',
    selector: 'global-variables',
    path: path.relative(rootPath, VARIABLES_FILE),
    description: 'Global CSS variables for ShipUI including colors, typography, and spacing.',
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: globalVariables,
    examples: [],
  });

  const sheetVariables = getSheetVariables();
  components.push({
    name: 'SheetVariables',
    selector: 'sheet-variables',
    path: path.relative(rootPath, SHEET_FILE),
    description:
      'Common CSS variables for components using the "sh-sheet" class. These variables control background, border, and color scales for different variants.',
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: sheetVariables,
    examples: [],
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(components, null, 2));
  if (OUTPUT_FILE !== LOCAL_OUTPUT) {
    fs.writeFileSync(LOCAL_OUTPUT, JSON.stringify(components, null, 2));
  }
  fs.writeFileSync(SNIPPETS_FILE, JSON.stringify(allSnippets, null, 2));
  console.log(`Scanned ${components.length} components.`);
  console.log(`Generated metadata in ${OUTPUT_FILE}`);
  console.log(`Generated snippets in ${SNIPPETS_FILE}`);
}

scanComponents();

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Load components and icons metadata bundled via esbuild
import componentsData from '../../projects/ship-ui/assets/mcp/components.json';
import libraryIcons from './icons.json';

function isCursorInsideShIcon(document: vscode.TextDocument, position: vscode.Position): boolean {
  const offset = document.offsetAt(position);
  // Get text from start of file up to cursor, limited to last 1000 characters
  const startOffset = Math.max(0, offset - 1000);
  const textBefore = document.getText(new vscode.Range(document.positionAt(startOffset), position));

  const lastOpenTag = textBefore.lastIndexOf('<sh-icon');
  if (lastOpenTag === -1) return false;

  const lastCloseTag = textBefore.lastIndexOf('</sh-icon>');
  if (lastCloseTag > lastOpenTag) return false;

  // Ensure the opening tag has closed its attribute list (i.e. has a '>')
  const remainingTextFromTag = textBefore.substring(lastOpenTag);
  const tagCloseBracket = remainingTextFromTag.indexOf('>');
  if (tagCloseBracket === -1) return false; // Still inside tag attributes

  // Verify that there are no other '<' characters after the '>'
  const contentArea = remainingTextFromTag.substring(tagCloseBracket + 1);
  if (contentArea.includes('<')) return false;

  return true;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('ShipUI Intellisense is now active!');

  // Pre-compute Component Completion Items from componentsData
  const completionItems: vscode.CompletionItem[] = [];

  for (const component of componentsData) {
    if (!component.selector) continue;
    
    const selectorBase = component.selector.replace(/[[\]]/g, '');
    const isAttribute = component.selector.startsWith('[');
    const tag = isAttribute ? (component.selector === '[shButton]' ? 'button' : 'div') : selectorBase;

    const commonInputs = component.inputs.filter((i: any) => 
      ['color', 'variant', 'size', 'readonly'].includes(i.name)
    );

    // Provide the -full snippet
    if (commonInputs.length > 0) {
      const item = new vscode.CompletionItem(`${selectorBase}-full`, vscode.CompletionItemKind.Snippet);
      
      let snippetString = '';
      const attrs = commonInputs.map((i: any, idx: number) => {
        if (i.options && i.options.length > 0) {
          return `${i.name}="\${${idx + 1}|${i.options.join(',')}|}"`;
        }
        return `[${i.name}]="\${${idx + 1}:${i.defaultValue || "''"}}"`;
      }).join(' ');

      if (isAttribute) {
        snippetString = `<${tag} ${selectorBase} ${attrs}>\n  $0\n</${tag}>`;
      } else {
        snippetString = `<${selectorBase} ${attrs}>\n  $0\n</${selectorBase}>`;
      }

      item.insertText = new vscode.SnippetString(snippetString);
      item.detail = `ShipUI: Full ${component.name}`;
      item.documentation = component.description;
      item.command = {
        command: 'ship-ui.autoImport',
        title: 'Auto Import ShipUI Component',
        arguments: [component.name]
      };
      
      completionItems.push(item);
    }
    
    // Provide the basic snippet
    const basicItem = new vscode.CompletionItem(selectorBase, vscode.CompletionItemKind.Snippet);
    if (isAttribute) {
      basicItem.insertText = new vscode.SnippetString(`<${tag} ${selectorBase}>$0</${tag}>`);
    } else {
      basicItem.insertText = new vscode.SnippetString(`<${selectorBase}>$0</${selectorBase}>`);
    }
    basicItem.detail = `ShipUI: Basic ${component.name}`;
    basicItem.command = {
      command: 'ship-ui.autoImport',
      title: 'Auto Import ShipUI Component',
      arguments: [component.name]
    };
    completionItems.push(basicItem);
  }

  const componentProvider = vscode.languages.registerCompletionItemProvider(
    { language: 'html' },
    {
      provideCompletionItems(document, position, token, context) {
        // Only return component snippets if NOT inside <sh-icon>
        if (isCursorInsideShIcon(document, position)) {
          return undefined;
        }
        return completionItems;
      }
    }
  );

  context.subscriptions.push(componentProvider);

  // Pre-compute Icon Completion Items from libraryIcons
  const iconCompletionItems: vscode.CompletionItem[] = [];
  const iconWeights = [
    { name: '', labelSuffix: '', detail: 'Phosphor: Regular', assetFolder: 'regular', filenameSuffix: '' },
    { name: 'thin', labelSuffix: '-thin', detail: 'Phosphor: Thin', assetFolder: 'thin', filenameSuffix: '-thin' },
    { name: 'light', labelSuffix: '-light', detail: 'Phosphor: Light', assetFolder: 'light', filenameSuffix: '-light' },
    { name: 'bold', labelSuffix: '-bold', detail: 'Phosphor: Bold', assetFolder: 'bold', filenameSuffix: '-bold' },
    { name: 'fill', labelSuffix: '-fill', detail: 'Phosphor: Fill', assetFolder: 'fill', filenameSuffix: '-fill' },
    { name: 'duotone', labelSuffix: '-duotone', detail: 'Phosphor: Duotone', assetFolder: 'duotone', filenameSuffix: '-duotone' },
  ];

  for (const icon of libraryIcons) {
    for (const weight of iconWeights) {
      const fullLabel = `${icon}${weight.labelSuffix}`;
      const item = new vscode.CompletionItem(fullLabel, vscode.CompletionItemKind.Value);
      item.detail = weight.detail;
      
      const doc = new vscode.MarkdownString();
      doc.supportHtml = true;
      doc.appendMarkdown(`### ${icon} (${weight.name || 'Regular'})\n\n`);
      
      const url = `https://raw.githubusercontent.com/phosphor-icons/core/main/assets/${weight.assetFolder}/${icon}${weight.filenameSuffix}.svg`;
      doc.appendMarkdown(`![${fullLabel}](${url})\n`);
      
      item.documentation = doc;
      iconCompletionItems.push(item);
    }
  }

  const iconProvider = vscode.languages.registerCompletionItemProvider(
    { language: 'html' },
    {
      provideCompletionItems(document, position, token, context) {
        if (isCursorInsideShIcon(document, position)) {
          return iconCompletionItems;
        }
        return undefined;
      }
    },
    '>', '-'
  );

  context.subscriptions.push(iconProvider);

  // Register Auto Import Command
  const autoImportCommand = vscode.commands.registerCommand('ship-ui.autoImport', async (componentName: string) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !componentName) return;

    const htmlPath = editor.document.uri.fsPath;
    if (!htmlPath.endsWith('.html')) return;

    const currentDir = path.dirname(htmlPath);
    const files = fs.readdirSync(currentDir);
    
    // Identify TS files in the same exact directory
    const tsFiles = files.filter(f => f.endsWith('.ts') && !f.endsWith('.spec.ts'));
    let targetTsFile = '';

    // Prefer exact component pair
    const baseName = path.basename(htmlPath, '.html');
    const exactMatch = tsFiles.find(f => f === `${baseName}.ts`);

    if (exactMatch) {
      targetTsFile = path.join(currentDir, exactMatch);
    } else if (tsFiles.length === 1) {
      targetTsFile = path.join(currentDir, tsFiles[0]);
    } else {
      // If ambiguous, look for one that has an @Component decorator
      for (const ts of tsFiles) {
        const content = fs.readFileSync(path.join(currentDir, ts), 'utf8');
        if (content.includes('@Component')) {
          targetTsFile = path.join(currentDir, ts);
          break;
        }
      }
    }

    if (!targetTsFile) return; // Could not safely determine TS file

    const tsUri = vscode.Uri.file(targetTsFile);
    const tsDoc = await vscode.workspace.openTextDocument(tsUri);
    const content = tsDoc.getText();

    const workspaceEdit = new vscode.WorkspaceEdit();
    let hasChanges = false;

    // 1. Add ES6 Import
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"](@ship-ui\/core|ship-ui)['"]/g;
    let importMatch;
    let existingImportMatch: { text: string; index: number; imports: string[]; pkg: string } | null = null;
    let alreadyImported = false;

    while ((importMatch = importRegex.exec(content)) !== null) {
      const pkg = importMatch[2];
      const importedSymbols = importMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      if (importedSymbols.includes(componentName)) {
        alreadyImported = true;
        break;
      }
      if (!existingImportMatch || pkg === '@ship-ui/core') {
        existingImportMatch = {
          text: importMatch[0],
          index: importMatch.index,
          imports: importedSymbols,
          pkg: pkg
        };
      }
    }

    if (!alreadyImported) {
      if (existingImportMatch) {
        // Append to existing
        const newImports = [...existingImportMatch.imports, componentName].join(', ');
        const newImportStr = `import { ${newImports} } from '${existingImportMatch.pkg}'`;
        const startPos = tsDoc.positionAt(existingImportMatch.index);
        const endPos = tsDoc.positionAt(existingImportMatch.index + existingImportMatch.text.length);
        workspaceEdit.replace(tsUri, new vscode.Range(startPos, endPos), newImportStr);
        hasChanges = true;
      } else {
        // Create new import at the top of the file
        const insertPos = new vscode.Position(0, 0);
        workspaceEdit.insert(tsUri, insertPos, `import { ${componentName} } from '@ship-ui/core';\n`);
        hasChanges = true;
      }
    }

    // 2. Append to imports array inside @Component using brace-matching state machine
    const decoratorKeyword = '@Component(';
    const startIdx = content.indexOf(decoratorKeyword);
    if (startIdx !== -1) {
      const openBraceIdx = content.indexOf('{', startIdx + decoratorKeyword.length);
      if (openBraceIdx !== -1) {
        let depth = 1;
        let endBraceIdx = -1;
        let inSingleQuote = false;
        let inDoubleQuote = false;
        let inTemplateLiteral = false;
        let escaped = false;

        for (let i = openBraceIdx + 1; i < content.length; i++) {
          const char = content[i];
          if (escaped) {
            escaped = false;
            continue;
          }
          if (char === '\\') {
            escaped = true;
            continue;
          }

          if (inSingleQuote) {
            if (char === "'") inSingleQuote = false;
            continue;
          }
          if (inDoubleQuote) {
            if (char === '"') inDoubleQuote = false;
            continue;
          }
          if (inTemplateLiteral) {
            if (char === '`') inTemplateLiteral = false;
            continue;
          }

          if (char === "'") {
            inSingleQuote = true;
            continue;
          }
          if (char === '"') {
            inDoubleQuote = true;
            continue;
          }
          if (char === '`') {
            inTemplateLiteral = true;
            continue;
          }

          if (char === '{') {
            depth++;
          } else if (char === '}') {
            depth--;
            if (depth === 0) {
              endBraceIdx = i;
              break;
            }
          }
        }

        if (endBraceIdx !== -1) {
          const decoratorContent = content.substring(openBraceIdx + 1, endBraceIdx);
          const importsMatch = decoratorContent.match(/imports\s*:\s*\[([\s\S]*?)\]/);
          
          if (importsMatch) {
            const existingArray = importsMatch[1];
            const existingImports = existingArray.split(',').map(s => s.trim()).filter(Boolean);
            if (!existingImports.includes(componentName)) {
              const newImports = [...existingImports, componentName].join(', ');
              const originalImportsText = importsMatch[0];
              const replacementImportsText = `imports: [${newImports}]`;
              
              const relativeStart = decoratorContent.indexOf(originalImportsText);
              const absStart = openBraceIdx + 1 + relativeStart;
              
              const startPos = tsDoc.positionAt(absStart);
              const endPos = tsDoc.positionAt(absStart + originalImportsText.length);
              workspaceEdit.replace(tsUri, new vscode.Range(startPos, endPos), replacementImportsText);
              hasChanges = true;
            }
          } else {
            // Inject imports: [...] right after the opening brace '{'
            const startPos = tsDoc.positionAt(openBraceIdx + 1);
            const isMultiline = decoratorContent.includes('\n');
            let injection = '';
            if (isMultiline) {
              const lines = decoratorContent.split('\n');
              const firstPropLine = lines.find(line => line.trim().length > 0) || '';
              const indentMatch = firstPropLine.match(/^\s+/);
              const indent = indentMatch ? indentMatch[0] : '  ';
              injection = `\n${indent}imports: [${componentName}],`;
            } else {
              injection = ` imports: [${componentName}],`;
            }
            workspaceEdit.insert(tsUri, startPos, injection);
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      await vscode.workspace.applyEdit(workspaceEdit);
      await tsDoc.save();
    }
  });

  context.subscriptions.push(autoImportCommand);
}

export function deactivate() {}

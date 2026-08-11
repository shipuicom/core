import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';
import { ASTDocument, ShipEditor, ShipEditorActionDirective, ShipEditorToolbar } from '@ship-ui/core/ship-editor';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipSelect } from '@ship-ui/core/ship-select';
import { ShipTooltip } from '@ship-ui/core/ship-tooltip';
import { Previewer } from '../../previewer/previewer';
import { HighlightBehavior } from './editors-shared';
import { CodePadBlockBehavior, CounterBlockBehavior } from './sh-editor-demo-blocks';

@Component({
  selector: 'app-editors-virtual',
  imports: [
    FormsModule,
    Previewer,
    ShipEditor,
    ShipEditorToolbar,
    ShipEditorActionDirective,
    ShipButton,
    ShipCheckbox,
    ShipSelect,
    ShipIcon,
    ShipTooltip,
  ],
  templateUrl: './editors-virtual.html',
  styleUrl: './editors-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorsVirtual {
  customBehaviors = [new HighlightBehavior(), new CounterBlockBehavior(), new CodePadBlockBehavior()];

  formatOptions = [
    { value: 'html', label: 'HTML' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'json', label: 'JSON (AST)' },
  ];

  /**
   * 5,000 blocks handed to the editor up front. Past 1,000 top-level blocks
   * the editor virtualizes: only the viewport's window of blocks exists in
   * the DOM, so this loads (and edits) as fast as a small document.
   */
  hugeDocValue = signal<string | ASTDocument | null>(buildHugeDocument());
  hugeFormat = signal<'html' | 'json' | 'markdown'>('json');
  hugeReadonly = signal(false);
  hugeShowMetrics = signal(true);
  hugeImageEdgeResize = signal(false);
  hugeDocumentVariant = signal(false);

  resetHuge() {
    this.hugeFormat.set('json');
    this.hugeDocValue.set(buildHugeDocument());
  }

  demoImageUpload = async (file: File): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return `https://picsum.photos/seed/${encodeURIComponent(file.name)}/480/320`;
  };
}

/**
 * Exactly 5,000 top-level blocks exercising the whole block/mark surface:
 * headings, both list kinds, code blocks, quotes, callouts, hr and image
 * voids, and paragraphs carrying inline marks (bold, italic, links, inline
 * code, colors, highlight). Variable heights and real mark runs make the
 * virtualized window's measured-height model and per-block render cache work
 * for their living. Deterministic on purpose: reloads always show the same
 * document.
 */
function buildHugeDocument(): ASTDocument {
  const sentences = [
    'The window mounts only what the viewport can see.',
    'Everything above and below is spacer padding, priced by measured block heights.',
    'Scroll anywhere — the mapping from pixels to blocks is a binary search.',
    'Typing here costs the same as in a ten-block document.',
    'Select-all and copy still serialize the whole document from the model.',
  ];
  const colors = ['#e05263', '#3b82f6', '#16a34a', '#d97706'];

  const svgImage = (i: number): string => {
    const height = 120 + (i % 5) * 40;
    const hue = (i * 47) % 360;
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='${height}'>` +
      `<rect width='480' height='${height}' rx='8' fill='hsl(${hue} 60% 55%)'/>` +
      `<text x='16' y='34' font-family='sans-serif' font-size='20' fill='white'>Image at block ${i} (${height}px)</text></svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  };

  /** A paragraph's inline nodes with a deterministic sprinkle of marks. */
  const markedContent = (i: number): ASTDocument[number]['content'] => {
    const sentence = sentences[i % sentences.length];
    const tail = i % 7 === 0 ? ` ${sentences[(i + 2) % sentences.length]}` : '';
    const plain = [{ type: 'text' as const, text: `Block ${i}. ${sentence}${tail}` }];
    switch (i % 11) {
      case 0:
        return [
          { type: 'text', text: `Block ${i}. ` },
          { type: 'text', text: 'Bold lead-in', marks: [{ type: 'bold' }] },
          { type: 'text', text: ` ${sentence}` },
        ];
      case 3:
        return [
          { type: 'text', text: `Block ${i}. See ` },
          { type: 'text', text: 'the docs', marks: [{ type: 'link', attrs: { href: 'https://ship-ui.dev/docs' } }] },
          { type: 'text', text: ` — ${sentence}`, marks: [{ type: 'italic' }] },
        ];
      case 5:
        return [
          { type: 'text', text: `Block ${i}. Call ` },
          { type: 'text', text: 'renderBlockHtml(i)', marks: [{ type: 'code' }] },
          { type: 'text', text: ' per block. ' },
          { type: 'text', text: sentence, marks: [{ type: 'style', attrs: { color: colors[i % colors.length] } }] },
        ];
      case 8:
        return [
          { type: 'text', text: `Block ${i}. ` },
          { type: 'text', text: 'Highlighted', marks: [{ type: 'highlight' }] },
          { type: 'text', text: ' and ' },
          { type: 'text', text: 'struck', marks: [{ type: 'strike' }] },
          { type: 'text', text: `. ${sentence}` },
        ];
      default:
        return plain;
    }
  };

  const listBlock = (i: number): ASTDocument[number] => ({
    type: i % 2 === 0 ? 'bullet-list' : 'ordered-list',
    content: Array.from({ length: 2 + (i % 4) }, (_, n) => ({
      type: 'list-item',
      content:
        n === 0
          ? [
              { type: 'text', text: `Item ${n + 1} at block ${i} — ` },
              { type: 'text', text: 'marked', marks: [{ type: 'bold' }, { type: 'italic' }] },
            ]
          : [{ type: 'text', text: `Item ${n + 1} of the list at block ${i}` }],
    })),
  });

  const doc: ASTDocument = [];
  for (let i = 0; i < 5000; i++) {
    if (i % 500 === 0) {
      doc.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: `Chapter ${i / 500 + 1}` }] });
    } else if (i % 500 === 250) {
      doc.push({ type: 'image', attrs: { src: svgImage(i), alt: `Demo image ${i}`, mode: 'content', size: 'auto' }, content: [] });
    } else if (i % 125 === 0) {
      doc.push({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: `Section ${Math.floor(i / 125)}` }] });
    } else if (i % 311 === 0) {
      doc.push({ type: 'hr', content: [] });
    } else if (i % 89 === 0) {
      doc.push({
        type: 'code-block',
        content: [
          {
            type: 'text',
            text: `function blockAt(index) {\n\tconst row = rowOfTopLevel(${i});\n\tif (row >= rows) {\n\t\treturn null;\n\t}\n\treturn blockFromRow(cd, row);\n}`,
          },
        ],
      });
    } else if (i % 71 === 0) {
      const isQuote = i % 142 === 0;
      doc.push({
        type: isQuote ? 'quote' : 'info-callout',
        content: [
          { type: 'text', text: `Block ${i}: ` },
          { type: 'text', text: sentences[i % sentences.length], ...(isQuote ? { marks: [{ type: 'italic' }] } : {}) },
        ],
      });
    } else if (i % 53 === 0) {
      doc.push(listBlock(i));
    } else {
      doc.push({ type: 'paragraph', content: markedContent(i) });
    }
  }
  return doc;
}

import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { ShipColor } from '@ship-ui/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipCard } from '@ship-ui/core/ship-card';
import {
  ShipEditor,
  ShipEditorBlock,
  ShipEditorCommand,
  ShipEditorRegistry,
  ShipEditorValue,
  formatDocRange,
  splitBlock,
} from '@ship-ui/core/ship-editor';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipToggle } from '@ship-ui/core/ship-toggle';

@Component({
  selector: 'app-sandbox-editor',
  standalone: true,
  imports: [ShipEditor, ShipButton, ShipCard, ShipToggle, ShipIcon, ShipButtonGroup],
  templateUrl: './sandbox-editor.html',
  styleUrl: './sandbox-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxEditor {
  constructor() {
    // Register custom highlight mark extension
    ShipEditorRegistry.registerMark({
      type: 'highlight',
      tagName: 'mark',
      toHTML: (mark, text) =>
        `<mark style="background-color: var(--warn-2); color: var(--warn-11); padding: 2px 4px; border-radius: 2px;">${text}</mark>`,
      parseHTML: (el) => (el.tagName.toLowerCase() === 'mark' ? { type: 'highlight' } : null),
    });
  }

  // Current format selection
  selectedFormat = signal<'html' | 'markdown' | 'json'>('html');

  editor = viewChild(ShipEditor);

  // Editor states
  isReadonly = signal<boolean>(false);
  showToolbar = signal<boolean>(true);
  selectedColor = signal<ShipColor | null>(null);
  imageUploadEnabled = signal<boolean>(true);

  // Toolbar group configurations
  showFormats = signal<boolean>(true);
  showBlocks = signal<boolean>(true);
  showLists = signal<boolean>(true);
  showAlignments = signal<boolean>(true);
  showInsertions = signal<boolean>(true);
  showHistory = signal<boolean>(true);

  // Custom action for projected button
  customAction() {
    alert('Custom Projected Button Clicked!');
  }

  customEditorCommands = signal<ShipEditorCommand[]>([
    {
      id: 'highlight',
      label: 'Highlight Text',
      icon: 'star',
      description: 'Highlight selected text in yellow',
      action: (editor) => {
        editor.runTransaction((doc, selection) => {
          return formatDocRange(doc, selection.start, selection.end, 'highlight', 'toggle');
        });
      },
    },
    {
      id: 'info-callout',
      label: 'Info Callout',
      icon: 'terminal',
      description: 'Insert an info callout box',
      action: (editor) => {
        editor.runTransaction((doc, selection) => {
          const { doc: splitDoc } = splitBlock(doc, selection.start);
          const calloutBlock: ShipEditorBlock = {
            type: 'quote',
            attrs: { align: 'left' },
            content: [{ type: 'text', text: '💡 Info: Start typing callout contents here...' }],
          };
          const targetIndex = selection.start.blockIndex + 1;
          splitDoc.splice(targetIndex, 0, calloutBlock);
          return {
            doc: splitDoc,
            selectionShift: {
              start: { blockIndex: targetIndex },
              end: { blockIndex: targetIndex },
            },
          };
        });
      },
    },
  ]);

  // Pre-populated initial contents for each format
  initialHtml = `<h1>Ship WYSIWYG Editor</h1><p>Welcome! This is a <strong>config-driven</strong> rich-text editor designed to support flexible storage formats.</p><ul><li><strong>Two-way binding</strong> with <code>ControlValueAccessor</code></li><li>Instant conversion to <strong>HTML</strong>, <strong>Markdown</strong>, or <strong>JSON</strong></li><li>Sticky blur-toolbar, light/dark mode support, and word counting</li></ul><blockquote>"A beautiful interface makes editing content a delight."</blockquote><hr><p>Try changing the storage format below to see the serialized output update in real time!</p>`;

  // Current value model
  editorValue = signal<ShipEditorValue>(this.initialHtml);

  // Stringified preview for database presentation
  serializedOutput = computed(() => {
    const val = this.editorValue();
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    return JSON.stringify(val, null, 2);
  });

  // Handle format swapping, converting the value appropriately
  onFormatChange(format: string | null) {
    if (format === 'html' || format === 'markdown' || format === 'json') {
      this.selectedFormat.set(format);
    }
  }

  // Copy serialized contents to clipboard
  copyToClipboard() {
    navigator.clipboard.writeText(this.serializedOutput());
  }
}

import { Component, computed, inject, input } from '@angular/core';
import { ShipEditor } from '@ship-ui/core/ship-editor';

@Component({
  selector: 'sh-editor-selection-debug',
  standalone: true,
  template: `
    <pre class="sh-editor-selection-debug">{{ selectionJson() }}</pre>
  `,
  styles: `
    :host { display: block; }
    .sh-editor-selection-debug {
      font-size: 11px;
      line-height: 1.4;
      font-family: 'SF Mono', 'Fira Code', monospace;
      background: #1e1e2e;
      color: #cdd6f4;
      padding: 12px 16px;
      border-radius: 8px;
      margin: 8px 0;
      white-space: pre-wrap;
      word-break: break-all;
    }
  `,
})
export class ShipEditorSelectionDebug {
  editorInput = input<ShipEditor | null>(null, { alias: 'editor' });

  #parentEditor = inject(ShipEditor, { optional: true });

  editor = computed(() => {
    const e = this.editorInput() ?? this.#parentEditor;
    if (!e) throw new Error('[sh-editor-selection-debug] must be within <sh-editor> or have [editor] input.');
    return e;
  });

  selectionJson = computed(() => {
    const sel = this.editor().selection.live();
    if (!sel) return 'No selection';
    return JSON.stringify(sel, null, 2);
  });
}

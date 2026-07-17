import { Component, computed, inject, input } from '@angular/core';
import { ShipEditor } from '@ship-ui/core/ship-editor';

@Component({
  selector: 'sh-editor-selection-debug',
  standalone: true,
  templateUrl: './sh-editor-selection-debug.html',
  styleUrl: './sh-editor-selection-debug.scss',
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

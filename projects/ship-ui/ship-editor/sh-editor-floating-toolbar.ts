import { ChangeDetectionStrategy, Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { ShipEditor } from './ship-editor';

@Component({
  selector: 'sh-editor-floating-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './sh-editor-floating-toolbar.html',
  styleUrl: './sh-editor-floating-toolbar.scss',
})
export class ShipEditorFloatingToolbar {
  editorInput = input<ShipEditor | null>(null, { alias: 'editor' });
  #parentEditor = inject(ShipEditor, { optional: true });

  editor = computed(() => {
    const e = this.editorInput() ?? this.#parentEditor;
    if (!e) throw new Error('[sh-editor-floating-toolbar] missing editor reference.');
    return e;
  });

  isVisible = computed(() => {
    const sel = this.editor().selection.active();
    const rect = this.editor().selection.domRect();

    return !!(sel && !sel.isCollapsed && rect && rect.width > 0);
  });

  top = computed(() => {
    const rect = this.editor().selection.domRect();
    return rect ? rect.top : 0;
  });

  left = computed(() => {
    const rect = this.editor().selection.domRect();
    return rect ? rect.left + rect.width / 2 : 0;
  });
}

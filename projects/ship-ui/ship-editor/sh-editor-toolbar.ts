import { ChangeDetectionStrategy, Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { ShipEditor } from './ship-editor';

@Component({
  selector: 'sh-editor-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './sh-editor-toolbar.html',
  host: { '[attr.data-position]': 'position()' },
  styleUrl: './sh-editor-toolbar.scss',
})
export class ShipEditorToolbar {
  /** The editor the toolbar controls; defaults to the enclosing `<sh-editor>` when omitted. */
  editorInput = input<ShipEditor | null>(null, { alias: 'editor' });
  #parentEditor = inject(ShipEditor, { optional: true });

  editor = computed(() => {
    const e = this.editorInput() ?? this.#parentEditor;
    if (!e) throw new Error('[sh-editor-toolbar] missing editor reference.');
    return e;
  });
  /** Placement of the toolbar relative to the editor: `top`, `bottom`, or `none`. */
  position = input<'top' | 'bottom' | 'none'>('none');
}

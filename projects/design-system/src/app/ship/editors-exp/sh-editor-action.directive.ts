import { Directive, HostListener, computed, inject, input } from '@angular/core';
import { ShipEditorExp } from './ship-editor';

@Directive({
  selector: '[shEditorAction]',
  standalone: true,
  host: {
    '[class.sh-editor-action-active]': 'isActive()',
    '[attr.aria-pressed]': 'isActive() ? "true" : "false"',
  },
})
export class ShipEditorActionDirective {
  editorInput = input<ShipEditorExp | null>(null, { alias: 'editor' });

  action = input.required<string>({ alias: 'shEditorAction' });
  attrs = input<Record<string, any>>({}, { alias: 'shEditorActionAttrs' });

  #parentEditor = inject(ShipEditorExp, { optional: true });

  editor = computed(() => {
    const e = this.editorInput() ?? this.#parentEditor;
    if (!e) throw new Error('[shEditorAction] must be within <sh-editor>.');
    return e;
  });

  // Pass attrs into isActive to enable variant matching (H1 vs H2)
  isActive = computed(() => this.editor().engine.isActive(this.action(), this.attrs()));

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    event.preventDefault(); // Prevents physical focus from leaving contenteditable!
    this.editor().engine.dispatch(this.action(), this.attrs());
  }
}

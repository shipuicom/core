import { Directive, HostListener, computed, inject, input } from '@angular/core';
import { ShipEditor } from './ship-editor';

@Directive({
  selector: '[shEditorAction]',
  standalone: true,
  host: {
    '[class.sh-editor-action-active]': 'isActive()',
    '[attr.aria-pressed]': 'isActive() ? "true" : "false"',
  },
})
export class ShipEditorActionDirective {
  /** The editor to act on; defaults to the enclosing `<sh-editor>` when omitted. */
  editorInput = input<ShipEditor | null>(null, { alias: 'editor' });

  /** The editor command dispatched when the host element is pressed. */
  action = input.required<string>({ alias: 'shEditorAction' });
  /** Extra attributes passed to the dispatched command and used to compute its active state. */
  attrs = input<Record<string, any>>({}, { alias: 'shEditorActionAttrs' });

  #parentEditor = inject(ShipEditor, { optional: true });

  editor = computed(() => {
    const e = this.editorInput() ?? this.#parentEditor;
    if (!e) throw new Error('[shEditorAction] must be within <sh-editor>.');
    return e;
  });

  isActive = computed(() => this.editor().engine.isActive(this.action(), this.attrs()));

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.editor().engine.dispatch(this.action(), this.attrs());
  }

  // Mousedown alone leaves the control keyboard-dead: a focused toolbar
  // button advertising aria-pressed must also react to Enter and Space.
  // (Not `click` — that would double-dispatch after every mousedown.)
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.editor().engine.dispatch(this.action(), this.attrs());
  }
}

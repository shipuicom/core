import { ChangeDetectionStrategy, Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { ShipEditorExp } from './ship-editor';

@Component({
  selector: 'sh-editor-floating-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (isVisible()) {
      <div
        class="sh-editor-floating-panel"
        [style.top.px]="top()"
        [style.left.px]="left()"
        (mousedown)="$event.preventDefault()">
        <ng-content></ng-content>
      </div>
    }
  `,
  styles: [
    `
      .sh-editor-floating-panel {
        position: fixed;
        background: rgb(from var(--base-12) r g b / 85%);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: var(--base-1);
        padding: 4px;
        border-radius: var(--shape-2);
        display: flex;
        gap: 2px;
        box-shadow: var(--box-shadow-30);
        z-index: 50;
        transform: translateX(-50%);
        align-items: center;
        margin-top: -12px;
      }

      .sh-editor-floating-panel button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 28px;
        padding: 0 8px;
        background: transparent;
        border: none;
        border-radius: var(--shape-1);
        color: var(--base-1);
        cursor: pointer;
        font: var(--paragraph-20);
        font-weight: 600;
        transition: all 0.15s ease;
      }

      .sh-editor-floating-panel button:hover {
        background: rgb(from var(--base-1) r g b / 15%);
      }

      .sh-editor-floating-panel button.sh-editor-action-active {
        background: rgb(from var(--base-1) r g b / 25%);
      }
    `,
  ],
})
export class ShipEditorFloatingToolbar {
  editorInput = input<ShipEditorExp | null>(null, { alias: 'editor' });
  #parentEditor = inject(ShipEditorExp, { optional: true });

  editor = computed(() => {
    const e = this.editorInput() ?? this.#parentEditor;
    if (!e) throw new Error('[sh-editor-floating-toolbar] missing editor reference.');
    return e;
  });

  isVisible = computed(() => {
    const sel = this.editor().selection.active();
    const rect = this.editor().selection.domRect();
    // Only show if there is an active selection that is NOT collapsed
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

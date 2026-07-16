import { ChangeDetectionStrategy, Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { ShipEditorExp } from './ship-editor';

@Component({
  selector: 'sh-editor-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- No blanket mousedown preventDefault here: it would block focus on
         interactive controls (sh-select, sh-color-picker-input) that open on
         focus/click. The plain action buttons keep the editor's DOM selection
         via shEditorAction's own per-button mousedown preventDefault. -->
    <div class="sh-editor-toolbar-inner" role="toolbar">
      <ng-content></ng-content>
    </div>
  `,
  host: { '[attr.data-position]': 'position()' },
  styles: [
    `
      sh-editor-toolbar {
        display: block;
        background: rgb(from var(--base-1) r g b / 70%);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--base-4);
        z-index: 10;
      }
      sh-editor-toolbar[data-position='top'] {
        position: sticky;
        top: 0;
        border-top-left-radius: inherit;
        border-top-right-radius: inherit;
      }
      sh-editor-toolbar[data-position='bottom'] {
        position: sticky;
        bottom: 0;
        border-top: 1px solid var(--base-4);
        border-bottom: none;
        border-bottom-left-radius: inherit;
        border-bottom-right-radius: inherit;
      }

      .sh-editor-toolbar-inner {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 2px;
        padding: 6px 8px;
      }

      .sh-editor-toolbar-inner button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 28px;
        padding: 0 8px;
        background: transparent;
        border: none;
        border-radius: var(--shape-1);
        color: var(--base-11);
        cursor: pointer;
        font: var(--paragraph-20);
        font-weight: 600;
        transition: all 0.15s ease;
      }

      .sh-editor-toolbar-inner button:hover:not(:disabled) {
        background-color: var(--base-3);
        color: var(--base-12);
      }

      .sh-editor-toolbar-inner button:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }

      .sh-editor-toolbar-inner button.sh-editor-action-active {
        background-color: var(--primary-3);
        color: var(--primary-11);
      }

      .sh-editor-toolbar-inner .divider {
        width: 1px;
        height: 20px;
        background: var(--base-4);
        margin: 0 4px;
        flex-shrink: 0;
      }
    `,
  ],
})
export class ShipEditorToolbar {
  editorInput = input<ShipEditorExp | null>(null, { alias: 'editor' });
  #parentEditor = inject(ShipEditorExp, { optional: true });

  editor = computed(() => {
    const e = this.editorInput() ?? this.#parentEditor;
    if (!e) throw new Error('[sh-editor-toolbar] missing editor reference.');
    return e;
  });
  position = input<'top' | 'bottom' | 'none'>('none');
}

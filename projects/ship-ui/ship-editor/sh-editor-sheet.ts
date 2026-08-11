import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ShipDialogService } from '@ship-ui/core/ship-dialog';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipEditor } from './ship-editor';
import { ShipEditorToolbar } from './sh-editor-toolbar';
import { ShipEditorActionDirective } from './sh-editor-action.directive';
import { BaseBlockBehavior, BaseInlineBehavior } from './editor-behaviors';
import { ASTDocument } from './editor.types';

type SheetEditorBehaviors = (BaseBlockBehavior | BaseInlineBehavior)[];

type SheetEditorConfig = {
  value: () => string | ASTDocument | null;
  setValue: (next: string | ASTDocument | null) => void;
  format: 'html' | 'markdown' | 'json';
  behaviors: SheetEditorBehaviors;
  placeholder: string;
};

/**
 * The editing surface mounted inside the bottom sheet: the editor fills the
 * card and scrolls, the toolbar sits pinned underneath — directly above the
 * software keyboard, since the sheet itself rides the keyboard inset.
 */
@Component({
  selector: 'sh-editor-sheet-surface',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ShipEditor, ShipEditorToolbar, ShipEditorActionDirective, ShipIcon],
  styles: `
    sh-editor-sheet-surface {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;

      // Stretch the editor's internal column so the body takes the leftover
      // height (and becomes the scroller) while the bottom toolbar lands
      // pinned at the card's bottom edge.
      sh-editor,
      sh-editor > .sh-editor-container {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
      }

      // The sheet card supplies the chrome — the editor sheds its own frame.
      sh-editor {
        border-radius: 0;
      }

      sh-editor > .sh-editor-container {
        border: none;
        border-radius: 0;
      }

      sh-editor .sh-editor-body {
        flex: 1;
        min-height: 0;
        overflow: auto;
      }

      // One scrollable row instead of wrapping: on narrow screens the full
      // action set swipes horizontally, like native keyboard accessory bars.
      sh-editor-toolbar[data-position='bottom'] .sh-editor-toolbar-inner {
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;

        &::-webkit-scrollbar {
          display: none;
        }

        button {
          flex: 0 0 auto;
        }
      }
    }
  `,
  template: `
    <sh-editor
      [value]="data().value()"
      (valueChange)="data().setValue($event)"
      [format]="data().format"
      [behaviors]="data().behaviors"
      [placeholder]="data().placeholder">
      <sh-editor-toolbar position="bottom">
        <button shEditorAction="undo" aria-label="Undo"><sh-icon>arrow-u-up-left</sh-icon></button>
        <button shEditorAction="redo" aria-label="Redo"><sh-icon>arrow-u-up-right</sh-icon></button>
        <button shEditorAction="bold" aria-label="Bold"><sh-icon>text-b</sh-icon></button>
        <button shEditorAction="italic" aria-label="Italic"><sh-icon>text-italic</sh-icon></button>
        <button shEditorAction="underline" aria-label="Underline"><sh-icon>text-underline</sh-icon></button>
        <button shEditorAction="heading" [shEditorActionAttrs]="{ level: 2 }" aria-label="Heading">
          <sh-icon>text-h-two</sh-icon>
        </button>
        <button shEditorAction="bullet-list" aria-label="Bullet list"><sh-icon>list-bullets</sh-icon></button>
        <button shEditorAction="ordered-list" aria-label="Numbered list"><sh-icon>list-numbers</sh-icon></button>
        <button shEditorAction="quote" aria-label="Quote"><sh-icon>quotes</sh-icon></button>
        <button shEditorAction="link" aria-label="Link"><sh-icon>link</sh-icon></button>
      </sh-editor-toolbar>
    </sh-editor>
  `,
})
export class ShipEditorSheetSurface {
  data = input.required<SheetEditorConfig>();

  editorRef = viewChild(ShipEditor);
  #destroyRef = inject(DestroyRef);

  constructor() {
    // The editor publishes `value` from an effect, which never flushes when
    // the sheet is torn down mid-typing — without this, dismissing the sheet
    // right after a keystroke drops that keystroke.
    this.#destroyRef.onDestroy(() => {
      const editor = this.editorRef();
      if (!editor) return;
      const config = this.data();
      config.setValue(editor.engine.serialize(config.format));
    });
  }
}

/**
 * `<sh-editor-sheet>` — the mobile editing pattern. On fine-pointer/wide
 * viewports it renders a normal inline `sh-editor`. On coarse-pointer or
 * narrow viewports the inline editor becomes a tap-to-edit preview that opens
 * the real editing surface in a `bottom-sheet` dialog: the editor fills the
 * card, the toolbar is pinned at the bottom above the keyboard, and the sheet
 * slides down to dismiss.
 *
 * The surface is mounted fresh in the sheet (a live contenteditable is never
 * reparented); `value` is two-way bound and stays in sync while editing.
 */
@Component({
  selector: 'sh-editor-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ShipEditor, ShipEditorToolbar, ShipEditorActionDirective, ShipIcon],
  styles: `
    sh-editor-sheet {
      display: block;

      .sh-editor-sheet-preview {
        position: relative;
        cursor: pointer;

        // The preview is inert — the sheet is the editing surface.
        sh-editor {
          pointer-events: none;
        }

        .sh-editor-sheet-preview-hit {
          position: absolute;
          inset: 0;
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          width: 100%;
        }
      }
    }
  `,
  template: `
    @if (sheetActive()) {
      <div class="sh-editor-sheet-preview">
        <sh-editor [value]="value()" [format]="format()" [behaviors]="behaviors()" [readonly]="true" />
        <button
          type="button"
          class="sh-editor-sheet-preview-hit"
          [attr.aria-label]="'Edit ' + (sheetLabel() || 'document')"
          (click)="openSheet()"></button>
      </div>
    } @else {
      <sh-editor
        [value]="value()"
        (valueChange)="value.set($event)"
        [format]="format()"
        [behaviors]="behaviors()"
        [placeholder]="placeholder()">
        <sh-editor-toolbar position="top">
          <button shEditorAction="undo" aria-label="Undo"><sh-icon>arrow-u-up-left</sh-icon></button>
          <button shEditorAction="redo" aria-label="Redo"><sh-icon>arrow-u-up-right</sh-icon></button>
          <button shEditorAction="bold" aria-label="Bold"><sh-icon>text-b</sh-icon></button>
          <button shEditorAction="italic" aria-label="Italic"><sh-icon>text-italic</sh-icon></button>
          <button shEditorAction="underline" aria-label="Underline"><sh-icon>text-underline</sh-icon></button>
          <button shEditorAction="heading" [shEditorActionAttrs]="{ level: 2 }" aria-label="Heading">
            <sh-icon>text-h-two</sh-icon>
          </button>
          <button shEditorAction="bullet-list" aria-label="Bullet list"><sh-icon>list-bullets</sh-icon></button>
          <button shEditorAction="ordered-list" aria-label="Numbered list"><sh-icon>list-numbers</sh-icon></button>
          <button shEditorAction="quote" aria-label="Quote"><sh-icon>quotes</sh-icon></button>
          <button shEditorAction="link" aria-label="Link"><sh-icon>link</sh-icon></button>
        </sh-editor-toolbar>
      </sh-editor>
    }
  `,
})
export class ShipEditorSheet {
  #dialogService = inject(ShipDialogService);
  #destroyRef = inject(DestroyRef);

  /** Two-way bound editor content, same contract as `sh-editor`'s `value`. */
  value = model<string | ASTDocument | null>(null);
  /** Serialization format handed through to the editor. */
  format = input<'html' | 'markdown' | 'json'>('html');
  /** Extra behaviors handed through to the editor. */
  behaviors = input<SheetEditorBehaviors>([]);
  placeholder = input('');
  /** Accessible label for the tap-to-edit preview ("Edit {label}"). */
  sheetLabel = input('');
  /**
   * `'auto'` (default) uses the sheet on coarse-pointer or narrow viewports;
   * `'sheet'`/`'inline'` force one mode (e.g. for demos or embedding).
   */
  mode = input<'auto' | 'sheet' | 'inline'>('auto');

  #isMobile = signal(false);

  readonly sheetActive = computed(() => {
    const mode = this.mode();
    if (mode !== 'auto') return mode === 'sheet';
    return this.#isMobile();
  });

  #sheetOpen = false;

  constructor() {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const query = window.matchMedia('(pointer: coarse), (max-width: 768px)');
      this.#isMobile.set(query.matches);
      const onChange = (e: MediaQueryListEvent) => this.#isMobile.set(e.matches);
      query.addEventListener('change', onChange);
      this.#destroyRef.onDestroy(() => query.removeEventListener('change', onChange));
    }
  }

  openSheet() {
    if (this.#sheetOpen) return;
    this.#sheetOpen = true;

    this.#dialogService.open(ShipEditorSheetSurface, {
      type: 'bottom-sheet',
      // A fixed-height card, not content-sized: the editing surface should
      // feel like a workspace (the keyboard cap still wins via max-height).
      height: '95dvh',
      maxHeight: '95dvh',
      data: {
        value: () => this.value(),
        setValue: (next: string | ASTDocument | null) => this.value.set(next),
        format: this.format(),
        behaviors: this.behaviors(),
        placeholder: this.placeholder(),
      },
      closed: () => {
        this.#sheetOpen = false;
      },
    });
  }
}

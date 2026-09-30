// ---------------------------------------------------------------------------
// ShipSpreadsheet — the `select` cell type
// ---------------------------------------------------------------------------
//
// The reference component editor (EXTENSIONS.md §3.1): a column whose cells
// hold one option's key. The cell shows the option's label as an `sh-chip`
// (`ShipSheetSelectCell`, the reference cell renderer); typing, Enter
// or F2 open a menu of the options in the cell's place (`sh-menu`,
// searchable: arrows move, Enter picks, typed text filters); paste and the
// formula bar go through `parse`, which takes a key, a label or a label
// prefix.

import { ChangeDetectionStrategy, Component, Injector, ViewEncapsulation, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipMenu } from '@ship-ui/core/ship-menu';
import { SheetCellContext, SheetCellEditor, SheetCellEditorApi, SheetCellExtension } from '../core/sheet-extensions';
import { escapeSheetHtml } from '../core/sheet-html';

/** One choice of a select column: `key` is what the cell stores, `label` what it shows. */
export interface SheetSelectOption {
  readonly key: string;
  readonly label: string;
  /** A colour for the chip (`--chip-c`). */
  readonly color?: string;
  /** Extra classes on the chip. */
  readonly className?: string;
}

export interface SheetSelectExtensionOptions {
  /** The key stored in `colTypes`; `'select'` by default — give each option set its own type. */
  readonly type?: string;
  /** The choices — a list, or a function read at every render, parse and edit so the choices can follow a store. */
  readonly options: readonly SheetSelectOption[] | (() => readonly SheetSelectOption[]);
}

/** A `sheetSelectExtension` instance: the extension plus its option source, which its editor reads. */
export interface SheetSelectExtension extends SheetCellExtension {
  options(): readonly SheetSelectOption[];
  find(key: string): SheetSelectOption | undefined;
}

/**
 * Case-insensitive match of typed text against options: an exact key or
 * label first, then a label or key prefix; `null` when nothing fits.
 */
export function matchSheetSelectOption<T extends SheetSelectOption>(input: string, options: readonly T[]): T | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;
  return (
    options.find((option) => option.key.toLowerCase() === text || option.label.toLowerCase() === text) ??
    options.find((option) => option.label.toLowerCase().startsWith(text) || option.key.toLowerCase().startsWith(text)) ??
    null
  );
}

/**
 * A select column over plain strings: the cell stores an option's key and
 * shows its label as a chip (`ShipSheetSelectCell`; the string `render` is
 * the export fallback); an unknown key shows as itself and is flagged.
 * Edits open `ShipSheetSelectEditor`; typed or pasted text resolves through
 * `matchSheetSelectOption`; empty clears.
 */
export function sheetSelectExtension({ type = 'select', options }: SheetSelectExtensionOptions): SheetSelectExtension {
  const list = typeof options === 'function' ? options : () => options;
  const find = (key: string) => list().find((option) => option.key === key);
  return {
    type,
    options: list,
    find,
    editor: ShipSheetSelectEditor,
    renderer: ShipSheetSelectCell,
    render: (raw) => {
      if (!raw) return '';
      const option = find(raw);
      const cls = `shs-chip${option?.className ? ` ${escapeSheetHtml(option.className)}` : ''}${option ? '' : ' unknown'}`;
      const style = option?.color ? ` style="--chip-c:${escapeSheetHtml(option.color)}"` : '';
      return `<span class="${cls}"${style}>${escapeSheetHtml(option?.label ?? raw)}</span>`;
    },
    parse: (input) => (input.trim() ? (matchSheetSelectOption(input, list())?.key ?? null) : ''),
    format: (raw) => find(raw)?.label ?? raw,
    validate: (raw) => (raw && !find(raw) ? `Unknown ${type}: ${raw}` : null),
    toText: (raw) => find(raw)?.label ?? raw,
  };
}

/**
 * The select column's read-only cell: the option's label as a small
 * `sh-chip` coloured through `--chip-c` (`dynamic` when the option carries
 * a colour), `unknown` for a key not among the options, nothing when empty.
 */
@Component({
  selector: 'sh-sheet-select-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ShipChip],
  template: `
    @if (value(); as raw) {
      @let option = current();
      <sh-chip class="xsmall" [class]="option?.className ?? ''" [class.unknown]="!option" [dynamic]="!!option?.color" [style.--chip-c]="option?.color ?? null">
        {{ option?.label ?? raw }}
      </sh-chip>
    }
  `,
  styles: `
    sh-sheet-select-cell {
      display: contents;

      sh-chip {
        max-width: 100%;
        overflow: hidden;

        div {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &.unknown {
          --chip-c: var(--error-8);
        }
      }
    }
  `,
})
export class ShipSheetSelectCell {
  readonly value = input('');
  readonly extension = input.required<SheetCellExtension>();
  readonly current = computed(() => (this.extension() as SheetSelectExtension).find?.(this.value()));
}

/**
 * The select column's editor: an `sh-menu` of the options opened over the
 * cell. Arrows move, Enter picks, Escape or a click elsewhere cancels; the
 * character that opened the editor seeds the menu's search. A pick commits
 * the option's key and stays on the cell.
 */
@Component({
  selector: 'sh-sheet-select-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ShipMenu],
  template: `
    <sh-menu class="shs-select-menu" [searchable]="true" [label]="'Choose ' + ctx().type" (closed)="onClosed()">
      <span trigger class="shs-select-current">{{ current()?.label ?? value() }}</span>
      <ng-container menu>
        @for (option of options(); track option.key) {
          <button type="button" [class.active]="option.key === value()" (click)="pick(option.key)">{{ option.label }}</button>
        }
        @if (value()) {
          <button type="button" class="shs-select-clear" (click)="pick('')">Clear</button>
        }
      </ng-container>
    </sh-menu>
  `,
  styles: `
    sh-sheet-select-editor {
      display: flex;
      min-width: 0;

      .shs-select-menu {
        flex: 1;
        min-width: 0;

        [trigger] {
          display: flex;
          align-items: center;
          width: 100%;
          height: 100%;
        }
      }

      .shs-select-current {
        flex: 1;
        min-width: 0;
        padding: 0 6px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .shs-select-clear {
        color: var(--base-10);
      }
    }
  `,
})
export class ShipSheetSelectEditor implements SheetCellEditor {
  readonly value = input('');
  readonly ctx = input.required<SheetCellContext>();
  readonly typed = input<string | null>(null);
  readonly extension = input.required<SheetCellExtension>();
  readonly editor = input.required<SheetCellEditorApi>();

  readonly menu = viewChild.required(ShipMenu);
  readonly options = computed(() => (this.extension() as SheetSelectExtension).options?.() ?? []);
  readonly current = computed(() => this.options().find((option) => option.key === this.value()));
  readonly #done = signal(false);
  #injector = inject(Injector);

  constructor() {
    afterNextRender(
      () => {
        const menu = this.menu();
        menu.open();
        const typed = this.typed();
        if (!typed) return;
        // The menu focuses its search on a timeout; seed the text after it.
        setTimeout(() => {
          const input = menu.inputRef()?.nativeElement;
          if (!input) return;
          input.value = typed;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        });
      },
      { injector: this.#injector }
    );
  }

  /** A Tab or a click elsewhere keeps the cell's value. */
  readValue(): string {
    return this.value();
  }

  pick(key: string): void {
    if (this.#done()) return;
    this.#done.set(true);
    this.editor().commit(key);
  }

  onClosed(): void {
    if (this.#done()) return;
    this.#done.set(true);
    this.editor().cancel();
  }
}

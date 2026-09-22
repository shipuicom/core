// ---------------------------------------------------------------------------
// ShipSpreadsheet — cell extensions
// ---------------------------------------------------------------------------
//
// The sheet's cells are strings and stay strings. A cell *type* — carried
// per column in `SheetModel.colTypes` — names the extension that interprets
// those strings: how they render, how they are edited, how typed or pasted
// text becomes a stored string. Extensions never see the model, ops, or the
// transform, which is what keeps every one of those unchanged; they are the
// spreadsheet's counterpart of ship-editor's block behaviors.
//
// See EXTENSIONS.md for the design and the extension points to come.

import { Type } from '@angular/core';
import { SHEET_CURRENCY_EXTENSION, SHEET_DATE_EXTENSION, SHEET_NUMBER_EXTENSION, SHEET_PERCENT_EXTENSION } from './sheet-formats';
import { escapeSheetHtml } from './sheet-html';

export { escapeSheetHtml };

/** What an extension knows about the cell it is asked about. */
export interface SheetCellContext {
  readonly row: number;
  readonly col: number;
  readonly type: string;
}

/** Where the caret goes after a commit. */
export type SheetCommitMove = 'none' | 'down' | 'up' | 'right' | 'left';

/**
 * What the composer hands a component editor (its `editor` input): the
 * verbs that end the edit. `commit` stores the string as the cell's raw
 * value (it is the stored form already, not typed text — `parse` is not
 * applied), moves the selection and returns focus to the grid; `cancel`
 * closes the editor and leaves the cell alone.
 */
export interface SheetCellEditorApi {
  commit(raw: string, move?: SheetCommitMove): void;
  cancel(): void;
}

/**
 * Contract for a component editor (`SheetCellExtension.editor`). The
 * composer creates it in the edit overlay over the cell and sets the inputs
 * it declares, by name: `value` (the cell's raw string), `ctx`
 * (`SheetCellContext`), `typed` (the character that opened the editor, or
 * `null` for Enter/F2/double-click), `extension` (the `SheetCellExtension`
 * the cell resolved to, so one component can serve many configured types)
 * and `editor` (`SheetCellEditorApi`).
 * Enter, Tab and Escape inside the editor are the component's own; a Tab
 * or a click elsewhere commits through `readValue` when the component has
 * one, else the edit is cancelled.
 */
export interface SheetCellEditor {
  /** The raw string to store when the composer ends the edit from outside (Tab, a click elsewhere). */
  readValue?(): string;
}

export interface SheetCellExtension {
  /** The key stored in `colTypes`; `'text'` is the built-in default. */
  readonly type: string;
  /**
   * Display HTML for a raw string. Must return escaped markup — the result is
   * written into the row's `innerHTML` payload as is. `''` for an empty cell.
   */
  render(raw: string, ctx: SheetCellContext): string;
  /**
   * Normalize text the user typed or pasted into the stored string. `null`
   * rejects the input (the cell is left unchanged). Default: identity.
   */
  parse?(input: string, ctx: SheetCellContext): string | null;
  /** The text shown in the editor and on the formula bar. Default: the raw string. */
  format?(raw: string, ctx: SheetCellContext): string;
  /**
   * Enter, Space, or a click on the cell "activates" it: return the new raw
   * string to commit — a checkbox toggles here — or `null` to do nothing.
   * A type with `activate` and `editor: 'none'` never opens a text editor.
   */
  activate?(raw: string, ctx: SheetCellContext): string | null;
  /**
   * How the cell is edited: `'text'` (the built-in overlay, default),
   * `'none'` (activation only), or a component the composer creates in the
   * overlay's place (a select, a picker, a date picker) — see
   * `SheetCellEditor` for the inputs it receives and how it commits.
   */
  readonly editor?: 'text' | 'none' | Type<SheetCellEditor>;
  /**
   * For the `'text'` editor: the HTML input type to edit with (`'date'`,
   * `'time'`, `'number'`) instead of the multiline textarea. The editor
   * opens on `format(raw)` and commits through `parse` as usual.
   */
  readonly inputType?: string;
  /** Validation for a stored string: an error message, or `null` when fine. */
  validate?(raw: string, ctx: SheetCellContext): string | null;
  /** Plain-text export (TSV/CSV/search); default: the raw string. */
  toText?(raw: string, ctx: SheetCellContext): string;
  /** Markdown export; default: `toText`. */
  toMarkdown?(raw: string, ctx: SheetCellContext): string;
  /** HTML export for the `<table>` document form; default: escaped `toText`. */
  toHtml?(raw: string, ctx: SheetCellContext): string;
}

/** The default: the raw string, escaped. */
export const SHEET_TEXT_EXTENSION: SheetCellExtension = {
  type: 'text',
  render: (raw) => escapeSheetHtml(raw),
};

const TRUE_WORDS = new Set(['true', '1', 'x', 'yes', 'y', '☑', '☒', '[x]', 'on', 'checked']);

/** `'true'` / `''` in the model; renders a box; a click or Enter toggles. */
export const SHEET_CHECKBOX_EXTENSION: SheetCellExtension = {
  type: 'checkbox',
  editor: 'none',
  render: (raw) => (raw === 'true' ? '<span class="shs-check on" aria-hidden="true">☑</span>' : '<span class="shs-check" aria-hidden="true">☐</span>'),
  parse: (input) => (TRUE_WORDS.has(input.trim().toLowerCase()) ? 'true' : ''),
  activate: (raw) => (raw === 'true' ? '' : 'true'),
  toText: (raw) => (raw === 'true' ? 'true' : 'false'),
  toMarkdown: (raw) => (raw === 'true' ? '[x]' : '[ ]'),
};

/** Every built-in type, in registry order: text, checkbox, number, currency, percent, date. */
export const SHEET_BUILTIN_EXTENSIONS: readonly SheetCellExtension[] = [
  SHEET_TEXT_EXTENSION,
  SHEET_CHECKBOX_EXTENSION,
  SHEET_NUMBER_EXTENSION,
  SHEET_CURRENCY_EXTENSION,
  SHEET_PERCENT_EXTENSION,
  SHEET_DATE_EXTENSION,
];

/**
 * The extensions a composer instance resolves types against. Unknown types
 * fall back to text, so a document typed by an app-side extension the
 * current host does not register still renders its raw strings.
 */
export class SheetCellRegistry {
  readonly #byType = new Map<string, SheetCellExtension>();

  constructor(extensions: readonly SheetCellExtension[] = []) {
    for (const ext of [...SHEET_BUILTIN_EXTENSIONS, ...extensions]) this.#byType.set(ext.type, ext);
  }

  get(type: string | null | undefined): SheetCellExtension {
    return (type ? this.#byType.get(type) : undefined) ?? SHEET_TEXT_EXTENSION;
  }

  has(type: string): boolean {
    return this.#byType.has(type);
  }

  types(): string[] {
    return [...this.#byType.keys()];
  }
}

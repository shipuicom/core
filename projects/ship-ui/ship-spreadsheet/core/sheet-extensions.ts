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

/** What an extension knows about the cell it is asked about. */
export interface SheetCellContext {
  readonly row: number;
  readonly col: number;
  readonly type: string;
}

/** Contract for a mounted custom editor (see `SheetCellExtension.editor`). */
export interface SheetCellEditor {
  /** The raw string to start from; set by the composer right after creation. */
  value: string;
  /** Called by the composer to read the result when the edit commits. */
  readValue(): string;
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
   * `'none'` (activation only), or a component the composer mounts in the
   * overlay's place (a date picker, a select) implementing `SheetCellEditor`.
   */
  readonly editor?: 'text' | 'none' | Type<SheetCellEditor>;
  /** Validation for a stored string: an error message, or `null` when fine. */
  validate?(raw: string, ctx: SheetCellContext): string | null;
  /** Plain-text export (TSV/CSV/search); default: the raw string. */
  toText?(raw: string, ctx: SheetCellContext): string;
  /** Markdown export; default: `toText`. */
  toMarkdown?(raw: string, ctx: SheetCellContext): string;
  /** HTML export for the `<table>` document form; default: escaped `toText`. */
  toHtml?(raw: string, ctx: SheetCellContext): string;
}

export function escapeSheetHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

/**
 * The extensions a composer instance resolves types against. Unknown types
 * fall back to text, so a document typed by an app-side extension the
 * current host does not register still renders its raw strings.
 */
export class SheetCellRegistry {
  readonly #byType = new Map<string, SheetCellExtension>();

  constructor(extensions: readonly SheetCellExtension[] = []) {
    for (const ext of [SHEET_TEXT_EXTENSION, SHEET_CHECKBOX_EXTENSION, ...extensions]) this.#byType.set(ext.type, ext);
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

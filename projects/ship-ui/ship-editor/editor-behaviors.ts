import type { EditorEngineService } from './editor-engine.service';
import { ASTBlockNode, ASTMark, BlockBehaviorManifest, BlockCategory, LogicalSelection } from './editor.types';

export interface BehaviorContext {
  engine: EditorEngineService;
  selection: LogicalSelection;
  blockEl?: HTMLElement;
}

/** Context handed to a block's `contextualActions()` when it is the active
 * contextual target (currently: a selected void block such as an image). */
export interface ContextualActionCtx {
  block: ASTBlockNode;
  index: number;
  engine: EditorEngineService;
}

/**
 * One button in the contextual toolbar. Behaviors return these from
 * `contextualActions()`, and consumers can contribute more via the editor's
 * `contextualActions` input — so the toolbar is extensible without forking.
 */
export interface ContextualAction {
  /** Stable id (used as the render key and to dedupe). */
  id: string;
  /** Icon ligature name (rendered via `sh-icon`); falls back to `label`. */
  icon?: string;
  /** Text label — the button text when there's no icon, and the tooltip. */
  label: string;
  /** Toggle highlight when true (e.g. the current image layout mode). */
  isActive?: boolean;
  /** Destructive styling (e.g. delete). */
  danger?: boolean;
  /** Perform the action (typically an engine call — an undoable transaction). */
  run: () => void;
}

/** Context handed to a behavior's `slashCommands()`. The list is built once,
 * globally (not tied to a specific block), so this only carries the engine. */
export interface SlashCommandCtx {
  engine: EditorEngineService;
}

/**
 * One entry in the slash-command menu. Behaviors return these from
 * `slashCommands()`, and consumers can contribute more via the editor's
 * `slashCommands` input — so the menu is extensible without forking, exactly
 * like {@link ContextualAction} is for the contextual toolbar.
 */
export interface SlashCommand {
  /** Stable id (render key / dedupe). */
  id: string;
  /** Menu label, e.g. "Heading 1". */
  label: string;
  /** Icon ligature name (rendered via `sh-icon`). */
  icon?: string;
  /** Extra match terms beyond the label, e.g. ['h1','title'] for a heading. */
  keywords?: string[];
  /** Section header the entry sits under, e.g. 'Basic', 'Media'. */
  group?: string;
  /** Apply the command — typically `ctx.engine.dispatch(type, attrs)`. Runs
   * after the menu has removed the `/query` trigger text from the block. */
  run: (ctx: SlashCommandCtx) => void;
}

export abstract class BaseBlockBehavior implements BlockBehaviorManifest {
  abstract readonly type: string;
  abstract readonly category: BlockCategory;

  abstract readonly enterPhysics: BlockBehaviorManifest['enterPhysics'];
  abstract readonly backspacePhysics: BlockBehaviorManifest['backspacePhysics'];

  keybinding?: string;
  activeClassName?: string;

  /**
   * When true, `\n` in this block's text is significant whitespace rendered
   * literally (code blocks in `<pre>`). When false/omitted, `\n` is a soft line
   * break rendered as `<br>` (Shift+Enter), the way a paragraph works.
   */
  preserveWhitespace?: boolean;

  /**
   * When true, dispatching this block's action opens input UI (a `uiRequest`)
   * instead of converting the current block — for blocks that need data before
   * they can exist, e.g. an image needs a `src`.
   */
  requestsUi?: boolean;

  abstract parseDOM(el: HTMLElement): ASTBlockNode | null;

  /**
   * Render this block to an HTML string. `contentHtml` is already-escaped
   * inline markup and safe to interpolate verbatim.
   *
   * SECURITY CONTRACT: the returned string becomes live DOM (patchDOM →
   * innerHTML) and the serialized `value`, and `block.attrs` can arrive from
   * untrusted JSON. Every attr you interpolate MUST go through `escapeAttr()`
   * (attribute values), `isSafeUrl()` (href/src — rewrite failures to '#'/''),
   * or an allow-list (enum-valued attrs interpolated into class/tag names).
   * See `standard-behaviors.ts` (ImageBehavior/LinkBehavior) for the pattern;
   * both helpers are exported from `./editor-sanitize`.
   */
  abstract renderHTML(block: ASTBlockNode, contentHtml: string): string;
  renderMarkdown?(block: ASTBlockNode, contentMd: string): string;

  resolveDOMPosition?(blockEl: Element, block: ASTBlockNode, offset: number): { node: Node; offset: number } | null;

  /**
   * Buttons for the contextual toolbar, shown while this block is the active
   * contextual target (a selected void block today). Return the actions in
   * display order; the generic toolbar renders them and consumer-provided
   * extras. See {@link ContextualAction}.
   */
  contextualActions?(ctx: ContextualActionCtx): ContextualAction[];

  /**
   * Entries this block contributes to the slash-command menu (e.g. a heading
   * behavior offers "Heading 1"/"Heading 2"). Aggregated across all registered
   * behaviors by the engine, so a new block type is slash-insertable without
   * touching the menu. See {@link SlashCommand}.
   */
  slashCommands?(ctx: SlashCommandCtx): SlashCommand[];

  onKeyAction?(engine: EditorEngineService): void;
  onClick?(event: MouseEvent, ctx: BehaviorContext): void;
}

export abstract class BaseInlineBehavior {
  abstract readonly type: string;

  // Controls mark behavior when typing precisely at the trailing edge of the styled text
  abstract readonly isSticky: boolean;

  /**
   * When true, dispatching this mark's action without attrs does NOT toggle it
   * — the engine emits a `uiRequest` instead, so attr-carrying marks (link)
   * can open an input UI. The UI then commits via `setMark`/`removeMark`.
   */
  requestsUi?: boolean;

  keybinding?: string;

  abstract parseDOM(el: HTMLElement): ASTMark | null;

  /**
   * Render `text` (already escaped — interpolate verbatim) wrapped in this
   * mark's markup.
   *
   * SECURITY CONTRACT: same as {@link BaseBlockBehavior.renderHTML} — any
   * `mark.attrs` value you interpolate MUST pass `escapeAttr()` and, for URL
   * attributes, `isSafeUrl()` (both exported from `./editor-sanitize`).
   */
  abstract renderHTML(mark: ASTMark, text: string): string;
  renderMarkdown?(mark: ASTMark, text: string): string;

  onKeyAction?(engine: EditorEngineService): void;
}

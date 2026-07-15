import type { EditorEngineService } from './editor-engine.service';
import { ASTBlockNode, ASTMark, BlockBehaviorManifest, BlockCategory, LogicalSelection } from './editor.types';

export interface BehaviorContext {
  engine: EditorEngineService;
  selection: LogicalSelection;
  blockEl?: HTMLElement;
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

import type { EditorEngineService } from './editor-engine.service';
import { ASTBlockNode, ASTMark, BlockBehaviorManifest, BlockCategory, LogicalSelection } from './editor.types';

export interface BehaviorContext {
  engine: EditorEngineService;
  selection: LogicalSelection;
  blockEl?: HTMLElement;
}

export interface ContextualActionCtx {
  block: ASTBlockNode;
  index: number;
  engine: EditorEngineService;
}

export interface ContextualAction {

  id: string;

  icon?: string;

  label: string;

  isActive?: boolean;

  danger?: boolean;

  run: () => void;
}

export interface SlashCommandCtx {
  engine: EditorEngineService;
}

export interface SlashCommand {

  id: string;

  label: string;

  icon?: string;

  keywords?: string[];

  group?: string;

  run: (ctx: SlashCommandCtx) => void;
}

export abstract class BaseBlockBehavior implements BlockBehaviorManifest {
  abstract readonly type: string;
  abstract readonly category: BlockCategory;

  abstract readonly enterPhysics: BlockBehaviorManifest['enterPhysics'];
  abstract readonly backspacePhysics: BlockBehaviorManifest['backspacePhysics'];

  keybinding?: string;
  activeClassName?: string;

  preserveWhitespace?: boolean;

  requestsUi?: boolean;

  abstract parseDOM(el: HTMLElement): ASTBlockNode | null;

  abstract renderHTML(block: ASTBlockNode, contentHtml: string): string;
  renderMarkdown?(block: ASTBlockNode, contentMd: string): string;

  resolveDOMPosition?(blockEl: Element, block: ASTBlockNode, offset: number): { node: Node; offset: number } | null;

  contextualActions?(ctx: ContextualActionCtx): ContextualAction[];

  slashCommands?(ctx: SlashCommandCtx): SlashCommand[];

  onKeyAction?(engine: EditorEngineService): void;
  onClick?(event: MouseEvent, ctx: BehaviorContext): void;
}

export abstract class BaseInlineBehavior {
  abstract readonly type: string;

  abstract readonly isSticky: boolean;

  requestsUi?: boolean;

  keybinding?: string;

  abstract parseDOM(el: HTMLElement): ASTMark | null;

  abstract renderHTML(mark: ASTMark, text: string): string;
  renderMarkdown?(mark: ASTMark, text: string): string;

  onKeyAction?(engine: EditorEngineService): void;
}

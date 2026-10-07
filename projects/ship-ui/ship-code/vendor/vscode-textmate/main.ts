// vscode-textmate v9.1.0 — typed entry over the vendored bundle in main.impl.ts.
// The declarations below are the public surface of the upstream `main.d.ts`
// (with the handful of types it pulled from internal files inlined); the
// values are bound from the bundle so TypeScript compiles this module and
// ng-packagr bundles it like any other library source.

import impl from './main.impl';

// --- Oniguruma bridge (onigLib.d.ts) ---------------------------------------

export interface IOnigLib {
  createOnigScanner(sources: string[]): OnigScanner;
  createOnigString(str: string): OnigString;
}
export interface IOnigCaptureIndex {
  start: number;
  end: number;
  length: number;
}
export interface IOnigMatch {
  index: number;
  captureIndices: IOnigCaptureIndex[];
}
export enum FindOption {
  None = 0,
  /** ONIG_OPTION_NOT_BEGIN_STRING: (str) isn't considered as begin of string (fails \A) */
  NotBeginString = 1,
  /** ONIG_OPTION_NOT_END_STRING: (end) isn't considered as end of string (fails \z, \Z) */
  NotEndString = 2,
  /** ONIG_OPTION_NOT_BEGIN_POSITION: (start) isn't considered as start position of search (fails \G) */
  NotBeginPosition = 4,
  /** used for debugging purposes. */
  DebugCall = 8,
}
export type OrMask<T extends number> = number;
export interface OnigScanner {
  findNextMatchSync(string: string | OnigString, startPosition: number, options: OrMask<FindOption>): IOnigMatch | null;
  dispose?(): void;
}
export interface OnigString {
  readonly content: string;
  dispose?(): void;
}

// --- Raw grammar (rawGrammar.d.ts) -----------------------------------------

/** Identifiers with a binary dot operator, e.g. `baz` or `foo.bar`. */
export type ScopeName = string;
/** ScopeNames joined by a binary space (nesting) operator, e.g. `foo.bar boo.baz`. */
export type ScopePath = string;
/** ScopePaths joined by a binary comma (alternatives) operator, e.g. `foo.bar boo.baz,quick quack`. */
export type ScopePattern = string;

export type RuleId = { __brand: 'RuleId' };
export type IncludeString = string;
export type RegExpString = string;

export interface ILocation {
  readonly filename: string;
  readonly line: number;
  readonly char: number;
}
export interface ILocatable {
  readonly $vscodeTextmateLocation?: ILocation;
}
export interface IRawRepositoryMap {
  [name: string]: IRawRule;
  $self: IRawRule;
  $base: IRawRule;
}
export type IRawRepository = IRawRepositoryMap & ILocatable;
export interface IRawCapturesMap {
  [captureId: string]: IRawRule;
}
export type IRawCaptures = IRawCapturesMap & ILocatable;
export interface IRawRule extends ILocatable {
  id?: RuleId;
  readonly include?: IncludeString;
  readonly name?: ScopeName;
  readonly contentName?: ScopeName;
  readonly match?: RegExpString;
  readonly captures?: IRawCaptures;
  readonly begin?: RegExpString;
  readonly beginCaptures?: IRawCaptures;
  readonly end?: RegExpString;
  readonly endCaptures?: IRawCaptures;
  readonly while?: RegExpString;
  readonly whileCaptures?: IRawCaptures;
  readonly patterns?: IRawRule[];
  readonly repository?: IRawRepository;
  readonly applyEndPatternLast?: boolean;
}
export interface IRawGrammar extends ILocatable {
  repository: IRawRepository;
  readonly scopeName: ScopeName;
  readonly patterns: IRawRule[];
  readonly injections?: { [expression: string]: IRawRule };
  readonly injectionSelector?: string;
  readonly fileTypes?: string[];
  readonly name?: string;
  readonly firstLineMatch?: string;
}

// --- Raw theme (theme.d.ts) ------------------------------------------------

/** A TextMate theme. */
export interface IRawTheme {
  readonly name?: string;
  readonly settings: IRawThemeSetting[];
}
/** A single theme setting. */
export interface IRawThemeSetting {
  readonly name?: string;
  readonly scope?: ScopePattern | ScopePattern[];
  readonly settings: {
    readonly fontStyle?: string;
    readonly foreground?: string;
    readonly background?: string;
  };
}

// --- Token attributes (encodedTokenAttributes.d.ts) -------------------------

export enum StandardTokenType {
  Other = 0,
  Comment = 1,
  String = 2,
  RegEx = 3,
}

// --- Registry (main.d.ts) --------------------------------------------------

/** A registry helper that can locate grammar file paths given scope names. */
export interface RegistryOptions {
  onigLib: Promise<IOnigLib>;
  theme?: IRawTheme;
  colorMap?: string[];
  loadGrammar(scopeName: ScopeName): Promise<IRawGrammar | undefined | null>;
  getInjections?(scopeName: ScopeName): ScopeName[] | undefined;
}
/** A map from scope name to a language id. Please do not use language id 0. */
export interface IEmbeddedLanguagesMap {
  [scopeName: string]: number;
}
/** A map from selectors to token types. */
export interface ITokenTypeMap {
  [selector: string]: StandardTokenType;
}
export interface IGrammarConfiguration {
  embeddedLanguages?: IEmbeddedLanguagesMap;
  tokenTypes?: ITokenTypeMap;
  balancedBracketSelectors?: string[];
  unbalancedBracketSelectors?: string[];
}

/** The registry that will hold all grammars. */
export interface Registry {
  dispose(): void;
  /** Change the theme. Once called, no previous `ruleStack` should be used anymore. */
  setTheme(theme: IRawTheme, colorMap?: string[]): void;
  /** Returns a lookup array for color ids. */
  getColorMap(): string[];
  /** Load the grammar for `scopeName` and all referenced included grammars asynchronously. Please do not use language id 0. */
  loadGrammarWithEmbeddedLanguages(
    initialScopeName: ScopeName,
    initialLanguage: number,
    embeddedLanguages: IEmbeddedLanguagesMap,
  ): Promise<IGrammar | null>;
  /** Load the grammar for `scopeName` and all referenced included grammars asynchronously. Please do not use language id 0. */
  loadGrammarWithConfiguration(
    initialScopeName: ScopeName,
    initialLanguage: number,
    configuration: IGrammarConfiguration,
  ): Promise<IGrammar | null>;
  /** Load the grammar for `scopeName` and all referenced included grammars asynchronously. */
  loadGrammar(initialScopeName: ScopeName): Promise<IGrammar | null>;
  /** Adds a rawGrammar. */
  addGrammar(
    rawGrammar: IRawGrammar,
    injections?: string[],
    initialLanguage?: number,
    embeddedLanguages?: IEmbeddedLanguagesMap | null,
  ): Promise<IGrammar>;
}
export interface RegistryConstructor {
  new (options: RegistryOptions): Registry;
}

/** A grammar */
export interface IGrammar {
  /** Tokenize `lineText` using previous line state `prevState`. */
  tokenizeLine(lineText: string, prevState: StateStack | null, timeLimit?: number): ITokenizeLineResult;
  /**
   * Tokenize `lineText` using previous line state `prevState`. The result
   * contains the tokens in binary format (language, token type, font style,
   * foreground and background colors packed into one number per token).
   */
  tokenizeLine2(lineText: string, prevState: StateStack | null, timeLimit?: number): ITokenizeLineResult2;
}
export interface ITokenizeLineResult {
  readonly tokens: IToken[];
  /** The `prevState` to be passed on to the next line tokenization. */
  readonly ruleStack: StateStack;
  /** Did tokenization stop early due to reaching the time limit. */
  readonly stoppedEarly: boolean;
}
export interface ITokenizeLineResult2 {
  /** Tokens in binary format: two array indices per token, startIndex then metadata. */
  readonly tokens: Uint32Array;
  /** The `prevState` to be passed on to the next line tokenization. */
  readonly ruleStack: StateStack;
  /** Did tokenization stop early due to reaching the time limit. */
  readonly stoppedEarly: boolean;
}
export interface IToken {
  startIndex: number;
  readonly endIndex: number;
  readonly scopes: string[];
}
/** **IMPORTANT** - Immutable! */
export interface StateStack {
  _stackElementBrand: void;
  readonly depth: number;
  clone(): StateStack;
  equals(other: StateStack): boolean;
}

// --- State stack diffs (diffStateStacks.d.ts) -------------------------------

/** One frame of a serialized state stack; opaque to callers. */
export interface StateStackFrame {
  readonly ruleId: number;
  readonly enterPos?: number;
  readonly anchorPos?: number;
  readonly beginRuleCapturedEOL: boolean;
  readonly endRule: string | null;
  readonly nameScopesList: string | null;
  readonly contentNameScopesList: string | null;
}
export interface StackDiff {
  readonly pops: number;
  readonly newFrames: StateStackFrame[];
}

// --- Values --------------------------------------------------------------------

export const Registry: RegistryConstructor = impl.Registry;
export const INITIAL: StateStack = impl.INITIAL;
export const parseRawGrammar: (content: string, filePath?: string) => IRawGrammar = impl.parseRawGrammar;
export const diffStateStacksRefEq: (first: StateStack, second: StateStack) => StackDiff = impl.diffStateStacksRefEq;
export const applyStateStackDiff: (stack: StateStack | null, diff: StackDiff) => StateStack | null =
  impl.applyStateStackDiff;
export const disposeOnigString: (str: OnigString) => void = impl.disposeOnigString;

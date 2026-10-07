// vscode-oniguruma v2.0.1 — typed entry over the vendored bundle in main.impl.ts.
// The declarations below are the upstream `main.d.ts`; the values are bound
// from the bundle so TypeScript compiles this module and ng-packagr bundles it
// like any other library source. The WASM core ships beside it as onig.wasm.

import impl from './main.impl';

export interface WebAssemblyInstantiator {
  (
    importObject: Record<string, Record<string, WebAssembly.ImportValue>> | undefined,
  ): Promise<WebAssembly.WebAssemblyInstantiatedSource>;
}
interface ICommonOptions {
  print?(str: string): void;
}
interface IInstantiatorOptions extends ICommonOptions {
  instantiator: WebAssemblyInstantiator;
}
interface IDataOptions extends ICommonOptions {
  data: ArrayBufferView | ArrayBuffer | Response;
}
export type IOptions = IInstantiatorOptions | IDataOptions;

export interface OnigString {
  readonly content: string;
  dispose(): void;
}
export interface OnigStringConstructor {
  new (content: string): OnigString;
}

export enum FindOption {
  Default,
  None,
  Ignorecase,
  Extend,
  Multiline,
  Singleline,
  FindLongest,
  FindNotEmpty,
  NegateSingleline,
  DontCaptureGroup,
  CaptureGroup,
  Notbol,
  Noteol,
  CheckValidityOfString,
  IgnorecaseIsAscii,
  WordIsAscii,
  DigitIsAscii,
  SpaceIsAscii,
  PosixIsAscii,
  TextSegmentExtendedGraphemeCluster,
  TextSegmentWord,
  NotBeginString,
  NotEndString,
  NotBeginPosition,
  CallbackEachMatch,
  DebugCall,
}

export enum Syntax {
  Default,
  Asis,
  PosixBasic,
  PosixExtended,
  Emacs,
  Grep,
  GnuRegex,
  Java,
  Perl,
  PerlNg,
  Ruby,
  Python,
  Oniguruma,
}

export interface IOnigScannerConfig {
  options?: FindOption[];
  syntax?: Syntax;
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

export interface OnigScanner {
  dispose(): void;
  findNextMatchSync(string: string | OnigString, startPosition: number, options: FindOption[]): IOnigMatch | null;
  findNextMatchSync(string: string | OnigString, startPosition: number, debugCall: boolean): IOnigMatch | null;
  findNextMatchSync(string: string | OnigString, startPosition: number): IOnigMatch | null;
}
export interface OnigScannerConstructor {
  new (patterns: string[], config?: IOnigScannerConfig): OnigScanner;
}

export interface LoadWASM {
  (options: IOptions): Promise<void>;
  (data: ArrayBufferView | ArrayBuffer | Response): Promise<void>;
}

export const loadWASM: LoadWASM = impl.loadWASM;
export const createOnigString: (str: string) => OnigString = impl.createOnigString;
export const createOnigScanner: (patterns: string[]) => OnigScanner = impl.createOnigScanner;
export const setDefaultDebugCall: (defaultDebugCall: boolean) => void = impl.setDefaultDebugCall;
export const OnigString: OnigStringConstructor = impl.OnigString;
export const OnigScanner: OnigScannerConstructor = impl.OnigScanner;

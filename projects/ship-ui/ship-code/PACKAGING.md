# ship-code packaging

`@ship-ui/core/ship-code` is a normal secondary entry point. Its TextMate engine depends on two vendored bundles
(`vendor/vscode-textmate`, `vendor/vscode-oniguruma`, see `vendor/README.md`), which keeps `@ship-ui/core`
dependency-free.

ng-packagr's FESM bundler resolves relative imports only among the files ngtsc compiled, so a vendored `main.js`
with a hand-written `main.d.ts` beside it can never be bundled (the `.d.ts` satisfies TypeScript and the `.js` is
never emitted). Each vendored bundle is therefore stored as `main.impl.ts` (the upstream ESM output under
`// @ts-nocheck`) with a typed `main.ts` entry that re-exports its values under the upstream declarations.

The Oniguruma WASM binary is not bundled: the primary `ng-package.json` publishes it as an asset at
`ship-code/vendor/vscode-oniguruma/onig.wasm`, and the application serves it (the docs app copies it to
`/assets/ship-code/onig.wasm` through `angular.json`) and hands its URL to `createVSCodeEngine`.

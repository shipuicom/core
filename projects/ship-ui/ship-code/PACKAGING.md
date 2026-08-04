# ship-code is not published yet

`ng-package.json` is renamed to `ng-package.json.disabled`, which is how
ng-packagr discovers secondary entry points — without it, `ng build ship-ui`
skips this directory and `@ship-ui/core/ship-code` is not emitted.

## Why

The TextMate engine imports the vendored bundles directly:

```ts
import { Registry } from '../vendor/vscode-textmate/main';
import { loadWASM }  from '../vendor/vscode-oniguruma/main';
```

Each vendor entry ships as `main.js` **plus** a hand-written `main.d.ts`.
TypeScript resolves the declaration file and never compiles the `.js`, so
ng-packagr's bundler is left with an import it cannot resolve:

```
Could not resolve "../vendor/vscode-textmate/main"
  from "dist/ship-ui/tmp-esm2022/ship-code/textmate/vscode-engine.js"
```

`allowJs` alone does not fix it — the `.d.ts` still shadows the `.js`.

## To re-enable

Fix the vendor packaging, then rename the file back. Options, roughly in order
of preference:

1. Convert the vendor entry points to `.ts` (dropping the shadowing `.d.ts`) so
   they compile into the output tree.
2. Publish the vendored bundles as real dependencies and import them by package
   name, letting ng-packagr treat them as external.
3. Split the TextMate engine into its own entry point that is built separately
   with a bundler that can consume plain ESM `.js`.

Nothing in the library imports `@ship-ui/core/ship-code`, and the design-system
demo resolves it from source through the `@ship-ui/core/*` tsconfig path, so
both keep working while it is gated.

# Vendored Dependencies

These libraries are vendored (copied directly) rather than installed via npm.
This keeps `@ship-ui/core` dependency-free while giving us a stable API surface
to code against. When we build our own Rust/Zig WASM tokenizer engine, these
files will be replaced by a drop-in substitute.

## vscode-textmate v9.1.0

- **Source**: https://github.com/microsoft/vscode-textmate
- **License**: MIT (see `vscode-textmate/LICENSE.md`)
- **Files**: `main.impl.ts` (the upstream `release/main.js` bundle converted to ESM, `// @ts-nocheck`),
  `main.ts` (typed entry: the public surface of the upstream `main.d.ts`, values bound from `main.impl.ts`)
- **Purpose**: TextMate grammar parser + scope stack tokenizer

## vscode-oniguruma v2.0.1

- **Source**: https://github.com/nicklockwood/vscode-oniguruma
- **License**: MIT (see `vscode-oniguruma/LICENSE.txt`)
- **Files**: `main.impl.ts` (the upstream `release/main.js` converted to ESM, `// @ts-nocheck`), `main.ts` (typed entry
  over it), `onig.wasm` (Oniguruma regex engine; published as a package asset at `ship-code/vendor/vscode-oniguruma/onig.wasm`)
- **Purpose**: Oniguruma regular expression engine compiled to WASM

## Updating

To update a vendored package. ng-packagr only bundles files ngtsc compiled, so the upstream bundle is kept as a
`.ts` module rather than a `.js` + `.d.ts` pair:

```bash
cd /tmp
npm pack vscode-textmate@<version>
tar xzf vscode-textmate-<version>.tgz
npx esbuild package/release/main.js --format=esm --bundle --platform=neutral --outfile=<target>/main.impl.ts
sed -i '' '1i\
// @ts-nocheck
' <target>/main.impl.ts
rm -rf package vscode-textmate-<version>.tgz
```

Then diff the upstream `release/main.d.ts` against `<target>/main.ts` and update the typed entry, and update the
version in this README.

## TextMate grammars (`../grammars/*.json`)

Vendored from the VS Code repository (`microsoft/vscode`, `main`), from
`extensions/<lang>/syntaxes/`:

- `typescript.json` ← `typescript-basics/syntaxes/TypeScript.tmLanguage.json`
- `html.json` ← `html/syntaxes/html.tmLanguage.json`
- `css.json` ← `css/syntaxes/css.tmLanguage.json`
- `json.json` ← `json/syntaxes/JSON.tmLanguage.json`

Licenses: the grammars ship under the licenses noted in each file's
`information_for_contributors` header (MIT-licensed upstream sources,
distributed by VS Code under MIT). After updating a JSON, regenerate the
bundler-facing `.grammar.ts` modules:

```bash
cd projects/ship-ui/ship-code/grammars
for lang in typescript html css json; do node -e "
const fs = require('fs');
const parsed = JSON.parse(fs.readFileSync('$lang.json', 'utf8'));
fs.writeFileSync('$lang.grammar.ts',
  '// Generated from $lang.json (vendored VS Code grammar) — regenerate, do not edit.\n' +
  'const grammar = ' + JSON.stringify(parsed) + ' as object;\nexport default grammar;\n');
"; done
```

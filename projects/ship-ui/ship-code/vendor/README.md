# Vendored Dependencies

These libraries are vendored (copied directly) rather than installed via npm.
This keeps `@ship-ui/core` dependency-free while giving us a stable API surface
to code against. When we build our own Rust/Zig WASM tokenizer engine, these
files will be replaced by a drop-in substitute.

## vscode-textmate v9.1.0

- **Source**: https://github.com/microsoft/vscode-textmate
- **License**: MIT (see `vscode-textmate/LICENSE.md`)
- **Files**: `main.js` (bundled), `main.d.ts` (types)
- **Purpose**: TextMate grammar parser + scope stack tokenizer

## vscode-oniguruma v2.0.1

- **Source**: https://github.com/nicklockwood/vscode-oniguruma
- **License**: MIT (see `vscode-oniguruma/LICENSE.txt`)
- **Files**: `main.js` (JS bindings), `main.d.ts` (types), `onig.wasm` (Oniguruma regex engine)
- **Purpose**: Oniguruma regular expression engine compiled to WASM

## Updating

To update a vendored package:

```bash
cd /tmp
npm pack vscode-textmate@<version>
tar xzf vscode-textmate-<version>.tgz
cp package/release/main.js <target>/main.js
cp package/release/main.d.ts <target>/main.d.ts
rm -rf package vscode-textmate-<version>.tgz
```

Then update the version in this README.

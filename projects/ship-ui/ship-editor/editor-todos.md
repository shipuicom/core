# 🚀 ShipEditor Evolution TODO

## 🔒 Security (Critical)
- [x] **Sanitization Overhaul**: Replace regex-based `sanitizeHTML` with a `DOMParser` + allow-list walker.
- [x] **Attribute Escaping**: Ensure all `toHTML` methods in extensions call `escapeHTML` on attributes.
- [x] **Protocol Guard**: Add a `safeProtocol` check for `href` and `src` attributes (block `javascript:`).

## ⚡ Performance (High)
- [x] **Fast Selection Mapping**: Optimized `mapDOMPositionToLogical` to use `closest()` and `TreeWalker`.
- [x] **Structural Sharing / Fast Clone**: Optimized `cloneDoc` to use `structuredClone`.
- [x] **Debounce Markdown**: Implemented dual-phase debouncing (Phase 1: AST, Phase 2: Serialization).

## 🏗️ Architecture (Medium)
- [x] **DI Registry**: Moved `ShipEditorRegistry` to an injectable Angular Service (provided per-component).
- [x] **Parser Unification**: Unified HTML/Markdown output via `jsonToMarkdown` and common AST parsing.
- [x] **Extension Lifecycle**: Added `onInit` and `onDestroy` hooks to extensions.
- [x] **Interactive Blocks**: Implemented mini-editor behavior for code blocks (Tab/Auto-indent).

## ✅ Completed
- [x] Caret Selection Hardening (Phase 1)
- [x] Initial XSS Sanitizer (Phase 2)
- [x] Input Debouncing (Phase 3)
- [x] Markdown Code Fence Protection (Phase 4)
- [x] Fast Selection Mapping (Phase 5)
- [x] Registry DI Refactor (Phase 6)
- [x] Unified Markdown Pipeline (Phase 7)
- [x] Code Block Interactivity (Phase 8)
- [x] Accessibility & Paste Hardening (Phase 9)

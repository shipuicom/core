# Migration Guide: Upgrading to Secondary Entry Points

Starting with version `0.21.0`, ShipUI has transitioned from a single unified bundle import to a **Modular Secondary Entry Points** architecture. This guide walks you through why we made this change and how to update your codebase.

---

## Why Secondary Entry Points?

Previously, all components were exported from the main `@ship-ui/core` entry point. While convenient, this had several drawbacks:
1. **Slower Dev Server (HMR)**: During development (`ng serve`), changing a single file forced the Vite dev server to compile and load all 35+ components and their styles, resulting in slower hot-reload times.
2. **Fragile Tree-Shaking**: If a single component or utility in the main bundle contained a side-effect, the bundler was forced to include the entire library in your production bundles, causing bundle bloat.
3. **IDE Performance**: Autocomplete and type checking were slower because the TypeScript language server had to parse the entire package at once.

Under the new model, each component is built and served as a separate, self-contained sub-package (e.g., `@ship-ui/core/ship-button`), yielding **faster development startup/reload times, smaller production bundles, and a snappier IDE experience**.

---

## Step-by-Step Migration

### 1. Update TypeScript Component Imports

You must separate component imports from the main `@ship-ui/core` entry point and direct them to their respective subpaths.

#### ❌ Before:
```typescript
import { Component } from '@angular/core';
import { ShipButton, ShipIcon, ShipCard, ShipTooltip } from '@ship-ui/core';

@Component({
  selector: 'app-my-feature',
  standalone: true,
  imports: [ShipButton, ShipIcon, ShipCard, ShipTooltip],
  template: `...`
})
export class MyFeatureComponent {}
```

####  After:
```typescript
import { Component } from '@angular/core';
// Components import from their respective secondary entry points
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipCard } from '@ship-ui/core/ship-card';

// Global directives and utilities continue to import from the primary entry point
import { ShipTooltip } from '@ship-ui/core';

@Component({
  selector: 'app-my-feature',
  standalone: true,
  imports: [ShipButton, ShipIcon, ShipCard, ShipTooltip],
  template: `...`
})
export class MyFeatureComponent {}
```

### 2. Verify Stylesheet Setup

The global stylesheet configuration remains backward compatible. Ensure your application's `styles.scss` continues to load the root variables, sheet utility, and basic resets:

```scss
@use '@ship-ui/core/styles';
```

If you configure shadow styles or font setups, make sure to pass them down:

```scss
@use '@ship-ui/core/styles' with (
  $useInterTight: true,
  $shipButtonShadow: true,
  $shipFormFieldShadow: true
);
```

### 3. Verify Asset Glob Mapping (`angular.json`)

Double check your `angular.json` configuration. Ensure the input directory resolves to the scoped package:

```json
"assets": [
  "src/assets",
  {
    "glob": "**/*",
    "input": "./node_modules/@ship-ui/core/assets",
    "output": "./ship-ui-assets/"
  }
]
```

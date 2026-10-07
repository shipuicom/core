"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var path = __toESM(require("path"));
var fs = __toESM(require("fs"));

// ../projects/ship-ui/assets/mcp/components.json
var components_default = [
  {
    name: "ShipA11yKeybindingsDirective",
    selector: "[shA11yKeybinding]",
    package: "@ship-ui/core/ship-a11y-keybindings",
    kind: "directive",
    path: "projects/ship-ui/ship-a11y-keybindings/ship-a11y-keybindings.ts",
    inputs: [
      {
        name: "shA11yKeybinding",
        type: "string",
        description: "Keybinding action id to bind to the host (looked up in `ShipA11yKeybindingsService`)."
      },
      {
        name: "mode",
        type: "'global' | 'local'",
        description: "Listen scope: `local` reacts only to key events on the host, `global` listens on `window`.",
        defaultValue: "'local'",
        options: [
          "global",
          "local"
        ]
      },
      {
        name: "preventDefault",
        type: "boolean",
        description: "Call `preventDefault()` on the keyboard event when the shortcut matches.",
        defaultValue: "true"
      },
      {
        name: "stopPropagation",
        type: "boolean",
        description: "Call `stopPropagation()` on the keyboard event when the shortcut matches.",
        defaultValue: "true"
      }
    ],
    outputs: [
      {
        name: "triggered",
        type: "KeyboardEvent",
        description: "Emit the originating `KeyboardEvent` when the bound shortcut is triggered."
      }
    ],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipButton",
    selector: "[shButton]",
    package: "@ship-ui/core/ship-button",
    kind: "component",
    path: "projects/ship-ui/ship-button/ship-button.ts",
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "Semantic color scale (`primary`, `accent`, `warn`, `error`, `success`).",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "Visual variant (`simple`, `outlined`, `flat`, `raised`).",
        defaultValue: "null",
        options: [
          "simple",
          "outlined",
          "flat",
          "raised",
          ""
        ]
      },
      {
        name: "size",
        type: "ShipButtonSize | null",
        description: "Size preset (`small`, `xsmall`, or default).",
        defaultValue: "null",
        options: [
          "small",
          "xsmall",
          ""
        ]
      },
      {
        name: "readonly",
        type: "boolean",
        description: "Render in a non-interactive read-only state.",
        defaultValue: "false"
      },
      {
        name: "noBg",
        type: "boolean",
        description: "Remove the background (adds the `no-bg` class).",
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--btn-h",
        defaultValue: "#{p2r(40)}"
      },
      {
        name: "--btn-mw",
        defaultValue: "#{p2r(40)}"
      },
      {
        name: "--btn-f",
        defaultValue: "var(--paragraph-20)"
      },
      {
        name: "--btn-py",
        defaultValue: "0"
      },
      {
        name: "--btn-px",
        defaultValue: "var(--pad-x-3)"
      },
      {
        name: "--btn-o-a",
        defaultValue: "0.05"
      },
      {
        name: "--btn-ir",
        defaultValue: "180deg"
      },
      {
        name: "--sheet-bg",
        defaultValue: "transparent"
      },
      {
        name: "--sheet-bc",
        defaultValue: "transparent"
      }
    ],
    examples: [
      {
        name: "flat-button",
        html: '<button shButton variant="flat" aria-label="Icon button">\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="flat">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="flat" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="flat" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="flat" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="flat" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="flat" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="flat" disabled>\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon>circle</sh-icon>\n</button>\n\n<a shButton variant="flat" href="https://www.google.com/" target="_blank">Link</a>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-flat-button',\n  imports: [ShipIcon, ShipButton],\n  templateUrl: './flat-button.html',\n  styleUrl: './flat-button.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FlatButton {}\n"
      },
      {
        name: "raised-button",
        html: '<button shButton variant="raised" aria-label="Icon button">\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="raised">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="raised" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="raised" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="raised" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="raised" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="raised" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="raised" disabled>\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon>circle</sh-icon>\n</button>\n<a shButton variant="raised" href="https://www.google.com/" target="_blank">Link</a>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-raised-button',\n  imports: [ShipIcon, ShipButton],\n  templateUrl: './raised-button.html',\n  styleUrl: './raised-button.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RaisedButton {}\n"
      },
      {
        name: "simple-button",
        html: '<button shButton variant="simple" aria-label="Icon button">\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="simple">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="simple" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="simple" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="simple" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="simple" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="simple" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="simple" disabled>\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon>circle</sh-icon>\n</button>\n\n<a shButton variant="simple" href="https://www.google.com/" target="_blank">Link</a>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-simple-button',\n  imports: [ShipIcon, ShipButton],\n  templateUrl: './simple-button.html',\n  styleUrl: './simple-button.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SimpleButton {}\n"
      },
      {
        name: "outlined-button",
        html: '<button shButton variant="outlined" aria-label="Icon button">\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="outlined">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="outlined" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="outlined" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="outlined" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="outlined" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="outlined" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="outlined" disabled>\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon>circle</sh-icon>\n</button>\n\n<a shButton variant="outlined" href="https://www.google.com/" target="_blank">Link</a>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-outlined-button',\n  imports: [ShipIcon, ShipButton],\n  templateUrl: './outlined-button.html',\n  styleUrl: './outlined-button.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OutlinedButton {}\n"
      },
      {
        name: "basic-button",
        html: "<button shButton>Button</button>\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\n\n@Component({\n  selector: 'app-basic-button',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './basic-button.html',\n  styleUrl: './basic-button.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicButton {}\n"
      },
      {
        name: "base-button",
        html: '<!-- Using attribute inputs -->\n<button shButton aria-label="Open">\n  <sh-icon>caret-down</sh-icon>\n</button>\n\n<button shButton aria-label="Open">\n  <sh-icon>caret-down</sh-icon>\n</button>\n\n<button shButton>\n  <sh-icon>circle</sh-icon>\n  Default\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton color="success">\n  <sh-icon>circle</sh-icon>\n  success\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton disabled>\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon>circle</sh-icon>\n</button>\n\n<a shButton href="https://www.google.com/" target="_blank">Link</a>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<button shButton class="primary">Primary</button>\n<button shButton class="raised primary">Raised Primary</button>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-base-button',\n  imports: [ShipIcon, ShipButton],\n  templateUrl: './base-button.html',\n  styleUrl: './base-button.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseButton {}\n"
      },
      {
        name: "button-sandbox",
        html: '<button\n  shButton\n  aria-label="Sandbox icon button"\n  [color]="color()"\n  [variant]="variant()"\n  [size]="size()"\n  [class.loading]="loading()"\n  [class.rotated-icon]="rotated()"\n  [disabled]="disabled()"\n  [attr.readonly]="readonly() ? true : null"\n  [noBg]="noBg()">\n  <sh-icon>caret-down</sh-icon>\n</button>\n\n<button\n  shButton\n  [color]="color()"\n  [variant]="variant()"\n  [size]="size()"\n  [class.loading]="loading()"\n  [class.rotated-icon]="rotated()"\n  [disabled]="disabled()"\n  [attr.readonly]="readonly() ? true : null"\n  [noBg]="noBg()">\n  <sh-icon>caret-down</sh-icon>\n  Default\n  <sh-icon>caret-down</sh-icon>\n</button>\n\n<button\n  shButton\n  [color]="color()"\n  [variant]="variant()"\n  [size]="size()"\n  [class.loading]="loading()"\n  [class.rotated-icon]="rotated()"\n  [disabled]="disabled()"\n  [attr.readonly]="readonly() ? true : null"\n  [noBg]="noBg()">\n  <sh-icon>caret-down</sh-icon>\n  Primary\n</button>\n\n<button\n  shButton\n  [color]="color()"\n  [variant]="variant()"\n  [size]="size()"\n  [class.loading]="loading()"\n  [class.rotated-icon]="rotated()"\n  [disabled]="disabled()"\n  [attr.readonly]="readonly() ? true : null"\n  [noBg]="noBg()">\n  Primary\n  <sh-icon>caret-down</sh-icon>\n</button>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-button-sandbox',\n  imports: [ShipButton, ShipIcon],\n  templateUrl: './button-sandbox.html',\n  styleUrl: './button-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ButtonSandbox {\n  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');\n  variant = input<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');\n  size = input<'' | 'small' | 'xsmall'>('');\n  rotated = input(false);\n  loading = input(false);\n  disabled = input(false);\n  readonly = input(false);\n  noBg = input(false);\n}\n"
      }
    ],
    keywords: [
      "button",
      "cta",
      "action",
      "submit"
    ]
  },
  {
    name: "ShipCodeInputGroup",
    selector: "[shCodeInputGroup]",
    package: "@ship-ui/core/ship-code-input",
    kind: "directive",
    path: "projects/ship-ui/ship-code-input/ship-code-input-group.ts",
    description: "Turns a set of single-character inputs into one code entry: typing advances\nto the next input, backspace on an empty input steps back, arrow keys move\nbetween inputs, and pasting (or autofill) into any input spreads the code\nacross the remaining ones.\n\nApply it to the element wrapping the inputs \u2014 every non-hidden `<input>`\nbeneath it is part of the group, in DOM order.",
    inputs: [
      {
        name: "shCodeInputGroup",
        type: "ShipCodeInputAccept",
        description: "Which characters are kept: `numeric` (default), `alphanumeric`, `any`, or a RegExp matching one allowed character.",
        defaultValue: "'numeric'"
      }
    ],
    outputs: [
      {
        name: "valueChange",
        type: "string",
        description: "Emits the joined value of all inputs whenever any of them changes."
      },
      {
        name: "completed",
        type: "string",
        description: "Emits the full code once every input holds a character."
      }
    ],
    methods: [
      {
        name: "inputs",
        parameters: "",
        returnType: "HTMLInputElement[]",
        description: "The inputs that make up the group, in DOM order."
      },
      {
        name: "value",
        parameters: "",
        returnType: "string",
        description: "The current code \u2014 one character per input, empty inputs contribute nothing."
      },
      {
        name: "isComplete",
        parameters: "",
        returnType: "boolean",
        description: "`true` once every input holds a character."
      },
      {
        name: "setValue",
        parameters: "code: string",
        returnType: "void",
        description: "Writes a code into the inputs from the first one on, clearing the rest. Does not move focus."
      },
      {
        name: "clear",
        parameters: "focus = true",
        returnType: "void",
        description: "Empties every input and focuses the first one."
      },
      {
        name: "focus",
        parameters: "index = 0",
        returnType: "void",
        description: "Focuses the input at `index` (clamped to the group) and selects its content."
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipFileDragDrop",
    selector: "[shDragDrop]",
    package: "@ship-ui/core/ship-file-drag-drop",
    kind: "directive",
    path: "projects/ship-ui/ship-file-drag-drop/ship-file-drag-drop.ts",
    inputs: [],
    outputs: [
      {
        name: "filesDropped",
        type: "FileList",
        description: "Emits the dropped `FileList` when one or more files are released over the host element."
      }
    ],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipEditorActionDirective",
    selector: "[shEditorAction]",
    package: "@ship-ui/core/ship-editor",
    kind: "directive",
    path: "projects/ship-ui/ship-editor/ship-editor-action.ts",
    inputs: [
      {
        name: "editor",
        type: "ShipEditor | null",
        description: "The editor to act on; defaults to the enclosing `<sh-editor>` when omitted.",
        defaultValue: "null"
      },
      {
        name: "shEditorAction",
        type: "string",
        description: "The editor command dispatched when the host element is pressed."
      },
      {
        name: "shEditorActionAttrs",
        type: "Record<string, any>",
        description: "Extra attributes passed to the dispatched command and used to compute its active state.",
        defaultValue: "{}"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipInputMask",
    selector: "[shInputMask]",
    package: "@ship-ui/core/ship-input-mask",
    kind: "directive",
    path: "projects/ship-ui/ship-input-mask/ship-input-mask.ts",
    description: '### Enable Masking\n\nApply the\n`[shInputMask]`\ndirective to an input element to enforce a specific format. You can pass a static mask string (e.g.,\n`"(00) 000-000"`\n) or a custom formatting function.',
    inputs: [
      {
        name: "shInputMask",
        type: "string | MaskingFunction",
        description: "Mask pattern (`9` marks a digit slot) or a custom masking function applied to the input value.",
        defaultValue: "'(999) 999-9999'"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: [
      {
        name: "basic-input-mask",
        html: '<sh-form-field>\n  <label for="phone">Phone</label>\n  <input id="phone" placeholder="(999) 999-9999" type="text" shInputMask="(999) 999-9999" />\n  <div boxPrefix>\n    <sh-icon>phone</sh-icon>\n  </div>\n</sh-form-field>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipInputMask } from '@ship-ui/core/ship-input-mask';\n\n@Component({\n  selector: 'app-basic-input-mask',\n  standalone: true,\n  imports: [ShipFormField, ShipIcon, ShipInputMask],\n  templateUrl: './basic-input-mask.html',\n  styleUrl: './basic-input-mask.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicInputMask {}\n"
      },
      {
        name: "signal-form-input-mask",
        html: '<sh-form-field>\n  <label for="signalPhone">Phone</label>\n  <input id="signalPhone" placeholder="(999) 999-9999" type="text" shInputMask="(999) 999-9999" [formField]="contactForm.phone" />\n  <div boxPrefix>\n    <sh-icon>phone</sh-icon>\n  </div>\n  @if (contactForm.phone().touched() && contactForm.phone().errors()[0]; as error) {\n    <span error>{{ error.message }}</span>\n  }\n</sh-form-field>\n\n<sh-form-field>\n  <label for="signalCard">Credit card</label>\n  <input id="signalCard" placeholder="1234 5678 1234 5678" type="text" shInputMask="9999 9999 9999 9999" [formField]="contactForm.card" />\n  <div boxPrefix>\n    <sh-icon>credit-card</sh-icon>\n  </div>\n  @if (contactForm.card().touched() && contactForm.card().errors()[0]; as error) {\n    <span error>{{ error.message }}</span>\n  }\n</sh-form-field>\n\n<p>Form valid: {{ contactForm().valid() }}</p>\n<pre>{{ contact() | json }}</pre>\n',
        ts: "import { JsonPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { form, FormField, pattern, required } from '@angular/forms/signals';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipInputMask } from '@ship-ui/core/ship-input-mask';\n\n@Component({\n  selector: 'app-signal-form-input-mask',\n  imports: [JsonPipe, FormField, ShipFormField, ShipIcon, ShipInputMask],\n  templateUrl: './signal-form-input-mask.html',\n  styleUrl: './signal-form-input-mask.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SignalFormInputMask {\n  contact = signal({ phone: '', card: '' });\n\n  contactForm = form(this.contact, (path) => {\n    required(path.phone, { message: 'Phone is required' });\n    pattern(path.phone, /^\\(\\d{3}\\) \\d{3}-\\d{4}$/, { message: 'Complete the phone number' });\n    pattern(path.card, /^(\\d{4} ){3}\\d{4}$/, { message: 'Complete the card number' });\n  });\n}\n"
      },
      {
        name: "base-input-mask",
        html: '<sh-form-field>\n  <label for="phone1">Phone 1</label>\n  <input id="phone1" placeholder="(999) 999-9999" type="text" shInputMask="(999) 999-9999" />\n  <div boxPrefix>\n    <sh-icon>phone</sh-icon>\n  </div>\n</sh-form-field>\n\n<sh-form-field>\n  <label for="phone2">Phone 2</label>\n  <input id="phone2" placeholder="99 99 99 99" type="text" shInputMask="99 99 99 99" />\n  <div boxPrefix>\n    <sh-icon>phone</sh-icon>\n  </div>\n</sh-form-field>\n\n<sh-form-field>\n  <label for="date1">Date 1</label>\n  <input id="date1" placeholder="99/99/9999" type="text" shInputMask="99/99/9999" />\n  <div boxPrefix>\n    <sh-icon>calendar</sh-icon>\n  </div>\n</sh-form-field>\n\n<sh-form-field>\n  <label for="date2">Date 2</label>\n  <input id="date2" placeholder="99/99 - 9999" type="text" shInputMask="99/99 - 9999" />\n  <div boxPrefix>\n    <sh-icon>calendar</sh-icon>\n  </div>\n</sh-form-field>\n\n<div class="credit-card">\n  <sh-form-field>\n    <label for="creditCard">Credit card</label>\n    <input id="creditCard" placeholder="1234 5678 1234 5678" type="text" shInputMask="9999 9999 9999 9999" />\n    <div boxPrefix>\n      <sh-icon>credit-card</sh-icon>\n    </div>\n  </sh-form-field>\n\n  <sh-form-field>\n    <label for="creditCard">CVV</label>\n    <input id="creditCard" placeholder="123" type="text" shInputMask="999" />\n  </sh-form-field>\n</div>\n\n<sh-form-field>\n  <label for="decimal1">Decimal using function</label>\n  <input id="decimal1" placeholder="Hello im a decimal pipe" type="text" [shInputMask]="maskingFunction" />\n  <div boxPrefix>\n    <sh-icon>calendar</sh-icon>\n  </div>\n</sh-form-field>\n',
        ts: "import { DecimalPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, inject } from '@angular/core';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipInputMask } from '@ship-ui/core/ship-input-mask';\n\n@Component({\n  selector: 'app-base-input-mask',\n  imports: [ShipFormField, ShipIcon, ShipInputMask],\n  templateUrl: './base-input-mask.html',\n  styleUrl: './base-input-mask.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n  providers: [DecimalPipe],\n})\nexport class BaseInputMaskComponent {\n  #decimalPipe = inject(DecimalPipe);\n\n  maskingFunction = (cleanValue: string) => {\n    return this.#decimalPipe.transform(cleanValue, '1.0-2');\n  };\n}\n"
      }
    ]
  },
  {
    name: "ShipPreventWheel",
    selector: "[shPreventWheel]",
    package: "@ship-ui/core/ship-prevent-wheel",
    kind: "directive",
    path: "projects/ship-ui/ship-prevent-wheel/ship-prevent-wheel.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipResize",
    selector: "[shResize]",
    package: "@ship-ui/core/ship-table",
    kind: "directive",
    path: "projects/ship-ui/ship-table/ship-table.ts",
    inputs: [
      {
        name: "resizable",
        type: "boolean",
        description: "Whether the column header can be resized by dragging or keyboard shortcuts.",
        defaultValue: "true"
      },
      {
        name: "minWidth",
        type: "number",
        description: "Minimum width in pixels the column can be resized to.",
        defaultValue: "50"
      },
      {
        name: "maxWidth",
        type: "number | null",
        description: "Maximum width in pixels the column can be resized to, or `null` for no cap.",
        defaultValue: "null"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipRowResize",
    selector: "[shRowResize]",
    package: "@ship-ui/core/ship-table",
    kind: "directive",
    path: "projects/ship-ui/ship-table/ship-table.ts",
    inputs: [
      {
        name: "resizable",
        type: "boolean",
        description: "Whether the row can be resized by dragging or keyboard shortcuts.",
        defaultValue: "true"
      },
      {
        name: "minHeight",
        type: "number",
        description: "Minimum height in pixels the row can be resized to.",
        defaultValue: "24"
      },
      {
        name: "maxHeight",
        type: "number | null",
        description: "Maximum height in pixels the row can be resized to, or `null` for no cap.",
        defaultValue: "null"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipSort",
    selector: "[shSort]",
    package: "@ship-ui/core/ship-table",
    kind: "directive",
    path: "projects/ship-ui/ship-table/ship-table.ts",
    inputs: [
      {
        name: "shSort",
        type: "string | undefined",
        description: "The column id to sort by; when set, the header becomes an interactive sort control."
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipSortable",
    selector: "[shSortable]",
    package: "@ship-ui/core/ship-sortable",
    kind: "directive",
    path: "projects/ship-ui/ship-sortable/ship-sortable.ts",
    description: '### ShipSortableService\n\n`ShipSortableService` is the root-provided drag registry shared by every `ShipSortable`\ncontainer. It is what makes cross-container drops work: all sortable instances register themselves in\n`activeInstances`, and during a drag the service tracks the source container\n(`activeSource`), the dragged element (`activeDraggedElement`) and the container currently\nunder the pointer (`activeTarget`).\n\nYou rarely call it directly \u2014 `ShipSortable` and `createSortableManager()` use it under the\nhood \u2014 but injecting it lets you observe global drag state, e.g. to highlight valid drop zones or block other\ninteractions while a drag is active:\n\n<app-highlight lang="ts" [content]="codeInspect" />',
    inputs: [
      {
        name: "shSortable",
        type: "any",
        description: "Optional sortable manager (from `createSortableManager`/`createTreeSortableManager`) that handles drops instead of emitting events."
      },
      {
        name: "sortableGroup",
        type: "string",
        description: "Group identifier that allows dragging items between sortable containers sharing the same value."
      },
      {
        name: "sortingMode",
        type: "'list' | 'grid' | 'tree'",
        description: "Layout/sorting behaviour of the container: `'list'`, `'grid'`, or `'tree'`.",
        defaultValue: "'list'",
        options: [
          "list",
          "grid",
          "tree"
        ]
      },
      {
        name: "treeItems",
        type: "any[]",
        description: "Two-way bound list of tree nodes, used when `sortingMode` is `'tree'`.",
        defaultValue: "[]",
        twoWay: true
      },
      {
        name: "shSortableAxis",
        type: "'x' | 'y' | 'both'",
        description: "The axis items move along: `'y'` for a vertical list, `'x'` for a horizontal row (column headers),\n`'both'` for a grid. A drag picks the nearest slot measured on that axis only, and the keyboard\nuses the matching arrow keys (up/down, left/right, or all four).",
        defaultValue: "'both'",
        options: [
          "x",
          "y",
          "both"
        ]
      },
      {
        name: "touchEnabled",
        type: "boolean",
        description: 'Enables touch-based dragging. Off by default and meant to be bound to an\nexplicit "edit mode" toggle, the way iOS lists work: a plain touch always\nscrolls, and reordering only becomes possible once the user asks for it.\nTouch devices never fire the native drag events the mouse path relies on,\nso this is the only route to reordering on a phone.',
        defaultValue: "false"
      },
      {
        name: "touchActivation",
        type: "'longpress' | 'handle' | 'none'",
        description: "How a touch drag is initiated: `'longpress'`, `'handle'`, or `'none'`.",
        defaultValue: "'longpress'",
        options: [
          "longpress",
          "handle",
          "none"
        ]
      }
    ],
    outputs: [
      {
        name: "sortDrop",
        type: "ShipDropEvent",
        description: "Emitted on any drop with the source/target containers and indices."
      },
      {
        name: "afterDrop",
        type: "AfterDropResponse",
        description: "Emitted after an in-container reorder with the from/to indices."
      },
      {
        name: "crossDrop",
        type: "CrossDropResponse",
        description: "Emitted when an item is dropped into a different container than it started in."
      },
      {
        name: "treeDrop",
        type: "ShipTreeDropEvent",
        description: "Emitted on a drop in `'tree'` mode with the indices and drop position (`before`/`after`/`inside`)."
      }
    ],
    methods: [
      {
        name: "moveItem",
        parameters: "previousIndex: number, currentIndex: number, focusHandle = false",
        returnType: "void",
        description: "Reorders in place, as an internal drop from `previousIndex` to `currentIndex` would."
      },
      {
        name: "onTouchCancel",
        parameters: "",
        returnType: "void",
        description: "The system can take a touch away mid-drag \u2014 an incoming call, or the browser\nclaiming the gesture. That is an abort, not a drop, so tear the drag down and\nleave the list in the order it started in."
      }
    ],
    cssVariables: [],
    examples: [
      {
        name: "handle-sortable",
        html: `<div class="toolbar">
  <span class="hint">
    {{ isEditing() ? 'Drag the handles to reorder' : 'Tap Edit to reorder by touch' }}
  </span>

  <button shButton variant="outlined" size="small" (click)="toggleEditing()">
    {{ isEditing() ? 'Done' : 'Edit' }}
  </button>
</div>

<sh-list [shSortable]="manager" [touchEnabled]="isEditing()" touchActivation="handle" [class.editing]="isEditing()">
  @for (item of items(); track item) {
    <div class="list-item" draggable="true">
      <div class="drag-handle" sort-handle>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="12" r="1"></circle>
          <circle cx="9" cy="5" r="1"></circle>
          <circle cx="9" cy="19" r="1"></circle>
          <circle cx="15" cy="12" r="1"></circle>
          <circle cx="15" cy="5" r="1"></circle>
          <circle cx="15" cy="19" r="1"></circle>
        </svg>
      </div>
      <div class="content">{{ item }}</div>
    </div>
  }
</sh-list>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { createSortableManager, ShipSortable } from '@ship-ui/core/ship-sortable';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipList } from '@ship-ui/core/ship-list';\n\n@Component({\n  selector: 'app-handle-sortable',\n  standalone: true,\n  imports: [ShipList, ShipSortable, ShipButton],\n  templateUrl: './handle-sortable.html',\n  styleUrl: './handle-sortable.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class HandleSortable {\n  items = signal(['Task 1: Design Review', 'Task 2: Build Sortables', 'Task 3: Drag Handles', 'Task 4: Publish SDK', 'Task 5: Profit']);\n  manager = createSortableManager(this.items);\n\n  /**\n   * Gates touch reordering the way an iOS list does. Off, a touch scrolls the\n   * page as usual; on, the handles take over and drag instead.\n   */\n  isEditing = signal(false);\n\n  toggleEditing() {\n    this.isEditing.update((editing) => !editing);\n  }\n}\n"
      },
      {
        name: "grid-sortable",
        html: '<div class="grid-container" [shSortable]="manager">\n  @for (item of items(); track item) {\n    <div class="grid-item" draggable="true">\n      {{ item }}\n    </div>\n  }\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { createSortableManager, ShipSortable } from '@ship-ui/core/ship-sortable';\n\n@Component({\n  selector: 'app-grid-sortable-example',\n  standalone: true,\n  imports: [ShipSortable],\n  templateUrl: './grid-sortable-example.html',\n  styleUrl: './grid-sortable-example.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class GridSortableExample {\n  items = signal(Array.from({ length: 12 }, (_, i) => `Item ${i + 1}`));\n\n\n  manager = createSortableManager(this.items);\n}\n"
      },
      {
        name: "mobile-sortable",
        html: '<span class="hint">Long-press an item to pick it up \u2014 a plain touch still scrolls the list.</span>\n\n<sh-list [shSortable]="manager" [touchEnabled]="true" touchActivation="longpress" class="stops">\n  @for (stop of stops(); track stop.title) {\n    <div class="stop" draggable="true">\n      <div class="badge">\n        <sh-icon>{{ stop.icon }}</sh-icon>\n      </div>\n      <div class="text">\n        <span class="title">{{ stop.title }}</span>\n        <span class="subtitle">{{ stop.subtitle }}</span>\n      </div>\n      <span class="order">{{ $index + 1 }}</span>\n    </div>\n  }\n</sh-list>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { createSortableManager, ShipSortable } from '@ship-ui/core/ship-sortable';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipList } from '@ship-ui/core/ship-list';\n\n// The icon names below are bound dynamically, so register them for the font\n// subset: 'shicon:coffee' 'shicon:buildings' 'shicon:package' 'shicon:fork-knife'\n// 'shicon:barbell' 'shicon:shopping-cart' 'shicon:house'\nconst STOPS = [\n  { icon: 'coffee', title: 'Morning coffee', subtitle: 'Brew & Co, 8:00' },\n  { icon: 'buildings', title: 'Office check-in', subtitle: 'HQ, 9:00' },\n  { icon: 'package', title: 'Pick up parcel', subtitle: 'Post office, 11:30' },\n  { icon: 'fork-knife', title: 'Lunch with Alex', subtitle: 'Noodle bar, 12:30' },\n  { icon: 'barbell', title: 'Gym session', subtitle: 'Iron Works, 17:00' },\n  { icon: 'shopping-cart', title: 'Groceries', subtitle: 'Market, 18:15' },\n  { icon: 'house', title: 'Home', subtitle: '19:00' },\n];\n\n@Component({\n  selector: 'app-mobile-sortable',\n  standalone: true,\n  imports: [ShipList, ShipSortable, ShipIcon],\n  templateUrl: './mobile-sortable.html',\n  styleUrl: './mobile-sortable.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class MobileSortable {\n  stops = signal(STOPS);\n  manager = createSortableManager(this.stops);\n}\n"
      },
      {
        name: "tree-sortable",
        html: `<div class="tree-explorer">
  <div class="explorer-header">
    <span>WORKSPACE EXPLORER</span>
  </div>
  
  <div 
    class="tree-container"
    [shSortable]="manager"
    [treeItems]="manager.visibleNodes()"
    sortingMode="tree"
  >
    @for (node of manager.visibleNodes(); track node.id; let idx = $index) {
      <div 
        class="tree-node"
        [class.is-folder]="node.type === 'dir'"
        [class.is-expanded]="node.isOpen"
        draggable="true"
        [attr.sortable-dir]="node.type === 'dir' ? 'true' : null"
        [style.padding-left.px]="16 + getNodeDepth(node) * 16"
      >
        <!-- Indent guides -->
        @for (i of getDepthArray(getNodeDepth(node)); track i) {
          <div class="indent-guide" [style.left.px]="22 + i * 16"></div>
        }

        <!-- Folder Caret -->
        <span class="caret-container">
          @if (node.type === 'dir') {
            <button class="caret-btn" (click)="toggleFolder(node, $event)" type="button">
              <sh-icon size="small">{{ node.isOpen ? 'caret-down' : 'caret-right' }}</sh-icon>
            </button>
          }
        </span>

        <!-- Node Icon -->
        <sh-icon class="node-icon" size="small">
          {{ node.type === 'dir' ? (node.isOpen ? 'folder-open' : 'folder') : 'file-text' }}
        </sh-icon>

        <!-- Node Name -->
        <span class="node-name">{{ node.name }}</span>
      </div>
    } @empty {
      <div class="empty-state">No files in workspace</div>
    }
  </div>
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipSortable, createTreeSortableManager } from '@ship-ui/core/ship-sortable';\n\ninterface TreeNode {\n  id: string;\n  name: string;\n  type: 'item' | 'dir';\n  parentId: string | null;\n  isOpen?: boolean;\n}\n\n@Component({\n  selector: 'app-tree-sortable',\n  standalone: true,\n  imports: [ShipSortable, ShipIcon],\n  templateUrl: './tree-sortable.html',\n  styleUrl: './tree-sortable.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TreeSortable {\n  nodes = signal<TreeNode[]>([\n    { id: '1', name: 'projects', type: 'dir', parentId: null, isOpen: true },\n    { id: '1a', name: 'ship-ui', type: 'dir', parentId: '1', isOpen: true },\n    { id: '1a1', name: 'src', type: 'dir', parentId: '1a', isOpen: true },\n    { id: '1a1a', name: 'public-api.ts', type: 'item', parentId: '1a1' },\n    { id: '1a2', name: 'package.json', type: 'item', parentId: '1a' },\n    { id: '1a3', name: 'tsconfig.lib.json', type: 'item', parentId: '1a' },\n    { id: '2', name: 'design-system', type: 'dir', parentId: null, isOpen: false },\n    { id: '2a', name: 'angular.json', type: 'item', parentId: '2' },\n    { id: '3', name: 'README.md', type: 'item', parentId: null },\n    { id: '4', name: 'bun.lock', type: 'item', parentId: null },\n  ]);\n\n  manager = createTreeSortableManager(this.nodes);\n\n  toggleFolder(node: TreeNode, event: MouseEvent) {\n    event.stopPropagation();\n    this.nodes.update((list) =>\n      list.map((n) => (n.id === node.id ? { ...n, isOpen: !n.isOpen } : n))\n    );\n  }\n\n  getDepthArray(depth: number): number[] {\n    return Array.from({ length: depth }, (_, i) => i);\n  }\n\n  getNodeDepth(node: TreeNode): number {\n    const list = this.nodes();\n    let depth = 0;\n    let currentParentId = node.parentId;\n    while (currentParentId !== null && currentParentId !== undefined) {\n      const parent = list.find((n) => n.id === currentParentId);\n      if (!parent) break;\n      depth++;\n      currentParentId = parent.parentId;\n    }\n    return depth;\n  }\n}\n"
      },
      {
        name: "base-sortable",
        html: `<sh-list [shSortable]="manager">
  @for (todo of todos(); track $index) {
    <div item [draggable]="true" [class.active]="todo.done" (click)="toggleTodo($index)">
      <sh-checkbox [checked]="todo.done" [label]="todo.title || 'Done'" class="primary raised" />

      @if (todo.done) {
        <s>{{ todo.title }}</s>
      } @else {
        {{ todo.title }}
      }
    </div>
  }
</sh-list>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { createSortableManager, ShipSortable } from '@ship-ui/core/ship-sortable';\nimport { ShipCheckbox } from '@ship-ui/core/ship-checkbox';\nimport { ShipList } from '@ship-ui/core/ship-list';\n\nconst TODOS = [\n  {\n    title: 'Simple sorting of list',\n    done: true,\n  },\n  {\n    title: 'Sorting animation',\n    done: true,\n  },\n  {\n    title: 'Support sortable handle',\n    done: true,\n  },\n  {\n    title: 'Support gap in sorting list ',\n    done: true,\n  },\n  {\n    title: 'Support placeholder',\n    done: true,\n  },\n  {\n    title: 'Support animation only when dragging',\n    done: true,\n  },\n  {\n    title: 'Support multiple lists',\n    done: false,\n  },\n  {\n    title: 'Support draggable grids',\n    done: false,\n  },\n];\n\ntype Todo = (typeof TODOS)[0];\n\n@Component({\n  selector: 'app-base-sortable',\n  standalone: true,\n  imports: [ShipList, ShipSortable, ShipCheckbox],\n  templateUrl: './base-sortable.html',\n  styleUrl: './base-sortable.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseSortable {\n  todos = signal(TODOS);\n  manager = createSortableManager(this.todos);\n\n  toggleTodo(index: number) {\n    this.todos.update((todos) => {\n      todos[index].done = !todos[index].done;\n\n      return todos;\n    });\n  }\n}\n"
      },
      {
        name: "cross-list-sortable",
        html: '<div class="board">\n  <sh-card class="column">\n    <h3>To Do</h3>\n    <div [shSortable]="manager" sortableGroup="todo" class="sortable-list">\n      @for (item of todoList(); track item; let i = $index) {\n        <div class="item" draggable="true">\n          {{ item }}\n        </div>\n      }\n    </div>\n  </sh-card>\n\n  <sh-card class="column">\n    <h3>In Progress</h3>\n    <div [shSortable]="manager" sortableGroup="inProgress" class="sortable-list">\n      @for (item of inProgressList(); track item; let i = $index) {\n        <div class="item" draggable="true">\n          {{ item }}\n        </div>\n      }\n    </div>\n  </sh-card>\n\n  <sh-card class="column">\n    <h3>Done</h3>\n    <div [shSortable]="manager" sortableGroup="done" class="sortable-list">\n      @for (item of doneList(); track item; let i = $index) {\n        <div class="item" draggable="true">\n          {{ item }}\n        </div>\n      }\n    </div>\n  </sh-card>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { createSortableManager, ShipSortable } from '@ship-ui/core/ship-sortable';\nimport { ShipCard } from '@ship-ui/core/ship-card';\n\n@Component({\n  selector: 'app-cross-list-sortable',\n  standalone: true,\n  imports: [ShipSortable, ShipCard],\n  templateUrl: './cross-list-sortable.html',\n  styleUrl: './cross-list-sortable.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class CrossListSortable {\n  todoList = signal(['Implement Grids', 'Implement multiple boards', 'Refactor drag drop core']);\n  inProgressList = signal(['Write implementation plan', 'Check examples']);\n  doneList = signal(['Read documentation', 'Setup ship-ui workspace']);\n\n  manager = createSortableManager({\n    todo: this.todoList,\n    inProgress: this.inProgressList,\n    done: this.doneList,\n  });\n}\n"
      },
      {
        name: "header-sortable",
        html: `<p class="hint">Drag a header sideways, or focus its handle and press ArrowLeft / ArrowRight (Home / End for the ends).</p>

<div class="headers" [shSortable]="manager" shSortableAxis="x">
  @for (column of columns(); track column.key) {
    <div class="header" draggable="true">
      <sh-icon sort-handle class="handle" [attr.aria-label]="'Move ' + column.name">dots-six-vertical</sh-icon>
      <span class="name">{{ column.name }}</span>
      <span class="count">{{ column.count }}</span>
    </div>
  }
</div>

<pre>{{ columns().map(c => c.name).join(' \u2192 ') }}</pre>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { createSortableManager, ShipSortable } from '@ship-ui/core/ship-sortable';\n\n/**\n * Board column headers reordered by dragging them sideways. `shSortableAxis=\"x\"` makes the drop slot\n * follow the pointer's x only, and the handles take ArrowLeft/ArrowRight, Home and End.\n */\n@Component({\n  selector: 'app-header-sortable',\n  standalone: true,\n  imports: [ShipSortable, ShipIcon],\n  templateUrl: './header-sortable.html',\n  styleUrl: './header-sortable.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class HeaderSortable {\n  columns = signal([\n    { key: 'todo', name: 'To do', count: 4 },\n    { key: 'doing', name: 'Doing', count: 2 },\n    { key: 'review', name: 'Review', count: 1 },\n    { key: 'done', name: 'Done', count: 7 },\n  ]);\n  manager = createSortableManager(this.columns);\n}\n"
      },
      {
        name: "mixed-size-sortable",
        html: '<div class="mixed-list" [shSortable]="manager">\n  @for (item of items(); track item.id) {\n    <div class="item" [draggable]="true" [class]="item.size">\n      {{ item.text }}\n    </div>\n  }\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { createSortableManager, ShipSortable } from '@ship-ui/core/ship-sortable';\n\nconst ITEMS = [\n  { id: 1, text: 'Small item', size: 'small' },\n  { id: 2, text: 'This is a much larger item that spans multiple lines to show off the fact that the sortable handles differently sized elements cleanly.', size: 'large' },\n  { id: 3, text: 'Medium item with a bit more content.', size: 'medium' },\n  { id: 4, text: 'Another small item', size: 'small' },\n  { id: 5, text: 'Massive item. Huge block of text here to make it really tall. '.repeat(3), size: 'extra-large' },\n];\n\n@Component({\n  selector: 'app-mixed-size-sortable',\n  standalone: true,\n  imports: [ShipSortable],\n  templateUrl: './mixed-size-sortable.html',\n  styleUrl: './mixed-size-sortable.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class MixedSizeSortable {\n  items = signal(ITEMS);\n  manager = createSortableManager(this.items);\n}\n"
      }
    ]
  },
  {
    name: "ShipStickyColumns",
    selector: "[shStickyColumns]",
    package: "@ship-ui/core/ship-table",
    kind: "directive",
    path: "projects/ship-ui/ship-table/ship-table.ts",
    inputs: [
      {
        name: "shStickyColumns",
        type: "'start' | 'end' | (string & {})",
        description: "Which edge the cells stick to while scrolling horizontally: `'start'` (default) or `'end'`.",
        defaultValue: "'start'",
        options: [
          "start",
          "end"
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipTooltip",
    selector: "[shTooltip]",
    package: "@ship-ui/core/ship-tooltip",
    kind: "directive",
    path: "projects/ship-ui/ship-tooltip/ship-tooltip.ts",
    inputs: [
      {
        name: "shTooltip",
        type: "string | TemplateRef<any> | null | undefined",
        description: "Tooltip content to display; accepts a plain string or a `TemplateRef` for custom markup."
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: [
      {
        name: "themed-tooltip",
        html: `<!-- Primary themed tooltip -->
<button shButton class="primary" [shTooltip]="'Primary themed tooltip'">
  <sh-icon>check</sh-icon>
  Primary
</button>

<!-- Accent themed tooltip -->
<button shButton class="accent" [shTooltip]="'Accent themed tooltip'">
  <sh-icon>star</sh-icon>
  Accent
</button>

<!-- Warn themed tooltip -->
<button shButton class="warn" [shTooltip]="'Warning themed tooltip'">
  <sh-icon>warning</sh-icon>
  Warning
</button>

<!-- Error themed tooltip -->
<button shButton class="error" [shTooltip]="'Error themed tooltip'">
  <sh-icon>warning-octagon</sh-icon>
  Error
</button>

<!-- Success themed tooltip -->
<button shButton class="success" [shTooltip]="'Success themed tooltip'">
  <sh-icon>check-circle</sh-icon>
  Success
</button>

<!-- Icon themed tooltips -->
<sh-icon class="primary" [shTooltip]="'Primary icon tooltip'">info</sh-icon>
<sh-icon class="accent" [shTooltip]="'Accent icon tooltip'">star</sh-icon>
<sh-icon class="warn" [shTooltip]="'Warning icon tooltip'">warning</sh-icon>
<sh-icon class="error" [shTooltip]="'Error icon tooltip'">warning-octagon</sh-icon>
<sh-icon class="success" [shTooltip]="'Success icon tooltip'">check-circle</sh-icon>
`,
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipTooltip } from '@ship-ui/core/ship-tooltip';\n\n@Component({\n  selector: 'app-themed-tooltip',\n  imports: [ShipIcon, ShipButton, ShipTooltip],\n  templateUrl: './themed-tooltip.html',\n  styleUrl: './themed-tooltip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ThemedTooltip {}\n"
      },
      {
        name: "template-tooltip",
        html: '<button shButton [shTooltip]="richTooltip">\n  <sh-icon>star</sh-icon>\n  Rich Content\n</button>\n\n<!-- Template tooltip with rich content -->\n<ng-template #richTooltip>\n  <h4>Rich Tooltip</h4>\n  <p>\n    This tooltip contains\n    <strong>formatted content</strong>\n    with multiple elements.\n  </p>\n  <ul>\n    <li>Feature 1</li>\n    <li>Feature 2</li>\n    <li>Feature 3</li>\n  </ul>\n</ng-template>\n\n<sh-icon [shTooltip]="dynamicTooltip">help</sh-icon>\n\n<!-- Template tooltip with dynamic content -->\n<ng-template #dynamicTooltip>\n  <sh-icon>info</sh-icon>\n  <span>Dynamic content with icon</span>\n</ng-template>\n\n<button shButton [shTooltip]="actionTooltip">\n  <sh-icon>question</sh-icon>\n  Confirm Action\n</button>\n\n<!-- Template tooltip with action buttons -->\n<ng-template #actionTooltip let-ctx>\n  <p>Would you like to proceed?</p>\n  <div class="tooltip-actions">\n    <button shButton size="small" (click)="ctx.close()">Yes</button>\n    <button shButton size="small" class="secondary" (click)="ctx.close()">No</button>\n  </div>\n</ng-template>\n\n<button shButton [shTooltip]="toggle() ? tooltipA : tooltipB">Changing Tooltip</button>\n\n<ng-template #tooltipA>\n  <div>Tooltip A</div>\n</ng-template>\n\n<ng-template #tooltipB>\n  <div>Tooltip B</div>\n</ng-template>\n\n<button shButton [shTooltip]="tooltipContent">Changing Tooltip content</button>\n\n<ng-template #tooltipContent>\n  <div>{{ value() }}</div>\n</ng-template>\n',
        ts: "import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipTooltip } from '@ship-ui/core/ship-tooltip';\n\ntype Timeout = ReturnType<typeof setTimeout>;\n\n@Component({\n  selector: 'app-template-tooltip',\n  imports: [ShipIcon, ShipButton, ShipTooltip],\n  templateUrl: './template-tooltip.html',\n  styleUrl: './template-tooltip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TemplateTooltip implements OnInit, OnDestroy {\n  toggle = signal(false);\n\n  intervalId?: Timeout;\n\n  value = signal('Tooltip A');\n\n  ngOnInit() {\n    this.intervalId = setInterval(() => {\n      this.toggle.update((v) => !v);\n      this.value.set(this.toggle() ? 'Tooltip A' : 'Tooltip B');\n    }, 1000);\n  }\n\n  ngOnDestroy() {\n    if (this.intervalId) {\n      clearInterval(this.intervalId);\n    }\n  }\n}\n"
      },
      {
        name: "scrolled-tooltip",
        html: `<div class="scrolled-content">
  <!-- Basic tooltip with string content -->
  <sh-icon [shTooltip]="'This is a basic tooltip'">circle</sh-icon>

  <button shButton [shTooltip]="'Click me for more information'">
    <sh-icon>info</sh-icon>
    Basic Button
  </button>
  <!-- Button with longer tooltip text -->
  <button
    shButton
    [shTooltip]="'This is a longer tooltip message that provides more detailed information about the action'">
    <sh-icon>download</sh-icon>
    Download
  </button>

  <!-- Tooltip with different content -->
  <div [shTooltip]="'Hover over this text to see a tooltip'">Hover this basic div</div>
</div>
`,
        ts: "import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipTooltip } from '@ship-ui/core/ship-tooltip';\n\n@Component({\n  selector: 'app-scrolled-tooltip',\n  imports: [ShipIcon, ShipButton, ShipTooltip],\n  templateUrl: './scrolled-tooltip.html',\n  styleUrl: './scrolled-tooltip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ScrolledTooltip implements AfterViewInit {\n  #selfRef = inject(ElementRef);\n\n  ngAfterViewInit() {\n    const el = this.#selfRef.nativeElement;\n\n    setTimeout(() => {\n      if (typeof el?.scrollTo === 'function') {\n        el.scrollTo({\n          top: el.scrollHeight,\n          behavior: 'smooth',\n        });\n      }\n    }, 250);\n  }\n}\n"
      },
      {
        name: "long-tooltip",
        html: '<button shButton [shTooltip]="longTemplateTooltip">\n  <sh-icon>article</sh-icon>\n  Long Template\n</button>\n\n<!-- Long tooltip with template -->\n<ng-template #longTemplateTooltip>\n  <div class="long-tooltip-content">\n    <h4>Detailed Information</h4>\n    <p>\n      This is a comprehensive tooltip that contains multiple paragraphs of information. It demonstrates how the tooltip\n      component handles rich content with various HTML elements.\n    </p>\n    <p>\n      The tooltip should properly wrap text and maintain good spacing between elements. It should also handle different\n      content types gracefully.\n    </p>\n    <ul>\n      <li>Feature 1: Comprehensive documentation</li>\n      <li>Feature 2: Rich content support</li>\n      <li>Feature 3: Proper text wrapping</li>\n      <li>Feature 4: Responsive design</li>\n    </ul>\n  </div>\n</ng-template>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipTooltip } from '@ship-ui/core/ship-tooltip';\n\n@Component({\n  selector: 'app-long-tooltip',\n  imports: [ShipIcon, ShipButton, ShipTooltip],\n  templateUrl: './long-tooltip.html',\n  styleUrl: './long-tooltip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class LongTooltip {}\n"
      },
      {
        name: "basic-tooltip",
        html: `<!-- Basic tooltip with string content -->
<sh-icon [shTooltip]="'This is a basic tooltip'">circle</sh-icon>

<button shButton [shTooltip]="'Click me for more information'">
  <sh-icon>info</sh-icon>
  Basic Button
</button>

<button
  shButton
  [shTooltip]="'This is a longer tooltip message that provides more detailed information about the action'">
  <sh-icon>download</sh-icon>
  Download
</button>

<div [shTooltip]="'Hover over this text to see a tooltip'">Hover this basic div</div>
`,
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipTooltip } from '@ship-ui/core/ship-tooltip';\n\n@Component({\n  selector: 'app-basic-tooltip',\n  imports: [ShipIcon, ShipButton, ShipTooltip],\n  templateUrl: './basic-tooltip.html',\n  styleUrl: './basic-tooltip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicTooltip {}\n"
      }
    ],
    keywords: [
      "tooltip",
      "hint",
      "popover",
      "info",
      "hover",
      "helper text"
    ]
  },
  {
    name: "ShipVirtualScrollDirective",
    selector: "[shVirtualScroll]",
    package: "@ship-ui/core/ship-virtual-scroll",
    kind: "directive",
    path: "projects/ship-ui/ship-virtual-scroll/ship-virtual-scroll-directive.ts",
    description: 'Attribute-directive form of virtualization: apply it to the element that\nholds your rows and render only the `start()..end()` slice yourself. The\ndirective owns the scroll math (via `ShipVirtualWindow`), the spacer\npadding standing in for unmounted rows, and the measurement pass; the\nhost\'s element children are assumed to be exactly the rendered rows.\n\nPlace the host inside a container with `overflow: auto` \u2014 the directive\nscrolls against the nearest scrollable ancestor (falling back to the host\nitself when the host is the scroll container):\n\n```html\n<div class="scroller">\n  <div [shVirtualScroll]="items().length" #vs="shVirtualScroll">',
    inputs: [
      {
        name: "shVirtualScroll",
        type: "number",
        description: "Total number of items in the list."
      },
      {
        name: "virtualEstimate",
        type: "number",
        description: "Pixel size assumed for a row until it has been measured.",
        defaultValue: "36"
      },
      {
        name: "virtualOverscan",
        type: "number",
        description: "Pixels of content kept mounted beyond each viewport edge.",
        defaultValue: "200"
      },
      {
        name: "virtualAxis",
        type: "ShipVirtualAxis",
        description: "Scroll axis: `'vertical'` (default) windows by height, `'horizontal'` by width.",
        defaultValue: "'vertical'"
      }
    ],
    outputs: [],
    methods: [
      {
        name: "refresh",
        parameters: "",
        returnType: "void",
        description: "Recompute the window now (e.g. after an imperative `window.splice`)."
      },
      {
        name: "scrollToIndex",
        parameters: "index: number",
        returnType: "void",
        description: "Scroll the container so the item at `index` sits at the start of the viewport."
      }
    ],
    cssVariables: [],
    examples: [
      {
        name: "basic-virtual-scroll",
        html: '<sh-virtual-scroll>\n  @for (item of items(); track item) {\n    <div #item class="item">{{ item }}</div>\n  }\n</sh-virtual-scroll>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipVirtualScroll } from '@ship-ui/core/ship-virtual-scroll';\n\n@Component({\n  selector: 'app-basic-virtual-scroll',\n  standalone: true,\n  imports: [ShipVirtualScroll],\n  templateUrl: './basic-virtual-scroll.html',\n  styleUrl: './basic-virtual-scroll.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicVirtualScroll {\n  items = signal<string[]>(Array.from({ length: 1000 }, (_, i) => 'Item ' + i));\n}\n"
      },
      {
        name: "directive-virtual-scroll",
        html: '<div class="scroller">\n  <div [shVirtualScroll]="rows().length" #vs="shVirtualScroll">\n    @for (row of rows().slice(vs.start(), vs.end()); track row.id) {\n      <div class="row">\n        <strong>{{ row.label }}</strong>\n        @if (row.detail) {\n          <div class="detail">{{ row.detail }}</div>\n        }\n      </div>\n    }\n  </div>\n</div>\n<p class="window-readout">Mounted rows {{ vs.start() }}\u2013{{ vs.end() }} of {{ rows().length }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipVirtualScrollDirective } from '@ship-ui/core/ship-virtual-scroll';\n\ntype Row = { id: number; label: string; detail: string | null };\n\n@Component({\n  selector: 'app-directive-virtual-scroll',\n  standalone: true,\n  imports: [ShipVirtualScrollDirective],\n  templateUrl: './directive-virtual-scroll.html',\n  styleUrl: './directive-virtual-scroll.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DirectiveVirtualScroll {\n  // 50,000 rows with varying heights \u2014 every third row carries a detail line.\n  rows = signal<Row[]>(\n    Array.from({ length: 50_000 }, (_, i) => ({\n      id: i,\n      label: `Row ${i}`,\n      detail: i % 3 === 0 ? 'Taller row with a second line of detail text.' : null,\n    }))\n  );\n}\n"
      }
    ]
  },
  {
    name: "ShipCodeInputDivider",
    selector: "ng-template[shCodeInputDivider]",
    package: "@ship-ui/core/ship-code-input",
    kind: "directive",
    path: "projects/ship-ui/ship-code-input/ship-code-input-divider.ts",
    description: 'Marks an `<ng-template>` inside `sh-code-input` as the divider rendered\nbetween groups of boxes (or between every box when there is no `groupSize`).\n\n```html\n<sh-code-input [length]="6" [groupSize]="3">\n  <ng-template shCodeInputDivider><sh-icon>minus</sh-icon></ng-template>\n</sh-code-input>\n```',
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipViewTransition",
    selector: "router-outlet[shViewTransition]",
    package: "@ship-ui/core/ship-view-transition",
    kind: "directive",
    path: "projects/ship-ui/ship-view-transition/ship-view-transition.ts",
    description: 'Animates the pages a `router-outlet` swaps between using the View Transition API.\n\nEvery activated page gets its own `view-transition-name`, so nested outlets\ncan run different animations in the same navigation. The outlet\'s parent\nelement becomes the clipping frame, so slides stay inside it.\n\n```html\n<router-outlet shViewTransition />\n<router-outlet [shViewTransition]="{ in: slideFromRight, out: slideToLeft, back: { in: slideFromLeft, out: slideToRight } }" />\n<router-outlet shViewTransition swipeBack />\n```',
    inputs: [
      {
        name: "shViewTransition",
        type: "ShipViewTransitionSpec | '' | null",
        description: "Which animations this outlet plays. Leave empty to use the provider\ndefaults, or pass a spec with `in`, `out`, `back`, `duration`, `easing`.",
        defaultValue: "null",
        options: [
          ""
        ]
      },
      {
        name: "frame",
        type: "boolean",
        description: "Clip the sliding pages to the outlet's parent element. Set `false` to let them move across the full viewport.",
        defaultValue: "true"
      },
      {
        name: "swipeBack",
        type: "boolean",
        description: "iOS-style edge swipe: dragging from the left edge of the frame scrubs a back navigation, release to complete or cancel.",
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipAccordion",
    selector: "sh-accordion",
    package: "@ship-ui/core/ship-accordion",
    kind: "component",
    path: "projects/ship-ui/ship-accordion/ship-accordion.ts",
    description: "### Usage\n\nShipAccordion seamlessly wraps the native\n`&lt;details&gt;`\nHTML element. Use\n`allowMultiple`\nto control open exclusivity natively, or allow multi-expand.",
    inputs: [
      {
        name: "name",
        type: "string",
        description: "Shared group name applied to child `details` so only one stays open (defaults to a random unique name).",
        defaultValue: "`sh-accordion-${generateUniqueId()}`"
      },
      {
        name: "value",
        type: "string | null",
        description: "Two-way bound open item(s); a comma-separated list of item `value`s.",
        defaultValue: "null",
        twoWay: true
      },
      {
        name: "allowMultiple",
        type: "boolean",
        description: "Allow multiple items to be open at once instead of exclusive open.",
        defaultValue: "false"
      },
      {
        name: "variant",
        type: "ShipAccordionVariant | null",
        description: "Visual variant (`type-b`).",
        defaultValue: "null",
        options: [
          "type-b",
          ""
        ]
      },
      {
        name: "size",
        type: "string | null",
        description: "Size preset.",
        defaultValue: "null"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--acc-py",
        defaultValue: "var(--pad-y-5)"
      },
      {
        name: "--acc-px",
        defaultValue: "var(--pad-x-4)"
      },
      {
        name: "--acc-f",
        defaultValue: "var(--paragraph-30)"
      },
      {
        name: "--acc-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--acc-s",
        defaultValue: "var(--shape-2)"
      }
    ],
    examples: [
      {
        name: "sandbox-accordion",
        html: '<sh-accordion [(value)]="value" [allowMultiple]="allowMultiple()" [variant]="variant()">\n  <details value="panel1">\n    <summary>Personal Information</summary>\n    <p>\n      This is standard content projected inside native HTML tags! The entire accordion is configured seamlessly with\n      DOM structure.\n    </p>\n  </details>\n\n  <details value="panel2">\n    <summary>Advanced Settings</summary>\n    <sh-form-field>\n      <label>Settings A</label>\n      <input type="text" value="Configuration" />\n    </sh-form-field>\n  </details>\n\n  <details value="panel3">\n    <summary>Danger Zone</summary>\n    <button shButton color="error" variant="flat" size="small">Delete Account</button>\n  </details>\n</sh-accordion>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';\nimport { ShipAccordion } from '@ship-ui/core/ship-accordion';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipAccordionVariant } from '@ship-ui/core';\n\n@Component({\n  selector: 'app-sandbox-accordion',\n  imports: [ShipAccordion, ShipFormField, ShipButton],\n  templateUrl: './sandbox-accordion.html',\n  styleUrl: './sandbox-accordion.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SandboxAccordion {\n  value = model<string>('panel1');\n  allowMultiple = input(false);\n  variant = input<ShipAccordionVariant | null>(null);\n}\n"
      },
      {
        name: "base-accordion",
        html: "<sh-accordion>\n  <details>\n    <summary>Personal Information</summary>\n    <p>This is standard content projected inside native HTML tags!</p>\n  </details>\n  <details>\n    <summary>Advanced Settings</summary>\n    <p>More detailed settings go here.</p>\n  </details>\n  <details>\n    <summary>Danger Zone</summary>\n    <p>Critical actions are located here.</p>\n  </details>\n</sh-accordion>\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipAccordion } from '@ship-ui/core/ship-accordion';\n\n@Component({\n  selector: 'app-base-accordion',\n  imports: [ShipAccordion],\n  templateUrl: './base-accordion.html',\n  styleUrl: './base-accordion.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseAccordion {}\n"
      },
      {
        name: "type-b-accordion",
        html: '<sh-accordion variant="type-b">\n  <details>\n    <summary>Personal Information</summary>\n    <p>Notice the sharp corners and full-width layout built for seamless UI integration.</p>\n  </details>\n  <details>\n    <summary>Advanced Settings</summary>\n    <p>Configure everything completely flat.</p>\n  </details>\n  <details>\n    <summary>Danger Zone</summary>\n    <p>Critical actions here.</p>\n  </details>\n</sh-accordion>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipAccordion } from '@ship-ui/core/ship-accordion';\n\n@Component({\n  selector: 'app-type-b-accordion',\n  imports: [ShipAccordion],\n  templateUrl: './type-b-accordion.html',\n  styleUrl: './type-b-accordion.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TypeBAccordion {}\n"
      }
    ]
  },
  {
    name: "ShipAlert",
    selector: "sh-alert",
    package: "@ship-ui/core/ship-alert",
    kind: "component",
    path: "projects/ship-ui/ship-alert/ship-alert.ts",
    description: '### ShipAlertService\n\n`ShipAlertService` is provided in root and is the imperative way to show toast alerts from anywhere \u2014\ncomponents, interceptors, effects. Alerts are queued in a reactive history, animate in, and auto-hide after a\nshort timeout.\n\nTry it:\n\n<div class="service-demo-row">\n<button shButton color="success" (click)="alertService.success(\'Changes saved\')">success()</button>\n<button shButton color="warn" (click)="alertService.warning(\'Storage almost full\')">warning()</button>\n<button shButton color="error" (click)="alertService.error(\'Something went wrong\')">error()</button>\n<button shButton color="primary" (click)="alertService.info(\'Heads up!\')">info()</button>\n</div>\n<sh-alert-container [alertService]="alertService" />\n\n### Shorthand methods\n\n`success()`, `error()`, `warning()`, `info()` and\n`question()` each show a single-line alert of the matching type.\n\n<app-highlight lang="ts" [content]="codeShorthands" />\n\n### Full control with addAlert\n\nUse `addAlert()` when you need a body text or want to choose the type dynamically:\n\n<app-highlight lang="ts" [content]="codeAddAlert" />\n\n### Alert history\n\nEvery alert is kept in the `alertHistory` signal (newest first). The\n`alertHistoryIsOpen` and `alertHistoryIsHidden` signals control the history panel, and\n`removeAlert()` / `hideAlert()` manage individual entries.\n\n<app-highlight lang="ts" [content]="codeHistory" />',
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "Semantic color scale (`primary`, `accent`, `warn`, `error`, `success`); drives the state icon and `alert`/`status` role.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "Visual variant (`simple`, `outlined`, `flat`, `raised`).",
        defaultValue: "null",
        options: [
          "simple",
          "outlined",
          "flat",
          "raised",
          ""
        ]
      },
      {
        name: "alertService",
        type: "ShipAlertService | null",
        description: "Owning `ShipAlertService` used to dismiss this alert when rendered from the alert history.",
        defaultValue: "null"
      },
      {
        name: "id",
        type: "string | null",
        description: "Unique alert id; when set, renders the close button and enables dismissal.",
        defaultValue: "null"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--alert-state-ic",
        defaultValue: "currentColor"
      },
      {
        name: "--alert-close-ic",
        defaultValue: "currentColor"
      },
      {
        name: "--alert-ad",
        defaultValue: "400ms"
      },
      {
        name: "--alert-bs",
        defaultValue: "var(--box-shadow-10)"
      },
      {
        name: "--alert-py",
        defaultValue: "var(--pad-y-3)"
      },
      {
        name: "--alert-px",
        defaultValue: "var(--pad-x-2)"
      }
    ],
    examples: [
      {
        name: "flat-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="flat">Flat alert</sh-alert>\n<sh-alert variant="flat" color="primary">Primary flat alert</sh-alert>\n<sh-alert variant="flat" color="accent">Accent flat alert</sh-alert>\n<sh-alert variant="flat" color="warn">Warn flat alert</sh-alert>\n<sh-alert variant="flat" color="error">Error flat alert</sh-alert>\n<sh-alert variant="flat" color="success">\n  Success flat alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="flat">Flat alert</sh-alert>\n<sh-alert class="flat primary">Primary flat alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from '@ship-ui/core/ship-alert';\n\n@Component({\n  selector: 'app-flat-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './flat-alert.html',\n  styleUrl: './flat-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FlatAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "simple-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="simple">Simple alert</sh-alert>\n<sh-alert variant="simple" color="primary">Primary simple alert</sh-alert>\n<sh-alert variant="simple" color="accent">Accent simple alert</sh-alert>\n<sh-alert variant="simple" color="warn">Warn simple alert</sh-alert>\n<sh-alert variant="simple" color="error">Error simple alert</sh-alert>\n<sh-alert variant="simple" color="success">\n  Success simple alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="simple">Simple alert</sh-alert>\n<sh-alert class="simple primary">Primary simple alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from '@ship-ui/core/ship-alert';\n\n@Component({\n  selector: 'app-simple-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './simple-alert.html',\n  styleUrl: './simple-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SimpleAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "basic-alert",
        html: "<sh-alert>Default alert</sh-alert>\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipAlert } from '@ship-ui/core/ship-alert';\n\n@Component({\n  selector: 'app-basic-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './basic-alert.html',\n  styleUrl: './basic-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicAlert {}\n"
      },
      {
        name: "base-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert>Default alert</sh-alert>\n<sh-alert color="primary">Primary alert</sh-alert>\n<sh-alert color="accent">Accent alert</sh-alert>\n<sh-alert color="warn">Warn alert</sh-alert>\n<sh-alert color="error">Error alert</sh-alert>\n<sh-alert color="success">Success alert</sh-alert>\n<sh-alert color="success">\n  Success alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<sh-alert color="primary">\n  Success alert\n  <button shButton color="primary" variant="outlined" size="small">Button</button>\n</sh-alert>\n\n<sh-alert color="primary">\n  Success alert\n  <p>with a paragraph</p>\n  <button shButton color="primary" variant="outlined" size="small">Button</button>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="primary">Primary alert</sh-alert>\n<sh-alert class="accent">Accent alert</sh-alert>\n<button shButton class="outlined primary small">Button</button>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from '@ship-ui/core/ship-alert';\nimport { ShipButton } from '@ship-ui/core/ship-button';\n\n@Component({\n  selector: 'app-base-alert',\n  standalone: true,\n  imports: [ShipAlert, ShipButton],\n  templateUrl: './base-alert.html',\n  styleUrl: './base-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "raised-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="raised">Raised alert</sh-alert>\n<sh-alert variant="raised" color="primary">Primary raised alert</sh-alert>\n<sh-alert variant="raised" color="accent">Accent raised alert</sh-alert>\n<sh-alert variant="raised" color="warn">Warn raised alert</sh-alert>\n<sh-alert variant="raised" color="error">Error raised alert</sh-alert>\n<sh-alert variant="raised" color="success">\n  Success raised alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="raised">Raised alert</sh-alert>\n<sh-alert class="raised primary">Primary raised alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from '@ship-ui/core/ship-alert';\n\n@Component({\n  selector: 'app-raised-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './raised-alert.html',\n  styleUrl: './raised-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RaisedAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "outlined-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="outlined">Outlined alert</sh-alert>\n<sh-alert variant="outlined" color="primary">Primary outlined alert</sh-alert>\n<sh-alert variant="outlined" color="accent">Accent outlined alert</sh-alert>\n<sh-alert variant="outlined" color="warn">Warn outlined alert</sh-alert>\n<sh-alert variant="outlined" color="error">Error outlined alert</sh-alert>\n<sh-alert variant="outlined" color="success">\n  Success outlined alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="outlined">Outlined alert</sh-alert>\n<sh-alert class="outlined primary">Primary outlined alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from '@ship-ui/core/ship-alert';\n\n@Component({\n  selector: 'app-outlined-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './outlined-alert.html',\n  styleUrl: './outlined-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OutlinedAlert {\n  active = signal(false);\n}\n"
      }
    ]
  },
  {
    name: "ShipAlertContainer",
    selector: "sh-alert-container",
    selectorAliases: [
      "ship-alert-container"
    ],
    package: "@ship-ui/core/ship-alert",
    kind: "component",
    path: "projects/ship-ui/ship-alert/ship-alert-container.ts",
    inputs: [
      {
        name: "inline",
        type: "string | null",
        description: "When set, renders the alerts inline instead of as a hover-reveal floating stack.",
        defaultValue: "null"
      },
      {
        name: "alertService",
        type: "ShipAlertService",
        description: "The `ShipAlertService` instance whose alert history this container renders."
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipAvatar",
    selector: "sh-avatar",
    package: "@ship-ui/core/ship-avatar",
    kind: "component",
    path: "projects/ship-ui/ship-avatar/ship-avatar.ts",
    description: "An avatar: a picture when `src` loads, otherwise 1\u20132 initials from `name` on a background colour\nderived from the name (or the given `color`). Put `shTooltip` on it for the full name.",
    inputs: [
      {
        name: "name",
        type: "string",
        description: "The person's name: the source of the initials, the colour and the accessible label.",
        defaultValue: "''"
      },
      {
        name: "src",
        type: "string | null | undefined",
        description: "Image URL; the initials show until it loads and again if it fails.",
        defaultValue: "null"
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "Size preset: `small` or the regular size. Falls back to the enclosing group's size.",
        defaultValue: "null",
        options: [
          "small",
          "xsmall",
          ""
        ]
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Semantic colour scale instead of the name-derived hue.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "ring",
        type: "boolean",
        description: 'Draws an activity ring around the avatar (for "is dragging", "is editing" and similar states).',
        defaultValue: "false"
      },
      {
        name: "ringColor",
        type: "ShipColor | null",
        description: "Colour scale of the ring; defaults to `primary`.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--avatar-si",
        defaultValue: "#{p2r(32)}"
      },
      {
        name: "--avatar-f",
        defaultValue: "var(--paragraph-30B)"
      },
      {
        name: "--avatar-bg",
        defaultValue: "var(--base-3)"
      },
      {
        name: "--avatar-c",
        defaultValue: "var(--base-11)"
      },
      {
        name: "--avatar-ring-c",
        defaultValue: "var(--primary-8)"
      },
      {
        name: "--avatar-bc",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--avatar-hr",
        defaultValue: "#{$i * 45}"
      }
    ],
    examples: [
      {
        name: "group-avatar",
        html: '<sh-avatar-group [max]="3">\n  @for (name of people(); track name) {\n    <sh-avatar [name]="name" />\n  }\n</sh-avatar-group>\n\n<sh-avatar-group [max]="4" size="small">\n  @for (name of people(); track name) {\n    <sh-avatar [name]="name" />\n  }\n</sh-avatar-group>\n\n<div class="actions">\n  <button shButton class="small" (click)="add()">Add</button>\n  <button shButton class="small" (click)="remove()">Remove</button>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAvatar, ShipAvatarGroup } from '@ship-ui/core/ship-avatar';\nimport { ShipButton } from '@ship-ui/core/ship-button';\n\nconst PEOPLE = ['Ada Lovelace', 'Grace Hopper', 'Linus Torvalds', 'Margaret Hamilton', 'Ken Thompson', 'Barbara Liskov'];\n\n@Component({\n  selector: 'app-group-avatar',\n  imports: [ShipAvatar, ShipAvatarGroup, ShipButton],\n  templateUrl: './group-avatar.html',\n  styleUrl: './group-avatar.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class GroupAvatar {\n  people = signal(PEOPLE.slice(0, 5));\n\n  add() {\n    this.people.update((list) => (list.length < PEOPLE.length ? PEOPLE.slice(0, list.length + 1) : list));\n  }\n\n  remove() {\n    this.people.update((list) => list.slice(0, -1));\n  }\n}\n"
      },
      {
        name: "basic-avatar",
        html: '<sh-avatar name="Ada Lovelace" />\n<sh-avatar name="Grace Hopper" />\n<sh-avatar name="Linus" />\n<sh-avatar name="Margaret Hamilton" color="primary" />\n<sh-avatar name="Ken Thompson" src="https://i.pravatar.cc/64?img=12" />\n\n<sh-avatar name="Ada Lovelace" size="small" />\n<sh-avatar name="Grace Hopper" size="small" />\n<sh-avatar name="Ken Thompson" size="small" src="https://i.pravatar.cc/64?img=12" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipAvatar } from '@ship-ui/core/ship-avatar';\n\n@Component({\n  selector: 'app-basic-avatar',\n  imports: [ShipAvatar],\n  templateUrl: './basic-avatar.html',\n  styleUrl: './basic-avatar.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicAvatar {}\n"
      },
      {
        name: "ring-avatar",
        html: '<sh-avatar name="Ada Lovelace" ring shTooltip="Ada Lovelace is editing" />\n<sh-avatar name="Grace Hopper" ring ringColor="accent" shTooltip="Grace Hopper is moving this card" />\n<sh-avatar name="Linus Torvalds" ring ringColor="warn" size="small" shTooltip="Linus Torvalds is viewing" />\n\n<sh-avatar-group size="small">\n  <sh-avatar name="Ada Lovelace" ring shTooltip="Ada Lovelace (dragging)" />\n  <sh-avatar name="Grace Hopper" shTooltip="Grace Hopper" />\n  <sh-avatar name="Ken Thompson" shTooltip="Ken Thompson" />\n</sh-avatar-group>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipAvatar, ShipAvatarGroup } from '@ship-ui/core/ship-avatar';\nimport { ShipTooltip } from '@ship-ui/core/ship-tooltip';\n\n@Component({\n  selector: 'app-ring-avatar',\n  imports: [ShipAvatar, ShipAvatarGroup, ShipTooltip],\n  templateUrl: './ring-avatar.html',\n  styleUrl: './ring-avatar.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RingAvatar {}\n"
      }
    ]
  },
  {
    name: "ShipAvatarGroup",
    selector: "sh-avatar-group",
    package: "@ship-ui/core/ship-avatar",
    kind: "component",
    path: "projects/ship-ui/ship-avatar/ship-avatar.ts",
    description: "A stacked row of avatars. Shows the first `max` and folds the rest into a `+N` badge.\nThe group's `size` applies to every avatar that has none of its own.",
    inputs: [
      {
        name: "max",
        type: "number",
        description: "How many avatars stay visible before the rest collapse into `+N`.",
        defaultValue: "3"
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "Size applied to avatars in the group that do not set their own.",
        defaultValue: "null",
        options: [
          "small",
          "xsmall",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [
      {
        name: "isHidden",
        parameters: "avatar: ShipAvatar",
        returnType: "boolean",
        description: "Whether the given avatar is past `max` and therefore hidden."
      }
    ],
    cssVariables: [
      {
        name: "--avatar-overlap",
        defaultValue: "#{p2r(-8)}"
      }
    ],
    examples: []
  },
  {
    name: "ShipBlueprint",
    selector: "sh-blueprint",
    package: "@ship-ui/core/ship-blueprint",
    kind: "component",
    path: "projects/ship-ui/ship-blueprint/ship-blueprint.ts",
    inputs: [
      {
        name: "forceUnique",
        type: "boolean",
        description: "De-duplicate node and port ids on init instead of surfacing a validation error.",
        defaultValue: "true"
      },
      {
        name: "autoLayout",
        type: "boolean",
        description: "Run the auto-layout algorithm once after the view initialises.",
        defaultValue: "false"
      },
      {
        name: "gridSize",
        type: "number",
        description: "Spacing in pixels of the background grid.",
        defaultValue: "20"
      },
      {
        name: "snapToGrid",
        type: "boolean",
        description: "Snap dragged nodes to the grid (also forced while holding Shift).",
        defaultValue: "true"
      },
      {
        name: "gridColor",
        type: "[string, string]",
        description: "Grid line/dot color as a `[light, dark]` pair, chosen by the document theme.",
        defaultValue: "['#d8d8d8', '#2c2c2c']"
      },
      {
        name: "nodes",
        type: "BlueprintNode[]",
        description: "Two-way bound graph of nodes, their ports, and connections.",
        defaultValue: "[]",
        twoWay: true
      }
    ],
    outputs: [],
    methods: [
      {
        name: "updateCanvasSize",
        parameters: "",
        returnType: "void",
        description: "Resize the canvas to the host's bounds (accounting for device pixel ratio) and redraw."
      },
      {
        name: "drawCanvas",
        parameters: "",
        returnType: "void",
        description: "Clear and redraw the canvas grid, connections, and any in-progress connection at the current pan/zoom."
      },
      {
        name: "cancelPortDrag",
        parameters: "",
        returnType: "void",
        description: "Abort an in-progress connection drag, discarding the pending link."
      },
      {
        name: "getNodePortPosition",
        parameters: "nodeId: string, portId: string",
        returnType: "Coordinates",
        description: "Return the world-space `[x, y]` position of a node's port, measuring the DOM when available."
      },
      {
        name: "closeMidpointDiv",
        parameters: "",
        returnType: "void",
        description: "Hide the connection-removal midpoint control and unlock the canvas."
      },
      {
        name: "getNewNodeCoordinates",
        parameters: "panToCoordinates = false",
        returnType: "Coordinates",
        description: "Compute coordinates for a new node below the existing ones, optionally panning the view to them."
      }
    ],
    cssVariables: [
      {
        name: "--bp-grid-c",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--bp-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--bp-icon-c",
        defaultValue: "var(--base-6)"
      },
      {
        name: "--bp-stroke-c",
        defaultValue: "var(--base-7)"
      },
      {
        name: "--bp-stroke-ca",
        defaultValue: "var(--primary-8)"
      },
      {
        name: "--card-bg",
        defaultValue: "var(--base-1)"
      }
    ],
    examples: []
  },
  {
    name: "ShipBreadcrumbs",
    selector: "sh-breadcrumbs",
    package: "@ship-ui/core/ship-breadcrumbs",
    kind: "component",
    path: "projects/ship-ui/ship-breadcrumbs/ship-breadcrumbs.ts",
    description: 'Breadcrumb trail. Put the crumbs in as direct children (`a[routerLink]`,\n`a[href]`, `button` or a plain `span`), optionally with an `sh-icon` inside;\nseparators are drawn between them. The last crumb is styled as the current\npage \u2014 mark it `aria-current="page"`. Slots into `sh-lo-page`\'s nav area.',
    inputs: [
      {
        name: "label",
        type: "string",
        description: "Accessible name of the navigation landmark.",
        defaultValue: "'Breadcrumb'"
      },
      {
        name: "separator",
        type: "string",
        description: "Character(s) drawn between crumbs. Hidden from assistive tech.",
        defaultValue: "'/'"
      },
      {
        name: "variant",
        type: "ShipBreadcrumbsVariant | null",
        description: "Visual variant: `type-b` boxed surface, `type-c` pill crumbs. Project default via `ShipConfig.breadcrumbs.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      },
      {
        name: "size",
        type: "ShipBreadcrumbsSize | null",
        description: "`small` for dense headers. Project default via `ShipConfig.breadcrumbs.size`.",
        defaultValue: "null",
        options: [
          "small",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--crumb-f",
        defaultValue: "var(--paragraph-30)"
      },
      {
        name: "--crumb-gap",
        defaultValue: "var(--space-2)"
      },
      {
        name: "--crumb-py",
        defaultValue: "0"
      },
      {
        name: "--crumb-px",
        defaultValue: "0"
      },
      {
        name: "--crumb-c",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--crumb-c-h",
        defaultValue: "var(--base-12)"
      },
      {
        name: "--crumb-c-current",
        defaultValue: "var(--base-12)"
      },
      {
        name: "--crumb-sep-c",
        defaultValue: "var(--base-6)"
      },
      {
        name: "--crumb-sep-w",
        defaultValue: "1ch"
      },
      {
        name: "--crumb-item-py",
        defaultValue: "0"
      },
      {
        name: "--crumb-item-px",
        defaultValue: "0"
      },
      {
        name: "--crumb-item-bg",
        defaultValue: "transparent"
      },
      {
        name: "--crumb-item-bg-h",
        defaultValue: "transparent"
      },
      {
        name: "--crumb-item-bg-current",
        defaultValue: "transparent"
      },
      {
        name: "--crumb-item-s",
        defaultValue: "var(--shape-1)"
      },
      {
        name: "--crumb-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--crumb-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--crumb-s",
        defaultValue: "var(--shape-2)"
      }
    ],
    examples: [
      {
        name: "breadcrumbs-sandbox",
        html: '<sh-breadcrumbs [variant]="variant()" [size]="size()" [separator]="separator()">\n  <a href="#">\n    <sh-icon>house</sh-icon>\n    Home\n  </a>\n  <a href="#">Workspace</a>\n  <a href="#">Projects</a>\n  <span aria-current="page">Ship UI</span>\n</sh-breadcrumbs>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipBreadcrumbsSize, ShipBreadcrumbsVariant } from '@ship-ui/core';\nimport { ShipBreadcrumbs } from '@ship-ui/core/ship-breadcrumbs';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-breadcrumbs-sandbox',\n  imports: [ShipBreadcrumbs, ShipIcon],\n  templateUrl: './breadcrumbs-sandbox.html',\n  styleUrl: './breadcrumbs-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BreadcrumbsSandbox {\n  variant = input<ShipBreadcrumbsVariant>('');\n  size = input<ShipBreadcrumbsSize>('');\n  separator = input('/');\n}\n"
      },
      {
        name: "config-breadcrumbs",
        html: '<sh-breadcrumbs>\n  @for (crumb of crumbs; track crumb.label; let last = $last) {\n    @if (last) {\n      <span aria-current="page">{{ crumb.label }}</span>\n    } @else {\n      <a [href]="crumb.href">\n        @if (crumb.icon) {\n          <sh-icon>{{ crumb.icon }}</sh-icon>\n        }\n        {{ crumb.label }}\n      </a>\n    }\n  }\n</sh-breadcrumbs>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipBreadcrumbs } from '@ship-ui/core/ship-breadcrumbs';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\ninterface Crumb {\n  label: string;\n  href: string;\n  icon?: string;\n}\n\n@Component({\n  selector: 'app-config-breadcrumbs-example',\n  imports: [ShipBreadcrumbs, ShipIcon],\n  templateUrl: './config-breadcrumbs.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ConfigBreadcrumbs {\n  // Build the trail from data instead of hand-written children. In an app this\n  // usually comes from the router (route `data`) or a breadcrumbs service, and\n  // each link is an `a[routerLink]` rather than `a[href]`.\n  crumbs: Crumb[] = [\n    { label: 'Home', href: '#', icon: 'house' },\n    { label: 'Workspace', href: '#' },\n    { label: 'Projects', href: '#' },\n    { label: 'Ship UI', href: '#' },\n  ];\n}\n"
      },
      {
        name: "basic-breadcrumbs",
        html: '<sh-breadcrumbs>\n  <a href="#">Home</a>\n  <a href="#">Projects</a>\n  <span aria-current="page">Ship UI</span>\n</sh-breadcrumbs>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipBreadcrumbs } from '@ship-ui/core/ship-breadcrumbs';\n\n@Component({\n  selector: 'app-basic-breadcrumbs-example',\n  imports: [ShipBreadcrumbs],\n  templateUrl: './basic-breadcrumbs.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicBreadcrumbs {}\n"
      },
      {
        name: "page-breadcrumbs",
        html: `<sh-lo-page size="small">
  <sh-breadcrumbs>
    @for (crumb of trail(); track crumb.id; let last = $last) {
      @if (last) {
        <span aria-current="page">{{ crumb.title }}</span>
      } @else {
        <button type="button" (click)="open(crumb.id)">
          @if (crumb.icon) {
            <sh-icon>{{ crumb.icon }}</sh-icon>
          }
          {{ crumb.title }}
        </button>
      }
    }
  </sh-breadcrumbs>

  <h1>{{ current().title }}</h1>
  <p>{{ current().description }}</p>

  @if (children().length) {
    <sh-list class="type-c">
      @for (child of children(); track child.id) {
        <button type="button" (click)="open(child.id)">
          <sh-icon>{{ child.icon }}</sh-icon>
          <span class="text-group">
            <span class="label">{{ child.title }}</span>
            <span class="description">{{ child.description }}</span>
          </span>
          <sh-icon suffix>caret-right</sh-icon>
        </button>
      }
    </sh-list>
  } @else {
    <sh-lo-empty-state>
      <sh-icon>{{ current().icon }}</sh-icon>
      <h3>You're at the end of the trail</h3>
      <p>Use the breadcrumbs above to jump back to any level.</p>
    </sh-lo-empty-state>
  }
</sh-lo-page>
`,
        ts: "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { ShipBreadcrumbs } from '@ship-ui/core/ship-breadcrumbs';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutEmptyState, ShipLayoutPage } from '@ship-ui/core/ship-layout';\nimport { ShipList } from '@ship-ui/core/ship-list';\n\ninterface Page {\n  id: string;\n  title: string;\n  description: string;\n  icon: string;\n  parent?: string;\n}\n\n// Icons only named in data need registering for the icon font subset:\n// subset: 'shicon:house' 'shicon:folder-simple' 'shicon:package' 'shicon:book-open' 'shicon:gear'\n// 'shicon:sliders' 'shicon:users' 'shicon:user-plus' 'shicon:shield-check'\n\n// In an app these are your routes: each crumb is an `a[routerLink]` to its parent route.\nconst PAGES: Page[] = [\n  { id: 'home', title: 'Home', description: 'Everything in your workspace.', icon: 'house' },\n  { id: 'projects', parent: 'home', title: 'Projects', description: 'Apps and sites you ship.', icon: 'folder-simple' },\n  { id: 'ship-ui', parent: 'projects', title: 'Ship UI', description: 'The component library.', icon: 'package' },\n  { id: 'docs', parent: 'projects', title: 'Docs', description: 'The documentation site.', icon: 'book-open' },\n  { id: 'settings', parent: 'home', title: 'Settings', description: 'Workspace preferences.', icon: 'gear' },\n  { id: 'general', parent: 'settings', title: 'General', description: 'Name, region and language.', icon: 'sliders' },\n  { id: 'team', parent: 'settings', title: 'Team', description: 'People and permissions.', icon: 'users' },\n  { id: 'members', parent: 'team', title: 'Members', description: 'Invite and remove people.', icon: 'user-plus' },\n  { id: 'roles', parent: 'team', title: 'Roles', description: 'Who can do what.', icon: 'shield-check' },\n];\n\nconst byId = new Map(PAGES.map((page) => [page.id, page]));\n\n@Component({\n  selector: 'app-page-breadcrumbs-example',\n  imports: [ShipLayoutPage, ShipLayoutEmptyState, ShipBreadcrumbs, ShipIcon, ShipList],\n  templateUrl: './page-breadcrumbs.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class PageBreadcrumbs {\n  currentId = signal('members');\n\n  current = computed(() => byId.get(this.currentId())!);\n  children = computed(() => PAGES.filter((page) => page.parent === this.currentId()));\n\n  // Walk up the parents to build the trail, root first.\n  trail = computed(() => {\n    const trail: Page[] = [];\n    for (let page = this.current(); page; page = byId.get(page.parent!)!) {\n      trail.unshift(page);\n      if (!page.parent) break;\n    }\n    return trail;\n  });\n\n  open(id: string) {\n    this.currentId.set(id);\n  }\n}\n"
      }
    ]
  },
  {
    name: "ShipButtonGroup",
    selector: "sh-button-group",
    package: "@ship-ui/core/ship-button-group",
    kind: "component",
    path: "projects/ship-ui/ship-button-group/ship-button-group.ts",
    inputs: [
      {
        name: "variant",
        type: "ShipButtonGroupVariant | null",
        description: "Visual variant of the button group.",
        defaultValue: "null",
        options: [
          ""
        ]
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "Size preset.",
        defaultValue: "null",
        options: [
          "small",
          "xsmall",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--btng-bg",
        defaultValue: "var(--base-3)"
      },
      {
        name: "--btng-item-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--btng-c",
        defaultValue: "var(--base-12)"
      },
      {
        name: "--btng-ic",
        defaultValue: "var(--base-12)"
      },
      {
        name: "--btng-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--btng-h",
        defaultValue: "#{p2r(40)}"
      },
      {
        name: "--btng-py",
        defaultValue: "0"
      },
      {
        name: "--btng-px",
        defaultValue: "var(--pad-x-3)"
      },
      {
        name: "--btng-s",
        defaultValue: "var(--shape-2)"
      },
      {
        name: "--btng-s-a",
        defaultValue: "var(--shape-2)"
      },
      {
        name: "--btng-f",
        defaultValue: "var(--paragraph-30)"
      }
    ],
    examples: [
      {
        name: "basic-button-group",
        html: '<sh-button-group [(value)]="selected">\n  <button value="one">One</button>\n  <button value="two">Two</button>\n  <button value="three">Three</button>\n</sh-button-group>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipButtonGroup } from '@ship-ui/core/ship-button-group';\n\n@Component({\n  selector: 'app-basic-button-group',\n  standalone: true,\n  imports: [ShipButtonGroup],\n  templateUrl: './basic-button-group.html',\n  styleUrl: './basic-button-group.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicButtonGroup {\n  selected = signal<string | null>('one');\n}\n"
      },
      {
        name: "base-button-group",
        html: '<sh-button-group [class.small]="small()" [(value)]="activeIndex">\n  @for (item of items(); track $index; let idx = $index) {\n    <button [value]="idx.toString()">\n      <sh-icon>circle</sh-icon>\n      Hello {{ idx }}\n    </button>\n  }\n</sh-button-group>\n\n<sh-button-group [class.small]="small()" [(value)]="selected">\n  <button value="one">One</button>\n  <button value="two">Two</button>\n  <button value="three">Three</button>\n  <button value="four">Four</button>\n  <button value="five">Five</button>\n</sh-button-group>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipButtonGroup } from '@ship-ui/core/ship-button-group';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-base-button-group',\n  imports: [ShipButtonGroup, ShipIcon],\n  templateUrl: './base-button-group.html',\n  styleUrl: './base-button-group.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseButtonGroup {\n  small = input<boolean>(false);\n  activeIndex = signal<string | null>('0');\n  selected = signal<string | null>('one');\n\n  items = signal(new Array(5).fill('0'));\n}\n"
      }
    ],
    keywords: [
      "button",
      "group",
      "joined",
      "grouped",
      "cluster",
      "segment"
    ]
  },
  {
    name: "ShipCard",
    selector: "sh-card",
    package: "@ship-ui/core/ship-card",
    kind: "component",
    path: "projects/ship-ui/ship-card/ship-card.ts",
    description: "### Variants\n\nCard variants can be set using the\n`variant`\nattribute. Available options:\n**type-a**\n,\n**type-b**\n,\n**type-c**\n,\n**type-d**\n(content surface right to the border, no inset frame), and\n**default**\n.\n\n### Toggle Card\n\nUse\n`&lt;sh-toggle-card&gt;`\nfor collapsible content. Use the\n`disableToggle`\nattribute or binding to keep the card open.",
    inputs: [
      {
        name: "variant",
        type: "ShipCardVariant | null",
        description: "Visual variant of the card.",
        defaultValue: "null",
        options: [
          "type-a",
          "type-b",
          "type-c",
          "type-d",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--card-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--card-ibg",
        defaultValue: "var(--base-2)"
      },
      {
        name: "--card-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--card-sh",
        defaultValue: "var(--box-shadow-10)"
      },
      {
        name: "--card-py",
        defaultValue: "var(--pad-y-6)"
      },
      {
        name: "--card-px",
        defaultValue: "var(--pad-x-6)"
      },
      {
        name: "--card-shp",
        defaultValue: "#{p2r(8)}"
      }
    ],
    examples: [
      {
        name: "card-sandbox",
        html: '<sh-card [variant]="variant()">Hello world (sh-card)</sh-card>\n\n<sh-toggle-card [variant]="variant()" [disableToggle]="disableToggle()">\n  <ng-container title>Advanced options</ng-container>\n  <p>Hello world (sh-toggle-card)</p>\n\n  <p>\n    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore\n    magna aliqua.\n  </p>\n\n  <p>\n    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore\n    magna aliqua.\n  </p>\n</sh-toggle-card>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipCardVariant } from '@ship-ui/core';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipToggleCard } from '@ship-ui/core/ship-toggle-card';\n\n@Component({\n  selector: 'app-card-sandbox',\n  imports: [ShipCard, ShipToggleCard],\n  templateUrl: './card-sandbox.html',\n  styleUrl: './card-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class CardSandbox {\n  variant = input<ShipCardVariant>('type-a');\n  disableToggle = input(false);\n}\n"
      },
      {
        name: "toggle-card",
        html: "<sh-toggle-card>\n  <ng-container title>Advanced options</ng-container>\n  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>\n</sh-toggle-card>\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipToggleCard } from '@ship-ui/core/ship-toggle-card';\n\n@Component({\n  selector: 'app-toggle-card-example',\n  standalone: true,\n  imports: [ShipToggleCard],\n  templateUrl: './toggle-card.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ToggleCardExampleComponent {}\n"
      },
      {
        name: "base-card",
        html: '<sh-card>\n  <header>Base Card Title</header>\n  <div class="content">\n    <p>This is an example of the default base card layout. It features standard padding, background, and borders.</p>\n  </div>\n  <footer>\n    <button shButton variant="outlined" size="small">Cancel</button>\n    <button shButton variant="raised" color="primary" size="small">Confirm</button>\n  </footer>\n</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\n\n@Component({\n  selector: 'app-base-card',\n  imports: [ShipCard, ShipButton],\n  templateUrl: './base-card.html',\n  styleUrl: './base-card.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseCardComponent {}\n"
      },
      {
        name: "type-a-card",
        html: '<sh-card variant="type-a">hello world</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipCard } from '@ship-ui/core/ship-card';\n\n@Component({\n  selector: 'app-type-a-card',\n  standalone: true,\n  imports: [ShipCard],\n  templateUrl: './type-a-card.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TypeACardComponent {}\n"
      },
      {
        name: "type-b-card",
        html: '<sh-card variant="type-b">hello world</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipCard } from '@ship-ui/core/ship-card';\n\n@Component({\n  selector: 'app-type-b-card',\n  standalone: true,\n  imports: [ShipCard],\n  templateUrl: './type-b-card.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TypeBCardComponent {}\n"
      },
      {
        name: "type-c-card",
        html: '<sh-card variant="type-c">hello world</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipCard } from '@ship-ui/core/ship-card';\n\n@Component({\n  selector: 'app-type-c-card',\n  standalone: true,\n  imports: [ShipCard],\n  templateUrl: './type-c-card.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TypeCCardComponent {}\n"
      },
      {
        name: "toggle-card-disallowed",
        html: '<sh-toggle-card [disableToggle]="true">\n  <ng-container title>Advanced options</ng-container>\n  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>\n</sh-toggle-card>\n\n<sh-toggle-card [disableToggle]="true">\n  <div title style="display: flex; align-items: center; justify-content: space-between; width: 100%;">\n    <span>Options</span>\n    <sh-menu [searchable]="true">\n      <button shButton class="outlined small">Select option</button>\n      <ng-container menu>\n        @for (item of menuItems; track item.value) {\n          <button (click)="select(item)" [class.selected]="selected === item.value">\n            {{ item.label }}\n          </button>\n        }\n      </ng-container>\n    </sh-menu>\n  </div>\n  <p>This toggle card has a searchable menu in its title. You should be able to type in the search field.</p>\n</sh-toggle-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipMenu } from '@ship-ui/core/ship-menu';\nimport { ShipToggleCard } from '@ship-ui/core/ship-toggle-card';\n\n@Component({\n  selector: 'app-toggle-card-disallowed-example',\n  standalone: true,\n  imports: [ShipToggleCard, ShipMenu, ShipButton],\n  templateUrl: './toggle-card-disallowed.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ToggleCardDisallowedExampleComponent {\n  menuItems = [\n    { label: 'Dashboard', value: 'dashboard' },\n    { label: 'Users', value: 'users' },\n    { label: 'Settings', value: 'settings' },\n    { label: 'Billing', value: 'billing' },\n  ];\n  selected: string | null = null;\n\n  select(item: any) {\n    this.selected = item.value;\n  }\n}\n"
      },
      {
        name: "type-d-card",
        html: '<sh-card variant="type-d">hello world</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipCard } from '@ship-ui/core/ship-card';\n\n@Component({\n  selector: 'app-type-d-card',\n  standalone: true,\n  imports: [ShipCard],\n  templateUrl: './type-d-card.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TypeDCardComponent {}\n"
      }
    ]
  },
  {
    name: "ShipChartSparkline",
    selector: "sh-chart-sparkline",
    package: "@ship-ui/core/ship-chart-sparkline",
    kind: "component",
    path: "projects/ship-ui/ship-chart-sparkline/ship-chart-sparkline.ts",
    description: '### Overview\n\n`&lt;sh-chart-sparkline&gt;`\nis the first of Ship\'s\n**standalone charts**\n: one series, one SVG, no axes, no legend, no runtime dependency on the rest of Ship. It is meant for KPI tiles,\ntable cells and list rows where a trend matters more than the numbers. It fills the width it is given and defaults\nto\n`--chart-h`\ntall.\n\n### Colors\n\nThe\n`color`\ninput (\n`primary`\n,\n`accent`\n,\n`success`\n,\n`warn`\n,\n`error`\n) picks the matching palette shades. Every visual value is a custom property declared on the host, so a plain\noverride on the element or a parent always wins.\n\n<app-highlight lang="scss" [content]="variablesExample" />\n\n### Shape\n\n`curve`\nchooses\n`linear`\n,\n`monotone`\n(smooth, never overshoots) or\n`step`\n.\n`area`\nfills under the line,\n`dot`\nmarks the latest value.\n`min`\nand\n`max`\npin the value axis so several sparklines share a scale.\n\n### Live data\n\nAdd\n`animate`\nand changes to\n`data`\ntween over\n`animationDuration`\n(300ms). The common streaming case is handled on purpose: when the oldest value is dropped and a new one is\nappended, the line slides one slot to the left, the dropped value leaves through the left edge and the new one\narrives from the right. Appending without dropping compresses the line, any other change eases every point to its\nnew place. Reduced motion turns it off.\n\n### Accessibility\n\nThe host has\n`role="img"`\nand an automatic label summarising count, range and latest value. Pass\n`ariaLabel`\nto describe it in your own words.\n\n### Building your own with the scales module\n\nThe math lives in\n`@ship-ui/core/ship-chart-scales`\n: pure functions for linear scales, nice ticks and SVG path building. Standalone charts and the composable\n`sh-chart`\nfamily both use it, and so can you.\n\n<app-highlight lang="ts" [content]="scalesExample" />',
    inputs: [
      {
        name: "data",
        type: "readonly number[]",
        description: "The values to plot, left to right. Non-finite entries are skipped."
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Palette color to inherit (project default via `ShipConfig.chartSparkline.color`). Any custom property set on the host still wins.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "curve",
        type: "ShipCurve",
        description: "Line interpolation.",
        defaultValue: "'linear'"
      },
      {
        name: "area",
        type: "boolean",
        description: "Fill the area under the line.",
        defaultValue: "false"
      },
      {
        name: "dot",
        type: "boolean",
        description: "Mark the last value with a dot.",
        defaultValue: "false"
      },
      {
        name: "min",
        type: "unknown",
        description: "Fixed lower bound of the value axis; defaults to the data minimum.",
        defaultValue: "undefined"
      },
      {
        name: "max",
        type: "unknown",
        description: "Fixed upper bound of the value axis; defaults to the data maximum.",
        defaultValue: "undefined"
      },
      {
        name: "ariaLabel",
        type: "string | null",
        description: "Accessible description. Defaults to a short summary of the values.",
        defaultValue: "null"
      },
      {
        name: "animate",
        type: "boolean",
        description: "Tween data changes: new values slide in on the right, dropped values slide out on the left.",
        defaultValue: "false"
      },
      {
        name: "animationDuration",
        type: "number",
        description: "Length of that tween in milliseconds.",
        defaultValue: "300"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--chart-stroke",
        defaultValue: "var(--primary-8)"
      },
      {
        name: "--chart-fill",
        defaultValue: "var(--primary-3)"
      },
      {
        name: "--chart-fill-opacity",
        defaultValue: "0.6"
      },
      {
        name: "--chart-stroke-width",
        defaultValue: "2"
      },
      {
        name: "--chart-dot-size",
        defaultValue: "#{p2r(6)}"
      },
      {
        name: "--chart-h",
        defaultValue: "2rem"
      },
      {
        name: "--chart-pad",
        defaultValue: "calc(var(--chart-stroke-width) * 0.5px + 1px)"
      }
    ],
    examples: [
      {
        name: "basic-chart-sparkline",
        html: '<sh-chart-sparkline [data]="visits" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipChartSparkline } from '@ship-ui/core/ship-chart-sparkline';\n\n@Component({\n  selector: 'app-basic-chart-sparkline',\n  imports: [ShipChartSparkline],\n  templateUrl: './basic-chart-sparkline.html',\n  styleUrl: './basic-chart-sparkline.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicChartSparkline {\n  visits = [12, 18, 15, 22, 30, 26, 34, 41, 38, 45];\n}\n"
      },
      {
        name: "sparkline-variants",
        html: '<div class="row">\n  <span>Revenue</span>\n  <sh-chart-sparkline [data]="revenue" color="success" curve="monotone" area dot />\n</div>\n\n<div class="row">\n  <span>Errors</span>\n  <sh-chart-sparkline [data]="errors" color="error" area />\n</div>\n\n<div class="row">\n  <span>Latency</span>\n  <sh-chart-sparkline [data]="latency" color="accent" curve="monotone" dot />\n</div>\n\n<div class="row">\n  <span>Steps</span>\n  <sh-chart-sparkline [data]="steps" color="warn" curve="step" />\n</div>\n\n<div class="row">\n  <span>Custom</span>\n  <sh-chart-sparkline class="custom" [data]="revenue" area dot />\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipChartSparkline } from '@ship-ui/core/ship-chart-sparkline';\n\n@Component({\n  selector: 'app-sparkline-variants',\n  imports: [ShipChartSparkline],\n  templateUrl: './sparkline-variants.html',\n  styleUrl: './sparkline-variants.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SparklineVariants {\n  revenue = [4, 6, 5, 9, 7, 12, 10, 14, 13, 18];\n  errors = [2, 1, 4, 3, 6, 5, 9, 4, 3, 2];\n  latency = [120, 118, 125, 121, 119, 140, 132, 128, 122, 117];\n  steps = [1, 1, 2, 2, 2, 3, 3, 4, 4, 5];\n}\n"
      },
      {
        name: "live-chart-sparkline",
        html: `<div class="tile">
  <div class="stat">
    <span class="label">Requests / s</span>
    <strong>{{ values()[values().length - 1] }}</strong>
  </div>
  <sh-chart-sparkline [data]="values()" curve="monotone" area dot animate />
</div>

<div class="actions">
  <button shButton class="flat" (click)="tick()">Push a value</button>
  <button shButton class="flat" (click)="toggle()">{{ running() ? 'Pause' : 'Resume' }}</button>
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipChartSparkline } from '@ship-ui/core/ship-chart-sparkline';\n\n@Component({\n  selector: 'app-live-chart-sparkline',\n  imports: [ShipChartSparkline, ShipButton],\n  templateUrl: './live-chart-sparkline.html',\n  styleUrl: './live-chart-sparkline.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class LiveChartSparkline {\n  values = signal([42, 47, 45, 51, 49, 55, 58, 54, 60, 63]);\n  running = signal(true);\n  #timer: ReturnType<typeof setInterval> | null = null;\n\n  constructor() {\n    this.start();\n    inject(DestroyRef).onDestroy(() => this.stop());\n  }\n\n  /** Drops the oldest value and appends a new one, like a metric ticking in. */\n  tick() {\n    this.values.update((values) => {\n      const last = values[values.length - 1];\n      const next = Math.max(20, Math.min(90, last + Math.round((Math.random() - 0.45) * 14)));\n      return [...values.slice(1), next];\n    });\n  }\n\n  toggle() {\n    this.running() ? this.stop() : this.start();\n  }\n\n  start() {\n    if (typeof window === 'undefined') return;\n    this.stop();\n    this.#timer = setInterval(() => this.tick(), 1200);\n    this.running.set(true);\n  }\n\n  stop() {\n    if (this.#timer) clearInterval(this.#timer);\n    this.#timer = null;\n    this.running.set(false);\n  }\n}\n"
      }
    ]
  },
  {
    name: "ShipChat",
    selector: "sh-chat",
    package: "@ship-ui/core/ship-chat",
    kind: "component",
    path: "projects/ship-ui/ship-chat/ship-chat.ts",
    description: "A single chat message. Slot the parts in: `sh-avatar`, `b` (sender name),\n`time`, the message content (text, `p`s, images, cards\u2026), and `sh-chip`s or\nan element marked `footer` (reactions, read receipts) below the bubble.\nStack messages in any block container \u2014 each one spaces itself from the\nprevious; mark follow-ups from the same sender `continued` and leave out\ntheir avatar and name to group them.",
    inputs: [
      {
        name: "outgoing",
        type: "boolean",
        description: "Sent by the current user: aligned to the end with the outgoing bubble style.",
        defaultValue: "false"
      },
      {
        name: "continued",
        type: "boolean",
        description: "A follow-up from the same sender: sits tight under the previous message, keeping its avatar space.",
        defaultValue: "false"
      },
      {
        name: "typing",
        type: "boolean",
        description: "Replace the content with an animated typing indicator.",
        defaultValue: "false"
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Bubble color. Project default via `ShipConfig.chat.color`.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipChatVariant | null",
        description: "Visual variant: `type-b` outlined bubbles, `type-c` flat rows (no bubbles, everything start-aligned). Project default via `ShipConfig.chat.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--chat-gap",
        defaultValue: "var(--space-4)"
      },
      {
        name: "--chat-gap-continued",
        defaultValue: "var(--space-1)"
      },
      {
        name: "--chat-avatar-si",
        defaultValue: "#{p2r(32)}"
      },
      {
        name: "--chat-max-w",
        defaultValue: "75%"
      },
      {
        name: "--chat-py",
        defaultValue: "var(--pad-y-3)"
      },
      {
        name: "--chat-px",
        defaultValue: "var(--pad-x-3)"
      },
      {
        name: "--chat-s",
        defaultValue: "var(--shape-4)"
      },
      {
        name: "--chat-tail-s",
        defaultValue: "var(--shape-1)"
      },
      {
        name: "--chat-bg",
        defaultValue: "var(--base-3)"
      },
      {
        name: "--chat-c",
        defaultValue: "var(--base-12)"
      },
      {
        name: "--chat-bc",
        defaultValue: "transparent"
      },
      {
        name: "--chat-meta-c",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--chat-f",
        defaultValue: "var(--paragraph-30)"
      }
    ],
    examples: [
      {
        name: "chat-sandbox",
        html: '<sh-chat [variant]="variant()">\n  <sh-avatar name="Grace Hopper" />\n  <b>Grace</b>\n  <time>14:02</time>\n  Found the bug. It was a moth in relay 70.\n</sh-chat>\n<sh-chat [variant]="variant()" continued>\n  <p>Taping it into the logbook now.</p>\n  <sh-chip size="small" variant="simple">\u{1F41B} 2</sh-chip>\n</sh-chat>\n\n<sh-chat [variant]="variant()" [color]="color()" outgoing>\n  <sh-avatar name="You" color="primary" />\n  <b>You</b>\n  <time>14:03</time>\n  First actual case of a bug being found.\n  <span footer>Seen</span>\n</sh-chat>\n\n<sh-chat [variant]="variant()" typing>\n  <sh-avatar name="Grace Hopper" />\n</sh-chat>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipChatVariant, ShipColor } from '@ship-ui/core';\nimport { ShipAvatar } from '@ship-ui/core/ship-avatar';\nimport { ShipChat } from '@ship-ui/core/ship-chat';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\n\n@Component({\n  selector: 'app-chat-sandbox',\n  imports: [ShipChat, ShipAvatar, ShipChip],\n  templateUrl: './chat-sandbox.html',\n  styleUrl: './chat-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ChatSandbox {\n  variant = input<ShipChatVariant>('');\n  color = input<ShipColor>('');\n}\n"
      },
      {
        name: "chat-interface",
        html: `<sh-card class="chat">
  <header>
    <sh-avatar-group size="small">
      <sh-avatar name="Ada Lovelace" />
      <sh-avatar name="Grace Hopper" />
    </sh-avatar-group>
    <div class="title">
      <b>Launch crew</b>
      <small>Ada, Grace and you</small>
    </div>
    <button shButton noBg aria-label="Conversation options">
      <sh-icon>dots-three</sh-icon>
    </button>
  </header>

  <div class="thread" #scroller role="log" aria-label="Messages">
    <sh-divider>Today</sh-divider>

    @for (message of thread(); track message.id) {
      <sh-chat [outgoing]="message.from === 'me'" [continued]="message.continued">
        @if (!message.continued && message.from !== 'me') {
          <sh-avatar [name]="people[message.from]" />
        }
        @if (!message.continued && message.from !== 'me') {
          <b>{{ people[message.from] }}</b>
        }
        @if (!message.continued) {
          <time>{{ message.time }}</time>
        }
        {{ message.text }}
        @for (reaction of message.reactions; track reaction) {
          <sh-chip size="small" variant="simple">{{ reaction }}</sh-chip>
        }
      </sh-chat>
    }

    @if (typing()) {
      <sh-chat typing>
        <sh-avatar name="Ada Lovelace" />
      </sh-chat>
    }
  </div>

  <form class="composer" (submit)="send($event)">
    <sh-form-field>
      <textarea
        rows="1"
        placeholder="Message Launch crew"
        aria-label="Message"
        [value]="draft()"
        (input)="draft.set($any($event.target).value)"
        (keydown.enter)="send($event)"></textarea>
    </sh-form-field>
    <button shButton type="submit" color="primary" variant="raised" aria-label="Send" [disabled]="!draft().trim()">
      <sh-icon>paper-plane-right</sh-icon>
    </button>
  </form>
</sh-card>
`,
        ts: "import {\n  afterRenderEffect,\n  ChangeDetectionStrategy,\n  Component,\n  computed,\n  ElementRef,\n  signal,\n  viewChild,\n} from '@angular/core';\nimport { ShipAvatar, ShipAvatarGroup } from '@ship-ui/core/ship-avatar';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipChat } from '@ship-ui/core/ship-chat';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipDivider } from '@ship-ui/core/ship-divider';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\ntype Sender = 'ada' | 'grace' | 'me';\n\ninterface Message {\n  id: number;\n  from: Sender;\n  time: string;\n  text: string;\n  reactions?: string[];\n}\n\nconst REPLIES = ['Nice, looks good from here.', 'Ship it \u{1F680}', 'Let me double-check the numbers.'];\n\n@Component({\n  selector: 'app-chat-interface-example',\n  imports: [ShipCard, ShipChat, ShipAvatar, ShipAvatarGroup, ShipButton, ShipIcon, ShipChip, ShipDivider, ShipFormField],\n  templateUrl: './chat-interface.html',\n  styleUrl: './chat-interface.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ChatInterface {\n  people: Record<string, string> = { ada: 'Ada Lovelace', grace: 'Grace Hopper' };\n\n  messages = signal<Message[]>([\n    { id: 1, from: 'ada', time: '09:12', text: 'Morning! Is the release still on for today?' },\n    { id: 2, from: 'ada', time: '09:12', text: 'Marketing wants to know by noon.' },\n    { id: 3, from: 'grace', time: '09:20', text: 'QA signed off last night.', reactions: ['\u{1F389} 2'] },\n    { id: 4, from: 'me', time: '09:31', text: 'Yes \u2014 tagging the build now.' },\n    { id: 5, from: 'me', time: '09:31', text: 'Changelog is in the release PR if anyone wants a last look.' },\n  ]);\n  draft = signal('');\n  typing = signal(false);\n\n  // A message continues the previous one when it's from the same sender.\n  thread = computed(() =>\n    this.messages().map((m, i, all) => ({ ...m, continued: i > 0 && all[i - 1].from === m.from }))\n  );\n\n  private scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');\n\n  constructor() {\n    afterRenderEffect(() => {\n      this.thread();\n      this.typing();\n      const el = this.scroller().nativeElement;\n      el.scrollTop = el.scrollHeight;\n    });\n  }\n\n  send(event: Event) {\n    if (event instanceof KeyboardEvent && event.shiftKey) return;\n    event.preventDefault();\n\n    const text = this.draft().trim();\n    if (!text) return;\n\n    this.#push('me', text);\n    this.draft.set('');\n\n    this.typing.set(true);\n    setTimeout(() => {\n      this.typing.set(false);\n      this.#push('ada', REPLIES[Math.floor(Math.random() * REPLIES.length)]);\n    }, 1500);\n  }\n\n  #push(from: Sender, text: string) {\n    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });\n    this.messages.update((list) => [...list, { id: list.length + 1, from, time, text }]);\n  }\n}\n"
      },
      {
        name: "basic-chat",
        html: '<sh-chat>\n  <sh-avatar name="Ada Lovelace" />\n  <b>Ada</b>\n  <time>09:41</time>\n  Did the build go out?\n</sh-chat>\n<sh-chat outgoing>Yes \u2014 shipped 10 minutes ago.</sh-chat>\n<sh-chat outgoing continued>Release notes are in the channel.</sh-chat>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipAvatar } from '@ship-ui/core/ship-avatar';\nimport { ShipChat } from '@ship-ui/core/ship-chat';\n\n@Component({\n  selector: 'app-basic-chat-example',\n  imports: [ShipChat, ShipAvatar],\n  templateUrl: './basic-chat.html',\n  styleUrl: './basic-chat.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicChat {}\n"
      },
      {
        name: "chat-page",
        html: `<div class="messages" [class.open]="threadOpen()">
  <aside>
    <header>
      <h2>Messages</h2>
      <button shButton noBg aria-label="New message">
        <sh-icon>note-pencil</sh-icon>
      </button>
    </header>

    <sh-form-field class="search">
      <sh-icon prefix>magnifying-glass</sh-icon>
      <input
        type="search"
        placeholder="Search"
        aria-label="Search conversations"
        [value]="query()"
        (input)="query.set($any($event.target).value)" />
    </sh-form-field>

    <sh-list listRole="listbox" label="Conversations" [value]="activeId()" (valueChange)="open($event)">
      @for (conversation of filtered(); track conversation.id) {
        <button [value]="conversation.id">
          <sh-avatar [name]="conversation.name" />
          <span class="preview">
            <b>{{ conversation.name }}</b>
            <small>{{ lastMessage(conversation) }}</small>
          </span>
          @if (conversation.unread) {
            <sh-chip size="small" variant="raised" color="primary">{{ conversation.unread }}</sh-chip>
          }
        </button>
      } @empty {
        <p class="none">No conversations match "{{ query() }}".</p>
      }
    </sh-list>
  </aside>

  <main>
    <header>
      <button shButton noBg class="back" aria-label="Back to conversations" (click)="threadOpen.set(false)">
        <sh-icon>caret-left</sh-icon>
      </button>
      <sh-avatar [name]="active().name" />
      <div class="title">
        <b>{{ active().name }}</b>
        <small>{{ active().status }}</small>
      </div>
      <button shButton noBg aria-label="Call">
        <sh-icon>phone</sh-icon>
      </button>
      <button shButton noBg aria-label="Conversation options">
        <sh-icon>dots-three</sh-icon>
      </button>
    </header>

    <div class="thread" #scroller role="log" [attr.aria-label]="'Messages with ' + active().name">
      <sh-divider>Today</sh-divider>

      @for (message of thread(); track message.id) {
        <sh-chat [outgoing]="message.me" [continued]="message.continued">
          @if (!message.continued && !message.me) {
            <sh-avatar [name]="active().name" />
          }
          @if (!message.continued) {
            <time>{{ message.time }}</time>
          }
          {{ message.text }}
        </sh-chat>
      }

      @if (typing() === active().id) {
        <sh-chat typing>
          <sh-avatar [name]="active().name" />
        </sh-chat>
      }
    </div>

    <form class="composer" (submit)="send($event)">
      <button shButton noBg type="button" aria-label="Attach file">
        <sh-icon>paperclip</sh-icon>
      </button>
      <sh-form-field>
        <textarea
          rows="1"
          aria-label="Message"
          [placeholder]="'Message ' + active().name"
          [value]="draft()"
          (input)="draft.set($any($event.target).value)"
          (keydown.enter)="send($event)"></textarea>
      </sh-form-field>
      <button shButton type="submit" color="primary" variant="raised" aria-label="Send" [disabled]="!draft().trim()">
        <sh-icon>paper-plane-right</sh-icon>
      </button>
    </form>
  </main>
</div>
`,
        ts: "import {\n  afterRenderEffect,\n  ChangeDetectionStrategy,\n  Component,\n  computed,\n  ElementRef,\n  signal,\n  viewChild,\n} from '@angular/core';\nimport { ShipAvatar } from '@ship-ui/core/ship-avatar';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipChat } from '@ship-ui/core/ship-chat';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipDivider } from '@ship-ui/core/ship-divider';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipList } from '@ship-ui/core/ship-list';\n\ninterface Message {\n  id: number;\n  me: boolean;\n  time: string;\n  text: string;\n}\n\ninterface Conversation {\n  id: string;\n  name: string;\n  status: string;\n  unread: number;\n  messages: Message[];\n}\n\nconst REPLIES = ['Sounds good!', 'On it \u{1F44D}', 'Can we talk about it tomorrow?', 'Ha, fair enough.'];\n\n@Component({\n  selector: 'app-chat-page-example',\n  imports: [ShipChat, ShipAvatar, ShipButton, ShipChip, ShipDivider, ShipFormField, ShipIcon, ShipList],\n  templateUrl: './chat-page.html',\n  styleUrl: './chat-page.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ChatPage {\n  conversations = signal<Conversation[]>([\n    {\n      id: 'ada',\n      name: 'Ada Lovelace',\n      status: 'Active now',\n      unread: 0,\n      messages: [\n        { id: 1, me: false, time: '09:12', text: 'Did you get a chance to look at the engine notes?' },\n        { id: 2, me: false, time: '09:12', text: 'Note G is the interesting one.' },\n        { id: 3, me: true, time: '09:30', text: 'Reading it now \u2014 the Bernoulli numbers part is wild.' },\n      ],\n    },\n    {\n      id: 'grace',\n      name: 'Grace Hopper',\n      status: 'Active 5m ago',\n      unread: 2,\n      messages: [\n        { id: 1, me: true, time: '08:02', text: 'Is the compiler build green again?' },\n        { id: 2, me: false, time: '08:40', text: 'Yes. Found a moth in relay 70.' },\n        { id: 3, me: false, time: '08:41', text: 'It is taped into the logbook.' },\n      ],\n    },\n    {\n      id: 'alan',\n      name: 'Alan Turing',\n      status: 'Offline',\n      unread: 1,\n      messages: [{ id: 1, me: false, time: 'Yesterday', text: 'Can a machine think? Discuss over lunch.' }],\n    },\n    {\n      id: 'linus',\n      name: 'Linus Torvalds',\n      status: 'Active 1h ago',\n      unread: 0,\n      messages: [{ id: 1, me: true, time: 'Mon', text: 'Thanks for merging the patch!' }],\n    },\n  ]);\n\n  activeId = signal('ada');\n  query = signal('');\n  draft = signal('');\n  typing = signal<string | null>(null);\n  // Narrow screens show one pane at a time.\n  threadOpen = signal(false);\n\n  active = computed(() => this.conversations().find((c) => c.id === this.activeId())!);\n\n  filtered = computed(() => {\n    const q = this.query().trim().toLowerCase();\n    return this.conversations().filter((c) => !q || c.name.toLowerCase().includes(q));\n  });\n\n  // A message continues the previous one when it's from the same side.\n  thread = computed(() =>\n    this.active().messages.map((m, i, all) => ({ ...m, continued: i > 0 && all[i - 1].me === m.me }))\n  );\n\n  private scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');\n\n  constructor() {\n    afterRenderEffect(() => {\n      this.thread();\n      this.typing();\n      const el = this.scroller().nativeElement;\n      el.scrollTop = el.scrollHeight;\n    });\n  }\n\n  lastMessage(conversation: Conversation) {\n    const last = conversation.messages.at(-1);\n    return last ? (last.me ? 'You: ' : '') + last.text : '';\n  }\n\n  open(id: string | null) {\n    if (!id) return;\n    this.activeId.set(id);\n    this.threadOpen.set(true);\n    this.#update(id, (c) => ({ ...c, unread: 0 }));\n  }\n\n  send(event: Event) {\n    if (event instanceof KeyboardEvent && event.shiftKey) return;\n    event.preventDefault();\n\n    const text = this.draft().trim();\n    if (!text) return;\n\n    const id = this.activeId();\n    this.#push(id, true, text);\n    this.draft.set('');\n\n    this.typing.set(id);\n    setTimeout(() => {\n      this.typing.set(null);\n      this.#push(id, false, REPLIES[Math.floor(Math.random() * REPLIES.length)]);\n      if (this.activeId() !== id) this.#update(id, (c) => ({ ...c, unread: c.unread + 1 }));\n    }, 1500);\n  }\n\n  #push(id: string, me: boolean, text: string) {\n    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });\n    this.#update(id, (c) => ({ ...c, messages: [...c.messages, { id: c.messages.length + 1, me, time, text }] }));\n  }\n\n  #update(id: string, fn: (c: Conversation) => Conversation) {\n    this.conversations.update((list) => list.map((c) => (c.id === id ? fn(c) : c)));\n  }\n}\n"
      }
    ]
  },
  {
    name: "ShipCheckbox",
    selector: "sh-checkbox",
    package: "@ship-ui/core/ship-checkbox",
    kind: "component",
    path: "projects/ship-ui/ship-checkbox/ship-checkbox.ts",
    inputs: [
      {
        name: "checked",
        type: "boolean",
        description: "Two-way checked state of the checkbox.",
        defaultValue: "false",
        twoWay: true
      },
      {
        name: "label",
        type: "string",
        description: "Accessible name for label-less usage; projected text content is used otherwise.",
        defaultValue: "''"
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Semantic color scale (`primary`, `accent`, `warn`, `error`, `success`).",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "Visual variant of the checkbox sheet.",
        defaultValue: "null",
        options: [
          "simple",
          "outlined",
          "flat",
          "raised",
          ""
        ]
      },
      {
        name: "readonly",
        type: "boolean",
        description: "Render in a non-interactive read-only state.",
        defaultValue: "false"
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disable interaction.",
        defaultValue: "false"
      },
      {
        name: "noInternalInput",
        type: "boolean",
        description: "Suppress the internal `<input>` and expose the host element itself as the ARIA checkbox.",
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--cb-bw",
        defaultValue: "#{p2r(1)}"
      },
      {
        name: "--cb-bc",
        defaultValue: "var(--sheet-bc)"
      },
      {
        name: "--sheet-s",
        defaultValue: "var(--shape-1)"
      }
    ],
    examples: []
  },
  {
    name: "ShipChip",
    selector: "sh-chip",
    package: "@ship-ui/core/ship-chip",
    kind: "component",
    path: "projects/ship-ui/ship-chip/ship-chip.ts",
    description: '### Variants\n\nChip variants can be set using the\n`variant`\nattribute. Valid options are:\n**simple**\n,\n**outlined**\n,\n**flat**\n, and\n**raised**\n.\n\n### Sizes\n\nChip sizes can be set using the\n`size`\nattribute. For example:\n`size="small"`\n.\n\n### Colors\n\nChip colors can be set using the\n`color`\nattribute. Valid options are:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**error**\n, and\n**success**\n.\n\n### Dynamic Coloring\n\nYou can set a custom color using the CSS variable\n`--chip-c`\ntogether with the\n`dynamic`\ninput (as an attribute or binding). This is ideal for tagging purposes where you need a wide range of colors.\n\n### Background\n\nThe chip background can be removed by applying the\n`noBg`\ninput (adds the\n`no-bg`\nclass).\n\n### Icons\n\nChips can contain icons using the\n`sh-icon`\ncomponent. Use the\n`suffix`\nattribute for trailing icons.\n\n### Readonly\n\nThe chip can be set to readonly through the\n`readonly`\ninput (adds the\n`readonly`\nclass).\n\n### Disabled\n\nThe chip can be disabled using the standard\n`disabled`\nattribute or\n`[disabled]`\nbinding.',
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "Semantic color scale (`primary`, `accent`, `warn`, `error`, `success`).",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "Visual variant of the chip sheet.",
        defaultValue: "null",
        options: [
          "simple",
          "outlined",
          "flat",
          "raised",
          ""
        ]
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "Size preset.",
        defaultValue: "null",
        options: [
          "small",
          "xsmall",
          ""
        ]
      },
      {
        name: "sharp",
        type: "boolean | undefined",
        description: "Use sharp (non-rounded) corners.",
        defaultValue: "undefined"
      },
      {
        name: "dynamic",
        type: "boolean | undefined",
        description: "Enable the dynamic styling variant.",
        defaultValue: "undefined"
      },
      {
        name: "readonly",
        type: "boolean",
        description: "Render in a non-interactive read-only state.",
        defaultValue: "false"
      },
      {
        name: "noBg",
        type: "boolean",
        description: "Render without a background fill.",
        defaultValue: "false"
      },
      {
        name: "selected",
        type: "boolean",
        description: 'Highlights the chip with the variant\'s selected colours (`class="selected"` does the same).',
        defaultValue: "false"
      },
      {
        name: "selectable",
        type: "boolean",
        description: 'Makes the chip a toggle (`role="button"`, `aria-pressed`): click, Enter and Space flip `selected`.',
        defaultValue: "false"
      }
    ],
    outputs: [
      {
        name: "selectedChange",
        type: "boolean",
        description: "Emits the new state when a selectable chip is toggled."
      }
    ],
    methods: [],
    cssVariables: [
      {
        name: "--chip-h",
        defaultValue: "#{p2r(32)}"
      },
      {
        name: "--chip-s",
        defaultValue: "calc(var(--chip-h) / 2)"
      },
      {
        name: "--chip-py",
        defaultValue: "0"
      },
      {
        name: "--chip-px",
        defaultValue: "var(--pad-x-3)"
      },
      {
        name: "--sheet-c",
        defaultValue: "var(--chip-c)"
      },
      {
        name: "--sheet-s",
        defaultValue: "var(--chip-s)"
      },
      {
        name: "--sheet-bg",
        defaultValue: "transparent"
      },
      {
        name: "--chip-c",
        defaultValue: "deepen the tint and draw the colour as an inset ring.\n    &.dynamic {\n      --chip-sel-bg: rgb(from var(--chip-c) r g b / 0.3)"
      },
      {
        name: "--chip-sel-c",
        defaultValue: "var(--chip-c)"
      },
      {
        name: "--chip-sel-ring",
        defaultValue: "var(--chip-c)"
      }
    ],
    examples: [
      {
        name: "base-chip",
        html: '<sh-chip>\n  <sh-icon>circle</sh-icon>\n</sh-chip>\n\n<sh-chip>\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip disabled>\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-base-chip',\n  imports: [ShipIcon, ShipChip],\n  templateUrl: './base-chip.html',\n  styleUrl: './base-chip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseChip {}\n"
      },
      {
        name: "basic-chip",
        html: "<sh-chip>Chip</sh-chip>\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\n\n@Component({\n  selector: 'app-basic-chip',\n  standalone: true,\n  imports: [ShipChip],\n  templateUrl: './basic-chip.html',\n  styleUrl: './basic-chip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicChip {}\n"
      },
      {
        name: "flat-chip",
        html: '<sh-chip variant="flat">\n  <sh-icon>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="flat">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="flat" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="flat" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="flat" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="flat" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="flat" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip disabled variant="flat">\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-flat-chip',\n  imports: [ShipIcon, ShipChip],\n  templateUrl: './flat-chip.html',\n  styleUrl: './flat-chip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FlatChip {}\n"
      },
      {
        name: "chip-sandbox",
        html: '<sh-chip\n  [color]="color()"\n  [variant]="variant()"\n  [size]="size()"\n  [sharp]="sharp()"\n  [dynamic]="dynamic()"\n  [style.--chip-c]="dynamic() ? dynamicColor() : undefined"\n  [noBg]="noBg()">\n  <sh-icon>circle</sh-icon>\n</sh-chip>\n\n<sh-chip\n  [color]="color()"\n  [variant]="variant()"\n  [size]="size()"\n  [sharp]="sharp()"\n  [dynamic]="dynamic()"\n  [style.--chip-c]="dynamic() ? dynamicColor() : undefined"\n  [noBg]="noBg()">\n  <span>Chip</span>\n  <sh-icon>circle</sh-icon>\n</sh-chip>\n\n<sh-chip\n  [color]="color()"\n  [variant]="variant()"\n  [size]="size()"\n  [sharp]="sharp()"\n  [dynamic]="dynamic()"\n  [style.--chip-c]="dynamic() ? dynamicColor() : undefined"\n  [noBg]="noBg()">\n  <sh-icon>circle</sh-icon>\n  <span>Chip</span>\n</sh-chip>\n\n<sh-chip\n  [color]="color()"\n  [variant]="variant()"\n  [size]="size()"\n  [sharp]="sharp()"\n  [dynamic]="dynamic()"\n  [style.--chip-c]="dynamic() ? dynamicColor() : undefined"\n  [noBg]="noBg()">\n  <sh-icon>circle</sh-icon>\n  <span>Chip</span>\n  <sh-icon>circle</sh-icon>\n</sh-chip>\n\n<sh-chip\n  [color]="color()"\n  [variant]="variant()"\n  [size]="size()"\n  [sharp]="sharp()"\n  [dynamic]="dynamic()"\n  [style.--chip-c]="dynamic() ? dynamicColor() : undefined"\n  [noBg]="noBg()">\n  <sh-icon>circle</sh-icon>\n</sh-chip>\n\n<sh-chip\n  [color]="color()"\n  [variant]="variant()"\n  [size]="size()"\n  [sharp]="sharp()"\n  [dynamic]="dynamic()"\n  [style.--chip-c]="dynamic() ? dynamicColor() : undefined"\n  [noBg]="noBg()">\n  <sh-icon>circle</sh-icon>\n</sh-chip>\n\n<sh-chip\n  [color]="color()"\n  [variant]="variant()"\n  [size]="size()"\n  [sharp]="sharp()"\n  [dynamic]="dynamic()"\n  [style.--chip-c]="dynamic() ? dynamicColor() : undefined"\n  [noBg]="noBg()">\n  <span>Chip</span>\n</sh-chip>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-chip-sandbox',\n  imports: [ShipIcon, ShipChip],\n  templateUrl: './chip-sandbox.html',\n  styleUrl: './chip-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ChipSandbox {\n  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');\n  variant = input<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');\n  size = input<'' | 'small'>('');\n  sharp = input(false);\n  noBg = input(false);\n  /** When true, the chip derives its palette from `dynamicColor` (an hsl() string) instead of `color`. */\n  dynamic = input(false);\n  dynamicColor = input<string | undefined>(undefined);\n}\n"
      },
      {
        name: "selected-chip",
        html: `<div class="row">
  <span class="hint">Filter bar: click, Enter or Space toggles a chip</span>
  @for (priority of priorities; track priority) {
    <sh-chip
      class="simple small"
      selectable
      [selected]="selectedPriorities().includes(priority)"
      (selectedChange)="togglePriority(priority, $event)">
      {{ priority }}
    </sh-chip>
  }

  @for (label of labels; track label.name) {
    <sh-chip
      class="dynamic small sharp"
      [style.--chip-c]="label.color"
      selectable
      [selected]="selectedLabels().includes(label.name)"
      (selectedChange)="toggleLabel(label.name, $event)">
      {{ label.name }}
    </sh-chip>
  }

  <sh-chip class="simple small" selectable [selected]="mine()" (selectedChange)="mine.set($event)">
    <sh-icon>circle</sh-icon>
    Only mine
  </sh-chip>
</div>

<pre>priorities: {{ selectedPriorities().join(', ') || '\u2014' }} \xB7 labels: {{ selectedLabels().join(', ') || '\u2014' }} \xB7 mine: {{ mine() }}</pre>

<div class="row">
  <span class="hint">Every variant, selected</span>
  <sh-chip selected>Base</sh-chip>
  <sh-chip variant="simple" selected>Simple</sh-chip>
  <sh-chip variant="simple" color="primary" selected>Primary</sh-chip>
  <sh-chip variant="outlined" color="accent" selected>Outlined</sh-chip>
  <sh-chip variant="flat" color="success" selected>Flat</sh-chip>
  <sh-chip variant="raised" color="warn" selected>Raised</sh-chip>
  <sh-chip class="dynamic" style="--chip-c: #7c3aed" selected>Dynamic</sh-chip>
  <sh-chip class="simple small sharp" color="error" selected>Small sharp</sh-chip>
  <sh-chip class="simple small" selected noBg>No bg</sh-chip>
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\nconst PRIORITIES = ['urgent', 'high', 'medium', 'low'] as const;\nconst LABELS = [\n  { name: 'bug', color: '#dc2626' },\n  { name: 'feature', color: '#2563eb' },\n  { name: 'docs', color: '#16a34a' },\n];\n\n@Component({\n  selector: 'app-selected-chip',\n  imports: [ShipChip, ShipIcon],\n  templateUrl: './selected-chip.html',\n  styleUrl: './selected-chip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SelectedChip {\n  priorities = PRIORITIES;\n  labels = LABELS;\n  selectedPriorities = signal<string[]>(['high']);\n  selectedLabels = signal<string[]>(['bug']);\n  mine = signal(false);\n\n  togglePriority(priority: string, on: boolean) {\n    this.selectedPriorities.update((list) => (on ? [...list, priority] : list.filter((p) => p !== priority)));\n  }\n\n  toggleLabel(label: string, on: boolean) {\n    this.selectedLabels.update((list) => (on ? [...list, label] : list.filter((l) => l !== label)));\n  }\n}\n"
      },
      {
        name: "simple-chip",
        html: '<sh-chip variant="simple">\n  <sh-icon>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="simple">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="simple" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="simple" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="simple" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="simple" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="simple" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip disabled variant="simple">\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-simple-chip',\n  imports: [ShipIcon, ShipChip],\n  templateUrl: './simple-chip.html',\n  styleUrl: './simple-chip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SimpleChip {}\n"
      },
      {
        name: "raised-chip",
        html: '<sh-chip variant="raised">\n  <sh-icon>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="raised">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="raised" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="raised" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="raised" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="raised" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="raised" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip disabled variant="raised">\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-raised-chip',\n  imports: [ShipIcon, ShipChip],\n  templateUrl: './raised-chip.html',\n  styleUrl: './raised-chip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RaisedChip {}\n"
      },
      {
        name: "outlined-chip",
        html: '<sh-chip variant="outlined">\n  <sh-icon>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="outlined">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="outlined" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="outlined" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="outlined" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="outlined" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="outlined" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip disabled variant="outlined">\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-outlined-chip',\n  imports: [ShipIcon, ShipChip],\n  templateUrl: './outlined-chip.html',\n  styleUrl: './outlined-chip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OutlinedChip {}\n"
      }
    ]
  },
  {
    name: "ShipCode",
    selector: "sh-code",
    package: "@ship-ui/core/ship-code",
    kind: "component",
    path: "projects/ship-ui/ship-code/ship-code.ts",
    description: "`<sh-code>` \u2014 the code editor surface. Renders a virtualized window of\nlines (the shared `ShipVirtualWindow` drives the pixel model, the same\nengine behind `sh-virtual-scroll` and `sh-spreadsheet`), takes input through\na hidden textarea, and keeps a flat `{anchor, head}` selection over the\ncolumnar line index.",
    inputs: [
      {
        name: "value",
        type: "string | null",
        description: "Two-way bound document text.",
        defaultValue: "null",
        twoWay: true
      },
      {
        name: "valueSync",
        type: "'idle' | 'immediate' | 'blur'",
        description: "When an edit reaches `value` / the form control. Serializing the document is O(n) (about 1 ms at 50k lines),\nso by default it happens once the user pauses typing (`'idle'`), and always on blur, on `flushValue()` and\nbefore the editor is destroyed. `'immediate'` serializes on every edit; `'blur'` only on blur and flush.",
        defaultValue: "'idle'",
        options: [
          "idle",
          "immediate",
          "blur"
        ]
      },
      {
        name: "readonly",
        type: "boolean",
        description: "When `true`, the editor rejects all input.",
        defaultValue: "false"
      },
      {
        name: "keymap",
        type: "'sublime' | 'vscode' | ShipCodeKeymap",
        description: "Keymap preset name or a full custom keymap.",
        defaultValue: "'sublime'",
        options: [
          "sublime",
          "vscode"
        ]
      },
      {
        name: "lineNumbers",
        type: "boolean",
        description: "Show the line-number gutter.",
        defaultValue: "true"
      },
      {
        name: "multiCursor",
        type: "boolean",
        description: "Multi-cursor gestures: Alt+click, add caret above/below, and the\nprogressive Cmd/Ctrl+D and select-all-occurrences.\n\nOn by default \u2014 a code surface is where people expect them. Turning it off\nonly closes the ways a second cursor gets created; the selection model is\nthe same either way, so a single cursor behaves identically.",
        defaultValue: "true"
      },
      {
        name: "virtualization",
        type: "boolean | 'auto'",
        description: "`'auto'` virtualizes past 1000 lines; `true`/`false` force it.",
        defaultValue: "'auto'",
        options: [
          "auto"
        ]
      },
      {
        name: "language",
        type: "string",
        description: "Language id resolved against the grammar registry.",
        defaultValue: "''"
      },
      {
        name: "engine",
        type: "TokenizerEngine | Promise<TokenizerEngine> | null",
        description: "Tokenizer engine (see `createVSCodeEngine`). The engine needs the\n`onig.wasm` binary, whose URL only the application knows \u2014 so the app\ncreates the engine and hands it in; without one, lines render plain.",
        defaultValue: "null"
      },
      {
        name: "theme",
        type: "ShipCodeTheme | 'ship-dark' | 'ship-light'",
        description: "Token theme: a built-in name or a full VS-Code-shaped theme object.",
        defaultValue: "'ship-dark'",
        options: [
          "ship-dark",
          "ship-light"
        ]
      }
    ],
    outputs: [],
    methods: [
      {
        name: "flushValue",
        parameters: "",
        returnType: "void",
        description: "Push any unsent edit into `value` and the form control now. Cheap when nothing changed."
      },
      {
        name: "insertText",
        parameters: "text: string",
        returnType: "void",
        description: "Replace every cursor's selection with `text` (typing, paste, IME commit)."
      }
    ],
    cssVariables: [
      {
        name: "--code-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--code-fg",
        defaultValue: "var(--base-12)"
      },
      {
        name: "--code-gutter-bg",
        defaultValue: "var(--base-2)"
      },
      {
        name: "--code-gutter-fg",
        defaultValue: "var(--base-9)"
      },
      {
        name: "--code-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--code-caret",
        defaultValue: "var(--primary-9)"
      },
      {
        name: "--code-selection",
        defaultValue: "rgb(from var(--primary-9) r g b / 25%)"
      },
      {
        name: "--code-f",
        defaultValue: "var(--code-20)"
      }
    ],
    examples: [],
    keywords: [
      "code",
      "editor",
      "syntax",
      "monospace",
      "virtualized",
      "textmate"
    ]
  },
  {
    name: "ShipCodeInput",
    selector: "sh-code-input",
    package: "@ship-ui/core/ship-code-input",
    kind: "component",
    path: "projects/ship-ui/ship-code-input/ship-code-input.ts",
    description: "One-time-code entry: `length` single-character boxes that behave as one\nfield (auto-advance, backspace, arrows, paste/autofill spreading).\n\nBind the code with `[(value)]`, or project a hidden `<input>` and drive it\nwith `ngModel`, `formControl` or `[formField]` \u2014 the projected input mirrors\nthe code both ways, exactly like the inner input of `sh-select`.",
    inputs: [
      {
        name: "length",
        type: "number",
        description: "Number of characters in the code.",
        defaultValue: "6"
      },
      {
        name: "type",
        type: "'numeric' | 'alphanumeric'",
        description: "Character set: `numeric` (default) shows a numeric keyboard on mobile; `alphanumeric` allows letters too.",
        defaultValue: "'numeric'",
        options: [
          "numeric",
          "alphanumeric"
        ]
      },
      {
        name: "groupSize",
        type: "number",
        description: "Visually separates the boxes into groups of this size, e.g. `3` renders `123 456`.",
        defaultValue: "0"
      },
      {
        name: "divider",
        type: "string",
        description: 'Text rendered between groups of boxes (between every box without a `groupSize`),\ne.g. `"-"`. Project `<ng-template shCodeInputDivider>` instead for custom content.',
        defaultValue: "''"
      },
      {
        name: "value",
        type: "string",
        description: "Two-way bound code. Only accepted characters are kept; never longer than `length`.",
        defaultValue: "''",
        twoWay: true
      },
      {
        name: "autofocus",
        type: "boolean",
        description: "Focus the first box when the component renders.",
        defaultValue: "false"
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disables every box.",
        defaultValue: "false"
      },
      {
        name: "readonly",
        type: "boolean",
        description: "Boxes show the code but cannot be edited.",
        defaultValue: "false"
      }
    ],
    outputs: [
      {
        name: "completed",
        type: "string",
        description: "Emits the code once every box is filled \u2014 the moment to submit or verify."
      }
    ],
    methods: [
      {
        name: "clear",
        parameters: "",
        returnType: "void",
        description: "Empties the code and focuses the first box."
      },
      {
        name: "focus",
        parameters: "index?: number",
        returnType: "void",
        description: "Focuses the box at `index` (default the first empty one)."
      }
    ],
    cssVariables: [
      {
        name: "--ci-size",
        defaultValue: "#{p2r(44)}"
      },
      {
        name: "--ci-gap",
        defaultValue: "#{p2r(8)}"
      },
      {
        name: "--ci-group-gap",
        defaultValue: "#{p2r(20)}"
      },
      {
        name: "--ci-s",
        defaultValue: "var(--shape-2)"
      },
      {
        name: "--ci-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--ci-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--ci-c",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--ci-f",
        defaultValue: "var(--title-30B)"
      },
      {
        name: "--ci-focus",
        defaultValue: "var(--primary-8)"
      }
    ],
    examples: [
      {
        name: "base-code-input",
        html: `<sh-code-input [(value)]="code" (completed)="submitted.set($event)" #input>
  <label>Enter the 6-digit code we sent you</label>
</sh-code-input>

<p>Value: {{ code() || '\u2014' }}</p>
<p>Completed with: {{ submitted() || '\u2014' }}</p>

<button shButton class="small" (click)="input.clear(); submitted.set('')">Clear</button>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCodeInput } from '@ship-ui/core/ship-code-input';\n\n@Component({\n  selector: 'app-base-code-input',\n  imports: [ShipCodeInput, ShipButton],\n  templateUrl: './base-code-input.html',\n  styleUrl: './base-code-input.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseCodeInput {\n  code = signal('');\n  submitted = signal('');\n}\n"
      },
      {
        name: "signal-form-code-input",
        html: `<sh-code-input [class.error]="codeForm().touched() && codeForm().invalid()" (completed)="verify($event)">
  <label>Verification code (signal form)</label>
  <input type="text" [formField]="codeForm" />
</sh-code-input>

<p>Model: {{ code() || '\u2014' }}</p>
<p>Valid: {{ codeForm().valid() }}</p>
@if (codeForm().touched()) {
  @for (error of codeForm().errors(); track error.kind) {
    <p class="error">{{ error.message }}</p>
  }
}
@if (verified()) {
  <p class="success">Verified! (any repeated digit, e.g. 111111)</p>
}
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { form, FormField, minLength, required } from '@angular/forms/signals';\nimport { ShipCodeInput } from '@ship-ui/core/ship-code-input';\n\n@Component({\n  selector: 'app-signal-form-code-input',\n  imports: [FormField, ShipCodeInput],\n  templateUrl: './signal-form-code-input.html',\n  styleUrl: './signal-form-code-input.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SignalFormCodeInput {\n  code = signal('');\n  codeForm = form(this.code, (path) => {\n    required(path, { message: 'Enter the code' });\n    minLength(path, 6, { message: 'The code has 6 digits' });\n  });\n\n  verified = signal(false);\n\n  verify(code: string) {\n    // Pretend the server accepts any code that is all the same digit.\n    this.verified.set(/^(\\d)\\1{5}$/.test(code));\n  }\n}\n"
      },
      {
        name: "directive-code-input",
        html: `<p>Any inputs work \u2014 here four form fields share one group.</p>

<div class="row" shCodeInputGroup (valueChange)="code.set($event)">
  <sh-form-field class="center" variant="auto-width">
    <input aria-label="Digit 1 of 4" inputmode="numeric" autocomplete="one-time-code" />
  </sh-form-field>
  <sh-form-field class="center" variant="auto-width">
    <input aria-label="Digit 2 of 4" inputmode="numeric" />
  </sh-form-field>
  <sh-form-field class="center" variant="auto-width">
    <input aria-label="Digit 3 of 4" inputmode="numeric" />
  </sh-form-field>
  <sh-form-field class="center" variant="auto-width">
    <input aria-label="Digit 4 of 4" inputmode="numeric" />
  </sh-form-field>
</div>

<p>Value: {{ code() || '\u2014' }}</p>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipCodeInputGroup } from '@ship-ui/core/ship-code-input';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\n\n@Component({\n  selector: 'app-directive-code-input',\n  imports: [ShipCodeInputGroup, ShipFormField],\n  templateUrl: './directive-code-input.html',\n  styleUrl: './directive-code-input.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DirectiveCodeInput {\n  code = signal('');\n}\n"
      },
      {
        name: "grouped-code-input",
        html: `<sh-code-input [(value)]="code" [length]="8" [groupSize]="4" type="alphanumeric">
  <label>Recovery code (8 characters, gap between groups)</label>
</sh-code-input>

<sh-code-input [(value)]="dashed" [length]="6" [groupSize]="3" divider="-">
  <label>Text divider</label>
</sh-code-input>

<sh-code-input [length]="6" [groupSize]="2">
  <label>Custom divider template</label>
  <ng-template shCodeInputDivider><sh-icon>dot-outline</sh-icon></ng-template>
</sh-code-input>

<sh-code-input class="small" [length]="4" value="1234" [readonly]="true">
  <label>Small, readonly</label>
</sh-code-input>

<sh-code-input [length]="4" value="12" [disabled]="true">
  <label>Disabled</label>
</sh-code-input>

<p>Value: {{ code() || '\u2014' }} / {{ dashed() || '\u2014' }}</p>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipCodeInput, ShipCodeInputDivider } from '@ship-ui/core/ship-code-input';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-grouped-code-input',\n  imports: [ShipCodeInput, ShipCodeInputDivider, ShipIcon],\n  templateUrl: './grouped-code-input.html',\n  styleUrl: './grouped-code-input.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class GroupedCodeInput {\n  code = signal('');\n  dashed = signal('');\n}\n"
      }
    ],
    keywords: [
      "otp",
      "one-time code",
      "verification code",
      "2fa",
      "mfa",
      "sms code",
      "email code",
      "pin",
      "digits",
      "paste",
      "auto advance"
    ]
  },
  {
    name: "ShipColorPicker",
    selector: "sh-color-picker",
    package: "@ship-ui/core/ship-color-picker",
    kind: "component",
    path: "projects/ship-ui/ship-color-picker/ship-color-picker.ts",
    inputs: [
      {
        name: "showDarkColors",
        type: "boolean",
        description: "Extend the wheel/gradients into darker lightness values.",
        defaultValue: "false"
      },
      {
        name: "renderingType",
        type: "'hsl' | 'grid' | 'hue' | 'rgb' | 'saturation' | 'alpha'",
        description: "Which picker surface to render (`hsl` wheel, `grid`, `hue`, `rgb`, `saturation`, or `alpha`).",
        defaultValue: "'hsl'",
        options: [
          "hsl",
          "grid",
          "hue",
          "rgb",
          "saturation",
          "alpha"
        ]
      },
      {
        name: "gridSize",
        type: "number",
        description: "Number of cells per axis for the `grid` rendering type.",
        defaultValue: "20"
      },
      {
        name: "hue",
        type: "number",
        description: "Two-way base hue in degrees driving the gradients.",
        defaultValue: "0",
        twoWay: true
      },
      {
        name: "direction",
        type: "'horizontal' | 'vertical'",
        description: "Orientation for linear pickers (`horizontal` or `vertical`).",
        defaultValue: "'horizontal'",
        options: [
          "horizontal",
          "vertical"
        ]
      },
      {
        name: "selectedColor",
        type: "[R, G, B, A?]",
        description: "Two-way selected color as an `[r, g, b, a?]` tuple.",
        defaultValue: "[255, 255, 255, 1]",
        twoWay: true
      },
      {
        name: "alpha",
        type: "number",
        description: "Two-way alpha channel (0\u20131).",
        defaultValue: "1",
        twoWay: true
      },
      {
        name: "label",
        type: "string",
        description: "Accessible name announced by screen readers; defaults per rendering type.",
        defaultValue: "''"
      }
    ],
    outputs: [
      {
        name: "currentColor",
        type: "{\n    rgb: string;\n    rgba: string;\n    hex: string;\n    hex8: string;\n    hsl: string;\n    hsla: string;\n    hue: number;\n    saturation: number;\n    alpha: number;\n  }",
        description: "Emits the current color in every format (`rgb`, `rgba`, `hex`, `hex8`, `hsl`, `hsla`) plus hue, saturation and alpha."
      }
    ],
    methods: [],
    cssVariables: [
      {
        name: "--cp-checker-d",
        defaultValue: "color-mix(in srgb, var(--light-text) 50%, var(--dark-text))"
      },
      {
        name: "--cp-checker-l",
        defaultValue: "color-mix(in srgb, var(--light-text) 80%, var(--dark-text))"
      }
    ],
    examples: [
      {
        name: "signal-form-color-picker",
        html: '<sh-color-picker-input format="hex">\n  <label>Brand color (signal form)</label>\n  <input type="text" [formField]="colorForm" />\n</sh-color-picker-input>\n\n<div class="swatch" [style.background]="color()"></div>\n<p>Value: {{ color() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { form, FormField } from '@angular/forms/signals';\nimport { ShipColorPickerInput } from '@ship-ui/core/ship-color-picker';\n\n@Component({\n  selector: 'app-signal-form-color-picker',\n  imports: [FormField, ShipColorPickerInput],\n  templateUrl: './signal-form-color-picker.html',\n  styleUrl: './signal-form-color-picker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SignalFormColorPicker {\n  color = signal('#ff5722');\n  colorForm = form(this.color);\n}\n"
      },
      {
        name: "basic-color-picker",
        html: "<sh-color-picker />\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipColorPicker } from '@ship-ui/core/ship-color-picker';\n\n@Component({\n  selector: 'app-basic-color-picker',\n  standalone: true,\n  imports: [ShipColorPicker],\n  templateUrl: './basic-color-picker.html',\n  styleUrl: './basic-color-picker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicColorPicker {}\n"
      },
      {
        name: "live-updates-color-picker",
        html: '<sh-color-picker-input format="rgb">\n  <label>Driven externally</label>\n  <input type="text" [(ngModel)]="color" />\n</sh-color-picker-input>\n\n<p>External value (updated every second): {{ color() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipColorPickerInput } from '@ship-ui/core/ship-color-picker';\n\nconst COLORS = ['rgb(239, 68, 68)', 'rgb(34, 197, 94)', 'rgb(59, 130, 246)', 'rgb(234, 179, 8)'];\n\n@Component({\n  selector: 'app-live-updates-color-picker',\n  standalone: true,\n  imports: [FormsModule, ShipColorPickerInput],\n  templateUrl: './live-updates-color-picker.html',\n  styleUrl: './live-updates-color-picker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class LiveUpdatesColorPicker implements OnDestroy {\n  // Cycled from OUTSIDE the component once per second. The text field and the color\n  // swatch must both re-render to the new value on every tick.\n  color = signal<string>(COLORS[0]);\n\n  #index = 0;\n  #timer = setInterval(() => {\n    this.#index = (this.#index + 1) % COLORS.length;\n    this.color.set(COLORS[this.#index]);\n  }, 1000);\n\n  ngOnDestroy() {\n    clearInterval(this.#timer);\n  }\n}\n"
      },
      {
        name: "base-color-picker",
        html: `<sh-button-group [(value)]="renderingType">
  <button value="hsl">
    <sh-icon>circle</sh-icon>
    HSL Wheel
  </button>
  <button value="rgb">
    <sh-icon>circle</sh-icon>
    RGB
  </button>
  <button value="grid">
    <sh-icon>circle</sh-icon>
    Grid
  </button>
  <button value="hue">
    <sh-icon>circle</sh-icon>
    Hue
  </button>
  <button value="saturation">
    <sh-icon>circle</sh-icon>
    Saturation
  </button>
  <button value="alpha">
    <sh-icon>circle</sh-icon>
    Alpha
  </button>
</sh-button-group>

@if (renderingType() === 'hsl') {
  <sh-toggle [(checked)]="showDarkColors" color="primary" variant="raised">Show dark colors</sh-toggle>
}

@if (renderingType() === 'grid' || renderingType() === 'rgb') {
  <!-- <sh-range-slider unit="%" class="primary raised">
  <label>ngModel</label>
  <input type="range" min="0" [max]="360" [(ngModel)]="gridHue" />
</sh-range-slider>
 -->

  <sh-color-picker renderingType="hue" (currentColor)="selectedHue.set($event.hue)" />
}

@if (renderingType() === 'hue' || renderingType() === 'saturation' || renderingType() === 'alpha') {
  <sh-toggle [(checked)]="direction" color="primary" variant="raised">Direction</sh-toggle>
}

<sh-color-picker
  [renderingType]="renderingType()"
  [showDarkColors]="showDarkColors()"
  [direction]="direction() ? 'vertical' : 'horizontal'"
  [hue]="selectedHue()"
  (currentColor)="currentColor.set($event)" />

<div class="colors">
  <div class="swatch" [style.background]="currentColor()?.hex"></div>

  <div class="color-text">
    <p>RGB: {{ currentColor()?.rgb }}</p>
    <p>RGBA: {{ currentColor()?.rgba }}</p>
    <p>HEX: {{ currentColor()?.hex }}</p>
    <p>HEX8: {{ currentColor()?.hex8 }}</p>
    <p>HSL: {{ currentColor()?.hsl }}</p>
    <p>HSLA: {{ currentColor()?.hsla }}</p>
    <p>Hue: {{ currentColor()?.hue }}</p>
    <p>Saturation: {{ currentColor()?.saturation }}</p>
    <p>Alpha: {{ currentColor()?.alpha }}</p>
  </div>
</div>
<!-- <pre>{{ currentColor() | json }}</pre> -->

<div class="example-element">
  <h3>Color Picker Input Demo</h3>
  <sh-toggle [(checked)]="showAlpha" color="primary" variant="raised">Enable Alpha</sh-toggle>
  <sh-button-group [(value)]="inputRenderType">
    <button value="hsl">HSL</button>
    <button value="rgb">
      <sh-icon>circle</sh-icon>
      RGB
    </button>
    <button value="hex">
      <sh-icon>circle</sh-icon>
      Hex
    </button>
  </sh-button-group>

  <sh-color-picker-input [format]="computedRenderType()" [renderingType]="inputRenderType() === 'hsl' ? 'hsl' : 'rgb'">
    <label>Pick a color</label>
    <input type="text" [(ngModel)]="inputValue" />
  </sh-color-picker-input>
  <p>Input Value: {{ inputValue() }}</p>
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButtonGroup } from '@ship-ui/core/ship-button-group';\nimport { ShipColorPicker, ShipColorPickerInput } from '@ship-ui/core/ship-color-picker';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipToggle } from '@ship-ui/core/ship-toggle';\n\n@Component({\n  selector: 'app-base-color-picker',\n  imports: [FormsModule, ShipColorPicker, ShipButtonGroup, ShipIcon, ShipToggle, ShipColorPickerInput],\n  templateUrl: './base-color-picker.html',\n  styleUrl: './base-color-picker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseColorPicker {\n  renderingType = signal<'hsl' | 'rgb' | 'grid' | 'hue' | 'saturation' | 'alpha'>('hsl');\n  aColor = signal<[number, number, number, number?]>([255, 255, 255]);\n  currentColor = signal<{\n    rgb: string;\n    rgba: string;\n    hex: string;\n    hex8: string;\n    hsl: string;\n    hsla: string;\n    hue: number;\n    saturation: number;\n    alpha: number;\n  } | null>(null);\n  showDarkColors = signal(false);\n  direction = signal(false);\n  selectedHue = signal(0);\n  inputValue = signal('rgba(255, 0, 0, 0.5)');\n\n  inputRenderType = signal<'hsl' | 'rgb' | 'hex'>('rgb');\n  showAlpha = signal(true);\n  computedRenderType = computed(() => {\n    const inputRenderType = this.inputRenderType();\n    const showAlpha = this.showAlpha();\n    if (inputRenderType === 'hsl') {\n      return showAlpha ? 'hsla' : 'hsl';\n    }\n    if (inputRenderType === 'rgb') {\n      return showAlpha ? 'rgba' : 'rgb';\n    }\n    if (inputRenderType === 'hex') {\n      return showAlpha ? 'hex8' : 'hex';\n    }\n\n    return 'hsl';\n  });\n}\n"
      }
    ],
    keywords: [
      "color",
      "picker",
      "hue",
      "saturation",
      "lightness",
      "rgb",
      "hex",
      "eyedropper",
      "palette"
    ]
  },
  {
    name: "ShipColorPickerInput",
    selector: "sh-color-picker-input",
    package: "@ship-ui/core/ship-color-picker",
    kind: "component",
    path: "projects/ship-ui/ship-color-picker/ship-color-picker-input.ts",
    inputs: [
      {
        name: "renderingType",
        type: "'hsl' | 'grid' | 'hue' | 'rgb' | 'saturation' | 'alpha'",
        description: "Which picker surface the popover renders (`hsl`, `grid`, `hue`, `rgb`, `saturation`, `alpha`).",
        defaultValue: "'hsl'",
        options: [
          "hsl",
          "grid",
          "hue",
          "rgb",
          "saturation",
          "alpha"
        ]
      },
      {
        name: "format",
        type: "'rgb' | 'rgba' | 'hex' | 'hex8' | 'hsl' | 'hsla'",
        description: "Output color string format (`rgb`, `rgba`, `hex`, `hex8`, `hsl`, `hsla`).",
        defaultValue: "'rgb'",
        options: [
          "rgb",
          "rgba",
          "hex",
          "hex8",
          "hsl",
          "hsla"
        ]
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Semantic color scale (`primary`, `accent`, `warn`, `error`, `success`); project default via `ShipConfig.colorPickerInput`.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipFormFieldVariant | null",
        description: "Visual variant of the form field; project default via `ShipConfig.colorPickerInput`.",
        defaultValue: "null",
        options: [
          "base",
          "horizontal",
          "auto-width",
          "autosize",
          ""
        ]
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "Size preset; project default via `ShipConfig.colorPickerInput`.",
        defaultValue: "null",
        options: [
          "small",
          "xsmall",
          ""
        ]
      },
      {
        name: "readonly",
        type: "boolean",
        description: "Render in a non-interactive read-only state.",
        defaultValue: "false"
      },
      {
        name: "patch",
        type: "boolean",
        description: 'Compact "swatch only" appearance: the field renders as a single color patch\nthat opens the picker popover when clicked. The text input is still present\n(hidden) so `[(ngModel)]` value binding works exactly as in the full field.',
        defaultValue: "false"
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "Two-way open state of the picker popover.",
        defaultValue: "false",
        twoWay: true
      },
      {
        name: "showEyeDropper",
        type: "boolean",
        description: "Show the eyedropper button when the browser supports the EyeDropper API.",
        defaultValue: "true"
      }
    ],
    outputs: [
      {
        name: "closed",
        type: "string",
        description: "Emits the formatted color string when the picker popover closes."
      }
    ],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipDatepicker",
    selector: "sh-datepicker",
    package: "@ship-ui/core/ship-datepicker",
    kind: "component",
    path: "projects/ship-ui/ship-datepicker/ship-datepicker.ts",
    description: "### Selection\n\nSelected values are available via\n`date`\nand\n`endDate`\n. Use\n`[(date)]`\nand\n`[(endDate)]`\nfor two-way binding.\n\n### Configuration\n\nCustomize the picker behavior:\n\n<li>\n`asRange`\n: Enable range selection mode.\n</li>\n<li>\n`monthsToShow`\n: Set the number of months displayed (default: 1).\n</li>\n<li>\n`startOfWeek`\n: Specify the first day of the week (0-6).\n</li>\n<li>\n`weekdayLabels`\n: Provide custom labels for week days.\n</li>\n\n### Input Display\n\nCustomize how dates appear in inputs:\n\n<li>\n`masking`\n: Set the date format mask (e.g.,\n`'mediumDate'`\n).\n</li>\n<li>\n`size`\n: Use the\n`small`\nattribute/class for a compact input.\n</li>\n\n### Interaction\n\n<li>\n`closed`\n: Event emitted when the picker is dismissed.\n</li>\n<li>\n`disabled`\n: Standard attribute to disable interaction.\n</li>\n\n### Local Time & Timezones\n\nThe datepicker operates using standard native JavaScript\n`Date`\nobjects, so it automatically adapts to the user's operating system timezone.\n\n<strong>Testing different timezones:</strong>\nBecause it relies on the browser's native timezone API, you cannot spoof the timezone programmatically within the\ncomponent. To test how the datepicker looks and behaves in other regions, use your browser's Developer Tools. In\nChrome or Edge, open DevTools, press\n`Esc`\nto bring up the bottom drawer, find the\n<strong>Sensors</strong>\ntab, and change the Location override to a different city (e.g., Tokyo or London).",
    inputs: [
      {
        name: "date",
        type: "Date | null",
        description: "",
        defaultValue: "null",
        twoWay: true
      },
      {
        name: "endDate",
        type: "Date | null",
        description: "",
        defaultValue: "null",
        twoWay: true
      },
      {
        name: "asRange",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "activeRangeSelection",
        type: "'start' | 'end' | null",
        description: "",
        defaultValue: "null",
        options: [
          "start",
          "end"
        ]
      },
      {
        name: "monthsToShow",
        type: "number",
        description: "",
        defaultValue: "1"
      },
      {
        name: "disabled",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "startOfWeek",
        type: "number",
        description: "",
        defaultValue: "1"
      },
      {
        name: "weekdayLabels",
        type: "string[] | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "locale",
        type: "string | undefined",
        description: "",
        defaultValue: "undefined"
      }
    ],
    outputs: [
      {
        name: "tabbedOut",
        type: "void",
        description: ""
      }
    ],
    methods: [
      {
        name: "selectDate",
        parameters: "newDate: Date",
        returnType: "void",
        description: ""
      },
      {
        name: "focusActiveDate",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "setSelectedDateStylePosition",
        parameters: "selectedElement: HTMLElement",
        returnType: "void",
        description: ""
      }
    ],
    cssVariables: [
      {
        name: "--dp-sel-s",
        defaultValue: "var(--shape-1)"
      },
      {
        name: "--dp-ar",
        defaultValue: "1/0.8"
      },
      {
        name: "--dp-day-g",
        defaultValue: "#{p2r(8 0)}"
      },
      {
        name: "--dp-py",
        defaultValue: "var(--pad-y-3)"
      },
      {
        name: "--dp-px",
        defaultValue: "var(--pad-x-2)"
      },
      {
        name: "--dp-sel-bg",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--dp-sel-bw",
        defaultValue: "0"
      },
      {
        name: "--dp-sel-bc",
        defaultValue: "transparent"
      },
      {
        name: "--dp-sel-c",
        defaultValue: "var(--light-text)"
      },
      {
        name: "--dp-day-c",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--dp-day-f",
        defaultValue: "var(--paragraph-20)"
      },
      {
        name: "--dp-w",
        defaultValue: "#{p2r(300)}"
      }
    ],
    examples: [
      {
        name: "input-datepicker-ngmodel",
        html: `<div class="row">
  <sh-datepicker-input class="primary sharp">
    <label>Date (ngModel)</label>
    <input type="text" [(ngModel)]="date" />
  </sh-datepicker-input>

  <sh-form-field class="autosize">
    <label>Time</label>
    <input type="time" [(ngModel)]="time" step="300" />
    <div boxPrefix>
      <sh-icon>clock</sh-icon>
    </div>
  </sh-form-field>
</div>

<p>Selected: {{ date() | date: 'medium' }}</p>
<!-- <p>{{ date() }}</p>
<p>{{ time() }}</p> -->
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipDatepickerInput } from '@ship-ui/core/ship-datepicker';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-input-datepicker-ngmodel',\n  standalone: true,\n  imports: [FormsModule, ShipDatepickerInput, ShipFormField, ShipIcon, DatePipe],\n  templateUrl: './input-datepicker-ngmodel.html',\n  styleUrl: './input-datepicker-ngmodel.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InputDatepickerNgModelComponent {\n  date = signal<Date | null>(new Date());\n  time = signal<`${string}:${string}` | null>(\n    `${this.date()?.getHours() ?? '00'}:${this.date()?.getMinutes() ?? '00'}`\n  );\n\n  timeEffect = effect(() => {\n    const time = this.time();\n\n    if (time === null) return;\n\n    const [hours, minutes, seconds] = time.split(':');\n\n    this.date.update((x) => {\n      if (!x) return x;\n\n      const newDate = new Date(x);\n      newDate.setHours(parseInt(hours ?? '0'), parseInt(minutes ?? '0'), parseInt(seconds ?? '0'));\n\n      return newDate;\n    });\n  });\n}\n"
      },
      {
        name: "datepicker-sandbox",
        html: `<div class="content">
  <sh-datepicker
    class="raised"
    [class]="exampleClass()"
    [(date)]="date"
    [disabled]="disabled()"
    [startOfWeek]="startOfWeek()" />

  <p>Selected date: {{ date() | date: 'mediumDate' }}</p>
</div>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';\nimport { ShipDatepicker } from '@ship-ui/core/ship-datepicker';\n\n@Component({\n  selector: 'app-datepicker-sandbox',\n  standalone: true,\n  imports: [ShipDatepicker, DatePipe],\n  templateUrl: './datepicker-sandbox.html',\n  styleUrl: './datepicker-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DatepickerSandbox {\n  date = signal<Date | null>(new Date());\n  disabled = input(false);\n  sharp = input(false);\n  /** 0 = Sunday ... 6 = Saturday */\n  startOfWeek = input(1);\n  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');\n\n  exampleClass = computed(() => this.color() + ' ' + (this.sharp() ? 'sharp' : ''));\n}\n"
      },
      {
        name: "range-datepicker",
        html: `<label for="range-datepicker">Select a date range:</label>
<sh-datepicker [(date)]="startDate" [(endDate)]="endDate" [asRange]="true"></sh-datepicker>
<p>Start: {{ startDate() ? (startDate() | date: 'mediumDate') : 'None' }}</p>
<p>End: {{ endDate() ? (endDate() | date: 'mediumDate') : 'None' }}</p>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipDatepicker } from '@ship-ui/core/ship-datepicker';\n\n@Component({\n  selector: 'app-range-datepicker',\n  standalone: true,\n  imports: [FormsModule, ShipDatepicker, DatePipe],\n  templateUrl: './range-datepicker.html',\n  styleUrl: './range-datepicker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RangeDatepicker {\n  startDate = signal<Date | null>(null);\n  endDate = signal<Date | null>(null);\n}\n"
      },
      {
        name: "live-updates-input-datepicker",
        html: `<sh-datepicker-input class="primary">
  <label>Driven externally</label>
  <input type="text" [(ngModel)]="date" />
</sh-datepicker-input>

<p>External value (updated every second): {{ date() | date: 'medium' }}</p>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipDatepickerInput } from '@ship-ui/core/ship-datepicker';\n\n@Component({\n  selector: 'app-live-updates-input-datepicker',\n  standalone: true,\n  imports: [FormsModule, ShipDatepickerInput, DatePipe],\n  templateUrl: './live-updates-input-datepicker.html',\n  styleUrl: './live-updates-input-datepicker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class LiveUpdatesInputDatepicker implements OnDestroy {\n  // Advanced by one day every second from OUTSIDE the component. The masked field\n  // and the popover calendar must both reflect the model on every tick.\n  date = signal<Date | null>(new Date());\n\n  #timer = setInterval(\n    () =>\n      this.date.update((current) => {\n        const next = new Date(current ?? new Date());\n        next.setDate(next.getDate() + 1);\n        return next;\n      }),\n    1000\n  );\n\n  ngOnDestroy() {\n    clearInterval(this.#timer);\n  }\n}\n"
      },
      {
        name: "input-datepicker-signal-form",
        html: `<sh-datepicker-input>
  <label>Date (Signal Form)</label>
  <input type="text" [formField]="dateForm" />
</sh-datepicker-input>
<p>Selected: {{ date() | date: 'mediumDate' }}</p>
@for (error of dateForm().errors(); track error.kind) {
  <p class="error">{{ error.message }}</p>
}
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { form, FormField, required } from '@angular/forms/signals';\nimport { ShipDatepickerInput } from '@ship-ui/core/ship-datepicker';\n\n@Component({\n  selector: 'app-input-datepicker-signal-form',\n  imports: [FormField, ShipDatepickerInput, DatePipe],\n  templateUrl: './input-datepicker-signal-form.html',\n  styleUrl: './input-datepicker-signal-form.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InputDatepickerSignalForm {\n  // Signal forms bind text inputs as strings; the datepicker keeps the input\n  // value as a parseable date string, so the model holds that string.\n  date = signal(new Date().toDateString());\n  dateForm = form(this.date, (path) => {\n    required(path, { message: 'Pick a date' });\n  });\n}\n"
      },
      {
        name: "range-input-datepicker",
        html: `<sh-daterange-input>
  <label>Date Range (Reactive Form)</label>
  <input type="text" [formControl]="startDate" placeholder="Start date" />
  <input type="text" [formControl]="endDate" placeholder="End date" />
  <sh-icon suffix>calendar</sh-icon>
</sh-daterange-input>
<p>Start: {{ startDate.value || null | date: 'mediumDate' }}</p>
<p>End: {{ endDate.value || null | date: 'mediumDate' }}</p>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, ReactiveFormsModule } from '@angular/forms';\nimport { ShipDaterangeInput } from '@ship-ui/core/ship-datepicker';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-range-input-datepicker',\n  standalone: true,\n  imports: [ReactiveFormsModule, ShipDaterangeInput, ShipIcon, DatePipe],\n  templateUrl: './range-input-datepicker.html',\n  styleUrl: './range-input-datepicker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RangeInputDatepicker {\n  startDate = new FormControl(new Date());\n  endDate = new FormControl(new Date(Date.now() + 86400000)); // Tomorrow\n}\n"
      },
      {
        name: "base-datepicker",
        html: `<label for="datepicker">Select a date:</label>
<sh-datepicker [(date)]="selectedDate"></sh-datepicker>
<p>Selected: {{ selectedDate() | date: 'mediumDate' }}</p>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipDatepicker } from '@ship-ui/core/ship-datepicker';\n\n@Component({\n  selector: 'app-base-datepicker',\n  standalone: true,\n  imports: [FormsModule, ShipDatepicker, DatePipe],\n  templateUrl: './base-datepicker.html',\n  styleUrl: './base-datepicker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseDatepicker {\n  selectedDate = signal(new Date());\n}\n"
      },
      {
        name: "input-datepicker-reactive",
        html: `<sh-datepicker-input>
  <label>Date (Reactive Form)</label>
  <input type="text" [formControl]="dateControl" />
</sh-datepicker-input>
<p>Selected: {{ dateControl.value | date: 'mediumDate' }}</p>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, ReactiveFormsModule } from '@angular/forms';\nimport { ShipDatepickerInput } from '@ship-ui/core/ship-datepicker';\n\n@Component({\n  selector: 'app-input-datepicker-reactive',\n  standalone: true,\n  imports: [ReactiveFormsModule, ShipDatepickerInput, DatePipe],\n  templateUrl: './input-datepicker-reactive.html',\n  styleUrl: './input-datepicker-reactive.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InputDatepickerReactive {\n  dateControl = new FormControl(new Date());\n}\n"
      },
      {
        name: "range-datepicker-sandbox",
        html: `<div class="content">
  <sh-datepicker
    [class]="color()"
    [(date)]="startDate"
    [(endDate)]="endDate"
    [asRange]="true"
    [disabled]="disabled()"
    [monthsToShow]="monthsToShow()"></sh-datepicker>
  <p>Start: {{ startDate() | date: 'mediumDate' }}</p>
  <p>End: {{ endDate() | date: 'mediumDate' }}</p>
</div>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipDatepicker } from '@ship-ui/core/ship-datepicker';\n\n@Component({\n  selector: 'app-range-datepicker-sandbox',\n  standalone: true,\n  imports: [ShipDatepicker, DatePipe],\n  templateUrl: './range-datepicker-sandbox.html',\n  styleUrl: './range-datepicker-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RangeDatepickerSandbox {\n  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');\n  disabled = input(false);\n  monthsToShow = input(2);\n\n  startDate = signal<Date | null>(new Date());\n  endDate = signal<Date | null>(new Date(Date.now() + 86400000));\n}\n"
      }
    ]
  },
  {
    name: "ShipDatepickerInput",
    selector: "sh-datepicker-input",
    package: "@ship-ui/core/ship-datepicker",
    kind: "component",
    path: "projects/ship-ui/ship-datepicker/ship-datepicker-input.ts",
    inputs: [
      {
        name: "masking",
        type: "string",
        description: "`DatePipe` format used to render the masked date display (empty disables masking).",
        defaultValue: "'mediumDate'"
      },
      {
        name: "valueFormat",
        type: "string | null",
        description: "`DatePipe` format reflected into the input's actual value \u2014 what screen\nreaders announce and what an unmasked input displays. Defaults to the\n`masking` format; when that format would lose precision (e.g. a\ndate-only mask on a date holding a time), a lossless `'medium'` format\nis used instead so a round-trip through parsing keeps the same instant.\nSet to `''` to keep the raw `Date.toString()` value.",
        defaultValue: "null"
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "",
        defaultValue: "false",
        twoWay: true
      }
    ],
    outputs: [
      {
        name: "closed",
        type: "Date | null",
        description: "Emits the selected date when the picker popover closes."
      }
    ],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipDaterangeInput",
    selector: "sh-daterange-input",
    package: "@ship-ui/core/ship-datepicker",
    kind: "component",
    path: "projects/ship-ui/ship-datepicker/ship-daterange-input.ts",
    inputs: [
      {
        name: "monthsToShow",
        type: "number",
        description: "Number of consecutive month grids shown in the picker popover.",
        defaultValue: "1"
      },
      {
        name: "masking",
        type: "string",
        description: "`DatePipe` format used to render the masked start/end date display (empty disables masking).",
        defaultValue: "'mediumDate'"
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "Whether the range picker popover is open. Two-way bindable.",
        defaultValue: "false",
        twoWay: true
      }
    ],
    outputs: [
      {
        name: "closed",
        type: "{ start: Date | null; end: Date | null }",
        description: "Emits the selected `{ start, end }` range when the picker popover closes."
      }
    ],
    methods: [],
    cssVariables: [
      {
        name: "--dp-w",
        defaultValue: "#{p2r(300)}"
      }
    ],
    examples: []
  },
  {
    name: "ShipDialog",
    selector: "sh-dialog",
    package: "@ship-ui/core/ship-dialog",
    kind: "component",
    path: "projects/ship-ui/ship-dialog/ship-dialog.ts",
    inputs: [
      {
        name: "isOpen",
        type: "boolean",
        description: "Whether the dialog is open. Two-way bindable.",
        defaultValue: "false",
        twoWay: true
      },
      {
        name: "options",
        type: "Partial<ShipDialogOptions>",
        description: "Behaviour and sizing overrides (class, type, width, close-on-esc, etc.)."
      }
    ],
    outputs: [
      {
        name: "closed",
        type: "void",
        description: "Emits when the dialog closes."
      }
    ],
    methods: [
      {
        name: "dismissSheet",
        parameters: "",
        returnType: "void",
        description: "Slide the sheet out, then close the dialog."
      }
    ],
    cssVariables: [
      {
        name: "--dialog-py",
        defaultValue: "var(--pad-y-5)"
      },
      {
        name: "--dialog-px",
        defaultValue: "var(--pad-x-5)"
      },
      {
        name: "--dialog-g",
        defaultValue: "#{p2r(8)}"
      },
      {
        name: "--dialog-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--dialog-s",
        defaultValue: "var(--shape-2)"
      },
      {
        name: "--dialog-inner-s",
        defaultValue: "var(--shape-2)"
      },
      {
        name: "--dialog-side-w",
        defaultValue: "min(92vw, 30rem)"
      }
    ],
    examples: [
      {
        name: "basic-dynamic-dialog",
        html: '<button shButton (click)="openDialog()">Open Basic Dialog</button>\n',
        ts: "import { Component, inject, input, signal } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipDialogService } from '@ship-ui/core/ship-dialog';\n\n@Component({\n  selector: 'basic-dynamic-dialog',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './basic-dynamic-dialog.html',\n\n  styleUrl: './basic-dynamic-dialog.scss',\n})\nexport class BasicDynamicDialog {\n  #dialog = inject(ShipDialogService);\n\n  type = input<string>();\n\n  openDialog() {\n    const dialogRef = this.#dialog.open(SimpleDialogContentComponent, {\n      data: { message: 'hllo', yellow: true, hello: true },\n      class: this.type() ?? '',\n    });\n  }\n}\n\n@Component({\n  selector: 'simple-dialog-content',\n  standalone: true,\n\n  template: `\n    <div style=\"padding: 2rem;\">Hello from a basic dialog!</div>\n  `,\n})\nclass SimpleDialogContentComponent {\n  hello = signal<string>('hello');\n  data = input<{ message: string; yellow: boolean; hello: boolean }>();\n  // closed = output<string>();\n}\n"
      },
      {
        name: "dialog-as-component",
        html: '<button shButton (click)="openDialog()" [class.type]="type()">Open dialog as component</button>\n\n<sh-dialog [(isOpen)]="isOpen" (closed)="close()">hello im dialog content</sh-dialog>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipDialog } from '@ship-ui/core/ship-dialog';\n\n@Component({\n  selector: 'app-dialog-as-component',\n  imports: [ShipDialog, ShipButton],\n  templateUrl: './dialog-as-component.html',\n  styleUrl: './dialog-as-component.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DialogAsComponent {\n  type = input<string>();\n\n  isOpen = signal(false);\n\n  openDialog() {\n    this.isOpen.set(true);\n  }\n\n  close() {\n    this.isOpen.set(false);\n  }\n}\n"
      },
      {
        name: "bottom-sheet-dialog",
        html: '<button shButton color="primary" (click)="openSheet()">Open bottom sheet</button>\n',
        ts: `import { Component, inject, input } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipDialogService } from '@ship-ui/core/ship-dialog';

@Component({
  selector: 'bottom-sheet-dialog',
  standalone: true,
  imports: [ShipButton],
  templateUrl: './bottom-sheet-dialog.html',
  styleUrl: './bottom-sheet-dialog.scss',
})
export class BottomSheetDialog {
  #dialog = inject(ShipDialogService);

  openSheet() {
    this.#dialog.open(SheetContent, {
      type: 'bottom-sheet',
      maxWidth: '640px',
    });
  }
}

@Component({
  selector: 'bottom-sheet-content',
  standalone: true,
  template: \`
    <div header>
      <h4 title>Share this ship</h4>
      <p description>Drag the handle down \u2014 or flick \u2014 to dismiss, like a native sheet.</p>
    </div>
    <div content>
      <p>
        The sheet is a regular dialog (<code>type: 'bottom-sheet'</code>): same typed
        <code>open()</code>, same <code>data</code>/<code>closed</code> contract, backdrop and Escape included. With
        the software keyboard open it rides on top of it, so bottom-pinned content stays reachable.
      </p>
      <input placeholder="Focus me on mobile \u2014 the sheet rides the keyboard" style="width: 100%" />
    </div>
  \`,
})
class SheetContent {}
`
      },
      {
        name: "template-dialog",
        html: '<button shButton (click)="openTemplateDialog(myDialog)">Open Template Dialog</button>\n\n<ng-template #myDialog let-data let-close="close">\n  <div content>\n    <h2>{{ data.message }}</h2>\n    <p>This dialog is rendered entirely from a TemplateRef.</p>\n    <div>\n      <button shButton (click)="close()">Close Dialog</button>\n    </div>\n  </div>\n</ng-template>\n',
        ts: "import { Component, inject, input, TemplateRef } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipDialogService } from '@ship-ui/core/ship-dialog';\n\n@Component({\n  selector: 'template-dialog',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './template-dialog.html',\n\n  styleUrl: './template-dialog.scss',\n})\nexport class TemplateDialog {\n  #dialog = inject(ShipDialogService);\n  type = input<string>();\n\n  openTemplateDialog(template: TemplateRef<any>) {\n    this.#dialog.open(template, {\n      data: { message: 'Hello from Template!' },\n      class: this.type() || '',\n    });\n  }\n}\n"
      },
      {
        name: "data-passing-dialog",
        html: '<button shButton (click)="openDialog()">Open Data Passing hi Dialog</button>\n',
        ts: "import { Component, inject, input, output } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipDialogService } from '@ship-ui/core/ship-dialog';\n\n@Component({\n  selector: 'data-passing-dialog',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './data-passing-dialog.html',\n\n  styleUrl: './data-passing-dialog.scss',\n})\nexport class DataPassingDialog {\n  #dialog = inject(ShipDialogService);\n\n  type = input<string>();\n\n  openDialog() {\n    const dialogRef = this.#dialog.open(DataDialogContent, {\n      class: this.type() ?? '',\n      data: { message: 'Hello from parent!', hello: true },\n      closed: (result) => {\n        // Keep so we can easily see if the types break\n        const someString: string = result;\n        console.log('Dialog function closed with: \\t' + someString);\n      },\n    });\n\n    dialogRef.component.closed.subscribe((res) => {\n      console.log('Dialog component closed: \\t', res);\n    });\n\n    dialogRef.closed.subscribe((res) => {\n      console.log('Dialog ref closed: \\t', res);\n    });\n  }\n}\n\n@Component({\n  selector: 'data-dialog-content',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './data-dialog-content.html',\n\n  styleUrl: './data-dialog-content.scss',\n})\nclass DataDialogContent {\n  data = input<{ message: string; hello: boolean }>();\n  closed = output<string>();\n\n  closeWithValue() {\n    console.log('closeWithValue');\n    this.closed.emit('Some value from dialog');\n  }\n}\n"
      },
      {
        name: "header-footer-dialog",
        html: '<button shButton (click)="openDialog()">Open Header/Footer Dialog</button>\n',
        ts: "import { Component, inject, input, output, signal } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipDialogService } from '@ship-ui/core/ship-dialog';\n\n@Component({\n  selector: 'header-footer-dialog',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './header-footer-dialog.html',\n\n  styleUrl: './header-footer-dialog.scss',\n})\nexport class HeaderFooterDialog {\n  #dialog = inject(ShipDialogService);\n\n  type = input<string>();\n\n  openDialog() {\n    this.#dialog.open(HeaderFooterDialogContent, {\n      class: this.type() ?? '',\n    });\n  }\n}\n\n@Component({\n  selector: 'header-footer-dialog-content',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './header-footer-dialog-content.html',\n\n  styleUrl: './header-footer-dialog-content.scss',\n})\nclass HeaderFooterDialogContent {\n  closed = output<boolean>();\n\n  stickyHeader = signal(false);\n  stickyFooter = signal(false);\n}\n"
      }
    ],
    keywords: [
      "dialog",
      "modal",
      "popup",
      "overlay",
      "alert",
      "confirm",
      "window"
    ]
  },
  {
    name: "ShipDivider",
    selector: "sh-divider",
    package: "@ship-ui/core/ship-divider",
    kind: "component",
    path: "projects/ship-ui/ship-divider/ship-divider.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--divider-c",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--divider-h",
        defaultValue: "#{p2r(1)}"
      }
    ],
    examples: [
      {
        name: "base-divider",
        html: "<div>Above the divider</div>\n<sh-divider></sh-divider>\n<div>Below the divider</div>\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipDivider } from '@ship-ui/core/ship-divider';\n\n@Component({\n  selector: 'app-base-divider',\n  standalone: true,\n  imports: [ShipDivider],\n  templateUrl: './base-divider.html',\n  styleUrl: './base-divider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseDivider {}\n"
      },
      {
        name: "text-divider",
        html: "<div>Above the divider</div>\n<sh-divider>Text in divider</sh-divider>\n<div>Below the divider</div>\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipDivider } from '@ship-ui/core/ship-divider';\n\n@Component({\n  selector: 'app-text-divider',\n  standalone: true,\n  imports: [ShipDivider],\n  templateUrl: './text-divider.html',\n  styleUrl: './text-divider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TextDividerComponent {}\n"
      }
    ],
    keywords: [
      "divider",
      "separator",
      "line",
      "hr",
      "rule"
    ]
  },
  {
    name: "ShipEditor",
    selector: "sh-editor",
    package: "@ship-ui/core/ship-editor",
    kind: "component",
    path: "projects/ship-ui/ship-editor/ship-editor.ts",
    inputs: [
      {
        name: "readonly",
        type: "boolean",
        description: "When `true`, the editor is view-only and rejects all input, deletion, and paste.",
        defaultValue: "false"
      },
      {
        name: "multiCursor",
        type: "boolean",
        description: "Alt+click to open a second cursor, editing every cursor as one undo step.\n\nOff by default. A rich-text surface is not where people reach for multiple\ncursors, and only the primary one is the browser's own \u2014 the rest are\npainted by the editor, so they miss the native affordances (a blinking\ncaret of the platform's shape, IME, spellcheck) that this surface is\notherwise careful to keep. Opt in where the document is structured enough\nto want it.",
        defaultValue: "false"
      },
      {
        name: "format",
        type: "'html' | 'json' | 'markdown'",
        description: "Serialization format of `value`: rich `html`, structured `json` AST, or `markdown`.",
        defaultValue: "'html'",
        options: [
          "html",
          "json",
          "markdown"
        ]
      },
      {
        name: "variant",
        type: "'base' | 'document' | null",
        description: "Visual variant: compact `base` (the default) or full-width `document` styling; project default via `ShipConfig.editor.variant`.",
        defaultValue: "null",
        options: [
          "base",
          "document"
        ]
      },
      {
        name: "behaviors",
        type: "(BaseBlockBehavior | BaseInlineBehavior)[]",
        description: "Additional block and inline behaviors to register alongside the built-in ones.",
        defaultValue: "[]"
      },
      {
        name: "sanitize",
        type: "SanitizeOption",
        description: "Controls URL/content sanitization applied to incoming and pasted content.",
        defaultValue: "true"
      },
      {
        name: "contextualActions",
        type: "ContextualActionExtras",
        description: "Extra actions to surface in the selection contextual toolbar.",
        defaultValue: "{}"
      },
      {
        name: "slashCommands",
        type: "SlashCommand[]",
        description: "Commands available in the `/` slash menu.",
        defaultValue: "[]"
      },
      {
        name: "imageUpload",
        type: "((file: File) => Promise<string>) | null",
        description: "Optional async handler that uploads an image `File` and resolves to its URL.",
        defaultValue: "null"
      },
      {
        name: "placeholder",
        type: "string",
        description: "Placeholder text shown when the editor is empty.",
        defaultValue: "''"
      },
      {
        name: "showMetrics",
        type: "boolean",
        description: "When `true`, displays the metrics line beneath the editor.",
        defaultValue: "false"
      },
      {
        name: "metrics",
        type: "readonly ShipEditorMetric[]",
        description: "Which metrics the line shows, in order. A metric left out is not displayed\nand not calculated.",
        defaultValue: "['words', 'characters', 'format']"
      },
      {
        name: "imageEdgeResize",
        type: "boolean",
        description: "When `true`, enables dragging image edges to resize them inline.",
        defaultValue: "false"
      },
      {
        name: "value",
        type: "string | ASTDocument | null",
        description: "Two-way bound editor content, serialized according to `format`.",
        defaultValue: "null",
        twoWay: true
      },
      {
        name: "virtualization",
        type: "boolean | 'auto'",
        description: "Viewport virtualization: only blocks in and around the visible viewport\nexist in the DOM, with padding standing in for the rest. `'auto'` (the\ndefault) switches it on past `VIRTUAL_AUTO_THRESHOLD` top-level blocks;\n`true`/`false` force it.",
        defaultValue: "'auto'",
        options: [
          "auto"
        ]
      }
    ],
    outputs: [],
    methods: [
      {
        name: "measure",
        parameters: "",
        returnType: "{ words: number; characters: number; blocks: number }",
        description: "Count on demand rather than continuously.\n\nThe signals above recompute whenever the document changes, which is every\nkeystroke. Leave `showMetrics` off and call this when a count is actually\nwanted - on a button, on blur, when a panel opens - and the document is\nwalked once at that moment instead of on every key."
      },
      {
        name: "toggleSourceView",
        parameters: "",
        returnType: "void",
        description: "Toggles between the design view and the raw source (code) view, syncing content in both directions."
      }
    ],
    cssVariables: [
      {
        name: "--editor-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--editor-code-bg",
        defaultValue: "var(--base-2)"
      },
      {
        name: "--editor-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--editor-toolbar-bg",
        defaultValue: "rgb(from var(--base-1) r g b / 70%)"
      },
      {
        name: "--editor-toolbar-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--editor-btn-bg-h",
        defaultValue: "var(--base-3)"
      },
      {
        name: "--editor-btn-bg-a",
        defaultValue: "var(--primary-3)"
      },
      {
        name: "--editor-btn-c-a",
        defaultValue: "var(--primary-11)"
      },
      {
        name: "--editor-footer-bg",
        defaultValue: "var(--base-2)"
      },
      {
        name: "--editor-py",
        defaultValue: "var(--pad-y-5)"
      },
      {
        name: "--editor-px",
        defaultValue: "var(--pad-x-5)"
      },
      {
        name: "--editor-min-h",
        defaultValue: "#{p2r(150)}"
      },
      {
        name: "--editor-bc-f",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--editor-s",
        defaultValue: "var(--shape-3)"
      }
    ],
    examples: []
  },
  {
    name: "ShipEditorFloatingToolbar",
    selector: "sh-editor-floating-toolbar",
    package: "@ship-ui/core/ship-editor",
    kind: "component",
    path: "projects/ship-ui/ship-editor/ship-editor-floating-toolbar.ts",
    inputs: [
      {
        name: "editor",
        type: "ShipEditor | null",
        description: "The editor the floating toolbar controls; defaults to the enclosing `<sh-editor>` when omitted.",
        defaultValue: "null"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipEditorRemoteCursors",
    selector: "sh-editor-remote-cursors",
    package: "@ship-ui/core/ship-editor-collab",
    kind: "component",
    path: "projects/ship-ui/ship-editor-collab/ship-editor-remote-cursors.ts",
    description: 'Paints the carets and selections of remote peers over an `sh-editor`.\n\nProject it inside the editor \u2014 `<sh-editor>\u2026<sh-editor-remote-cursors\n[collab]="collab" />\u2026</sh-editor>` \u2014 and it picks the engine up from the\neditor\'s injector. (Placing it as a sibling in a `position: relative`\nwrapper with an explicit `[engine]` input also works.) It repaints on\ndocument and presence changes; peer selections are flat positions \u2014\nresolved to pixel rects through the live DOM, so they track marks, wraps\nand images.',
    inputs: [
      {
        name: "engine",
        type: "EditorEngineService | null",
        description: "Engine override for sibling placement; defaults to the enclosing editor's engine.",
        defaultValue: "null"
      },
      {
        name: "collab",
        type: "ShipEditorCollab",
        description: "The collab session whose peers should be painted."
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipEditorSheet",
    selector: "sh-editor-sheet",
    package: "@ship-ui/core/ship-editor",
    kind: "component",
    path: "projects/ship-ui/ship-editor/ship-editor-sheet.ts",
    description: "`<sh-editor-sheet>` \u2014 the mobile editing pattern. On fine-pointer/wide\nviewports it renders a normal inline `sh-editor`. On coarse-pointer or\nnarrow viewports the inline editor becomes a tap-to-edit preview that opens\nthe real editing surface in a `bottom-sheet` dialog: the editor fills the\ncard, the toolbar is pinned at the bottom above the keyboard, and the sheet\nslides down to dismiss.\n\nThe surface is mounted fresh in the sheet (a live contenteditable is never\nreparented); `value` is two-way bound and stays in sync while editing.",
    inputs: [
      {
        name: "value",
        type: "string | ASTDocument | null",
        description: "Two-way bound editor content, same contract as `sh-editor`'s `value`.",
        defaultValue: "null",
        twoWay: true
      },
      {
        name: "format",
        type: "'html' | 'markdown' | 'json'",
        description: "Serialization format handed through to the editor.",
        defaultValue: "'html'",
        options: [
          "html",
          "markdown",
          "json"
        ]
      },
      {
        name: "behaviors",
        type: "SheetEditorBehaviors",
        description: "Extra behaviors handed through to the editor.",
        defaultValue: "[]"
      },
      {
        name: "placeholder",
        type: "string",
        description: "",
        defaultValue: "''"
      },
      {
        name: "sheetLabel",
        type: "string",
        description: 'Accessible label for the tap-to-edit preview ("Edit {label}").',
        defaultValue: "''"
      },
      {
        name: "mode",
        type: "'auto' | 'sheet' | 'inline'",
        description: "`'auto'` (default) uses the sheet on coarse-pointer or narrow viewports;\n`'sheet'`/`'inline'` force one mode (e.g. for demos or embedding).",
        defaultValue: "'auto'",
        options: [
          "auto",
          "sheet",
          "inline"
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipEditorSheetSurface",
    selector: "sh-editor-sheet-surface",
    package: "@ship-ui/core/ship-editor",
    kind: "component",
    path: "projects/ship-ui/ship-editor/ship-editor-sheet.ts",
    description: "The editing surface mounted inside the bottom sheet: the editor fills the\ncard and scrolls, the toolbar sits pinned underneath \u2014 directly above the\nsoftware keyboard, since the sheet itself rides the keyboard inset.",
    inputs: [
      {
        name: "data",
        type: "SheetEditorConfig",
        description: ""
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipEditorToolbar",
    selector: "sh-editor-toolbar",
    package: "@ship-ui/core/ship-editor",
    kind: "component",
    path: "projects/ship-ui/ship-editor/ship-editor-toolbar.ts",
    inputs: [
      {
        name: "editor",
        type: "ShipEditor | null",
        description: "The editor the toolbar controls; defaults to the enclosing `<sh-editor>` when omitted.",
        defaultValue: "null"
      },
      {
        name: "position",
        type: "'top' | 'bottom' | 'none'",
        description: "Placement of the toolbar relative to the editor: `top`, `bottom`, or `none`.",
        defaultValue: "'none'",
        options: [
          "top",
          "bottom",
          "none"
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipEditorCollabDirective",
    selector: "sh-editor[shCollab]",
    package: "@ship-ui/core/ship-editor-collab",
    kind: "directive",
    path: "projects/ship-ui/ship-editor-collab/ship-editor-collab-directive.ts",
    inputs: [
      {
        name: "shCollab",
        type: "string | CollabTransport",
        description: ""
      },
      {
        name: "presence",
        type: "{ name: string; color: string }",
        description: "Shown on this peer's remote cursor in other windows."
      },
      {
        name: "clientId",
        type: "string",
        description: "Stable identity for this window; generated when omitted."
      },
      {
        name: "remoteCursors",
        type: "boolean",
        description: "Set false to skip the remote-cursor overlay.",
        defaultValue: "true"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipEventCard",
    selector: "sh-event-card",
    package: "@ship-ui/core/ship-event-card",
    kind: "component",
    path: "projects/ship-ui/ship-event-card/ship-event-card.ts",
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "Color theme applied to the card.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "Sheet visual variant of the card.",
        defaultValue: "null",
        options: [
          "simple",
          "outlined",
          "flat",
          "raised",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--ec-py",
        defaultValue: "var(--pad-y-5)"
      },
      {
        name: "--ec-px",
        defaultValue: "var(--pad-x-5)"
      },
      {
        name: "--btn-bs",
        defaultValue: "none"
      }
    ],
    examples: [
      {
        name: "outlined-event-card",
        html: '<sh-event-card class="outlined">\n  <h3>Default</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="outlined primary">\n  <h3>Primary</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="outlined accent">\n  <h3>Accent</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="outlined warn">\n  <h3>Warn</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="outlined error">\n  <h3>Error</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="outlined success">\n  <h3>Success</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipEventCard } from '@ship-ui/core/ship-event-card';\n\n@Component({\n  selector: 'app-outlined-event-card',\n  imports: [ShipEventCard, ShipButton],\n  templateUrl: './outlined-event-card.html',\n  styleUrl: './outlined-event-card.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OutlinedEventCard {}\n"
      },
      {
        name: "simple-event-card",
        html: '<sh-event-card class="simple">\n  <h3>Default</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="simple primary">\n  <h3>Primary</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="simple accent">\n  <h3>Accent</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="simple warn">\n  <h3>Warn</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="simple error">\n  <h3>Error</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="simple success">\n  <h3>Success</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipEventCard } from '@ship-ui/core/ship-event-card';\n\n@Component({\n  selector: 'app-simple-event-card',\n  imports: [ShipEventCard, ShipButton],\n  templateUrl: './simple-event-card.html',\n  styleUrl: './simple-event-card.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SimpleEventCard {}\n"
      },
      {
        name: "raised-event-card",
        html: '<sh-event-card class="raised">\n  <h3>Default</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="raised primary">\n  <h3>Primary</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="raised accent">\n  <h3>Accent</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="raised warn">\n  <h3>Warn</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="raised error">\n  <h3>Error</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="raised success">\n  <h3>Success</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipEventCard } from '@ship-ui/core/ship-event-card';\n\n@Component({\n  selector: 'app-raised-event-card',\n  imports: [ShipEventCard, ShipButton],\n  templateUrl: './raised-event-card.html',\n  styleUrl: './raised-event-card.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RaisedEventCard {}\n"
      },
      {
        name: "base-event-card",
        html: '<sh-event-card>\n  <h3>Default</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="primary">\n  <h3>Primary</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="accent">\n  <h3>Accent</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="warn">\n  <h3>Warn</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="error">\n  <h3>Error</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="success">\n  <h3>Success</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipEventCard } from '@ship-ui/core/ship-event-card';\n\n@Component({\n  selector: 'app-base-event-card',\n  imports: [ShipEventCard, ShipButton],\n  templateUrl: './base-event-card.html',\n  styleUrl: './base-event-card.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseEventCard {}\n"
      },
      {
        name: "event-card-sandbox",
        html: '<sh-event-card [class]="exampleClass()" [style.--sheet-c]="useDynamicColor() ? dynamicColor() : null">\n  Just text in the card\n</sh-event-card>\n\n<sh-event-card [class]="exampleClass()" [style.--sheet-c]="useDynamicColor() ? dynamicColor() : null">\n  <h3>Card with title</h3>\n  <p>and description</p>\n</sh-event-card>\n\n<sh-event-card [class]="exampleClass()" [style.--sheet-c]="useDynamicColor() ? dynamicColor() : null">\n  <h3>Card with title</h3>\n  <p>and description</p>\n\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card [class]="exampleClass()" [style.--sheet-c]="useDynamicColor() ? dynamicColor() : null">\n  Event card with just buttons projected as actions Event card with just buttons projected as actionsEvent card with\n  just buttons projected as actionsEvent card with just buttons projected as actionsEvent card with just buttons\n  projected as actionsEvent card with just buttons projected as actions\n\n  <button shButton>Action 1</button>\n  <button shButton>Action 2</button>\n</sh-event-card>\n\n<sh-event-card [class]="exampleClass()" [style.--sheet-c]="useDynamicColor() ? dynamicColor() : null">\n  <h3>Card with title</h3>\n  <p>and description</p>\n  <button shButton>And a action button</button>\n</sh-event-card>\n',
        ts: "import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipEventCard } from '@ship-ui/core/ship-event-card';\n\n@Component({\n  selector: 'app-event-card-sandbox',\n  imports: [ShipEventCard, ShipButton],\n  templateUrl: './event-card-sandbox.html',\n  styleUrl: './event-card-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class EventCardSandbox {\n  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');\n  variant = input<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('simple');\n  useDynamicColor = input(false);\n  dynamicColor = input('#2f54eb');\n\n  exampleClass = computed(() => {\n    if (this.useDynamicColor()) return 'dynamic';\n\n    return this.variant() + ' ' + this.color();\n  });\n}\n"
      },
      {
        name: "basic-event-card",
        html: "<sh-event-card>\n  <h3>Default</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipEventCard } from '@ship-ui/core/ship-event-card';\n\n@Component({\n  selector: 'app-basic-event-card',\n  standalone: true,\n  imports: [ShipEventCard, ShipButton],\n  templateUrl: './basic-event-card.html',\n  styleUrl: './basic-event-card.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicEventCard {}\n"
      },
      {
        name: "flat-event-card",
        html: '<sh-event-card class="flat">\n  <h3>Default</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="flat primary">\n  <h3>Primary</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="flat accent">\n  <h3>Accent</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="flat warn">\n  <h3>Warn</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="flat error">\n  <h3>Error</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="flat success">\n  <h3>Success</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipEventCard } from '@ship-ui/core/ship-event-card';\n\n@Component({\n  selector: 'app-flat-event-card',\n  imports: [ShipEventCard, ShipButton],\n  templateUrl: './flat-event-card.html',\n  styleUrl: './flat-event-card.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FlatEventCard {}\n"
      }
    ],
    keywords: [
      "event",
      "card",
      "calendar",
      "scheduling",
      "date",
      "meeting"
    ]
  },
  {
    name: "ShipFileUpload",
    selector: "sh-file-upload",
    package: "@ship-ui/core/ship-file-upload",
    kind: "component",
    path: "projects/ship-ui/ship-file-upload/ship-file-upload.ts",
    description: '### Files\n\nSelected files are available via the\n`files`\nattribute. Use\n`[(files)]`\nfor two-way binding.\n\n### Selection\n\nCustomize selection behavior:\n\n<li>\n`multiple`\n: Allows selecting more than one file.\n</li>\n<li>\n`accept`\n: Restricts file types (e.g.,\n`accept=".png,.jpg"`\n).\n</li>\n\n### Text\n\nCustomize displayed labels:\n\n<li>\n`placeholder`\n: Text shown when empty.\n</li>\n<li>\n`overlayText`\n: Text shown during drag-and-drop.\n</li>',
    inputs: [
      {
        name: "multiple",
        type: "boolean | null",
        description: "Allows selecting more than one file when `true`."
      },
      {
        name: "accept",
        type: "string | null",
        description: "Accepted file types, forwarded to the input's `accept` attribute.",
        defaultValue: "null"
      },
      {
        name: "placeholder",
        type: "string",
        description: "Prompt text shown when no files are selected. Two-way bindable.",
        defaultValue: "'Click or drag files here'",
        twoWay: true
      },
      {
        name: "overlayText",
        type: "string",
        description: "Prompt text shown while files are being dragged over the drop zone.",
        defaultValue: "'Drop files here'"
      },
      {
        name: "files",
        type: "File[]",
        description: "Currently selected files. Two-way bindable.",
        defaultValue: "[]",
        twoWay: true
      }
    ],
    outputs: [],
    methods: [
      {
        name: "handleFileUpload",
        parameters: "newFiles: File[]",
        returnType: "void",
        description: "Adds `newFiles` to the selection, appending when `multiple` is set or replacing otherwise."
      }
    ],
    cssVariables: [
      {
        name: "--fu-bg-active",
        defaultValue: "rgb(from var(--dark-text) r g b / 10%)"
      }
    ],
    examples: [
      {
        name: "base-file-upload",
        html: '<sh-file-upload [(files)]="files" accept=".json,.png"><label>Upload files</label></sh-file-upload>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipFileUpload } from '@ship-ui/core/ship-file-upload';\n\n@Component({\n  selector: 'app-base-file-upload',\n  imports: [ShipFileUpload],\n  templateUrl: './base-file-upload.html',\n  styleUrl: './base-file-upload.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseFileUpload {\n  files = signal<File[]>([]);\n}\n"
      },
      {
        name: "file-upload-sandbox",
        html: '<sh-file-upload\n  [(files)]="files"\n  [multiple]="multiple()"\n  [accept]="accept()"\n  [placeholder]="placeholder()"\n  [overlayText]="overlayText()">\n  <label>Upload files</label>\n</sh-file-upload>\n\n<div class="files-list">\n  <h4>Selected Files</h4>\n  <ul>\n    @for (file of files(); track file.name) {\n      <li>{{ file.name }}</li>\n    }\n  </ul>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipFileUpload } from '@ship-ui/core/ship-file-upload';\n\n@Component({\n  selector: 'app-file-upload-sandbox',\n  standalone: true,\n  imports: [ShipFileUpload],\n  templateUrl: './file-upload-sandbox.html',\n  styleUrl: './file-upload-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FileUploadSandbox {\n  files = signal<File[]>([]);\n  multiple = input(true);\n  accept = input('.json,.png');\n  placeholder = input('Click or drag files here');\n  overlayText = input('Drop files here');\n}\n"
      }
    ]
  },
  {
    name: "ShipFormField",
    selector: "sh-form-field",
    package: "@ship-ui/core/ship-form-field",
    kind: "component",
    path: "projects/ship-ui/ship-form-field/ship-form-field.ts",
    description: "### label\n\nOptional label for the form field. Can include icons or other elements.\n\n### prefix/suffix\n\nProject content before or after the input using\n`prefix`\nor\n`suffix`\nslots.\n\n### placeholder\n\nPlaceholder text for the input or textarea.\n\n### boxPref/boxSuffix\n\nProject content before or after the input but inside a box style\n`boxPrefix`\nor\n`boxSuffix`\nslots.\n\n### hint\n\nOptional hint text shown below the input.\n\n### error\n\nOptional error text shown below the input when in error state.\n\n### disabled\n\nDisables the input or textarea.\n\n### size/class\n\nUse\n`small`\n,\n`autosize`\n,\n`center`\nclasses for different layouts.",
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "Color theme applied to the field.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipFormFieldVariant | null",
        description: "Visual variant of the form field.",
        defaultValue: "null",
        options: [
          "base",
          "horizontal",
          "auto-width",
          "autosize",
          ""
        ]
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "Size of the form field.",
        defaultValue: "null",
        options: [
          "small",
          "xsmall",
          ""
        ]
      },
      {
        name: "readonly",
        type: "boolean",
        description: "Renders the field in a read-only state.",
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: [
      {
        name: "base-form-field",
        html: '<sh-form-field>\n  <input placeholder="Placeholder no label..." type="text" />\n  <div boxPrefix>\n    Hello\n    <sh-icon>circle</sh-icon>\n  </div>\n\n  <div boxSuffix>hello 123</div>\n</sh-form-field>\n\n<sh-form-field>\n  <input placeholder="Placeholder no label..." />\n  <sh-icon prefix>circle</sh-icon>\n\n  <ng-container suffix>hello 123</ng-container>\n</sh-form-field>\n\n<sh-form-field variant="autosize">\n  <label>Time</label>\n  <input type="time" />\n  <div boxPrefix>\n    <sh-icon>clock</sh-icon>\n  </div>\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input placeholder="Placeholder..." />\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input placeholder="Placeholder..." />\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon>circle</sh-icon>\n</sh-form-field>\n\n<sh-icon>circle</sh-icon>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input [formControl]="disabledCtrl" placeholder="Placeholder..." />\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon>circle</sh-icon>\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n    <sh-icon class="error" shTooltip="hello world">acorn-bold</sh-icon>\n  </label>\n  <input [formControl]="baseCtrl" placeholder="Placeholder..." #input />\n  <span hint>Hint</span>\n\n  <span hint>{{ baseCtrl.value?.length ?? 0 }}/10</span>\n\n  @if ((baseCtrl.value?.length ?? 0) > 10) {\n    <span error>Write a message in this alert area</span>\n  }\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Error without hint\n    <sh-icon>question</sh-icon>\n  </label>\n\n  <input placeholder="Placeholder with error ..." [formControl]="errorCtrl1" />\n\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon suffix>circle</sh-icon>\n\n  @if (errorCtrl1.invalid && errorCtrl1.touched) {\n    <span error>Write a message in this alert area</span>\n  }\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n\n  <input placeholder="Placeholder with error ..." [formControl]="errorCtrl" />\n\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon suffix>circle</sh-icon>\n\n  @if (errorCtrl.invalid && errorCtrl.touched) {\n    <span error>Write a message in this alert area</span>\n  }\n\n  <span hint>{{ errorCtrl.value?.length ?? 0 }}/10</span>\n</sh-form-field>\n\n<sh-form-field variant="autosize" class="center">\n  <label>\n    Number without suffix auto\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <sh-icon prefix>circle</sh-icon>\n  <span textPrefix>Hello</span>\n</sh-form-field>\n\n<sh-form-field variant="autosize" class="center">\n  <label>\n    Number without suffix\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n</sh-form-field>\n\n<sh-form-field variant="auto-width">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <sh-icon prefix>circle</sh-icon>\n  <span textPrefix>Hello</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <span textPrefix>$&nbsp;</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input [formControl]="disabledCtrl" type="number" placeholder="0" />\n  <span textPrefix>$&nbsp;</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field>\n  <label>Textarea</label>\n  <textarea></textarea>\n</sh-form-field>\n\n<sh-form-field>\n  <label>Textarea</label>\n  <textarea>\nwith some value very long text with some value very long text with some value very long text with some value very long text with some value very long text </textarea\n  >\n</sh-form-field>\n\n<sh-form-field>\n  <label>Textarea</label>\n  <textarea [formControl]="disabledCtrl"></textarea>\n</sh-form-field>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipTooltip } from '@ship-ui/core/ship-tooltip';\n\n@Component({\n  selector: 'app-base-form-field',\n  imports: [ShipFormField, ShipIcon, ShipTooltip, FormsModule, ReactiveFormsModule],\n  templateUrl: './base-form-field.html',\n  styleUrl: './base-form-field.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseFormFieldComponent {\n  baseCtrl = new FormControl('');\n  disabledCtrl = new FormControl({ value: '', disabled: true });\n  errorCtrl = new FormControl('', [Validators.required]);\n  errorCtrl1 = new FormControl('', [Validators.required, Validators.minLength(10)]);\n\n  ngOnInit() {\n    this.errorCtrl.markAsTouched();\n    this.errorCtrl.markAsDirty();\n  }\n}\n"
      },
      {
        name: "signal-form-field",
        html: '<sh-form-field>\n  <label>Name</label>\n  <input placeholder="Your name..." [formField]="profileForm.name" />\n  <sh-icon prefix>user</sh-icon>\n  <span hint>{{ profile().name.length }}/10</span>\n  @if (profileForm.name().touched() && profileForm.name().errors()[0]; as error) {\n    <span error>{{ error.message }}</span>\n  }\n</sh-form-field>\n\n<sh-form-field>\n  <label>Email</label>\n  <input type="email" placeholder="you@example.com" [formField]="profileForm.email" />\n  <sh-icon prefix>envelope</sh-icon>\n  @if (profileForm.email().touched() && profileForm.email().errors()[0]; as error) {\n    <span error>{{ error.message }}</span>\n  }\n</sh-form-field>\n\n<sh-form-field>\n  <label>Bio</label>\n  <textarea placeholder="A few words about you..." [formField]="profileForm.bio"></textarea>\n  <span hint>Minimum 20 characters</span>\n  @if (profileForm.bio().touched() && profileForm.bio().errors()[0]; as error) {\n    <span error>{{ error.message }}</span>\n  }\n</sh-form-field>\n\n<sh-form-field>\n  <label>Disabled via schema</label>\n  <input [formField]="profileForm.locked" />\n</sh-form-field>\n\n<p>Form valid: {{ profileForm().valid() }}</p>\n<pre>{{ profile() | json }}</pre>\n',
        ts: "import { JsonPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { disabled, email, form, FormField, maxLength, minLength, required } from '@angular/forms/signals';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-signal-form-field',\n  imports: [JsonPipe, FormField, ShipFormField, ShipIcon],\n  templateUrl: './signal-form-field.html',\n  styleUrl: './signal-form-field.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SignalFormField {\n  profile = signal({\n    name: '',\n    email: '',\n    bio: '',\n    locked: 'Cannot edit me',\n  });\n\n  profileForm = form(this.profile, (path) => {\n    required(path.name, { message: 'Name is required' });\n    maxLength(path.name, 10, { message: 'Max 10 characters' });\n    required(path.email, { message: 'Email is required' });\n    email(path.email, { message: 'Enter a valid email' });\n    minLength(path.bio, 20, { message: 'Tell us a bit more (min 20 chars)' });\n    disabled(path.locked);\n  });\n}\n"
      },
      {
        name: "form-field-sandbox",
        html: `<sh-form-field [variant]="variant()">
  @if (showLabel()) {
    <label>{{ label() }}</label>
  }
  @if (showPrefix()) {
    <ng-container prefix>{{ prefix() }}</ng-container>
  }
  @if (showSuffix()) {
    <ng-container suffix>{{ suffix() }}</ng-container>
  }
  @if (inputType() === 'text') {
    <input [placeholder]="placeholder()" [(ngModel)]="value" [disabled]="disabled()" />
  } @else if (inputType() === 'number') {
    <input type="number" [placeholder]="placeholder()" [(ngModel)]="value" [disabled]="disabled()" />
  } @else if (inputType() === 'textarea') {
    <textarea [placeholder]="placeholder()" [(ngModel)]="value" [disabled]="disabled()"></textarea>
  }
  @if (showHint()) {
    <span hint>{{ hint() }}</span>
  }
  @if (showError()) {
    <span error>{{ error() }}</span>
  }
</sh-form-field>
`,
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipFormFieldVariant } from '@ship-ui/core';\n\n@Component({\n  selector: 'app-form-field-sandbox',\n  standalone: true,\n  imports: [FormsModule, ShipFormField],\n  templateUrl: './form-field-sandbox.html',\n  styleUrl: './form-field-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FormFieldSandbox {\n  label = input('Label');\n  showLabel = input(true);\n  prefix = input('');\n  showPrefix = input(false);\n  suffix = input('');\n  showSuffix = input(false);\n  placeholder = input('Placeholder...');\n  hint = input('');\n  showHint = input(false);\n  error = input('');\n  showError = input(false);\n  disabled = input(false);\n  inputType = input<'text' | 'number' | 'textarea'>('text');\n  variant = input<ShipFormFieldVariant>(''); // '', 'small', 'autosize', etc.\n  value = signal<string>('');\n}\n"
      },
      {
        name: "basic-form-field",
        html: '<sh-form-field>\n  <label>Label</label>\n  <input placeholder="Placeholder..." type="text" />\n</sh-form-field>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\n\n@Component({\n  selector: 'app-basic-form-field',\n  standalone: true,\n  imports: [ShipFormField],\n  templateUrl: './basic-form-field.html',\n  styleUrl: './basic-form-field.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicFormField {}\n"
      },
      {
        name: "small-form-field",
        html: '<sh-form-field class="small">\n  <input placeholder="Placeholder no label..." />\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input placeholder="Placeholder..." />\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input placeholder="Placeholder..." />\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon>circle</sh-icon>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input [formControl]="disabledCtrl" placeholder="Placeholder..." />\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon>circle</sh-icon>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input [formControl]="baseCtrl" placeholder="Placeholder..." #input />\n  <span hint>Hint</span>\n\n  <span hint>{{ baseCtrl.value?.length ?? 0 }}/10</span>\n\n  @if ((baseCtrl.value?.length ?? 0) > 10) {\n    <span error>Write a message in this alert area</span>\n  }\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n\n  <input placeholder="Placeholder with error ..." [formControl]="errorCtrl" />\n\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon suffix>circle</sh-icon>\n\n  @if (errorCtrl.invalid && errorCtrl.touched) {\n    <span error>Write a message in this alert area</span>\n  }\n\n  <span hint>{{ errorCtrl.value?.length ?? 0 }}/10</span>\n</sh-form-field>\n\n<sh-form-field class="small center autosize">\n  <label>\n    Number without suffix\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <sh-icon prefix>circle</sh-icon>\n  <span textPrefix>Hello</span>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <sh-icon prefix>circle</sh-icon>\n  <span textPrefix>Hello</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <span textPrefix>$&nbsp;</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input [formControl]="disabledCtrl" type="number" placeholder="0" />\n  <span textPrefix>$&nbsp;</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>Textarea</label>\n  <textarea></textarea>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>Textarea</label>\n  <textarea>\nwith some value very long text with some value very long text with some value very long text with some value very long text with some value very long text </textarea\n  >\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>Textarea</label>\n  <textarea [formControl]="disabledCtrl"></textarea>\n</sh-form-field>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-small-form-field',\n  imports: [ShipFormField, ShipIcon, FormsModule, ReactiveFormsModule],\n  templateUrl: './small-form-field.html',\n  styleUrl: './small-form-field.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SmallFormField {\n  baseCtrl = new FormControl('');\n  disabledCtrl = new FormControl({ value: '', disabled: true });\n  errorCtrl = new FormControl('', [Validators.required]);\n  errorCtrl1 = new FormControl('', [Validators.required, Validators.minLength(10)]);\n\n  ngOnInit() {\n    this.errorCtrl.markAsTouched();\n    this.errorCtrl.markAsDirty();\n  }\n}\n"
      }
    ]
  },
  {
    name: "ShipFormFieldPopover",
    selector: "sh-form-field-popover",
    package: "@ship-ui/core/ship-form-field",
    kind: "component",
    path: "projects/ship-ui/ship-form-field/ship-form-field-popover.ts",
    inputs: [
      {
        name: "isOpen",
        type: "boolean",
        description: "Whether the popover is open. Two-way bindable.",
        defaultValue: "false",
        twoWay: true
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Color theme applied to the field.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipFormFieldVariant | null",
        description: "Visual variant of the form field.",
        defaultValue: "null",
        options: [
          "base",
          "horizontal",
          "auto-width",
          "autosize",
          ""
        ]
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "Size of the form field.",
        defaultValue: "null",
        options: [
          "small",
          "xsmall",
          ""
        ]
      },
      {
        name: "readonly",
        type: "boolean",
        description: "Renders the field in a read-only state.",
        defaultValue: "false"
      }
    ],
    outputs: [
      {
        name: "closed",
        type: "void",
        description: "Emits when the popover closes."
      }
    ],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipIcon",
    selector: "sh-icon",
    package: "@ship-ui/core/ship-icon",
    kind: "component",
    path: "projects/ship-ui/ship-icon/ship-icon.ts",
    description: "### Sizes\n\nIcons can be set to different sizes using the\n`size`\nattribute. Valid options are:\n**small**\n,\n**large**\n, or\n**inherit**\n.\n\n### Colors\n\nIcon colors can be set using the\n`color`\nattribute. Valid options are:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**error**\n, and\n**success**\n.\n\nColor can also be overridden with CSS color variables:\n`{{ `\\<sh-icon [style.--icon-c]=\"'blue'\">cloud-warning\\</sh-icon>` }}`\n\n### Icon Packs\n\nCurrently we support Phosphor Icons. Search for icons here:\n\n<a shButton variant=\"raised\" color=\"primary\" size=\"small\" href=\"https://phosphoricons.com/#toolbar\" target=\"_blank\">\nSearch Phosphor Icons\n<sh-icon>arrow-square-out</sh-icon>\n</a>\nWe support multiple weight variations using ligatures:\n\n<li>\n`cloud-warning`\n(Regular - default)\n</li>\n- `cloud-warning-thin`\n- `cloud-warning-light`\n- `cloud-warning-fill`\n- `cloud-warning-bold`\n\n### Icon CLI\n\nUse our CLI tool to generate optimized icon fonts containing only the icons you use.\n\nGenerate once:\n`ship-fg --src='./src' --out='./src/assets' --rootPath='./'`\n\nWatch mode:\n`ship-fg --src='./src' --out='./src/assets' --rootPath='./' --watch`",
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "Theme color applied to the icon (`ShipColor`); `null` inherits the current color.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "size",
        type: "ShipIconSize | null",
        description: "Icon size preset (`ShipIconSize`); `null` uses the default size.",
        defaultValue: "null",
        options: [
          "small",
          "large",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--icon-c",
        defaultValue: "inherit"
      }
    ],
    examples: [
      {
        name: "sandbox-icon",
        html: '<section>\n  <h4>Cloud-warning</h4>\n  <sh-icon [size]="size()" [color]="color()">cloud-warning</sh-icon>\n  <sh-icon [size]="size()" [color]="color()">cloud-warning-thin</sh-icon>\n  <sh-icon [size]="size()" [color]="color()">cloud-warning-light</sh-icon>\n  <sh-icon [size]="size()" [color]="color()">cloud-warning-fill</sh-icon>\n  <sh-icon [size]="size()" [color]="color()">cloud-warning-bold</sh-icon>\n</section>\n\n<section>\n  <h4>Warning</h4>\n  <sh-icon [size]="size()" [color]="color()">warning</sh-icon>\n  <sh-icon [size]="size()" [color]="color()">warning-thin</sh-icon>\n  <sh-icon [size]="size()" [color]="color()">warning-light</sh-icon>\n  <sh-icon [size]="size()" [color]="color()">warning-fill</sh-icon>\n  <sh-icon [size]="size()" [color]="color()">warning-bold</sh-icon>\n</section>\n\n<section>\n  <h4>Warning warning-octagon</h4>\n  <sh-icon [size]="size()" [color]="color()">warning-octagon</sh-icon>\n  <sh-icon [size]="size()" [color]="color()">warning-octagon-thin</sh-icon>\n  <sh-icon [size]="size()" [color]="color()">warning-octagon-light</sh-icon>\n  <sh-icon [size]="size()" [color]="color()">warning-octagon-fill</sh-icon>\n  <sh-icon [size]="size()" [color]="color()">warning-octagon-bold</sh-icon>\n</section>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipColor, ShipIconSize } from '@ship-ui/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-sandbox-icon',\n  imports: [ShipIcon],\n  templateUrl: './sandbox-icon.html',\n  styleUrl: './sandbox-icon.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SandboxIcon {\n  size = input<ShipIconSize>('');\n  sizeValue = input(10);\n  color = input<ShipColor>('');\n}\n"
      },
      {
        name: "basic-icon",
        html: "<sh-icon>heart</sh-icon>\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-basic-icon',\n  standalone: true,\n  imports: [ShipIcon],\n  templateUrl: './basic-icon.html',\n  styleUrl: './basic-icon.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicIcon {}\n"
      }
    ]
  },
  {
    name: "ShipTreeClosedIcon",
    selector: "sh-icon[closedIcon]",
    package: "@ship-ui/core/ship-tree",
    kind: "directive",
    path: "projects/ship-ui/ship-tree/ship-tree.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipTreeItemIcon",
    selector: "sh-icon[itemIcon]",
    package: "@ship-ui/core/ship-tree",
    kind: "directive",
    path: "projects/ship-ui/ship-tree/ship-tree.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipTreeOpenIcon",
    selector: "sh-icon[openIcon]",
    package: "@ship-ui/core/ship-tree",
    kind: "directive",
    path: "projects/ship-ui/ship-tree/ship-tree.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipKbd",
    selector: "sh-kbd",
    selectorAliases: [
      "[sh-kbd]"
    ],
    package: "@ship-ui/core/ship-kbd",
    kind: "component",
    path: "projects/ship-ui/ship-kbd/ship-kbd.ts",
    inputs: [
      {
        name: "meta",
        type: "boolean",
        description: "Show the Meta key (`\u2318` on Mac, `Win` otherwise).",
        defaultValue: "false"
      },
      {
        name: "shift",
        type: "boolean",
        description: "Show the Shift key (`\u21E7` on Mac, `Shift` otherwise).",
        defaultValue: "false"
      },
      {
        name: "alt",
        type: "boolean",
        description: "Show the Alt key (`\u2325` on Mac, `Alt` otherwise).",
        defaultValue: "false"
      },
      {
        name: "ctrl",
        type: "boolean",
        description: "Show the Control key (`\u2303` on Mac, `Ctrl` otherwise).",
        defaultValue: "false"
      },
      {
        name: "ctrlOrCmd",
        type: "boolean",
        description: "Show the platform command key: `\u2318` on Mac, `Ctrl` otherwise.",
        defaultValue: "false"
      },
      {
        name: "enter",
        type: "boolean",
        description: "Show the Enter key (`\u21B5` on Mac, `Enter` otherwise).",
        defaultValue: "false"
      },
      {
        name: "escape",
        type: "boolean",
        description: "Show the Escape key (`\u238B` on Mac, `Esc` otherwise).",
        defaultValue: "false"
      },
      {
        name: "backspace",
        type: "boolean",
        description: "Show the Backspace key (`\u232B` on Mac, `Backspace` otherwise).",
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--kbd-py",
        defaultValue: "var(--pad-y-1)"
      },
      {
        name: "--kbd-px",
        defaultValue: "var(--pad-x-1)"
      }
    ],
    examples: [
      {
        name: "basic-kbd",
        html: "<sh-kbd meta>K</sh-kbd>\n<sh-kbd shift alt>P</sh-kbd>\n<sh-kbd enter></sh-kbd>\n",
        ts: "import { Component } from '@angular/core';\nimport { ShipKbd } from '@ship-ui/core/ship-kbd';\n\n@Component({\n  selector: 'basic-kbd-example',\n  standalone: true,\n  imports: [ShipKbd],\n  templateUrl: './basic-kbd.html',\n  styleUrl: './basic-kbd.scss',\n})\nexport class BasicKbd {}\n"
      }
    ]
  },
  {
    name: "ShipList",
    selector: "sh-list",
    package: "@ship-ui/core/ship-list",
    kind: "component",
    path: "projects/ship-ui/ship-list/ship-list.ts",
    description: "### item\n\nAdd the\n`item`\nattribute to a child element of\n`sh-list`\nto make it a list item.\n\n### action\n\nAdd the\n`action`\nattribute to a child element of\n`sh-list`\nto make it an actionable item (e.g., clickable).\n\n### suffix\n\nAdd the\n`suffix`\nattribute to an element inside a list item to align it to the right.",
    inputs: [
      {
        name: "label",
        type: "string",
        description: "Accessible name for the list/listbox announced by screen readers.",
        defaultValue: "''"
      },
      {
        name: "listRole",
        type: "ShipListRole",
        description: "Semantic role of the list. The default `list` keeps projected content\nuntouched (today's static behavior). Set `listbox` to opt in to the\nselection-group behavior: `[(value)]` two-way binding, click/keyboard\nselection, roving focus, and `option`/`aria-selected` stamping on items\ncarrying a `value` attribute.",
        defaultValue: "'list'"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--list-collapsed-w",
        defaultValue: "#{p2r(68)}"
      },
      {
        name: "--list-collapsed-item",
        defaultValue: "#{p2r(44)}"
      },
      {
        name: "--list-s",
        defaultValue: "var(--shape-2)"
      },
      {
        name: "--list-bg-a",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--list-c",
        defaultValue: "var(--base-9)"
      },
      {
        name: "--list-bs-a",
        defaultValue: "none"
      },
      {
        name: "--list-item-b",
        defaultValue: "1px solid transparent"
      },
      {
        name: "--list-item-b-a",
        defaultValue: "1px solid var(--list-bg-a)"
      },
      {
        name: "--list-py",
        defaultValue: "var(--pad-y-5)"
      },
      {
        name: "--list-px",
        defaultValue: "var(--pad-x-4)"
      },
      {
        name: "--list-item-py",
        defaultValue: "var(--pad-y-3)"
      },
      {
        name: "--list-item-px",
        defaultValue: "var(--pad-x-3)"
      },
      {
        name: "--list-item-gap",
        defaultValue: "#{p2r(8)}"
      },
      {
        name: "--list-accent",
        defaultValue: "var(--base-12)"
      }
    ],
    examples: [
      {
        name: "list-sandbox",
        html: '<sh-list\n  listRole="listbox"\n  label="Workspace"\n  [(value)]="active"\n  [class]="[variant(), color()]"\n  [class.collapsed]="collapsed()"\n>\n  <h3 title>Workspace</h3>\n  <button value="dashboard">\n    <sh-icon>squares-four</sh-icon>\n    Dashboard\n    <span suffix>\u23181</span>\n  </button>\n  <button value="projects">\n    <sh-icon>folder</sh-icon>\n    Projects\n    <span suffix>\u23182</span>\n  </button>\n  <button value="reports">\n    <sh-icon>chart-bar</sh-icon>\n    Reports\n    <span suffix>\u23183</span>\n  </button>\n  <button value="settings">\n    <sh-icon>gear</sh-icon>\n    Settings\n    <span suffix>\u23184</span>\n  </button>\n</sh-list>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipList } from '@ship-ui/core/ship-list';\n\nexport type ListSandboxVariant = '' | 'base-1' | 'outlined' | 'type-b' | 'type-c';\nexport type ListSandboxColor = '' | 'primary' | 'accent' | 'warn' | 'error' | 'success';\n\n@Component({\n  selector: 'app-list-sandbox',\n  imports: [ShipList, ShipIcon],\n  templateUrl: './list-sandbox.html',\n  styleUrl: './list-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ListSandbox {\n  variant = input<ListSandboxVariant>('');\n  color = input<ListSandboxColor>('');\n  collapsed = input(false);\n\n  active = signal<string | null>('projects');\n}\n"
      },
      {
        name: "select-list-example",
        html: `<sh-list class="primary" listRole="listbox" label="Environment" closable [(value)]="environment">
  <h3 title>Deploy target</h3>
  <button value="development">
    <sh-icon>code</sh-icon>
    Development
  </button>
  <button value="staging">
    <sh-icon>flask</sh-icon>
    Staging
  </button>
  <button value="production">
    <sh-icon>rocket-launch</sh-icon>
    Production
  </button>
</sh-list>

<p class="selected-value">
  Selected:
  <code>{{ environment() ?? 'none' }}</code>
</p>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipList } from '@ship-ui/core/ship-list';\n\n@Component({\n  selector: 'app-select-list-example',\n  standalone: true,\n  imports: [ShipIcon, ShipList],\n  templateUrl: './select-list-example.html',\n  styleUrls: ['./select-list-example.scss'],\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SelectListExample {\n  environment = signal<string | null>('staging');\n}\n"
      },
      {
        name: "nav-list-example",
        html: `<sh-list class="type-c">
  @for (page of pages; track page.id) {
    <button type="button" (click)="opened.set(page.id)">
      <sh-icon>{{ page.icon }}</sh-icon>
      <span class="text-group">
        <span class="label">{{ page.title }}</span>
        <span class="description">{{ page.description }}</span>
      </span>
      <sh-icon suffix>caret-right</sh-icon>
    </button>
  }
</sh-list>

<p class="selected-value">
  Opened:
  <code>{{ opened() ?? 'none' }}</code>
</p>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipList } from '@ship-ui/core/ship-list';\n\n@Component({\n  selector: 'app-nav-list-example',\n  imports: [ShipList, ShipIcon],\n  templateUrl: './nav-list-example.html',\n  styleUrl: './nav-list-example.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class NavListExample {\n  pages = [\n    { id: 'general', title: 'General', description: 'Name, region and language.', icon: 'sliders' },\n    { id: 'team', title: 'Team', description: 'People and permissions.', icon: 'users' },\n    { id: 'billing', title: 'Billing', description: 'Plan, invoices and payment methods.', icon: 'credit-card' },\n  ];\n\n  opened = signal<string | null>(null);\n}\n"
      },
      {
        name: "swipe-list-example",
        html: '<span class="hint">\n  Swipe a row right to archive, left to delete \u2014 on desktop, use the buttons revealed by dragging on a touch screen.\n</span>\n\n<sh-list class="inbox">\n  @for (message of messages(); track message.id) {\n    <sh-list-item-swipe (swipeOpen)="onSwipeOpen($event, message)">\n      <button actionLeft class="swipe-action archive" (click)="archive(message)">\n        <sh-icon>tray-arrow-down</sh-icon>\n        Archive\n      </button>\n\n      <div class="row">\n        <div class="text">\n          <span class="from">{{ message.from }}</span>\n          <span class="subject">{{ message.subject }}</span>\n        </div>\n        <span class="time">{{ message.time }}</span>\n      </div>\n\n      <button actionRight class="swipe-action delete" (click)="remove(message)">\n        <sh-icon>trash</sh-icon>\n        Delete\n      </button>\n    </sh-list-item-swipe>\n  } @empty {\n    <div class="empty">Inbox zero \u{1F389}</div>\n  }\n</sh-list>\n\n<div class="status-row">\n  <span class="status">{{ lastAction() }}</span>\n  @if (messages().length < 4) {\n    <button class="reset" (click)="reset()">Reset</button>\n  }\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipList } from '@ship-ui/core/ship-list';\nimport { ShipListItemSwipe } from '@ship-ui/core/ship-list-item-swipe';\n\nconst MESSAGES = [\n  { id: 1, from: 'Nova Kim', subject: 'Design tokens are live', time: '09:12' },\n  { id: 2, from: 'Ravi Patel', subject: 'Sortable review notes', time: '10:47' },\n  { id: 3, from: 'Ida S\xF8rensen', subject: 'Lunch on Thursday?', time: '11:03' },\n  { id: 4, from: 'CI Bot', subject: 'main is green again', time: '12:30' },\n];\n\ntype Message = (typeof MESSAGES)[0];\n\n@Component({\n  selector: 'app-swipe-list-example',\n  standalone: true,\n  imports: [ShipList, ShipListItemSwipe, ShipIcon],\n  templateUrl: './swipe-list-example.html',\n  styleUrl: './swipe-list-example.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SwipeListExample {\n  messages = signal(MESSAGES);\n  lastAction = signal('');\n\n  onSwipeOpen(side: 'left' | 'right', message: Message) {\n    this.lastAction.set(`Opened ${side} on \"${message.subject}\"`);\n  }\n\n  archive(message: Message) {\n    this.messages.update((list) => list.filter((m) => m.id !== message.id));\n    this.lastAction.set(`Archived \"${message.subject}\"`);\n  }\n\n  remove(message: Message) {\n    this.messages.update((list) => list.filter((m) => m.id !== message.id));\n    this.lastAction.set(`Deleted \"${message.subject}\"`);\n  }\n\n  reset() {\n    this.messages.set(MESSAGES);\n    this.lastAction.set('');\n  }\n}\n"
      },
      {
        name: "todo-list-example",
        html: '<sh-list class="primary">\n  <h3 title>Today</h3>\n  @for (todo of todos(); track todo.id) {\n    <button (click)="toggle(todo.id)" [class.done]="todo.done">\n      <sh-checkbox class="primary" [label]="todo.title">\n        <input type="checkbox" [ngModel]="todo.done" />\n      </sh-checkbox>\n      <span class="title">{{ todo.title }}</span>\n    </button>\n  }\n</sh-list>\n\n<p class="selected-value">\n  Completed:\n  <code>{{ doneCount() }}/{{ todos().length }}</code>\n</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipCheckbox } from '@ship-ui/core/ship-checkbox';\nimport { ShipList } from '@ship-ui/core/ship-list';\n\ninterface Todo {\n  id: number;\n  title: string;\n  done: boolean;\n}\n\n@Component({\n  selector: 'app-todo-list-example',\n  standalone: true,\n  imports: [FormsModule, ShipCheckbox, ShipList],\n  templateUrl: './todo-list-example.html',\n  styleUrls: ['./todo-list-example.scss'],\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TodoListExample {\n  todos = signal<Todo[]>([\n    { id: 1, title: 'Review sidenav PR', done: true },\n    { id: 2, title: 'Collapse sh-list to icon rail', done: true },\n    { id: 3, title: 'Write listbox docs', done: false },\n    { id: 4, title: 'Ship 0.26.0', done: false },\n  ]);\n\n  doneCount = computed(() => this.todos().filter((todo) => todo.done).length);\n\n  toggle(id: number) {\n    this.todos.update((todos) => todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));\n  }\n}\n"
      },
      {
        name: "collapsed-list-example",
        html: `<button shButton class="simple" (click)="collapsed.set(!collapsed())">
  <sh-icon>list</sh-icon>
  {{ collapsed() ? 'Expand' : 'Collapse' }}
</button>

<sh-list class="primary" listRole="listbox" label="Navigation" [(value)]="active" [class.collapsed]="collapsed()">
  <h3 title>Workspace</h3>
  <a value="dashboard">
    <sh-icon>squares-four</sh-icon>
    Dashboard
    <span suffix>\u23181</span>
  </a>
  <a value="projects">
    <sh-icon>folder</sh-icon>
    Projects
    <span suffix>\u23182</span>
  </a>
  <a value="reports">
    <sh-icon>chart-bar</sh-icon>
    Reports
    <span suffix>\u23183</span>
  </a>
  <a value="settings">
    <sh-icon>gear</sh-icon>
    Settings
    <span suffix>\u23184</span>
  </a>
</sh-list>

<p class="selected-value">
  Selected:
  <code>{{ active() ?? 'none' }}</code>
</p>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipList } from '@ship-ui/core/ship-list';\n\n@Component({\n  selector: 'app-collapsed-list-example',\n  standalone: true,\n  imports: [ShipButton, ShipIcon, ShipList],\n  templateUrl: './collapsed-list-example.html',\n  styleUrls: ['./collapsed-list-example.scss'],\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class CollapsedListExample {\n  collapsed = signal(false);\n  active = signal<string | null>('dashboard');\n}\n"
      },
      {
        name: "base-list-example",
        html: '<sh-list class="primary">\n  <h3 title>Basic</h3>\n  <div>\n    <sh-icon>circle</sh-icon>\n    Simple item\n    <span suffix>\u2318O</span>\n  </div>\n  <div>\n    <sh-icon>circle</sh-icon>\n    Another simple item\n    <span suffix>\u2318O</span>\n  </div>\n  <!-- action opts a non-native element in to interactive affordances -->\n  <div action [class.active]="active()" (click)="active.set(!active())">\n    <sh-icon>circle</sh-icon>\n    Actionable item\n    <span suffix>\u2318O</span>\n  </div>\n  <div (click)="checkbox1.setValue(!checkbox1.value)">\n    <sh-icon>circle</sh-icon>\n    Checkbox item with reactive form control\n    <sh-checkbox suffix label="Checkbox item with reactive form control">\n      <input type="checkbox" [formControl]="checkbox1" />\n    </sh-checkbox>\n  </div>\n  <div (click)="checkbox2.set(!checkbox2())">\n    <sh-checkbox label="Checkbox item with ngModel">\n      <input type="checkbox" [ngModel]="checkbox2()" />\n    </sh-checkbox>\n    Checkbox item with ngModel\n  </div>\n</sh-list>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';\nimport { ShipCheckbox } from '@ship-ui/core/ship-checkbox';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipList } from '@ship-ui/core/ship-list';\n\n@Component({\n  selector: 'base-list-example',\n  standalone: true,\n  imports: [FormsModule, ReactiveFormsModule, ShipList, ShipIcon, ShipCheckbox],\n  templateUrl: './base-list-example.html',\n  styleUrls: ['./base-list-example.scss'],\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseListExample {\n  active = signal(false);\n  checkbox1 = new FormControl(false);\n  checkbox2 = signal(false);\n}\n"
      },
      {
        name: "basic-list",
        html: "<sh-list>\n  <div>Simple item</div>\n  <div>Another simple item</div>\n</sh-list>\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipList } from '@ship-ui/core/ship-list';\n\n@Component({\n  selector: 'app-basic-list',\n  standalone: true,\n  imports: [ShipList],\n  templateUrl: './basic-list.html',\n  styleUrl: './basic-list.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicList {}\n"
      }
    ]
  },
  {
    name: "ShipListItemSwipe",
    selector: "sh-list-item-swipe",
    package: "@ship-ui/core/ship-list-item-swipe",
    kind: "component",
    path: "projects/ship-ui/ship-list-item-swipe/ship-list-item-swipe.ts",
    inputs: [
      {
        name: "swipeThreshold",
        type: "number",
        description: "Fraction of the actions' width (0-1) the item must be dragged past to snap open on release.",
        defaultValue: "0.3"
      }
    ],
    outputs: [
      {
        name: "swipeOpen",
        type: "'left' | 'right'",
        description: "Emits the side (`'left'` or `'right'`) when the item snaps open."
      },
      {
        name: "swipeClose",
        type: "void",
        description: "Emits when the item returns to its closed position."
      }
    ],
    methods: [
      {
        name: "open",
        parameters: "side: 'left' | 'right'",
        returnType: "void",
        description: "Animates the item open to reveal the actions on the given `side` and emits `swipeOpen`."
      },
      {
        name: "close",
        parameters: "",
        returnType: "void",
        description: "Animates the item back to its closed position and emits `swipeClose` if it was open."
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipLayoutAchievement",
    selector: "sh-lo-achievement",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-achievement.ts",
    description: 'Achievement / badge card. Mix and match the parts: a medallion (`sh-icon`,\n`img`, `sh-avatar` or anything marked `[media]`), `h3` (title), `p`\n(description), `sh-chip`/`[tag]` (rarity, level \u2026) and `small`/`[meta]`\n("Unlocked Sep 12", "3 of 5"). `color` tints the medallion and glow;\nfor any other color set `dynamic` and the `--achievement-c` CSS variable\n(like `sh-chip`). `locked` greys it out and shows a lock.',
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "Medallion and glow color (`ShipColor`); defaults to primary.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "dynamic",
        type: "boolean | undefined",
        description: "Use an arbitrary color from the `--achievement-c` CSS variable instead of a `ShipColor`.",
        defaultValue: "undefined"
      },
      {
        name: "locked",
        type: "boolean",
        description: "Not earned yet: greys the medallion out and shows a lock.",
        defaultValue: "false"
      },
      {
        name: "variant",
        type: "ShipLayoutAchievementVariant | null",
        description: "Visual variant: `type-b` horizontal row (medallion beside the text), `type-c` compact pill. Project default via `ShipConfig.layoutAchievement.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--ach-c",
        defaultValue: "var(--primary-8)"
      },
      {
        name: "--ach-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--ach-py",
        defaultValue: "var(--pad-y-6)"
      },
      {
        name: "--ach-px",
        defaultValue: "var(--pad-x-6)"
      },
      {
        name: "--ach-s",
        defaultValue: "var(--shape-3)"
      },
      {
        name: "--ach-size",
        defaultValue: "#{p2r(72)}"
      },
      {
        name: "--ach-icon",
        defaultValue: "#{p2r(32)}"
      }
    ],
    examples: [
      {
        name: "achievement-sandbox",
        html: `<sh-lo-achievement
  [variant]="variant()"
  [color]="dynamicColor() ? null : color()"
  [dynamic]="!!dynamicColor()"
  [style.--achievement-c]="dynamicColor() || null">
  @if (media() === 'image') {
    <img src="/examples/achievement-badge.svg" alt="" />
  } @else {
    <sh-icon>rocket-launch</sh-icon>
  }
  <h3>First deploy</h3>
  <sh-chip size="small" variant="simple">Common</sh-chip>
  <p>Shipped your first build to production.</p>
  <small>Unlocked Sep 12, 2026</small>
</sh-lo-achievement>

<sh-lo-achievement
  [variant]="variant()"
  [color]="dynamicColor() ? null : color()"
  [dynamic]="!!dynamicColor()"
  [style.--achievement-c]="dynamicColor() || null">
  @if (media() === 'image') {
    <img src="/examples/achievement-badge.svg" alt="" />
  } @else {
    <sh-icon>fire</sh-icon>
  }
  <h3>On fire</h3>
  <sh-chip size="small" variant="simple" color="primary">Rare</sh-chip>
  <p>Deployed every day for 30 days in a row.</p>
  <small>Unlocked Sep 24, 2026</small>
</sh-lo-achievement>

<sh-lo-achievement
  [variant]="variant()"
  [color]="dynamicColor() ? null : color()"
  [dynamic]="!!dynamicColor()"
  [style.--achievement-c]="dynamicColor() || null"
  [locked]="locked()">
  @if (media() === 'image') {
    <img src="/examples/achievement-badge.svg" alt="" />
  } @else {
    <sh-icon>crown</sh-icon>
  }
  <h3>Ship captain</h3>
  <sh-chip size="small" variant="simple" color="warn">Legendary</sh-chip>
  <p>Led 10 releases without a rollback.</p>
  <small>{{ locked() ? '7 of 10 releases' : 'Unlocked Sep 28, 2026' }}</small>
</sh-lo-achievement>
`,
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipColor, ShipLayoutAchievementVariant } from '@ship-ui/core';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutAchievement } from '@ship-ui/core/ship-layout';\n\n@Component({\n  selector: 'app-achievement-sandbox',\n  imports: [ShipLayoutAchievement, ShipChip, ShipIcon],\n  templateUrl: './achievement-sandbox.html',\n  styleUrl: '../sandbox.scss',\n  host: { class: 'stats' },\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class AchievementSandbox {\n  variant = input<ShipLayoutAchievementVariant>('');\n  color = input<ShipColor>('primary');\n  media = input<'icon' | 'image'>('icon');\n  locked = input(true);\n  /** Any CSS color; when set it overrides `color` through the dynamic mode. */\n  dynamicColor = input<string | null | undefined>(null);\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutDetail",
    selector: "sh-lo-detail",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-details.ts",
    description: "One row of `sh-lo-details`: `dt`/`[term]` then the value (anything else).",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: [
      {
        name: "page-sandbox",
        html: '<sh-lo-page [variant]="variant()" [size]="size()">\n  <nav>\n    <a href="#">Projects</a>\n    <sh-icon size="small">caret-right</sh-icon>\n    <span>Website redesign</span>\n  </nav>\n  <h1>Website redesign</h1>\n  <p>Kicked off March 3rd. Ships when it ships.</p>\n  <button actions shButton variant="outlined">Share</button>\n  <button actions shButton variant="raised" color="primary">Edit</button>\n\n  <sh-tabs color="primary" [(value)]="tab">\n    <button value="overview">Overview</button>\n    <button value="tasks">Tasks</button>\n    <button value="files">Files</button>\n  </sh-tabs>\n\n  <div class="stats">\n    <sh-lo-stat>\n      <sh-icon>check-circle</sh-icon>\n      <p>Tasks done</p>\n      <h3>42</h3>\n      <sh-chip size="small" variant="raised" color="success">+8 this week</sh-chip>\n    </sh-lo-stat>\n    <sh-lo-stat>\n      <sh-icon>clock</sh-icon>\n      <p>Hours logged</p>\n      <h3>318</h3>\n      <sh-chip size="small" variant="raised" color="primary">on track</sh-chip>\n    </sh-lo-stat>\n    <sh-lo-stat>\n      <sh-icon>calendar</sh-icon>\n      <p>Days left</p>\n      <h3>19</h3>\n    </sh-lo-stat>\n  </div>\n\n  <sh-lo-section>\n    <h2>Recent activity</h2>\n    <p>What the team shipped over the last few days.</p>\n    <button actions shButton size="small" variant="outlined">View all</button>\n\n    <sh-card>\n      <sh-lo-timeline>\n        <sh-lo-timeline-item>\n          <sh-icon>git-merge</sh-icon>\n          <b>Header redesign merged</b>\n          <time>2 hours ago</time>\n        </sh-lo-timeline-item>\n        <sh-lo-timeline-item>\n          <sh-icon>check</sh-icon>\n          <b>Pricing page copy approved</b>\n          <time>Yesterday</time>\n          <p>Signed off by marketing, ready for build.</p>\n        </sh-lo-timeline-item>\n        <sh-lo-timeline-item>\n          <sh-icon>arrows-clockwise</sh-icon>\n          <b>Design tokens synced from Figma</b>\n          <time>3 days ago</time>\n        </sh-lo-timeline-item>\n      </sh-lo-timeline>\n    </sh-card>\n  </sh-lo-section>\n\n  <sh-card aside>\n    <sh-lo-details>\n      <h3>Details</h3>\n      <sh-lo-detail>\n        <dt>Status</dt>\n        <sh-chip size="small" variant="raised" color="primary">In progress</sh-chip>\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Owner</dt>\n        Sofia Lund\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Due</dt>\n        Oct 17, 2026\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Team</dt>\n        Web platform\n      </sh-lo-detail>\n    </sh-lo-details>\n  </sh-card>\n</sh-lo-page>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipLayoutPageSize, ShipLayoutPageVariant } from '@ship-ui/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport {\n  ShipLayoutDetail,\n  ShipLayoutDetails,\n  ShipLayoutPage,\n  ShipLayoutSection,\n  ShipLayoutStat,\n  ShipLayoutTimeline,\n  ShipLayoutTimelineItem,\n} from '@ship-ui/core/ship-layout';\nimport { ShipTabs } from '@ship-ui/core/ship-tabs';\n\n@Component({\n  selector: 'app-page-sandbox',\n  imports: [\n    ShipLayoutPage,\n    ShipLayoutSection,\n    ShipLayoutStat,\n    ShipLayoutDetails,\n    ShipLayoutDetail,\n    ShipLayoutTimeline,\n    ShipLayoutTimelineItem,\n    ShipTabs,\n    ShipCard,\n    ShipChip,\n    ShipButton,\n    ShipIcon,\n  ],\n  templateUrl: './page-sandbox.html',\n  styleUrl: './page-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class PageSandbox {\n  variant = input<ShipLayoutPageVariant>('');\n  size = input<ShipLayoutPageSize>('');\n  tab = signal('overview');\n}\n"
      },
      {
        name: "details-sandbox",
        html: '<sh-card>\n  <sh-lo-details [variant]="variant()">\n    <h3>Invoice #1042</h3>\n    <button actions shButton size="small" variant="outlined">Edit</button>\n\n    <sh-lo-detail>\n      <dt>Status</dt>\n      <sh-chip size="small" variant="raised" color="success">Paid</sh-chip>\n    </sh-lo-detail>\n    <sh-lo-detail>\n      <dt>Customer</dt>\n      Acme Inc.\n    </sh-lo-detail>\n    <sh-lo-detail>\n      <dt>Amount</dt>\n      $1,250.00\n    </sh-lo-detail>\n    <sh-lo-detail>\n      <dt>Issued</dt>\n      Sep 12, 2026\n    </sh-lo-detail>\n    <sh-lo-detail>\n      <dt>Due</dt>\n      Oct 12, 2026\n    </sh-lo-detail>\n  </sh-lo-details>\n</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipLayoutDetailsVariant } from '@ship-ui/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipLayoutDetail, ShipLayoutDetails } from '@ship-ui/core/ship-layout';\n\n@Component({\n  selector: 'app-details-sandbox',\n  imports: [ShipLayoutDetails, ShipLayoutDetail, ShipCard, ShipButton, ShipChip],\n  templateUrl: './details-sandbox.html',\n  styleUrl: '../sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DetailsSandbox {\n  variant = input<ShipLayoutDetailsVariant>('');\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutDetails",
    selector: "sh-lo-details",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-details.ts",
    description: 'Key/value list ("Details" panel). Slot an `h3` and `[actions]` for the\nheader, then one `sh-lo-detail` per row.',
    inputs: [
      {
        name: "variant",
        type: "ShipLayoutDetailsVariant | null",
        description: "Visual variant: `type-b` stacked pairs in a grid, `type-c` compact inline pairs. Project default via `ShipConfig.layoutDetails.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--details-gap",
        defaultValue: "var(--space-3)"
      },
      {
        name: "--details-term-w",
        defaultValue: "#{p2r(160)}"
      },
      {
        name: "--details-term-c",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--details-cols",
        defaultValue: "#{p2r(160)}"
      }
    ],
    examples: [
      {
        name: "page-sandbox",
        html: '<sh-lo-page [variant]="variant()" [size]="size()">\n  <nav>\n    <a href="#">Projects</a>\n    <sh-icon size="small">caret-right</sh-icon>\n    <span>Website redesign</span>\n  </nav>\n  <h1>Website redesign</h1>\n  <p>Kicked off March 3rd. Ships when it ships.</p>\n  <button actions shButton variant="outlined">Share</button>\n  <button actions shButton variant="raised" color="primary">Edit</button>\n\n  <sh-tabs color="primary" [(value)]="tab">\n    <button value="overview">Overview</button>\n    <button value="tasks">Tasks</button>\n    <button value="files">Files</button>\n  </sh-tabs>\n\n  <div class="stats">\n    <sh-lo-stat>\n      <sh-icon>check-circle</sh-icon>\n      <p>Tasks done</p>\n      <h3>42</h3>\n      <sh-chip size="small" variant="raised" color="success">+8 this week</sh-chip>\n    </sh-lo-stat>\n    <sh-lo-stat>\n      <sh-icon>clock</sh-icon>\n      <p>Hours logged</p>\n      <h3>318</h3>\n      <sh-chip size="small" variant="raised" color="primary">on track</sh-chip>\n    </sh-lo-stat>\n    <sh-lo-stat>\n      <sh-icon>calendar</sh-icon>\n      <p>Days left</p>\n      <h3>19</h3>\n    </sh-lo-stat>\n  </div>\n\n  <sh-lo-section>\n    <h2>Recent activity</h2>\n    <p>What the team shipped over the last few days.</p>\n    <button actions shButton size="small" variant="outlined">View all</button>\n\n    <sh-card>\n      <sh-lo-timeline>\n        <sh-lo-timeline-item>\n          <sh-icon>git-merge</sh-icon>\n          <b>Header redesign merged</b>\n          <time>2 hours ago</time>\n        </sh-lo-timeline-item>\n        <sh-lo-timeline-item>\n          <sh-icon>check</sh-icon>\n          <b>Pricing page copy approved</b>\n          <time>Yesterday</time>\n          <p>Signed off by marketing, ready for build.</p>\n        </sh-lo-timeline-item>\n        <sh-lo-timeline-item>\n          <sh-icon>arrows-clockwise</sh-icon>\n          <b>Design tokens synced from Figma</b>\n          <time>3 days ago</time>\n        </sh-lo-timeline-item>\n      </sh-lo-timeline>\n    </sh-card>\n  </sh-lo-section>\n\n  <sh-card aside>\n    <sh-lo-details>\n      <h3>Details</h3>\n      <sh-lo-detail>\n        <dt>Status</dt>\n        <sh-chip size="small" variant="raised" color="primary">In progress</sh-chip>\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Owner</dt>\n        Sofia Lund\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Due</dt>\n        Oct 17, 2026\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Team</dt>\n        Web platform\n      </sh-lo-detail>\n    </sh-lo-details>\n  </sh-card>\n</sh-lo-page>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipLayoutPageSize, ShipLayoutPageVariant } from '@ship-ui/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport {\n  ShipLayoutDetail,\n  ShipLayoutDetails,\n  ShipLayoutPage,\n  ShipLayoutSection,\n  ShipLayoutStat,\n  ShipLayoutTimeline,\n  ShipLayoutTimelineItem,\n} from '@ship-ui/core/ship-layout';\nimport { ShipTabs } from '@ship-ui/core/ship-tabs';\n\n@Component({\n  selector: 'app-page-sandbox',\n  imports: [\n    ShipLayoutPage,\n    ShipLayoutSection,\n    ShipLayoutStat,\n    ShipLayoutDetails,\n    ShipLayoutDetail,\n    ShipLayoutTimeline,\n    ShipLayoutTimelineItem,\n    ShipTabs,\n    ShipCard,\n    ShipChip,\n    ShipButton,\n    ShipIcon,\n  ],\n  templateUrl: './page-sandbox.html',\n  styleUrl: './page-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class PageSandbox {\n  variant = input<ShipLayoutPageVariant>('');\n  size = input<ShipLayoutPageSize>('');\n  tab = signal('overview');\n}\n"
      },
      {
        name: "details-sandbox",
        html: '<sh-card>\n  <sh-lo-details [variant]="variant()">\n    <h3>Invoice #1042</h3>\n    <button actions shButton size="small" variant="outlined">Edit</button>\n\n    <sh-lo-detail>\n      <dt>Status</dt>\n      <sh-chip size="small" variant="raised" color="success">Paid</sh-chip>\n    </sh-lo-detail>\n    <sh-lo-detail>\n      <dt>Customer</dt>\n      Acme Inc.\n    </sh-lo-detail>\n    <sh-lo-detail>\n      <dt>Amount</dt>\n      $1,250.00\n    </sh-lo-detail>\n    <sh-lo-detail>\n      <dt>Issued</dt>\n      Sep 12, 2026\n    </sh-lo-detail>\n    <sh-lo-detail>\n      <dt>Due</dt>\n      Oct 12, 2026\n    </sh-lo-detail>\n  </sh-lo-details>\n</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipLayoutDetailsVariant } from '@ship-ui/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipLayoutDetail, ShipLayoutDetails } from '@ship-ui/core/ship-layout';\n\n@Component({\n  selector: 'app-details-sandbox',\n  imports: [ShipLayoutDetails, ShipLayoutDetail, ShipCard, ShipButton, ShipChip],\n  templateUrl: './details-sandbox.html',\n  styleUrl: '../sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DetailsSandbox {\n  variant = input<ShipLayoutDetailsVariant>('');\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutEmptyState",
    selector: "sh-lo-empty-state",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-empty-state.ts",
    description: 'Centered "nothing here yet" layout for empty lists, tables and pages:\n`sh-icon`, `h2`/`h3`, `p` and `[actions]`/`button`s, in that order.',
    inputs: [
      {
        name: "variant",
        type: "ShipLayoutEmptyStateVariant | null",
        description: "Visual variant (`type-b`, `type-c`, or default). Project default via `ShipConfig.layoutEmptyState.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--empty-py",
        defaultValue: "var(--pad-y-8)"
      },
      {
        name: "--empty-px",
        defaultValue: "var(--pad-x-6)"
      },
      {
        name: "--empty-gap",
        defaultValue: "var(--space-4)"
      },
      {
        name: "--empty-mw",
        defaultValue: "#{p2r(400)}"
      },
      {
        name: "--empty-ic",
        defaultValue: "var(--base-7)"
      },
      {
        name: "--empty-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--empty-s",
        defaultValue: "var(--shape-3)"
      }
    ],
    examples: [
      {
        name: "empty-state-sandbox",
        html: '<sh-card>\n  <sh-lo-empty-state [variant]="variant()">\n    <sh-icon>folder-dashed</sh-icon>\n    <h3>No projects yet</h3>\n    <p>Projects group your reports, dashboards and teammates. Create the first one to get started.</p>\n    <button shButton variant="outlined">Import</button>\n    <button shButton variant="raised" color="primary">\n      <sh-icon>plus</sh-icon>\n      New project\n    </button>\n  </sh-lo-empty-state>\n</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipLayoutEmptyStateVariant } from '@ship-ui/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutEmptyState } from '@ship-ui/core/ship-layout';\n\n@Component({\n  selector: 'app-empty-state-sandbox',\n  imports: [ShipLayoutEmptyState, ShipCard, ShipButton, ShipIcon],\n  templateUrl: './empty-state-sandbox.html',\n  styleUrl: '../sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class EmptyStateSandbox {\n  variant = input<ShipLayoutEmptyStateVariant>('');\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutInbox",
    selector: "sh-lo-inbox",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-inbox.ts",
    description: "Full-page mail client shell. Slots: `[folders]` (the left column: compose\nbutton, folder links), `sh-lo-toolbar` (bulk actions above the list),\n`sh-lo-inbox-item`s (the message list) and an optional `[reader]` pane on\nthe right. With a reader open the list switches to two-line rows; on narrow\nscreens the reader replaces the list and the folders column is hidden.\nGive it a height (it fills its parent) so the list scrolls on its own.",
    inputs: [
      {
        name: "variant",
        type: "ShipLayoutInboxVariant | null",
        description: "Visual variant: `type-b` list and reader as separate cards, `type-c` compact single-line rows without avatars. Project default via `ShipConfig.layoutInbox.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--inbox-folders-w",
        defaultValue: "#{p2r(220)}"
      },
      {
        name: "--inbox-reader-w",
        defaultValue: "minmax(0, 1.3fr)"
      },
      {
        name: "--inbox-gap",
        defaultValue: "var(--space-4)"
      },
      {
        name: "--inbox-row-h",
        defaultValue: "#{p2r(44)}"
      },
      {
        name: "--inbox-c",
        defaultValue: "var(--primary-8)"
      }
    ],
    examples: [
      {
        name: "inbox-sandbox",
        html: `<sh-lo-inbox [variant]="variant()">
  <nav folders>
    <button shButton variant="raised" color="primary">
      <sh-icon>pencil-simple</sh-icon>
      Compose
    </button>
    <button class="active">
      <sh-icon>tray</sh-icon>
      Inbox
      <span count>{{ unreadCount() }}</span>
    </button>
    <button>
      <sh-icon>star</sh-icon>
      Starred
    </button>
    <button>
      <sh-icon>clock</sh-icon>
      Snoozed
    </button>
    <button>
      <sh-icon>paper-plane-tilt</sh-icon>
      Sent
    </button>
    <button>
      <sh-icon>file-dashed</sh-icon>
      Drafts
      <span count>2</span>
    </button>
  </nav>

  <sh-lo-toolbar variant="type-c">
    <sh-checkbox label="Select all" />
    <button shButton shTooltip="Archive">
      <sh-icon>archive</sh-icon>
    </button>
    <button shButton shTooltip="Delete">
      <sh-icon>trash</sh-icon>
    </button>
    <button shButton shTooltip="Mark as read">
      <sh-icon>envelope-open</sh-icon>
    </button>
    <ng-container end>
      <span>1\u2013{{ mails.length }} of {{ mails.length }}</span>
    </ng-container>
  </sh-lo-toolbar>

  @for (mail of mails; track mail.id) {
    <sh-lo-inbox-item
      [unread]="mail.unread"
      [selected]="readingPane() && openId() === mail.id"
      (click)="openId.set(mail.id)">
      <sh-checkbox [label]="'Select ' + mail.subject" (click)="$event.stopPropagation()" />
      @if (mail.starred) {
        <sh-icon star>star-fill</sh-icon>
      } @else {
        <sh-icon star class="not-starred">star</sh-icon>
      }
      <sh-avatar [name]="mail.from" />
      <span from>{{ mail.from }}</span>
      <h4>{{ mail.subject }}</h4>
      <p>{{ mail.snippet }}</p>
      @if (mail.label) {
        <sh-chip size="small" variant="simple" [color]="mail.labelColor ?? null">{{ mail.label }}</sh-chip>
      }
      <time>{{ mail.time }}</time>
    </sh-lo-inbox-item>
  }

  @if (readingPane() && openMail(); as mail) {
    <article reader class="reader">
      <header>
        <h2>{{ mail.subject }}</h2>
        <button shButton shTooltip="Close" (click)="openId.set(null)">
          <sh-icon>x-circle</sh-icon>
        </button>
      </header>
      <div class="sender">
        <sh-avatar [name]="mail.from" />
        <div>
          <b>{{ mail.from }}</b>
          <small>to me \xB7 {{ mail.time }}</small>
        </div>
      </div>
      <p>{{ mail.snippet }}</p>
      <p>Let me know what you think when you have a minute.</p>
      <div class="reply">
        <button shButton variant="outlined">
          <sh-icon>arrow-bend-up-left</sh-icon>
          Reply
        </button>
        <button shButton variant="outlined">
          <sh-icon>arrow-bend-up-right</sh-icon>
          Forward
        </button>
      </div>
    </article>
  }
</sh-lo-inbox>
`,
        ts: "import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';\nimport { ShipColor, ShipLayoutInboxVariant } from '@ship-ui/core';\nimport { ShipAvatar } from '@ship-ui/core/ship-avatar';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCheckbox } from '@ship-ui/core/ship-checkbox';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutInbox, ShipLayoutInboxItem, ShipLayoutToolbar } from '@ship-ui/core/ship-layout';\nimport { ShipTooltip } from '@ship-ui/core/ship-tooltip';\n\ninterface Mail {\n  id: number;\n  from: string;\n  subject: string;\n  snippet: string;\n  time: string;\n  unread: boolean;\n  starred: boolean;\n  label?: string;\n  labelColor?: ShipColor;\n}\n\n@Component({\n  selector: 'app-inbox-sandbox',\n  imports: [\n    ShipLayoutInbox,\n    ShipLayoutInboxItem,\n    ShipLayoutToolbar,\n    ShipAvatar,\n    ShipButton,\n    ShipCheckbox,\n    ShipChip,\n    ShipIcon,\n    ShipTooltip,\n  ],\n  templateUrl: './inbox-sandbox.html',\n  styleUrl: './inbox-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InboxSandbox {\n  variant = input<ShipLayoutInboxVariant>('');\n  readingPane = input(true);\n\n  openId = signal<number | null>(1);\n  openMail = computed(() => this.mails.find((mail) => mail.id === this.openId()) ?? null);\n  unreadCount = computed(() => this.mails.filter((mail) => mail.unread).length);\n\n  mails: Mail[] = [\n    {\n      id: 1,\n      from: 'Sofia Lund',\n      subject: 'Design review moved to Thursday',\n      snippet: 'Hey! The design review got pushed to Thursday 14:00, the new header mocks are in Figma.',\n      time: '10:42',\n      unread: true,\n      starred: true,\n      label: 'Work',\n      labelColor: 'primary',\n    },\n    {\n      id: 2,\n      from: 'GitHub',\n      subject: '[ship-ui] PR #412 was merged',\n      snippet: 'feat(ship-layout): stat ring and ranking components merged into main by sp90.',\n      time: '09:15',\n      unread: true,\n      starred: false,\n    },\n    {\n      id: 3,\n      from: 'Mads Holm',\n      subject: 'Pricing page copy',\n      snippet: 'Attached the final copy for the pricing page, marketing signed off this morning.',\n      time: 'Yesterday',\n      unread: false,\n      starred: true,\n      label: 'Marketing',\n      labelColor: 'accent',\n    },\n    {\n      id: 4,\n      from: 'Vercel',\n      subject: 'Deployment ready',\n      snippet: 'Your deployment of ship-docs is live at docs.shipui.com. Build took 48s.',\n      time: 'Yesterday',\n      unread: false,\n      starred: false,\n    },\n    {\n      id: 5,\n      from: 'Freja Berg',\n      subject: 'Lunch on Friday?',\n      snippet: 'Thinking the new ramen place around the corner, 12:30 works for everyone?',\n      time: 'Sep 26',\n      unread: false,\n      starred: false,\n      label: 'Personal',\n      labelColor: 'success',\n    },\n    {\n      id: 6,\n      from: 'Stripe',\n      subject: 'Your September invoice',\n      snippet: 'Your invoice for September is available. Amount due: $49.00.',\n      time: 'Sep 25',\n      unread: false,\n      starred: false,\n    },\n    {\n      id: 7,\n      from: 'Jonas Krog',\n      subject: 'Re: Accessibility audit',\n      snippet: 'Found three focus-order issues on the settings page, notes are in the ticket.',\n      time: 'Sep 24',\n      unread: false,\n      starred: false,\n      label: 'Work',\n      labelColor: 'primary',\n    },\n  ];\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutInboxItem",
    selector: "sh-lo-inbox-item",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-inbox.ts",
    description: "One message row of `sh-lo-inbox`. Slots: `sh-checkbox`, `sh-avatar`,\n`[from]` (sender), `h4`/`[subject]`, `p` (snippet), `sh-chip`/`[labels]`,\n`time` and `[star]`. Set `unread` for bold text and an accent bar, and\n`selected` for the open/checked state.",
    inputs: [
      {
        name: "unread",
        type: "boolean",
        description: "Not read yet: bold sender and subject plus an accent bar.",
        defaultValue: "false"
      },
      {
        name: "selected",
        type: "boolean",
        description: "Open in the reader or checked.",
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: [
      {
        name: "inbox-sandbox",
        html: `<sh-lo-inbox [variant]="variant()">
  <nav folders>
    <button shButton variant="raised" color="primary">
      <sh-icon>pencil-simple</sh-icon>
      Compose
    </button>
    <button class="active">
      <sh-icon>tray</sh-icon>
      Inbox
      <span count>{{ unreadCount() }}</span>
    </button>
    <button>
      <sh-icon>star</sh-icon>
      Starred
    </button>
    <button>
      <sh-icon>clock</sh-icon>
      Snoozed
    </button>
    <button>
      <sh-icon>paper-plane-tilt</sh-icon>
      Sent
    </button>
    <button>
      <sh-icon>file-dashed</sh-icon>
      Drafts
      <span count>2</span>
    </button>
  </nav>

  <sh-lo-toolbar variant="type-c">
    <sh-checkbox label="Select all" />
    <button shButton shTooltip="Archive">
      <sh-icon>archive</sh-icon>
    </button>
    <button shButton shTooltip="Delete">
      <sh-icon>trash</sh-icon>
    </button>
    <button shButton shTooltip="Mark as read">
      <sh-icon>envelope-open</sh-icon>
    </button>
    <ng-container end>
      <span>1\u2013{{ mails.length }} of {{ mails.length }}</span>
    </ng-container>
  </sh-lo-toolbar>

  @for (mail of mails; track mail.id) {
    <sh-lo-inbox-item
      [unread]="mail.unread"
      [selected]="readingPane() && openId() === mail.id"
      (click)="openId.set(mail.id)">
      <sh-checkbox [label]="'Select ' + mail.subject" (click)="$event.stopPropagation()" />
      @if (mail.starred) {
        <sh-icon star>star-fill</sh-icon>
      } @else {
        <sh-icon star class="not-starred">star</sh-icon>
      }
      <sh-avatar [name]="mail.from" />
      <span from>{{ mail.from }}</span>
      <h4>{{ mail.subject }}</h4>
      <p>{{ mail.snippet }}</p>
      @if (mail.label) {
        <sh-chip size="small" variant="simple" [color]="mail.labelColor ?? null">{{ mail.label }}</sh-chip>
      }
      <time>{{ mail.time }}</time>
    </sh-lo-inbox-item>
  }

  @if (readingPane() && openMail(); as mail) {
    <article reader class="reader">
      <header>
        <h2>{{ mail.subject }}</h2>
        <button shButton shTooltip="Close" (click)="openId.set(null)">
          <sh-icon>x-circle</sh-icon>
        </button>
      </header>
      <div class="sender">
        <sh-avatar [name]="mail.from" />
        <div>
          <b>{{ mail.from }}</b>
          <small>to me \xB7 {{ mail.time }}</small>
        </div>
      </div>
      <p>{{ mail.snippet }}</p>
      <p>Let me know what you think when you have a minute.</p>
      <div class="reply">
        <button shButton variant="outlined">
          <sh-icon>arrow-bend-up-left</sh-icon>
          Reply
        </button>
        <button shButton variant="outlined">
          <sh-icon>arrow-bend-up-right</sh-icon>
          Forward
        </button>
      </div>
    </article>
  }
</sh-lo-inbox>
`,
        ts: "import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';\nimport { ShipColor, ShipLayoutInboxVariant } from '@ship-ui/core';\nimport { ShipAvatar } from '@ship-ui/core/ship-avatar';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCheckbox } from '@ship-ui/core/ship-checkbox';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutInbox, ShipLayoutInboxItem, ShipLayoutToolbar } from '@ship-ui/core/ship-layout';\nimport { ShipTooltip } from '@ship-ui/core/ship-tooltip';\n\ninterface Mail {\n  id: number;\n  from: string;\n  subject: string;\n  snippet: string;\n  time: string;\n  unread: boolean;\n  starred: boolean;\n  label?: string;\n  labelColor?: ShipColor;\n}\n\n@Component({\n  selector: 'app-inbox-sandbox',\n  imports: [\n    ShipLayoutInbox,\n    ShipLayoutInboxItem,\n    ShipLayoutToolbar,\n    ShipAvatar,\n    ShipButton,\n    ShipCheckbox,\n    ShipChip,\n    ShipIcon,\n    ShipTooltip,\n  ],\n  templateUrl: './inbox-sandbox.html',\n  styleUrl: './inbox-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InboxSandbox {\n  variant = input<ShipLayoutInboxVariant>('');\n  readingPane = input(true);\n\n  openId = signal<number | null>(1);\n  openMail = computed(() => this.mails.find((mail) => mail.id === this.openId()) ?? null);\n  unreadCount = computed(() => this.mails.filter((mail) => mail.unread).length);\n\n  mails: Mail[] = [\n    {\n      id: 1,\n      from: 'Sofia Lund',\n      subject: 'Design review moved to Thursday',\n      snippet: 'Hey! The design review got pushed to Thursday 14:00, the new header mocks are in Figma.',\n      time: '10:42',\n      unread: true,\n      starred: true,\n      label: 'Work',\n      labelColor: 'primary',\n    },\n    {\n      id: 2,\n      from: 'GitHub',\n      subject: '[ship-ui] PR #412 was merged',\n      snippet: 'feat(ship-layout): stat ring and ranking components merged into main by sp90.',\n      time: '09:15',\n      unread: true,\n      starred: false,\n    },\n    {\n      id: 3,\n      from: 'Mads Holm',\n      subject: 'Pricing page copy',\n      snippet: 'Attached the final copy for the pricing page, marketing signed off this morning.',\n      time: 'Yesterday',\n      unread: false,\n      starred: true,\n      label: 'Marketing',\n      labelColor: 'accent',\n    },\n    {\n      id: 4,\n      from: 'Vercel',\n      subject: 'Deployment ready',\n      snippet: 'Your deployment of ship-docs is live at docs.shipui.com. Build took 48s.',\n      time: 'Yesterday',\n      unread: false,\n      starred: false,\n    },\n    {\n      id: 5,\n      from: 'Freja Berg',\n      subject: 'Lunch on Friday?',\n      snippet: 'Thinking the new ramen place around the corner, 12:30 works for everyone?',\n      time: 'Sep 26',\n      unread: false,\n      starred: false,\n      label: 'Personal',\n      labelColor: 'success',\n    },\n    {\n      id: 6,\n      from: 'Stripe',\n      subject: 'Your September invoice',\n      snippet: 'Your invoice for September is available. Amount due: $49.00.',\n      time: 'Sep 25',\n      unread: false,\n      starred: false,\n    },\n    {\n      id: 7,\n      from: 'Jonas Krog',\n      subject: 'Re: Accessibility audit',\n      snippet: 'Found three focus-order issues on the settings page, notes are in the ticket.',\n      time: 'Sep 24',\n      unread: false,\n      starred: false,\n      label: 'Work',\n      labelColor: 'primary',\n    },\n  ];\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutPage",
    selector: "sh-lo-page",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-page.ts",
    description: "Route-level page layout. Slot the parts in and the page arranges them:\n`nav` or `sh-breadcrumbs`, `h1`, `p` (description), `[actions]`, `sh-tabs`, the\ncontent, and an optional `[aside]` column that drops below the content on\nnarrow screens. Content is centered at a readable max width.",
    inputs: [
      {
        name: "size",
        type: "ShipLayoutPageSize | null",
        description: "Max content width: `small` (forms, settings), default, or `large`. Add class `full` for no limit.",
        defaultValue: "null",
        options: [
          "small",
          "large",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipLayoutPageVariant | null",
        description: "Visual variant: `type-b` divides the header from the content, `type-c` is flush (no page padding). Project default via `ShipConfig.layoutPage.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--page-mw",
        defaultValue: "#{p2r(1200)}"
      },
      {
        name: "--page-py",
        defaultValue: "var(--pad-y-7)"
      },
      {
        name: "--page-px",
        defaultValue: "var(--pad-x-7)"
      },
      {
        name: "--page-gap",
        defaultValue: "var(--space-6)"
      },
      {
        name: "--page-head-gap",
        defaultValue: "var(--space-4)"
      },
      {
        name: "--page-aside-w",
        defaultValue: "#{p2r(320)}"
      }
    ],
    examples: [
      {
        name: "dashboard-page",
        html: `<sh-lo-page>
  <nav>
    <a href="#">Workspace</a>
    <sh-icon size="small">caret-right</sh-icon>
    <span>Analytics</span>
  </nav>
  <h1>Analytics</h1>
  <p>Traffic and revenue for the last 30 days.</p>
  <button actions shButton variant="outlined">
    <sh-icon>export</sh-icon>
    Export
  </button>
  <button actions shButton variant="raised" color="primary">
    <sh-icon>plus</sh-icon>
    New report
  </button>

  <div class="kpis">
    @for (kpi of kpis; track kpi.label) {
      <sh-lo-stat variant="type-c">
        <p>{{ kpi.label }}</p>
        <h3>{{ kpi.value }}</h3>
        <sh-chip size="small" variant="raised" [color]="kpi.up ? 'success' : 'error'">{{ kpi.delta }}</sh-chip>
        <sh-chart-sparkline [data]="kpi.trend" [color]="kpi.up ? 'success' : 'error'" area />
      </sh-lo-stat>
    }
  </div>

  <sh-lo-section>
    <h2>Top pages</h2>
    <p>Pages with the most visits this period.</p>
    <button actions shButton size="small" variant="outlined">View all</button>

    <sh-card class="pages">
      @for (page of pages; track page.path) {
        <div class="page-row">
          <span>{{ page.path }}</span>
          <b>{{ page.views }}</b>
        </div>
      }
    </sh-card>
  </sh-lo-section>

  <sh-lo-section aside>
    <h2>Recent activity</h2>
    <sh-card class="activity">
      @for (event of activity; track event.text) {
        <div>
          <b>{{ event.text }}</b>
          <p>{{ event.when }}</p>
        </div>
      }
    </sh-card>
  </sh-lo-section>
</sh-lo-page>
`,
        ts: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipChartSparkline } from '@ship-ui/core/ship-chart-sparkline';
import { ShipLayoutPage, ShipLayoutSection, ShipLayoutStat } from '@ship-ui/core/ship-layout';

@Component({
  selector: 'app-dashboard-page-example',
  imports: [
    ShipLayoutPage,
    ShipLayoutSection,
    ShipLayoutStat,
    ShipCard,
    ShipButton,
    ShipIcon,
    ShipChip,
    ShipChartSparkline,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageExample {
  kpis = [
    { label: 'Visitors', value: '48.2k', delta: '+12%', up: true, trend: [12, 18, 14, 22, 26, 24, 31, 35] },
    { label: 'Signups', value: '1,284', delta: '+4%', up: true, trend: [8, 9, 7, 11, 10, 12, 13, 14] },
    { label: 'Revenue', value: '$32.9k', delta: '-2%', up: false, trend: [40, 38, 41, 36, 34, 30, 32, 29] },
    { label: 'Churn', value: '1.8%', delta: '-0.3%', up: true, trend: [3, 2.8, 2.6, 2.4, 2.3, 2.1, 1.9, 1.8] },
  ];

  pages = [
    { path: '/pricing', views: '12,403' },
    { path: '/docs/getting-started', views: '9,871' },
    { path: '/blog/launch-week', views: '6,220' },
    { path: '/changelog', views: '3,115' },
  ];

  activity = [
    { text: 'Report "Q3 funnel" exported', when: '2 minutes ago' },
    { text: 'Alex invited 3 teammates', when: '1 hour ago' },
    { text: 'Goal "1k signups" reached', when: 'Yesterday' },
  ];
}
`
      },
      {
        name: "page-sandbox",
        html: '<sh-lo-page [variant]="variant()" [size]="size()">\n  <nav>\n    <a href="#">Projects</a>\n    <sh-icon size="small">caret-right</sh-icon>\n    <span>Website redesign</span>\n  </nav>\n  <h1>Website redesign</h1>\n  <p>Kicked off March 3rd. Ships when it ships.</p>\n  <button actions shButton variant="outlined">Share</button>\n  <button actions shButton variant="raised" color="primary">Edit</button>\n\n  <sh-tabs color="primary" [(value)]="tab">\n    <button value="overview">Overview</button>\n    <button value="tasks">Tasks</button>\n    <button value="files">Files</button>\n  </sh-tabs>\n\n  <div class="stats">\n    <sh-lo-stat>\n      <sh-icon>check-circle</sh-icon>\n      <p>Tasks done</p>\n      <h3>42</h3>\n      <sh-chip size="small" variant="raised" color="success">+8 this week</sh-chip>\n    </sh-lo-stat>\n    <sh-lo-stat>\n      <sh-icon>clock</sh-icon>\n      <p>Hours logged</p>\n      <h3>318</h3>\n      <sh-chip size="small" variant="raised" color="primary">on track</sh-chip>\n    </sh-lo-stat>\n    <sh-lo-stat>\n      <sh-icon>calendar</sh-icon>\n      <p>Days left</p>\n      <h3>19</h3>\n    </sh-lo-stat>\n  </div>\n\n  <sh-lo-section>\n    <h2>Recent activity</h2>\n    <p>What the team shipped over the last few days.</p>\n    <button actions shButton size="small" variant="outlined">View all</button>\n\n    <sh-card>\n      <sh-lo-timeline>\n        <sh-lo-timeline-item>\n          <sh-icon>git-merge</sh-icon>\n          <b>Header redesign merged</b>\n          <time>2 hours ago</time>\n        </sh-lo-timeline-item>\n        <sh-lo-timeline-item>\n          <sh-icon>check</sh-icon>\n          <b>Pricing page copy approved</b>\n          <time>Yesterday</time>\n          <p>Signed off by marketing, ready for build.</p>\n        </sh-lo-timeline-item>\n        <sh-lo-timeline-item>\n          <sh-icon>arrows-clockwise</sh-icon>\n          <b>Design tokens synced from Figma</b>\n          <time>3 days ago</time>\n        </sh-lo-timeline-item>\n      </sh-lo-timeline>\n    </sh-card>\n  </sh-lo-section>\n\n  <sh-card aside>\n    <sh-lo-details>\n      <h3>Details</h3>\n      <sh-lo-detail>\n        <dt>Status</dt>\n        <sh-chip size="small" variant="raised" color="primary">In progress</sh-chip>\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Owner</dt>\n        Sofia Lund\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Due</dt>\n        Oct 17, 2026\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Team</dt>\n        Web platform\n      </sh-lo-detail>\n    </sh-lo-details>\n  </sh-card>\n</sh-lo-page>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipLayoutPageSize, ShipLayoutPageVariant } from '@ship-ui/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport {\n  ShipLayoutDetail,\n  ShipLayoutDetails,\n  ShipLayoutPage,\n  ShipLayoutSection,\n  ShipLayoutStat,\n  ShipLayoutTimeline,\n  ShipLayoutTimelineItem,\n} from '@ship-ui/core/ship-layout';\nimport { ShipTabs } from '@ship-ui/core/ship-tabs';\n\n@Component({\n  selector: 'app-page-sandbox',\n  imports: [\n    ShipLayoutPage,\n    ShipLayoutSection,\n    ShipLayoutStat,\n    ShipLayoutDetails,\n    ShipLayoutDetail,\n    ShipLayoutTimeline,\n    ShipLayoutTimelineItem,\n    ShipTabs,\n    ShipCard,\n    ShipChip,\n    ShipButton,\n    ShipIcon,\n  ],\n  templateUrl: './page-sandbox.html',\n  styleUrl: './page-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class PageSandbox {\n  variant = input<ShipLayoutPageVariant>('');\n  size = input<ShipLayoutPageSize>('');\n  tab = signal('overview');\n}\n"
      },
      {
        name: "settings-page",
        html: '<sh-lo-page size="small">\n  <h1>Settings</h1>\n  <p>Manage your workspace profile and notifications.</p>\n\n  <sh-lo-section>\n    <h2>Workspace</h2>\n    <p>Shown to everyone who joins your workspace.</p>\n\n    <sh-card>\n      <sh-lo-setting>\n        <label for="ws-name">Name</label>\n        <p>Used in emails and the sidebar.</p>\n        <sh-form-field>\n          <input id="ws-name" value="Acme Inc." />\n        </sh-form-field>\n      </sh-lo-setting>\n\n      <sh-lo-setting>\n        <label for="ws-url">URL</label>\n        <p>Changing this breaks existing links.</p>\n        <sh-form-field>\n          <span prefix>acme.app/</span>\n          <input id="ws-url" value="acme" />\n        </sh-form-field>\n      </sh-lo-setting>\n    </sh-card>\n  </sh-lo-section>\n\n  <sh-lo-section>\n    <h2>Notifications</h2>\n    <p>Choose what we email you about.</p>\n\n    <sh-card>\n      <sh-lo-setting>\n        <label>Weekly digest</label>\n        <p>A summary of activity every Monday.</p>\n        <sh-toggle color="primary" [checked]="true" />\n      </sh-lo-setting>\n\n      <sh-lo-setting>\n        <label>Product updates</label>\n        <p>New features and improvements.</p>\n        <sh-toggle color="primary" />\n      </sh-lo-setting>\n    </sh-card>\n  </sh-lo-section>\n\n  <div class="footer">\n    <button shButton variant="outlined">Cancel</button>\n    <button shButton variant="raised" color="primary">Save changes</button>\n  </div>\n</sh-lo-page>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipLayoutPage, ShipLayoutSection, ShipLayoutSetting } from '@ship-ui/core/ship-layout';\nimport { ShipToggle } from '@ship-ui/core/ship-toggle';\n\n@Component({\n  selector: 'app-settings-page-example',\n  imports: [ShipLayoutPage, ShipLayoutSection, ShipLayoutSetting, ShipCard, ShipButton, ShipFormField, ShipToggle],\n  templateUrl: './settings-page.html',\n  styleUrl: './settings-page.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SettingsPageExample {}\n"
      }
    ]
  },
  {
    name: "ShipLayoutRanking",
    selector: "sh-lo-ranking",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-ranking.ts",
    description: "Ranked list with proportional bars (top pages, top sellers, votes \u2026).\nGive the list a `max` (defaults to 100) and each `sh-lo-ranking-item` a\n`value`; the item draws its bar as `value / max`. Item slots: an optional\n`sh-avatar`/`sh-icon`/`[lead]`, the label (any other content) and a\n`[detail]` on the right (the formatted number). Optional `h3` heading and\n`[actions]` on the list.",
    inputs: [
      {
        name: "max",
        type: "number",
        description: "Value that fills an item's bar completely. Pass the largest item's value for a relative ranking.",
        defaultValue: "100"
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Bar color (`ShipColor`), defaults to primary.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipLayoutRankingVariant | null",
        description: "Visual variant: `type-b` draws the bar as a tinted background behind the whole row, `type-c` compact rows without bars (a dense leaderboard). Project default via `ShipConfig.layoutRanking.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--ranking-gap",
        defaultValue: "var(--space-3)"
      },
      {
        name: "--ranking-bar-h",
        defaultValue: "#{p2r(6)}"
      },
      {
        name: "--ranking-bar-s",
        defaultValue: "#{p2r(999)}"
      },
      {
        name: "--ranking-c",
        defaultValue: "var(--primary-8)"
      },
      {
        name: "--ranking-track",
        defaultValue: "var(--base-3)"
      }
    ],
    examples: [
      {
        name: "ranking-sandbox",
        html: '<sh-card>\n  <sh-lo-ranking [variant]="variant()" [max]="1240" color="primary">\n    <h3>Top pages</h3>\n    <button actions shButton size="small" variant="outlined">Last 7 days</button>\n\n    @for (page of pages; track page.path) {\n      <sh-lo-ranking-item [value]="page.views">\n        <sh-icon>file</sh-icon>\n        {{ page.path }}\n        <span detail>{{ page.views }}</span>\n      </sh-lo-ranking-item>\n    }\n  </sh-lo-ranking>\n</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipLayoutRankingVariant } from '@ship-ui/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutRanking, ShipLayoutRankingItem } from '@ship-ui/core/ship-layout';\n\n@Component({\n  selector: 'app-ranking-sandbox',\n  imports: [ShipLayoutRanking, ShipLayoutRankingItem, ShipCard, ShipButton, ShipIcon],\n  templateUrl: './ranking-sandbox.html',\n  styleUrl: '../sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RankingSandbox {\n  variant = input<ShipLayoutRankingVariant>('');\n\n  pages = [\n    { path: '/pricing', views: 1240 },\n    { path: '/docs/getting-started', views: 986 },\n    { path: '/blog/launch', views: 712 },\n    { path: '/changelog', views: 431 },\n    { path: '/about', views: 208 },\n  ];\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutRankingItem",
    selector: "sh-lo-ranking-item",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-ranking.ts",
    description: "One row of `sh-lo-ranking`.",
    inputs: [
      {
        name: "value",
        type: "number",
        description: "The item's value; the bar is `value / max` of the parent list.",
        defaultValue: "0"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: [
      {
        name: "ranking-sandbox",
        html: '<sh-card>\n  <sh-lo-ranking [variant]="variant()" [max]="1240" color="primary">\n    <h3>Top pages</h3>\n    <button actions shButton size="small" variant="outlined">Last 7 days</button>\n\n    @for (page of pages; track page.path) {\n      <sh-lo-ranking-item [value]="page.views">\n        <sh-icon>file</sh-icon>\n        {{ page.path }}\n        <span detail>{{ page.views }}</span>\n      </sh-lo-ranking-item>\n    }\n  </sh-lo-ranking>\n</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipLayoutRankingVariant } from '@ship-ui/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutRanking, ShipLayoutRankingItem } from '@ship-ui/core/ship-layout';\n\n@Component({\n  selector: 'app-ranking-sandbox',\n  imports: [ShipLayoutRanking, ShipLayoutRankingItem, ShipCard, ShipButton, ShipIcon],\n  templateUrl: './ranking-sandbox.html',\n  styleUrl: '../sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RankingSandbox {\n  variant = input<ShipLayoutRankingVariant>('');\n\n  pages = [\n    { path: '/pricing', views: 1240 },\n    { path: '/docs/getting-started', views: 986 },\n    { path: '/blog/launch', views: 712 },\n    { path: '/changelog', views: 431 },\n    { path: '/about', views: 208 },\n  ];\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutSection",
    selector: "sh-lo-section",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-section.ts",
    description: "A titled block of a page: `h2`/`h3`, `p` (description) and `[actions]` in\na header row, then whatever content follows, stacked.",
    inputs: [
      {
        name: "variant",
        type: "ShipLayoutSectionVariant | null",
        description: "Visual variant (`type-b`, `type-c`, or default). Project default via `ShipConfig.layoutSection.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--section-gap",
        defaultValue: "var(--space-4)"
      },
      {
        name: "--section-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--section-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--section-py",
        defaultValue: "var(--pad-y-6)"
      },
      {
        name: "--section-px",
        defaultValue: "var(--pad-x-6)"
      },
      {
        name: "--section-s",
        defaultValue: "var(--shape-3)"
      },
      {
        name: "--section-text-w",
        defaultValue: "#{p2r(280)}"
      }
    ],
    examples: [
      {
        name: "dashboard-page",
        html: `<sh-lo-page>
  <nav>
    <a href="#">Workspace</a>
    <sh-icon size="small">caret-right</sh-icon>
    <span>Analytics</span>
  </nav>
  <h1>Analytics</h1>
  <p>Traffic and revenue for the last 30 days.</p>
  <button actions shButton variant="outlined">
    <sh-icon>export</sh-icon>
    Export
  </button>
  <button actions shButton variant="raised" color="primary">
    <sh-icon>plus</sh-icon>
    New report
  </button>

  <div class="kpis">
    @for (kpi of kpis; track kpi.label) {
      <sh-lo-stat variant="type-c">
        <p>{{ kpi.label }}</p>
        <h3>{{ kpi.value }}</h3>
        <sh-chip size="small" variant="raised" [color]="kpi.up ? 'success' : 'error'">{{ kpi.delta }}</sh-chip>
        <sh-chart-sparkline [data]="kpi.trend" [color]="kpi.up ? 'success' : 'error'" area />
      </sh-lo-stat>
    }
  </div>

  <sh-lo-section>
    <h2>Top pages</h2>
    <p>Pages with the most visits this period.</p>
    <button actions shButton size="small" variant="outlined">View all</button>

    <sh-card class="pages">
      @for (page of pages; track page.path) {
        <div class="page-row">
          <span>{{ page.path }}</span>
          <b>{{ page.views }}</b>
        </div>
      }
    </sh-card>
  </sh-lo-section>

  <sh-lo-section aside>
    <h2>Recent activity</h2>
    <sh-card class="activity">
      @for (event of activity; track event.text) {
        <div>
          <b>{{ event.text }}</b>
          <p>{{ event.when }}</p>
        </div>
      }
    </sh-card>
  </sh-lo-section>
</sh-lo-page>
`,
        ts: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipChartSparkline } from '@ship-ui/core/ship-chart-sparkline';
import { ShipLayoutPage, ShipLayoutSection, ShipLayoutStat } from '@ship-ui/core/ship-layout';

@Component({
  selector: 'app-dashboard-page-example',
  imports: [
    ShipLayoutPage,
    ShipLayoutSection,
    ShipLayoutStat,
    ShipCard,
    ShipButton,
    ShipIcon,
    ShipChip,
    ShipChartSparkline,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageExample {
  kpis = [
    { label: 'Visitors', value: '48.2k', delta: '+12%', up: true, trend: [12, 18, 14, 22, 26, 24, 31, 35] },
    { label: 'Signups', value: '1,284', delta: '+4%', up: true, trend: [8, 9, 7, 11, 10, 12, 13, 14] },
    { label: 'Revenue', value: '$32.9k', delta: '-2%', up: false, trend: [40, 38, 41, 36, 34, 30, 32, 29] },
    { label: 'Churn', value: '1.8%', delta: '-0.3%', up: true, trend: [3, 2.8, 2.6, 2.4, 2.3, 2.1, 1.9, 1.8] },
  ];

  pages = [
    { path: '/pricing', views: '12,403' },
    { path: '/docs/getting-started', views: '9,871' },
    { path: '/blog/launch-week', views: '6,220' },
    { path: '/changelog', views: '3,115' },
  ];

  activity = [
    { text: 'Report "Q3 funnel" exported', when: '2 minutes ago' },
    { text: 'Alex invited 3 teammates', when: '1 hour ago' },
    { text: 'Goal "1k signups" reached', when: 'Yesterday' },
  ];
}
`
      },
      {
        name: "page-sandbox",
        html: '<sh-lo-page [variant]="variant()" [size]="size()">\n  <nav>\n    <a href="#">Projects</a>\n    <sh-icon size="small">caret-right</sh-icon>\n    <span>Website redesign</span>\n  </nav>\n  <h1>Website redesign</h1>\n  <p>Kicked off March 3rd. Ships when it ships.</p>\n  <button actions shButton variant="outlined">Share</button>\n  <button actions shButton variant="raised" color="primary">Edit</button>\n\n  <sh-tabs color="primary" [(value)]="tab">\n    <button value="overview">Overview</button>\n    <button value="tasks">Tasks</button>\n    <button value="files">Files</button>\n  </sh-tabs>\n\n  <div class="stats">\n    <sh-lo-stat>\n      <sh-icon>check-circle</sh-icon>\n      <p>Tasks done</p>\n      <h3>42</h3>\n      <sh-chip size="small" variant="raised" color="success">+8 this week</sh-chip>\n    </sh-lo-stat>\n    <sh-lo-stat>\n      <sh-icon>clock</sh-icon>\n      <p>Hours logged</p>\n      <h3>318</h3>\n      <sh-chip size="small" variant="raised" color="primary">on track</sh-chip>\n    </sh-lo-stat>\n    <sh-lo-stat>\n      <sh-icon>calendar</sh-icon>\n      <p>Days left</p>\n      <h3>19</h3>\n    </sh-lo-stat>\n  </div>\n\n  <sh-lo-section>\n    <h2>Recent activity</h2>\n    <p>What the team shipped over the last few days.</p>\n    <button actions shButton size="small" variant="outlined">View all</button>\n\n    <sh-card>\n      <sh-lo-timeline>\n        <sh-lo-timeline-item>\n          <sh-icon>git-merge</sh-icon>\n          <b>Header redesign merged</b>\n          <time>2 hours ago</time>\n        </sh-lo-timeline-item>\n        <sh-lo-timeline-item>\n          <sh-icon>check</sh-icon>\n          <b>Pricing page copy approved</b>\n          <time>Yesterday</time>\n          <p>Signed off by marketing, ready for build.</p>\n        </sh-lo-timeline-item>\n        <sh-lo-timeline-item>\n          <sh-icon>arrows-clockwise</sh-icon>\n          <b>Design tokens synced from Figma</b>\n          <time>3 days ago</time>\n        </sh-lo-timeline-item>\n      </sh-lo-timeline>\n    </sh-card>\n  </sh-lo-section>\n\n  <sh-card aside>\n    <sh-lo-details>\n      <h3>Details</h3>\n      <sh-lo-detail>\n        <dt>Status</dt>\n        <sh-chip size="small" variant="raised" color="primary">In progress</sh-chip>\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Owner</dt>\n        Sofia Lund\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Due</dt>\n        Oct 17, 2026\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Team</dt>\n        Web platform\n      </sh-lo-detail>\n    </sh-lo-details>\n  </sh-card>\n</sh-lo-page>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipLayoutPageSize, ShipLayoutPageVariant } from '@ship-ui/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport {\n  ShipLayoutDetail,\n  ShipLayoutDetails,\n  ShipLayoutPage,\n  ShipLayoutSection,\n  ShipLayoutStat,\n  ShipLayoutTimeline,\n  ShipLayoutTimelineItem,\n} from '@ship-ui/core/ship-layout';\nimport { ShipTabs } from '@ship-ui/core/ship-tabs';\n\n@Component({\n  selector: 'app-page-sandbox',\n  imports: [\n    ShipLayoutPage,\n    ShipLayoutSection,\n    ShipLayoutStat,\n    ShipLayoutDetails,\n    ShipLayoutDetail,\n    ShipLayoutTimeline,\n    ShipLayoutTimelineItem,\n    ShipTabs,\n    ShipCard,\n    ShipChip,\n    ShipButton,\n    ShipIcon,\n  ],\n  templateUrl: './page-sandbox.html',\n  styleUrl: './page-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class PageSandbox {\n  variant = input<ShipLayoutPageVariant>('');\n  size = input<ShipLayoutPageSize>('');\n  tab = signal('overview');\n}\n"
      },
      {
        name: "section-sandbox",
        html: '<sh-lo-section [variant]="variant()">\n  <h2>Team members</h2>\n  <p>People with access to this project.</p>\n  <button actions shButton size="small" variant="outlined">Invite</button>\n\n  <sh-card>Content</sh-card>\n</sh-lo-section>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipLayoutSectionVariant } from '@ship-ui/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipLayoutSection } from '@ship-ui/core/ship-layout';\n\n@Component({\n  selector: 'app-section-sandbox',\n  imports: [ShipLayoutSection, ShipCard, ShipButton],\n  templateUrl: './section-sandbox.html',\n  styleUrl: '../sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SectionSandbox {\n  variant = input<ShipLayoutSectionVariant>('');\n}\n"
      },
      {
        name: "settings-page",
        html: '<sh-lo-page size="small">\n  <h1>Settings</h1>\n  <p>Manage your workspace profile and notifications.</p>\n\n  <sh-lo-section>\n    <h2>Workspace</h2>\n    <p>Shown to everyone who joins your workspace.</p>\n\n    <sh-card>\n      <sh-lo-setting>\n        <label for="ws-name">Name</label>\n        <p>Used in emails and the sidebar.</p>\n        <sh-form-field>\n          <input id="ws-name" value="Acme Inc." />\n        </sh-form-field>\n      </sh-lo-setting>\n\n      <sh-lo-setting>\n        <label for="ws-url">URL</label>\n        <p>Changing this breaks existing links.</p>\n        <sh-form-field>\n          <span prefix>acme.app/</span>\n          <input id="ws-url" value="acme" />\n        </sh-form-field>\n      </sh-lo-setting>\n    </sh-card>\n  </sh-lo-section>\n\n  <sh-lo-section>\n    <h2>Notifications</h2>\n    <p>Choose what we email you about.</p>\n\n    <sh-card>\n      <sh-lo-setting>\n        <label>Weekly digest</label>\n        <p>A summary of activity every Monday.</p>\n        <sh-toggle color="primary" [checked]="true" />\n      </sh-lo-setting>\n\n      <sh-lo-setting>\n        <label>Product updates</label>\n        <p>New features and improvements.</p>\n        <sh-toggle color="primary" />\n      </sh-lo-setting>\n    </sh-card>\n  </sh-lo-section>\n\n  <div class="footer">\n    <button shButton variant="outlined">Cancel</button>\n    <button shButton variant="raised" color="primary">Save changes</button>\n  </div>\n</sh-lo-page>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipLayoutPage, ShipLayoutSection, ShipLayoutSetting } from '@ship-ui/core/ship-layout';\nimport { ShipToggle } from '@ship-ui/core/ship-toggle';\n\n@Component({\n  selector: 'app-settings-page-example',\n  imports: [ShipLayoutPage, ShipLayoutSection, ShipLayoutSetting, ShipCard, ShipButton, ShipFormField, ShipToggle],\n  templateUrl: './settings-page.html',\n  styleUrl: './settings-page.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SettingsPageExample {}\n"
      }
    ]
  },
  {
    name: "ShipLayoutSetting",
    selector: "sh-lo-setting",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-setting.ts",
    description: "One setting in a settings form: `label` and `p` (description) on the\nleft, the control(s) on the right; stacks on narrow screens. Consecutive\nsettings inside a `sh-card` or `sh-lo-section` are divided automatically.\nThe slotted `label` names the control: an unlabelled `sh-toggle`, `sh-checkbox`,\n`sh-select` or native input in the control slot gets `aria-labelledby` pointing at it.",
    inputs: [
      {
        name: "variant",
        type: "ShipLayoutSettingVariant | null",
        description: "Visual variant (`type-b`, `type-c`, or default). Project default via `ShipConfig.layoutSetting.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--setting-py",
        defaultValue: "var(--pad-y-6)"
      },
      {
        name: "--setting-gap",
        defaultValue: "var(--space-3) var(--space-6)"
      },
      {
        name: "--setting-text-w",
        defaultValue: "#{p2r(224)}"
      }
    ],
    examples: [
      {
        name: "settings-page",
        html: '<sh-lo-page size="small">\n  <h1>Settings</h1>\n  <p>Manage your workspace profile and notifications.</p>\n\n  <sh-lo-section>\n    <h2>Workspace</h2>\n    <p>Shown to everyone who joins your workspace.</p>\n\n    <sh-card>\n      <sh-lo-setting>\n        <label for="ws-name">Name</label>\n        <p>Used in emails and the sidebar.</p>\n        <sh-form-field>\n          <input id="ws-name" value="Acme Inc." />\n        </sh-form-field>\n      </sh-lo-setting>\n\n      <sh-lo-setting>\n        <label for="ws-url">URL</label>\n        <p>Changing this breaks existing links.</p>\n        <sh-form-field>\n          <span prefix>acme.app/</span>\n          <input id="ws-url" value="acme" />\n        </sh-form-field>\n      </sh-lo-setting>\n    </sh-card>\n  </sh-lo-section>\n\n  <sh-lo-section>\n    <h2>Notifications</h2>\n    <p>Choose what we email you about.</p>\n\n    <sh-card>\n      <sh-lo-setting>\n        <label>Weekly digest</label>\n        <p>A summary of activity every Monday.</p>\n        <sh-toggle color="primary" [checked]="true" />\n      </sh-lo-setting>\n\n      <sh-lo-setting>\n        <label>Product updates</label>\n        <p>New features and improvements.</p>\n        <sh-toggle color="primary" />\n      </sh-lo-setting>\n    </sh-card>\n  </sh-lo-section>\n\n  <div class="footer">\n    <button shButton variant="outlined">Cancel</button>\n    <button shButton variant="raised" color="primary">Save changes</button>\n  </div>\n</sh-lo-page>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipLayoutPage, ShipLayoutSection, ShipLayoutSetting } from '@ship-ui/core/ship-layout';\nimport { ShipToggle } from '@ship-ui/core/ship-toggle';\n\n@Component({\n  selector: 'app-settings-page-example',\n  imports: [ShipLayoutPage, ShipLayoutSection, ShipLayoutSetting, ShipCard, ShipButton, ShipFormField, ShipToggle],\n  templateUrl: './settings-page.html',\n  styleUrl: './settings-page.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SettingsPageExample {}\n"
      },
      {
        name: "setting-sandbox",
        html: '<sh-card>\n  <sh-lo-setting [variant]="variant()">\n    <label for="display-name">Display name</label>\n    <p>Shown on your profile and in mentions.</p>\n    <sh-form-field>\n      <input id="display-name" value="Simon" />\n    </sh-form-field>\n  </sh-lo-setting>\n\n  <sh-lo-setting [variant]="variant()">\n    <label>Public profile</label>\n    <p>Anyone with the link can see your profile.</p>\n    <sh-toggle color="primary" [checked]="true" />\n  </sh-lo-setting>\n\n  <sh-lo-setting [variant]="variant()">\n    <label>Sounds</label>\n    <p>Play a sound for new messages.</p>\n    <sh-toggle color="primary" />\n  </sh-lo-setting>\n</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipLayoutSettingVariant } from '@ship-ui/core';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipLayoutSetting } from '@ship-ui/core/ship-layout';\nimport { ShipToggle } from '@ship-ui/core/ship-toggle';\n\n@Component({\n  selector: 'app-setting-sandbox',\n  imports: [ShipLayoutSetting, ShipCard, ShipFormField, ShipToggle],\n  templateUrl: './setting-sandbox.html',\n  styleUrl: '../sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SettingSandbox {\n  variant = input<ShipLayoutSettingVariant>('');\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutStat",
    selector: "sh-lo-stat",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-stat.ts",
    description: "KPI tile. Slots: `p` (label), `h3` (value), `sh-chip` (delta), an\noptional `sh-icon` and an optional `sh-chart-sparkline`/`[chart]`.\nPut several in a CSS grid for a stats row. For a highlighted headline\nmetric use `sh-lo-stat-trend`, for progress toward a target\n`sh-lo-stat-goal` or `sh-lo-stat-ring`.",
    inputs: [
      {
        name: "variant",
        type: "ShipLayoutStatVariant | null",
        description: "Visual variant: `type-b` icon beside the text, `type-c` flush (no padding, chart bleeds to the edges), `type-d` highlighted (colored wash, value and border in `color`, chart to the edges). Project default via `ShipConfig.layoutStat.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          "type-d",
          ""
        ]
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Accent color (`ShipColor`) used by `type-d`; defaults to primary.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--stat-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--stat-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--stat-py",
        defaultValue: "var(--pad-y-6)"
      },
      {
        name: "--stat-px",
        defaultValue: "var(--pad-x-6)"
      },
      {
        name: "--stat-s",
        defaultValue: "var(--shape-3)"
      },
      {
        name: "--stat-gap",
        defaultValue: "var(--space-4)"
      },
      {
        name: "--stat-ic",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--stat-chart-h",
        defaultValue: "#{p2r(40)}"
      },
      {
        name: "--stat-c",
        defaultValue: "var(--primary-8)"
      }
    ],
    examples: [
      {
        name: "dashboard-page",
        html: `<sh-lo-page>
  <nav>
    <a href="#">Workspace</a>
    <sh-icon size="small">caret-right</sh-icon>
    <span>Analytics</span>
  </nav>
  <h1>Analytics</h1>
  <p>Traffic and revenue for the last 30 days.</p>
  <button actions shButton variant="outlined">
    <sh-icon>export</sh-icon>
    Export
  </button>
  <button actions shButton variant="raised" color="primary">
    <sh-icon>plus</sh-icon>
    New report
  </button>

  <div class="kpis">
    @for (kpi of kpis; track kpi.label) {
      <sh-lo-stat variant="type-c">
        <p>{{ kpi.label }}</p>
        <h3>{{ kpi.value }}</h3>
        <sh-chip size="small" variant="raised" [color]="kpi.up ? 'success' : 'error'">{{ kpi.delta }}</sh-chip>
        <sh-chart-sparkline [data]="kpi.trend" [color]="kpi.up ? 'success' : 'error'" area />
      </sh-lo-stat>
    }
  </div>

  <sh-lo-section>
    <h2>Top pages</h2>
    <p>Pages with the most visits this period.</p>
    <button actions shButton size="small" variant="outlined">View all</button>

    <sh-card class="pages">
      @for (page of pages; track page.path) {
        <div class="page-row">
          <span>{{ page.path }}</span>
          <b>{{ page.views }}</b>
        </div>
      }
    </sh-card>
  </sh-lo-section>

  <sh-lo-section aside>
    <h2>Recent activity</h2>
    <sh-card class="activity">
      @for (event of activity; track event.text) {
        <div>
          <b>{{ event.text }}</b>
          <p>{{ event.when }}</p>
        </div>
      }
    </sh-card>
  </sh-lo-section>
</sh-lo-page>
`,
        ts: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipChartSparkline } from '@ship-ui/core/ship-chart-sparkline';
import { ShipLayoutPage, ShipLayoutSection, ShipLayoutStat } from '@ship-ui/core/ship-layout';

@Component({
  selector: 'app-dashboard-page-example',
  imports: [
    ShipLayoutPage,
    ShipLayoutSection,
    ShipLayoutStat,
    ShipCard,
    ShipButton,
    ShipIcon,
    ShipChip,
    ShipChartSparkline,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageExample {
  kpis = [
    { label: 'Visitors', value: '48.2k', delta: '+12%', up: true, trend: [12, 18, 14, 22, 26, 24, 31, 35] },
    { label: 'Signups', value: '1,284', delta: '+4%', up: true, trend: [8, 9, 7, 11, 10, 12, 13, 14] },
    { label: 'Revenue', value: '$32.9k', delta: '-2%', up: false, trend: [40, 38, 41, 36, 34, 30, 32, 29] },
    { label: 'Churn', value: '1.8%', delta: '-0.3%', up: true, trend: [3, 2.8, 2.6, 2.4, 2.3, 2.1, 1.9, 1.8] },
  ];

  pages = [
    { path: '/pricing', views: '12,403' },
    { path: '/docs/getting-started', views: '9,871' },
    { path: '/blog/launch-week', views: '6,220' },
    { path: '/changelog', views: '3,115' },
  ];

  activity = [
    { text: 'Report "Q3 funnel" exported', when: '2 minutes ago' },
    { text: 'Alex invited 3 teammates', when: '1 hour ago' },
    { text: 'Goal "1k signups" reached', when: 'Yesterday' },
  ];
}
`
      },
      {
        name: "page-sandbox",
        html: '<sh-lo-page [variant]="variant()" [size]="size()">\n  <nav>\n    <a href="#">Projects</a>\n    <sh-icon size="small">caret-right</sh-icon>\n    <span>Website redesign</span>\n  </nav>\n  <h1>Website redesign</h1>\n  <p>Kicked off March 3rd. Ships when it ships.</p>\n  <button actions shButton variant="outlined">Share</button>\n  <button actions shButton variant="raised" color="primary">Edit</button>\n\n  <sh-tabs color="primary" [(value)]="tab">\n    <button value="overview">Overview</button>\n    <button value="tasks">Tasks</button>\n    <button value="files">Files</button>\n  </sh-tabs>\n\n  <div class="stats">\n    <sh-lo-stat>\n      <sh-icon>check-circle</sh-icon>\n      <p>Tasks done</p>\n      <h3>42</h3>\n      <sh-chip size="small" variant="raised" color="success">+8 this week</sh-chip>\n    </sh-lo-stat>\n    <sh-lo-stat>\n      <sh-icon>clock</sh-icon>\n      <p>Hours logged</p>\n      <h3>318</h3>\n      <sh-chip size="small" variant="raised" color="primary">on track</sh-chip>\n    </sh-lo-stat>\n    <sh-lo-stat>\n      <sh-icon>calendar</sh-icon>\n      <p>Days left</p>\n      <h3>19</h3>\n    </sh-lo-stat>\n  </div>\n\n  <sh-lo-section>\n    <h2>Recent activity</h2>\n    <p>What the team shipped over the last few days.</p>\n    <button actions shButton size="small" variant="outlined">View all</button>\n\n    <sh-card>\n      <sh-lo-timeline>\n        <sh-lo-timeline-item>\n          <sh-icon>git-merge</sh-icon>\n          <b>Header redesign merged</b>\n          <time>2 hours ago</time>\n        </sh-lo-timeline-item>\n        <sh-lo-timeline-item>\n          <sh-icon>check</sh-icon>\n          <b>Pricing page copy approved</b>\n          <time>Yesterday</time>\n          <p>Signed off by marketing, ready for build.</p>\n        </sh-lo-timeline-item>\n        <sh-lo-timeline-item>\n          <sh-icon>arrows-clockwise</sh-icon>\n          <b>Design tokens synced from Figma</b>\n          <time>3 days ago</time>\n        </sh-lo-timeline-item>\n      </sh-lo-timeline>\n    </sh-card>\n  </sh-lo-section>\n\n  <sh-card aside>\n    <sh-lo-details>\n      <h3>Details</h3>\n      <sh-lo-detail>\n        <dt>Status</dt>\n        <sh-chip size="small" variant="raised" color="primary">In progress</sh-chip>\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Owner</dt>\n        Sofia Lund\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Due</dt>\n        Oct 17, 2026\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Team</dt>\n        Web platform\n      </sh-lo-detail>\n    </sh-lo-details>\n  </sh-card>\n</sh-lo-page>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipLayoutPageSize, ShipLayoutPageVariant } from '@ship-ui/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport {\n  ShipLayoutDetail,\n  ShipLayoutDetails,\n  ShipLayoutPage,\n  ShipLayoutSection,\n  ShipLayoutStat,\n  ShipLayoutTimeline,\n  ShipLayoutTimelineItem,\n} from '@ship-ui/core/ship-layout';\nimport { ShipTabs } from '@ship-ui/core/ship-tabs';\n\n@Component({\n  selector: 'app-page-sandbox',\n  imports: [\n    ShipLayoutPage,\n    ShipLayoutSection,\n    ShipLayoutStat,\n    ShipLayoutDetails,\n    ShipLayoutDetail,\n    ShipLayoutTimeline,\n    ShipLayoutTimelineItem,\n    ShipTabs,\n    ShipCard,\n    ShipChip,\n    ShipButton,\n    ShipIcon,\n  ],\n  templateUrl: './page-sandbox.html',\n  styleUrl: './page-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class PageSandbox {\n  variant = input<ShipLayoutPageVariant>('');\n  size = input<ShipLayoutPageSize>('');\n  tab = signal('overview');\n}\n"
      },
      {
        name: "stat-sandbox",
        html: '<sh-lo-stat [variant]="variant()" color="primary">\n  <sh-icon>currency-dollar</sh-icon>\n  <p>Revenue this month</p>\n  <h3>$32.9k</h3>\n  <sh-chip size="small" variant="raised" color="success">+12%</sh-chip>\n  <sh-chart-sparkline [data]="revenue" color="primary" area />\n</sh-lo-stat>\n\n<sh-lo-stat [variant]="variant()" color="error">\n  <sh-icon>users</sh-icon>\n  <p>Visitors this month</p>\n  <h3>48.2k</h3>\n  <sh-chip size="small" variant="raised" color="error">-2%</sh-chip>\n  <sh-chart-sparkline [data]="visitors" color="error" area />\n</sh-lo-stat>\n\n<sh-lo-stat [variant]="variant()" color="success">\n  <sh-icon>shopping-cart</sh-icon>\n  <p>Orders this month</p>\n  <h3>1,284</h3>\n  <sh-chip size="small" variant="raised" color="success">+6%</sh-chip>\n  <sh-chart-sparkline [data]="orders" color="success" area />\n</sh-lo-stat>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipLayoutStatVariant } from '@ship-ui/core';\nimport { ShipChartSparkline } from '@ship-ui/core/ship-chart-sparkline';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutStat } from '@ship-ui/core/ship-layout';\n\n@Component({\n  selector: 'app-stat-sandbox',\n  imports: [ShipLayoutStat, ShipChip, ShipIcon, ShipChartSparkline],\n  templateUrl: './stat-sandbox.html',\n  styleUrl: '../sandbox.scss',\n  host: { class: 'stats' },\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class StatSandbox {\n  variant = input<ShipLayoutStatVariant>('');\n  // Last 8 weeks. Each series ends on the headline value and moves the same way as\n  // its delta chip, so chart, number and chip tell one story.\n  revenue = [26.8, 27.5, 27.1, 28.6, 29.4, 30.1, 31.8, 32.9];\n  visitors = [51.8, 52.4, 51.1, 50.6, 49.9, 49.2, 48.9, 48.2];\n  orders = [1080, 1115, 1102, 1164, 1190, 1211, 1236, 1284];\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutStatGoal",
    selector: "sh-lo-stat-goal",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-stat-goal.ts",
    description: 'Progress toward a target: "$204k of $300k". Give it `value` and `max`; it\ndraws the bar itself. Slots: `p` (label), `h2`/`h3`\n(the formatted current value), `[target]` (the formatted goal, shown after\nthe value), an optional `sh-icon` and a `small`/`[footer]` line.',
    inputs: [
      {
        name: "value",
        type: "number",
        description: "Current progress.",
        defaultValue: "0"
      },
      {
        name: "max",
        type: "number",
        description: "The target; the bar is full at this value.",
        defaultValue: "100"
      },
      {
        name: "label",
        type: "string",
        description: 'Accessible name for the progress bar (e.g. "Quarterly sales goal"); the slotted `p` is used when unset.',
        defaultValue: "''"
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Bar color (`ShipColor`); defaults to primary.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipLayoutStatGoalVariant | null",
        description: "Visual variant: `type-b` draws the bar as ten segments, `type-c` compact without a card. Project default via `ShipConfig.layoutStatGoal.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--goal-c",
        defaultValue: "var(--primary-8)"
      },
      {
        name: "--goal-track",
        defaultValue: "var(--base-3)"
      },
      {
        name: "--goal-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--goal-py",
        defaultValue: "var(--pad-y-6)"
      },
      {
        name: "--goal-px",
        defaultValue: "var(--pad-x-6)"
      },
      {
        name: "--goal-s",
        defaultValue: "var(--shape-3)"
      },
      {
        name: "--goal-bar-h",
        defaultValue: "#{p2r(10)}"
      }
    ],
    examples: [
      {
        name: "stat-goal-sandbox",
        html: '<sh-lo-stat-goal [variant]="variant()" [value]="204" [max]="300" color="success" label="Quarterly sales goal">\n  <sh-icon>target</sh-icon>\n  <p>Quarterly sales goal</p>\n  <h3>$204k</h3>\n  <span target>$300k</span>\n  <small>$96k to go, 23 days left</small>\n</sh-lo-stat-goal>\n\n<sh-lo-stat-goal [variant]="variant()" [value]="87" [max]="100" color="warn" label="Storage used">\n  <sh-icon>hard-drives</sh-icon>\n  <p>Storage used</p>\n  <h3>87 GB</h3>\n  <span target>100 GB</span>\n  <small>Upgrade before you hit the limit</small>\n</sh-lo-stat-goal>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipLayoutStatGoalVariant } from '@ship-ui/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutStatGoal } from '@ship-ui/core/ship-layout';\n\n@Component({\n  selector: 'app-stat-goal-sandbox',\n  imports: [ShipLayoutStatGoal, ShipIcon],\n  templateUrl: './stat-goal-sandbox.html',\n  styleUrl: '../sandbox.scss',\n  host: { class: 'stats' },\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class StatGoalSandbox {\n  variant = input<ShipLayoutStatGoalVariant>('');\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutStatRing",
    selector: "sh-lo-stat-ring",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-stat-ring.ts",
    description: "Progress KPI: a value drawn as a ring. Give it `value` (and `max`, default\n100); the ring fills to the fraction. Slots: `p` (label), an optional\n`h3`/`[value]` shown inside the ring (defaults to the percentage), an\noptional `sh-icon` and a `[footer]`/`small` line. The slotted value and\nlabel read as ordinary content; set `label` to announce the ring as one\nimage with that name instead.",
    inputs: [
      {
        name: "value",
        type: "number",
        description: "Current value.",
        defaultValue: "0"
      },
      {
        name: "max",
        type: "number",
        description: "Value that fills the ring completely.",
        defaultValue: "100"
      },
      {
        name: "label",
        type: "string",
        description: "Names the ring as a single image (hiding its slotted content from assistive tech); leave unset to let the slotted value/label read as content.",
        defaultValue: "''"
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Ring color (`ShipColor`), defaults to primary.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipLayoutStatRingVariant | null",
        description: "Visual variant: `type-b` large ring with the label underneath, `type-c` compact inline row. Project default via `ShipConfig.layoutStatRing.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--ring-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--ring-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--ring-py",
        defaultValue: "var(--pad-y-6)"
      },
      {
        name: "--ring-px",
        defaultValue: "var(--pad-x-6)"
      },
      {
        name: "--ring-s",
        defaultValue: "var(--shape-3)"
      },
      {
        name: "--ring-gap",
        defaultValue: "var(--space-4)"
      },
      {
        name: "--ring-size",
        defaultValue: "#{p2r(72)}"
      },
      {
        name: "--ring-w",
        defaultValue: "#{p2r(7)}"
      },
      {
        name: "--ring-c",
        defaultValue: "var(--primary-8)"
      },
      {
        name: "--ring-track",
        defaultValue: "var(--base-3)"
      }
    ],
    examples: [
      {
        name: "stat-ring-sandbox",
        html: '<sh-lo-stat-ring [variant]="variant()" [value]="42" [max]="60" color="success">\n  <p>Tasks done</p>\n  <sh-chip size="small" variant="raised" color="success">+8 this week</sh-chip>\n  <small footer>42 of 60 tasks</small>\n</sh-lo-stat-ring>\n\n<sh-lo-stat-ring [variant]="variant()" [value]="318" [max]="400" color="primary">\n  <h3>318h</h3>\n  <p>Hours logged</p>\n  <small footer>82h left of the 400h budget</small>\n</sh-lo-stat-ring>\n\n<sh-lo-stat-ring [variant]="variant()" [value]="91" color="warn">\n  <sh-icon>hard-drives</sh-icon>\n  <p>Storage used</p>\n  <small footer>91 GB of 100 GB</small>\n</sh-lo-stat-ring>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipLayoutStatRingVariant } from '@ship-ui/core';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutStatRing } from '@ship-ui/core/ship-layout';\n\n@Component({\n  selector: 'app-stat-ring-sandbox',\n  imports: [ShipLayoutStatRing, ShipChip, ShipIcon],\n  templateUrl: './stat-ring-sandbox.html',\n  styleUrl: '../sandbox.scss',\n  host: { class: 'stats' },\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class StatRingSandbox {\n  variant = input<ShipLayoutStatRingVariant>('');\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutStatTrend",
    selector: "sh-lo-stat-trend",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-stat-trend.ts",
    description: 'Headline metric: the one number a dashboard leads with. A larger value,\na colored wash and a full-bleed trend chart along the bottom. Slots:\n`p` (label), `h2`/`h3` (value), `sh-chip` (delta), an optional `sh-icon`,\n`sh-chart-sparkline`/`[chart]` and a `small`/`[footer]` comparison line\n("Up from $29.4k last month").',
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "Accent color (`ShipColor`) for the wash, icon and border; defaults to primary.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipLayoutStatTrendVariant | null",
        description: "Visual variant: `type-b` puts the chart beside the text instead of under it, `type-c` drops the wash for a plain surface. Project default via `ShipConfig.layoutStatTrend.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--trend-c",
        defaultValue: "var(--primary-8)"
      },
      {
        name: "--trend-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--trend-py",
        defaultValue: "var(--pad-y-6)"
      },
      {
        name: "--trend-px",
        defaultValue: "var(--pad-x-6)"
      },
      {
        name: "--trend-s",
        defaultValue: "var(--shape-3)"
      },
      {
        name: "--trend-chart-h",
        defaultValue: "#{p2r(72)}"
      }
    ],
    examples: [
      {
        name: "stat-trend-sandbox",
        html: '<sh-lo-stat-trend [variant]="variant()" color="primary">\n  <sh-icon>currency-dollar</sh-icon>\n  <p>Revenue this month</p>\n  <h3>$32.9k</h3>\n  <sh-chip size="small" variant="raised" color="success">+12%</sh-chip>\n  <small>Up from $29.4k last month</small>\n  <sh-chart-sparkline [data]="revenue" color="primary" area />\n</sh-lo-stat-trend>\n\n<sh-lo-stat-trend [variant]="variant()" color="error">\n  <sh-icon>arrow-u-up-left</sh-icon>\n  <p>Refunds this month</p>\n  <h3>$1.8k</h3>\n  <sh-chip size="small" variant="raised" color="error">+31%</sh-chip>\n  <small>Up from $1.4k last month</small>\n  <sh-chart-sparkline [data]="refunds" color="error" area />\n</sh-lo-stat-trend>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipLayoutStatTrendVariant } from '@ship-ui/core';\nimport { ShipChartSparkline } from '@ship-ui/core/ship-chart-sparkline';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutStatTrend } from '@ship-ui/core/ship-layout';\n\n@Component({\n  selector: 'app-stat-trend-sandbox',\n  imports: [ShipLayoutStatTrend, ShipChip, ShipIcon, ShipChartSparkline],\n  templateUrl: './stat-trend-sandbox.html',\n  styleUrl: '../sandbox.scss',\n  host: { class: 'stats' },\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class StatTrendSandbox {\n  variant = input<ShipLayoutStatTrendVariant>('');\n\n  // Last 8 weeks, in thousands, ending on the headline value.\n  revenue = [26.8, 27.5, 27.1, 28.6, 29.4, 30.1, 31.8, 32.9];\n  refunds = [1.1, 1.2, 1.1, 1.3, 1.4, 1.5, 1.6, 1.8];\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutTableView",
    selector: "sh-lo-table-view",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-table-view.ts",
    description: 'Full-page data view: header, filters, a bulk-action toolbar, the table and a\nfooter. Slots: `h1`/`h2` (title), `p` (description), `[actions]` (primary\nbuttons), `[filters]` (search field, filter chips, `sh-table-filter-bar`),\n`sh-lo-toolbar` (bulk actions), `sh-table` (fills the remaining height and\nscrolls; mark its header row `class="sticky"` to pin it) and `[footer]`\n(count, pagination). Give it a height (it fills its parent) for the table to\nscroll on its own.',
    inputs: [
      {
        name: "variant",
        type: "ShipLayoutTableViewVariant | null",
        description: "Visual variant: `type-b` toolbar, table and footer inside one card, `type-c` flush (no page padding, for a table inside a sidenav's main). Project default via `ShipConfig.layoutTableView.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--tv-py",
        defaultValue: "var(--pad-y-7)"
      },
      {
        name: "--tv-px",
        defaultValue: "var(--pad-x-7)"
      },
      {
        name: "--tv-gap",
        defaultValue: "var(--space-4)"
      }
    ],
    examples: [
      {
        name: "table-view-sandbox",
        html: '<sh-lo-table-view [variant]="variant()">\n  <h2>Customers</h2>\n  <p>Everyone with an active or past subscription.</p>\n  <ng-container actions>\n    <button shButton variant="outlined">\n      <sh-icon>download-simple</sh-icon>\n      Export\n    </button>\n    <button shButton variant="raised" color="primary">\n      <sh-icon>plus</sh-icon>\n      Add customer\n    </button>\n  </ng-container>\n\n  <div filters>\n    <sh-form-field class="small search">\n      <sh-icon prefix>magnifying-glass</sh-icon>\n      <input placeholder="Search name or email" [value]="query()" (input)="query.set($any($event.target).value)" />\n    </sh-form-field>\n    <sh-button-group class="small" [(value)]="status">\n      <button value="">All</button>\n      <button value="Active">Active</button>\n      <button value="Trial">Trial</button>\n      <button value="Churned">Churned</button>\n    </sh-button-group>\n  </div>\n\n  <sh-lo-toolbar>\n    <sh-checkbox [checked]="allSelected()" (checkedChange)="toggleAll($event)" />\n    @if (selected().size) {\n      <span>{{ selected().size }} selected</span>\n      <sh-divider />\n      <button shButton shTooltip="Email">\n        <sh-icon>envelope-simple</sh-icon>\n      </button>\n      <button shButton shTooltip="Add tag">\n        <sh-icon>tag</sh-icon>\n      </button>\n      <button shButton shTooltip="Delete">\n        <sh-icon>trash</sh-icon>\n      </button>\n    } @else {\n      <span>Select rows for bulk actions</span>\n    }\n  </sh-lo-toolbar>\n\n  <sh-table [data]="rows()">\n    <tr thead class="sticky">\n      <th></th>\n      <th>Name</th>\n      <th>Email</th>\n      <th>Plan</th>\n      <th>Status</th>\n      <th>MRR</th>\n      <th>Joined</th>\n    </tr>\n\n    @for (row of rows(); track row.id) {\n      <tr>\n        <td>\n          <sh-checkbox [checked]="selected().has(row.id)" (checkedChange)="toggle(row.id, $event)" />\n        </td>\n        <td>\n          <span class="name">\n            <sh-avatar [name]="row.name" size="small" />\n            {{ row.name }}\n          </span>\n        </td>\n        <td>{{ row.email }}</td>\n        <td>{{ row.plan }}</td>\n        <td>\n          <sh-chip size="small" variant="simple" [color]="statusColor[row.status]">{{ row.status }}</sh-chip>\n        </td>\n        <td>{{ row.mrr }}</td>\n        <td>{{ row.joined }}</td>\n      </tr>\n    }\n\n    <div table-no-rows>No customers match your filters.</div>\n  </sh-table>\n\n  <ng-container footer>\n    <span>Showing {{ rows().length }} of {{ customers.length }} customers</span>\n    <span class="pager">\n      <button shButton size="small" variant="outlined" disabled>\n        <sh-icon>caret-left</sh-icon>\n      </button>\n      <button shButton size="small" variant="outlined">\n        <sh-icon>caret-right</sh-icon>\n      </button>\n    </span>\n  </ng-container>\n</sh-lo-table-view>\n',
        ts: "import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';\nimport { ShipColor, ShipLayoutTableViewVariant } from '@ship-ui/core';\nimport { ShipAvatar } from '@ship-ui/core/ship-avatar';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipButtonGroup } from '@ship-ui/core/ship-button-group';\nimport { ShipCheckbox } from '@ship-ui/core/ship-checkbox';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipDivider } from '@ship-ui/core/ship-divider';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutTableView, ShipLayoutToolbar } from '@ship-ui/core/ship-layout';\nimport { ShipTable } from '@ship-ui/core/ship-table';\nimport { ShipTooltip } from '@ship-ui/core/ship-tooltip';\n\ntype Status = 'Active' | 'Trial' | 'Churned';\n\ninterface Customer {\n  id: number;\n  name: string;\n  email: string;\n  plan: string;\n  status: Status;\n  mrr: string;\n  joined: string;\n}\n\n@Component({\n  selector: 'app-table-view-sandbox',\n  imports: [\n    ShipLayoutTableView,\n    ShipLayoutToolbar,\n    ShipTable,\n    ShipAvatar,\n    ShipButton,\n    ShipButtonGroup,\n    ShipCheckbox,\n    ShipChip,\n    ShipDivider,\n    ShipFormField,\n    ShipIcon,\n    ShipTooltip,\n  ],\n  templateUrl: './table-view-sandbox.html',\n  styleUrl: './table-view-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TableViewSandbox {\n  variant = input<ShipLayoutTableViewVariant>('');\n\n  query = signal('');\n  status = signal<'' | Status>('');\n  selected = signal(new Set<number>());\n\n  statusColor: Record<Status, ShipColor> = { Active: 'success', Trial: 'primary', Churned: 'error' };\n\n  customers: Customer[] = [\n    {\n      id: 1,\n      name: 'Sofia Lund',\n      email: 'sofia@northwind.io',\n      plan: 'Team',\n      status: 'Active',\n      mrr: '$240',\n      joined: 'Mar 3, 2025',\n    },\n    {\n      id: 2,\n      name: 'Mads Holm',\n      email: 'mads@holm.dk',\n      plan: 'Pro',\n      status: 'Active',\n      mrr: '$49',\n      joined: 'Apr 18, 2025',\n    },\n    {\n      id: 3,\n      name: 'Freja Berg',\n      email: 'freja@bergdesign.com',\n      plan: 'Pro',\n      status: 'Trial',\n      mrr: '$0',\n      joined: 'Sep 21, 2026',\n    },\n    {\n      id: 4,\n      name: 'Jonas Krog',\n      email: 'jonas@krog.io',\n      plan: 'Enterprise',\n      status: 'Active',\n      mrr: '$1,200',\n      joined: 'Jan 9, 2024',\n    },\n    {\n      id: 5,\n      name: 'Ida Moller',\n      email: 'ida@studio-m.com',\n      plan: 'Team',\n      status: 'Churned',\n      mrr: '$0',\n      joined: 'Jun 2, 2025',\n    },\n    {\n      id: 6,\n      name: 'Emil Dahl',\n      email: 'emil@dahl.co',\n      plan: 'Pro',\n      status: 'Active',\n      mrr: '$49',\n      joined: 'Jul 14, 2025',\n    },\n    {\n      id: 7,\n      name: 'Clara Skov',\n      email: 'clara@skovlabs.com',\n      plan: 'Team',\n      status: 'Trial',\n      mrr: '$0',\n      joined: 'Sep 25, 2026',\n    },\n    {\n      id: 8,\n      name: 'Oscar Friis',\n      email: 'oscar@friis.dev',\n      plan: 'Pro',\n      status: 'Active',\n      mrr: '$49',\n      joined: 'Nov 30, 2025',\n    },\n    {\n      id: 9,\n      name: 'Alma Juhl',\n      email: 'alma@juhl.io',\n      plan: 'Enterprise',\n      status: 'Active',\n      mrr: '$980',\n      joined: 'Feb 11, 2025',\n    },\n    {\n      id: 10,\n      name: 'Noah Vang',\n      email: 'noah@vang.net',\n      plan: 'Pro',\n      status: 'Churned',\n      mrr: '$0',\n      joined: 'Aug 5, 2025',\n    },\n    {\n      id: 11,\n      name: 'Ella Riis',\n      email: 'ella@riis.studio',\n      plan: 'Team',\n      status: 'Active',\n      mrr: '$240',\n      joined: 'Oct 22, 2025',\n    },\n    {\n      id: 12,\n      name: 'Viktor Lind',\n      email: 'viktor@lind.app',\n      plan: 'Pro',\n      status: 'Trial',\n      mrr: '$0',\n      joined: 'Sep 27, 2026',\n    },\n  ];\n\n  rows = computed(() => {\n    const q = this.query().trim().toLowerCase();\n    const status = this.status();\n    return this.customers.filter(\n      (c) =>\n        (!status || c.status === status) &&\n        (!q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))\n    );\n  });\n\n  allSelected = computed(() => {\n    const rows = this.rows();\n    return rows.length > 0 && rows.every((row) => this.selected().has(row.id));\n  });\n\n  toggle(id: number, checked: boolean) {\n    const next = new Set(this.selected());\n    if (checked) next.add(id);\n    else next.delete(id);\n    this.selected.set(next);\n  }\n\n  toggleAll(checked: boolean) {\n    this.selected.set(checked ? new Set(this.rows().map((row) => row.id)) : new Set());\n  }\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutTimeline",
    selector: "sh-lo-timeline",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-timeline.ts",
    description: "Activity feed: a column of `sh-lo-timeline-item`s joined by a line.",
    inputs: [
      {
        name: "variant",
        type: "ShipLayoutTimelineVariant | null",
        description: "Visual variant: `type-b` no connecting line (plain list), `type-c` compact single-line items. Project default via `ShipConfig.layoutTimeline.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--timeline-gap",
        defaultValue: "var(--space-5)"
      },
      {
        name: "--timeline-marker-si",
        defaultValue: "#{p2r(32)}"
      },
      {
        name: "--timeline-line-c",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--timeline-line-w",
        defaultValue: "#{p2r(2)}"
      },
      {
        name: "--avatar-si",
        defaultValue: "var(--timeline-marker-si)"
      }
    ],
    examples: [
      {
        name: "timeline-sandbox",
        html: '<sh-card>\n  <sh-lo-timeline [variant]="variant()">\n    <sh-lo-timeline-item>\n      <sh-avatar name="Alex Rivera" />\n      <b>Alex Rivera invited 3 teammates</b>\n      <time>2 min ago</time>\n    </sh-lo-timeline-item>\n    <sh-lo-timeline-item>\n      <sh-icon>rocket-launch</sh-icon>\n      <b>Deployed v2.4.0 to production</b>\n      <time>1 hour ago</time>\n      <p>14 commits, 3 contributors. No regressions reported.</p>\n    </sh-lo-timeline-item>\n    <sh-lo-timeline-item>\n      <b>Goal "1k signups" reached</b>\n      <time>Yesterday</time>\n    </sh-lo-timeline-item>\n  </sh-lo-timeline>\n</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipLayoutTimelineVariant } from '@ship-ui/core';\nimport { ShipAvatar } from '@ship-ui/core/ship-avatar';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutTimeline, ShipLayoutTimelineItem } from '@ship-ui/core/ship-layout';\n\n@Component({\n  selector: 'app-timeline-sandbox',\n  imports: [ShipLayoutTimeline, ShipLayoutTimelineItem, ShipCard, ShipAvatar, ShipIcon],\n  templateUrl: './timeline-sandbox.html',\n  styleUrl: '../sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TimelineSandbox {\n  variant = input<ShipLayoutTimelineVariant>('');\n}\n"
      },
      {
        name: "page-sandbox",
        html: '<sh-lo-page [variant]="variant()" [size]="size()">\n  <nav>\n    <a href="#">Projects</a>\n    <sh-icon size="small">caret-right</sh-icon>\n    <span>Website redesign</span>\n  </nav>\n  <h1>Website redesign</h1>\n  <p>Kicked off March 3rd. Ships when it ships.</p>\n  <button actions shButton variant="outlined">Share</button>\n  <button actions shButton variant="raised" color="primary">Edit</button>\n\n  <sh-tabs color="primary" [(value)]="tab">\n    <button value="overview">Overview</button>\n    <button value="tasks">Tasks</button>\n    <button value="files">Files</button>\n  </sh-tabs>\n\n  <div class="stats">\n    <sh-lo-stat>\n      <sh-icon>check-circle</sh-icon>\n      <p>Tasks done</p>\n      <h3>42</h3>\n      <sh-chip size="small" variant="raised" color="success">+8 this week</sh-chip>\n    </sh-lo-stat>\n    <sh-lo-stat>\n      <sh-icon>clock</sh-icon>\n      <p>Hours logged</p>\n      <h3>318</h3>\n      <sh-chip size="small" variant="raised" color="primary">on track</sh-chip>\n    </sh-lo-stat>\n    <sh-lo-stat>\n      <sh-icon>calendar</sh-icon>\n      <p>Days left</p>\n      <h3>19</h3>\n    </sh-lo-stat>\n  </div>\n\n  <sh-lo-section>\n    <h2>Recent activity</h2>\n    <p>What the team shipped over the last few days.</p>\n    <button actions shButton size="small" variant="outlined">View all</button>\n\n    <sh-card>\n      <sh-lo-timeline>\n        <sh-lo-timeline-item>\n          <sh-icon>git-merge</sh-icon>\n          <b>Header redesign merged</b>\n          <time>2 hours ago</time>\n        </sh-lo-timeline-item>\n        <sh-lo-timeline-item>\n          <sh-icon>check</sh-icon>\n          <b>Pricing page copy approved</b>\n          <time>Yesterday</time>\n          <p>Signed off by marketing, ready for build.</p>\n        </sh-lo-timeline-item>\n        <sh-lo-timeline-item>\n          <sh-icon>arrows-clockwise</sh-icon>\n          <b>Design tokens synced from Figma</b>\n          <time>3 days ago</time>\n        </sh-lo-timeline-item>\n      </sh-lo-timeline>\n    </sh-card>\n  </sh-lo-section>\n\n  <sh-card aside>\n    <sh-lo-details>\n      <h3>Details</h3>\n      <sh-lo-detail>\n        <dt>Status</dt>\n        <sh-chip size="small" variant="raised" color="primary">In progress</sh-chip>\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Owner</dt>\n        Sofia Lund\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Due</dt>\n        Oct 17, 2026\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Team</dt>\n        Web platform\n      </sh-lo-detail>\n    </sh-lo-details>\n  </sh-card>\n</sh-lo-page>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipLayoutPageSize, ShipLayoutPageVariant } from '@ship-ui/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport {\n  ShipLayoutDetail,\n  ShipLayoutDetails,\n  ShipLayoutPage,\n  ShipLayoutSection,\n  ShipLayoutStat,\n  ShipLayoutTimeline,\n  ShipLayoutTimelineItem,\n} from '@ship-ui/core/ship-layout';\nimport { ShipTabs } from '@ship-ui/core/ship-tabs';\n\n@Component({\n  selector: 'app-page-sandbox',\n  imports: [\n    ShipLayoutPage,\n    ShipLayoutSection,\n    ShipLayoutStat,\n    ShipLayoutDetails,\n    ShipLayoutDetail,\n    ShipLayoutTimeline,\n    ShipLayoutTimelineItem,\n    ShipTabs,\n    ShipCard,\n    ShipChip,\n    ShipButton,\n    ShipIcon,\n  ],\n  templateUrl: './page-sandbox.html',\n  styleUrl: './page-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class PageSandbox {\n  variant = input<ShipLayoutPageVariant>('');\n  size = input<ShipLayoutPageSize>('');\n  tab = signal('overview');\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutTimelineItem",
    selector: "sh-lo-timeline-item",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-timeline.ts",
    description: "One event: `sh-avatar`/`sh-icon` as the marker, `b`/`[title]`, `time`,\nand any further content (e.g. `p`) below.",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: [
      {
        name: "timeline-sandbox",
        html: '<sh-card>\n  <sh-lo-timeline [variant]="variant()">\n    <sh-lo-timeline-item>\n      <sh-avatar name="Alex Rivera" />\n      <b>Alex Rivera invited 3 teammates</b>\n      <time>2 min ago</time>\n    </sh-lo-timeline-item>\n    <sh-lo-timeline-item>\n      <sh-icon>rocket-launch</sh-icon>\n      <b>Deployed v2.4.0 to production</b>\n      <time>1 hour ago</time>\n      <p>14 commits, 3 contributors. No regressions reported.</p>\n    </sh-lo-timeline-item>\n    <sh-lo-timeline-item>\n      <b>Goal "1k signups" reached</b>\n      <time>Yesterday</time>\n    </sh-lo-timeline-item>\n  </sh-lo-timeline>\n</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipLayoutTimelineVariant } from '@ship-ui/core';\nimport { ShipAvatar } from '@ship-ui/core/ship-avatar';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutTimeline, ShipLayoutTimelineItem } from '@ship-ui/core/ship-layout';\n\n@Component({\n  selector: 'app-timeline-sandbox',\n  imports: [ShipLayoutTimeline, ShipLayoutTimelineItem, ShipCard, ShipAvatar, ShipIcon],\n  templateUrl: './timeline-sandbox.html',\n  styleUrl: '../sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TimelineSandbox {\n  variant = input<ShipLayoutTimelineVariant>('');\n}\n"
      },
      {
        name: "page-sandbox",
        html: '<sh-lo-page [variant]="variant()" [size]="size()">\n  <nav>\n    <a href="#">Projects</a>\n    <sh-icon size="small">caret-right</sh-icon>\n    <span>Website redesign</span>\n  </nav>\n  <h1>Website redesign</h1>\n  <p>Kicked off March 3rd. Ships when it ships.</p>\n  <button actions shButton variant="outlined">Share</button>\n  <button actions shButton variant="raised" color="primary">Edit</button>\n\n  <sh-tabs color="primary" [(value)]="tab">\n    <button value="overview">Overview</button>\n    <button value="tasks">Tasks</button>\n    <button value="files">Files</button>\n  </sh-tabs>\n\n  <div class="stats">\n    <sh-lo-stat>\n      <sh-icon>check-circle</sh-icon>\n      <p>Tasks done</p>\n      <h3>42</h3>\n      <sh-chip size="small" variant="raised" color="success">+8 this week</sh-chip>\n    </sh-lo-stat>\n    <sh-lo-stat>\n      <sh-icon>clock</sh-icon>\n      <p>Hours logged</p>\n      <h3>318</h3>\n      <sh-chip size="small" variant="raised" color="primary">on track</sh-chip>\n    </sh-lo-stat>\n    <sh-lo-stat>\n      <sh-icon>calendar</sh-icon>\n      <p>Days left</p>\n      <h3>19</h3>\n    </sh-lo-stat>\n  </div>\n\n  <sh-lo-section>\n    <h2>Recent activity</h2>\n    <p>What the team shipped over the last few days.</p>\n    <button actions shButton size="small" variant="outlined">View all</button>\n\n    <sh-card>\n      <sh-lo-timeline>\n        <sh-lo-timeline-item>\n          <sh-icon>git-merge</sh-icon>\n          <b>Header redesign merged</b>\n          <time>2 hours ago</time>\n        </sh-lo-timeline-item>\n        <sh-lo-timeline-item>\n          <sh-icon>check</sh-icon>\n          <b>Pricing page copy approved</b>\n          <time>Yesterday</time>\n          <p>Signed off by marketing, ready for build.</p>\n        </sh-lo-timeline-item>\n        <sh-lo-timeline-item>\n          <sh-icon>arrows-clockwise</sh-icon>\n          <b>Design tokens synced from Figma</b>\n          <time>3 days ago</time>\n        </sh-lo-timeline-item>\n      </sh-lo-timeline>\n    </sh-card>\n  </sh-lo-section>\n\n  <sh-card aside>\n    <sh-lo-details>\n      <h3>Details</h3>\n      <sh-lo-detail>\n        <dt>Status</dt>\n        <sh-chip size="small" variant="raised" color="primary">In progress</sh-chip>\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Owner</dt>\n        Sofia Lund\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Due</dt>\n        Oct 17, 2026\n      </sh-lo-detail>\n      <sh-lo-detail>\n        <dt>Team</dt>\n        Web platform\n      </sh-lo-detail>\n    </sh-lo-details>\n  </sh-card>\n</sh-lo-page>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipLayoutPageSize, ShipLayoutPageVariant } from '@ship-ui/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport {\n  ShipLayoutDetail,\n  ShipLayoutDetails,\n  ShipLayoutPage,\n  ShipLayoutSection,\n  ShipLayoutStat,\n  ShipLayoutTimeline,\n  ShipLayoutTimelineItem,\n} from '@ship-ui/core/ship-layout';\nimport { ShipTabs } from '@ship-ui/core/ship-tabs';\n\n@Component({\n  selector: 'app-page-sandbox',\n  imports: [\n    ShipLayoutPage,\n    ShipLayoutSection,\n    ShipLayoutStat,\n    ShipLayoutDetails,\n    ShipLayoutDetail,\n    ShipLayoutTimeline,\n    ShipLayoutTimelineItem,\n    ShipTabs,\n    ShipCard,\n    ShipChip,\n    ShipButton,\n    ShipIcon,\n  ],\n  templateUrl: './page-sandbox.html',\n  styleUrl: './page-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class PageSandbox {\n  variant = input<ShipLayoutPageVariant>('');\n  size = input<ShipLayoutPageSize>('');\n  tab = signal('overview');\n}\n"
      }
    ]
  },
  {
    name: "ShipLayoutToolbar",
    selector: "sh-lo-toolbar",
    package: "@ship-ui/core/ship-layout",
    kind: "component",
    path: "projects/ship-ui/ship-layout/ship-toolbar.ts",
    description: 'Gmail-style action bar above a list or table: a single dense line of icon\nbuttons (`button shButton` with an `sh-icon`, `sh-menu`, `sh-button-group`),\ngrouped with `sh-divider`s, an optional `sh-checkbox label="Select all"` at the start, and\n`[end]` content (count, pagination) pushed to the far end. Buttons inside\nare flat until hovered \u2014 no need to set `variant`/`noBg` on them.',
    inputs: [
      {
        name: "variant",
        type: "ShipLayoutToolbarVariant | null",
        description: "Visual variant: `type-b` boxed surface, `type-c` divided (bottom border). Project default via `ShipConfig.layoutToolbar.variant`.",
        defaultValue: "null",
        options: [
          "type-b",
          "type-c",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--toolbar-h",
        defaultValue: "#{p2r(44)}"
      },
      {
        name: "--toolbar-gap",
        defaultValue: "var(--space-1)"
      },
      {
        name: "--toolbar-py",
        defaultValue: "0"
      },
      {
        name: "--toolbar-px",
        defaultValue: "0"
      },
      {
        name: "--toolbar-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--toolbar-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--toolbar-s",
        defaultValue: "var(--shape-2)"
      },
      {
        name: "--toolbar-btn-si",
        defaultValue: "#{p2r(32)}"
      },
      {
        name: "--toolbar-btn-bg-h",
        defaultValue: "var(--base-3)"
      },
      {
        name: "--btn-h",
        defaultValue: "var(--toolbar-btn-si)"
      },
      {
        name: "--btn-mw",
        defaultValue: "var(--toolbar-btn-si)"
      },
      {
        name: "--sheet-bg",
        defaultValue: "transparent"
      },
      {
        name: "--sheet-bc",
        defaultValue: "transparent"
      }
    ],
    examples: [
      {
        name: "toolbar-sandbox",
        html: '<sh-lo-toolbar [variant]="variant()">\n  <sh-checkbox label="Select all" />\n  <sh-menu>\n    <button shButton shTooltip="Select">\n      <sh-icon>caret-down</sh-icon>\n    </button>\n    <ng-container menu>\n      <button>All</button>\n      <button>None</button>\n      <button>Read</button>\n      <button>Unread</button>\n    </ng-container>\n  </sh-menu>\n\n  <sh-divider />\n\n  <button shButton shTooltip="Archive">\n    <sh-icon>archive</sh-icon>\n  </button>\n  <button shButton shTooltip="Report spam">\n    <sh-icon>warning-circle</sh-icon>\n  </button>\n  <button shButton shTooltip="Delete">\n    <sh-icon>trash</sh-icon>\n  </button>\n\n  <sh-divider />\n\n  <button shButton shTooltip="Mark as unread">\n    <sh-icon>envelope-simple</sh-icon>\n  </button>\n  <button shButton shTooltip="Snooze">\n    <sh-icon>clock</sh-icon>\n  </button>\n  <button shButton shTooltip="Add to tasks">\n    <sh-icon>check-circle</sh-icon>\n  </button>\n\n  <sh-divider />\n\n  <button shButton shTooltip="Move to">\n    <sh-icon>folder-simple</sh-icon>\n  </button>\n  <button shButton shTooltip="Labels">\n    <sh-icon>tag</sh-icon>\n  </button>\n  <button shButton shTooltip="More">\n    <sh-icon>dots-three-vertical</sh-icon>\n  </button>\n\n  <ng-container end>\n    <span>1\u201350 of 15,953</span>\n    <button shButton shTooltip="Newer">\n      <sh-icon>caret-left</sh-icon>\n    </button>\n    <button shButton shTooltip="Older">\n      <sh-icon>caret-right</sh-icon>\n    </button>\n  </ng-container>\n</sh-lo-toolbar>\n',
        ts: "import { ChangeDetectionStrategy, Component, input } from '@angular/core';\nimport { ShipLayoutToolbarVariant } from '@ship-ui/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCheckbox } from '@ship-ui/core/ship-checkbox';\nimport { ShipDivider } from '@ship-ui/core/ship-divider';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutToolbar } from '@ship-ui/core/ship-layout';\nimport { ShipMenu } from '@ship-ui/core/ship-menu';\nimport { ShipTooltip } from '@ship-ui/core/ship-tooltip';\n\n@Component({\n  selector: 'app-toolbar-sandbox',\n  imports: [ShipLayoutToolbar, ShipButton, ShipIcon, ShipCheckbox, ShipDivider, ShipMenu, ShipTooltip],\n  templateUrl: './toolbar-sandbox.html',\n  styleUrl: '../sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ToolbarSandbox {\n  variant = input<ShipLayoutToolbarVariant>('');\n}\n"
      },
      {
        name: "table-view-sandbox",
        html: '<sh-lo-table-view [variant]="variant()">\n  <h2>Customers</h2>\n  <p>Everyone with an active or past subscription.</p>\n  <ng-container actions>\n    <button shButton variant="outlined">\n      <sh-icon>download-simple</sh-icon>\n      Export\n    </button>\n    <button shButton variant="raised" color="primary">\n      <sh-icon>plus</sh-icon>\n      Add customer\n    </button>\n  </ng-container>\n\n  <div filters>\n    <sh-form-field class="small search">\n      <sh-icon prefix>magnifying-glass</sh-icon>\n      <input placeholder="Search name or email" [value]="query()" (input)="query.set($any($event.target).value)" />\n    </sh-form-field>\n    <sh-button-group class="small" [(value)]="status">\n      <button value="">All</button>\n      <button value="Active">Active</button>\n      <button value="Trial">Trial</button>\n      <button value="Churned">Churned</button>\n    </sh-button-group>\n  </div>\n\n  <sh-lo-toolbar>\n    <sh-checkbox [checked]="allSelected()" (checkedChange)="toggleAll($event)" />\n    @if (selected().size) {\n      <span>{{ selected().size }} selected</span>\n      <sh-divider />\n      <button shButton shTooltip="Email">\n        <sh-icon>envelope-simple</sh-icon>\n      </button>\n      <button shButton shTooltip="Add tag">\n        <sh-icon>tag</sh-icon>\n      </button>\n      <button shButton shTooltip="Delete">\n        <sh-icon>trash</sh-icon>\n      </button>\n    } @else {\n      <span>Select rows for bulk actions</span>\n    }\n  </sh-lo-toolbar>\n\n  <sh-table [data]="rows()">\n    <tr thead class="sticky">\n      <th></th>\n      <th>Name</th>\n      <th>Email</th>\n      <th>Plan</th>\n      <th>Status</th>\n      <th>MRR</th>\n      <th>Joined</th>\n    </tr>\n\n    @for (row of rows(); track row.id) {\n      <tr>\n        <td>\n          <sh-checkbox [checked]="selected().has(row.id)" (checkedChange)="toggle(row.id, $event)" />\n        </td>\n        <td>\n          <span class="name">\n            <sh-avatar [name]="row.name" size="small" />\n            {{ row.name }}\n          </span>\n        </td>\n        <td>{{ row.email }}</td>\n        <td>{{ row.plan }}</td>\n        <td>\n          <sh-chip size="small" variant="simple" [color]="statusColor[row.status]">{{ row.status }}</sh-chip>\n        </td>\n        <td>{{ row.mrr }}</td>\n        <td>{{ row.joined }}</td>\n      </tr>\n    }\n\n    <div table-no-rows>No customers match your filters.</div>\n  </sh-table>\n\n  <ng-container footer>\n    <span>Showing {{ rows().length }} of {{ customers.length }} customers</span>\n    <span class="pager">\n      <button shButton size="small" variant="outlined" disabled>\n        <sh-icon>caret-left</sh-icon>\n      </button>\n      <button shButton size="small" variant="outlined">\n        <sh-icon>caret-right</sh-icon>\n      </button>\n    </span>\n  </ng-container>\n</sh-lo-table-view>\n',
        ts: "import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';\nimport { ShipColor, ShipLayoutTableViewVariant } from '@ship-ui/core';\nimport { ShipAvatar } from '@ship-ui/core/ship-avatar';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipButtonGroup } from '@ship-ui/core/ship-button-group';\nimport { ShipCheckbox } from '@ship-ui/core/ship-checkbox';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipDivider } from '@ship-ui/core/ship-divider';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutTableView, ShipLayoutToolbar } from '@ship-ui/core/ship-layout';\nimport { ShipTable } from '@ship-ui/core/ship-table';\nimport { ShipTooltip } from '@ship-ui/core/ship-tooltip';\n\ntype Status = 'Active' | 'Trial' | 'Churned';\n\ninterface Customer {\n  id: number;\n  name: string;\n  email: string;\n  plan: string;\n  status: Status;\n  mrr: string;\n  joined: string;\n}\n\n@Component({\n  selector: 'app-table-view-sandbox',\n  imports: [\n    ShipLayoutTableView,\n    ShipLayoutToolbar,\n    ShipTable,\n    ShipAvatar,\n    ShipButton,\n    ShipButtonGroup,\n    ShipCheckbox,\n    ShipChip,\n    ShipDivider,\n    ShipFormField,\n    ShipIcon,\n    ShipTooltip,\n  ],\n  templateUrl: './table-view-sandbox.html',\n  styleUrl: './table-view-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TableViewSandbox {\n  variant = input<ShipLayoutTableViewVariant>('');\n\n  query = signal('');\n  status = signal<'' | Status>('');\n  selected = signal(new Set<number>());\n\n  statusColor: Record<Status, ShipColor> = { Active: 'success', Trial: 'primary', Churned: 'error' };\n\n  customers: Customer[] = [\n    {\n      id: 1,\n      name: 'Sofia Lund',\n      email: 'sofia@northwind.io',\n      plan: 'Team',\n      status: 'Active',\n      mrr: '$240',\n      joined: 'Mar 3, 2025',\n    },\n    {\n      id: 2,\n      name: 'Mads Holm',\n      email: 'mads@holm.dk',\n      plan: 'Pro',\n      status: 'Active',\n      mrr: '$49',\n      joined: 'Apr 18, 2025',\n    },\n    {\n      id: 3,\n      name: 'Freja Berg',\n      email: 'freja@bergdesign.com',\n      plan: 'Pro',\n      status: 'Trial',\n      mrr: '$0',\n      joined: 'Sep 21, 2026',\n    },\n    {\n      id: 4,\n      name: 'Jonas Krog',\n      email: 'jonas@krog.io',\n      plan: 'Enterprise',\n      status: 'Active',\n      mrr: '$1,200',\n      joined: 'Jan 9, 2024',\n    },\n    {\n      id: 5,\n      name: 'Ida Moller',\n      email: 'ida@studio-m.com',\n      plan: 'Team',\n      status: 'Churned',\n      mrr: '$0',\n      joined: 'Jun 2, 2025',\n    },\n    {\n      id: 6,\n      name: 'Emil Dahl',\n      email: 'emil@dahl.co',\n      plan: 'Pro',\n      status: 'Active',\n      mrr: '$49',\n      joined: 'Jul 14, 2025',\n    },\n    {\n      id: 7,\n      name: 'Clara Skov',\n      email: 'clara@skovlabs.com',\n      plan: 'Team',\n      status: 'Trial',\n      mrr: '$0',\n      joined: 'Sep 25, 2026',\n    },\n    {\n      id: 8,\n      name: 'Oscar Friis',\n      email: 'oscar@friis.dev',\n      plan: 'Pro',\n      status: 'Active',\n      mrr: '$49',\n      joined: 'Nov 30, 2025',\n    },\n    {\n      id: 9,\n      name: 'Alma Juhl',\n      email: 'alma@juhl.io',\n      plan: 'Enterprise',\n      status: 'Active',\n      mrr: '$980',\n      joined: 'Feb 11, 2025',\n    },\n    {\n      id: 10,\n      name: 'Noah Vang',\n      email: 'noah@vang.net',\n      plan: 'Pro',\n      status: 'Churned',\n      mrr: '$0',\n      joined: 'Aug 5, 2025',\n    },\n    {\n      id: 11,\n      name: 'Ella Riis',\n      email: 'ella@riis.studio',\n      plan: 'Team',\n      status: 'Active',\n      mrr: '$240',\n      joined: 'Oct 22, 2025',\n    },\n    {\n      id: 12,\n      name: 'Viktor Lind',\n      email: 'viktor@lind.app',\n      plan: 'Pro',\n      status: 'Trial',\n      mrr: '$0',\n      joined: 'Sep 27, 2026',\n    },\n  ];\n\n  rows = computed(() => {\n    const q = this.query().trim().toLowerCase();\n    const status = this.status();\n    return this.customers.filter(\n      (c) =>\n        (!status || c.status === status) &&\n        (!q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))\n    );\n  });\n\n  allSelected = computed(() => {\n    const rows = this.rows();\n    return rows.length > 0 && rows.every((row) => this.selected().has(row.id));\n  });\n\n  toggle(id: number, checked: boolean) {\n    const next = new Set(this.selected());\n    if (checked) next.add(id);\n    else next.delete(id);\n    this.selected.set(next);\n  }\n\n  toggleAll(checked: boolean) {\n    this.selected.set(checked ? new Set(this.rows().map((row) => row.id)) : new Set());\n  }\n}\n"
      },
      {
        name: "inbox-sandbox",
        html: `<sh-lo-inbox [variant]="variant()">
  <nav folders>
    <button shButton variant="raised" color="primary">
      <sh-icon>pencil-simple</sh-icon>
      Compose
    </button>
    <button class="active">
      <sh-icon>tray</sh-icon>
      Inbox
      <span count>{{ unreadCount() }}</span>
    </button>
    <button>
      <sh-icon>star</sh-icon>
      Starred
    </button>
    <button>
      <sh-icon>clock</sh-icon>
      Snoozed
    </button>
    <button>
      <sh-icon>paper-plane-tilt</sh-icon>
      Sent
    </button>
    <button>
      <sh-icon>file-dashed</sh-icon>
      Drafts
      <span count>2</span>
    </button>
  </nav>

  <sh-lo-toolbar variant="type-c">
    <sh-checkbox label="Select all" />
    <button shButton shTooltip="Archive">
      <sh-icon>archive</sh-icon>
    </button>
    <button shButton shTooltip="Delete">
      <sh-icon>trash</sh-icon>
    </button>
    <button shButton shTooltip="Mark as read">
      <sh-icon>envelope-open</sh-icon>
    </button>
    <ng-container end>
      <span>1\u2013{{ mails.length }} of {{ mails.length }}</span>
    </ng-container>
  </sh-lo-toolbar>

  @for (mail of mails; track mail.id) {
    <sh-lo-inbox-item
      [unread]="mail.unread"
      [selected]="readingPane() && openId() === mail.id"
      (click)="openId.set(mail.id)">
      <sh-checkbox [label]="'Select ' + mail.subject" (click)="$event.stopPropagation()" />
      @if (mail.starred) {
        <sh-icon star>star-fill</sh-icon>
      } @else {
        <sh-icon star class="not-starred">star</sh-icon>
      }
      <sh-avatar [name]="mail.from" />
      <span from>{{ mail.from }}</span>
      <h4>{{ mail.subject }}</h4>
      <p>{{ mail.snippet }}</p>
      @if (mail.label) {
        <sh-chip size="small" variant="simple" [color]="mail.labelColor ?? null">{{ mail.label }}</sh-chip>
      }
      <time>{{ mail.time }}</time>
    </sh-lo-inbox-item>
  }

  @if (readingPane() && openMail(); as mail) {
    <article reader class="reader">
      <header>
        <h2>{{ mail.subject }}</h2>
        <button shButton shTooltip="Close" (click)="openId.set(null)">
          <sh-icon>x-circle</sh-icon>
        </button>
      </header>
      <div class="sender">
        <sh-avatar [name]="mail.from" />
        <div>
          <b>{{ mail.from }}</b>
          <small>to me \xB7 {{ mail.time }}</small>
        </div>
      </div>
      <p>{{ mail.snippet }}</p>
      <p>Let me know what you think when you have a minute.</p>
      <div class="reply">
        <button shButton variant="outlined">
          <sh-icon>arrow-bend-up-left</sh-icon>
          Reply
        </button>
        <button shButton variant="outlined">
          <sh-icon>arrow-bend-up-right</sh-icon>
          Forward
        </button>
      </div>
    </article>
  }
</sh-lo-inbox>
`,
        ts: "import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';\nimport { ShipColor, ShipLayoutInboxVariant } from '@ship-ui/core';\nimport { ShipAvatar } from '@ship-ui/core/ship-avatar';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCheckbox } from '@ship-ui/core/ship-checkbox';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipLayoutInbox, ShipLayoutInboxItem, ShipLayoutToolbar } from '@ship-ui/core/ship-layout';\nimport { ShipTooltip } from '@ship-ui/core/ship-tooltip';\n\ninterface Mail {\n  id: number;\n  from: string;\n  subject: string;\n  snippet: string;\n  time: string;\n  unread: boolean;\n  starred: boolean;\n  label?: string;\n  labelColor?: ShipColor;\n}\n\n@Component({\n  selector: 'app-inbox-sandbox',\n  imports: [\n    ShipLayoutInbox,\n    ShipLayoutInboxItem,\n    ShipLayoutToolbar,\n    ShipAvatar,\n    ShipButton,\n    ShipCheckbox,\n    ShipChip,\n    ShipIcon,\n    ShipTooltip,\n  ],\n  templateUrl: './inbox-sandbox.html',\n  styleUrl: './inbox-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InboxSandbox {\n  variant = input<ShipLayoutInboxVariant>('');\n  readingPane = input(true);\n\n  openId = signal<number | null>(1);\n  openMail = computed(() => this.mails.find((mail) => mail.id === this.openId()) ?? null);\n  unreadCount = computed(() => this.mails.filter((mail) => mail.unread).length);\n\n  mails: Mail[] = [\n    {\n      id: 1,\n      from: 'Sofia Lund',\n      subject: 'Design review moved to Thursday',\n      snippet: 'Hey! The design review got pushed to Thursday 14:00, the new header mocks are in Figma.',\n      time: '10:42',\n      unread: true,\n      starred: true,\n      label: 'Work',\n      labelColor: 'primary',\n    },\n    {\n      id: 2,\n      from: 'GitHub',\n      subject: '[ship-ui] PR #412 was merged',\n      snippet: 'feat(ship-layout): stat ring and ranking components merged into main by sp90.',\n      time: '09:15',\n      unread: true,\n      starred: false,\n    },\n    {\n      id: 3,\n      from: 'Mads Holm',\n      subject: 'Pricing page copy',\n      snippet: 'Attached the final copy for the pricing page, marketing signed off this morning.',\n      time: 'Yesterday',\n      unread: false,\n      starred: true,\n      label: 'Marketing',\n      labelColor: 'accent',\n    },\n    {\n      id: 4,\n      from: 'Vercel',\n      subject: 'Deployment ready',\n      snippet: 'Your deployment of ship-docs is live at docs.shipui.com. Build took 48s.',\n      time: 'Yesterday',\n      unread: false,\n      starred: false,\n    },\n    {\n      id: 5,\n      from: 'Freja Berg',\n      subject: 'Lunch on Friday?',\n      snippet: 'Thinking the new ramen place around the corner, 12:30 works for everyone?',\n      time: 'Sep 26',\n      unread: false,\n      starred: false,\n      label: 'Personal',\n      labelColor: 'success',\n    },\n    {\n      id: 6,\n      from: 'Stripe',\n      subject: 'Your September invoice',\n      snippet: 'Your invoice for September is available. Amount due: $49.00.',\n      time: 'Sep 25',\n      unread: false,\n      starred: false,\n    },\n    {\n      id: 7,\n      from: 'Jonas Krog',\n      subject: 'Re: Accessibility audit',\n      snippet: 'Found three focus-order issues on the settings page, notes are in the ticket.',\n      time: 'Sep 24',\n      unread: false,\n      starred: false,\n      label: 'Work',\n      labelColor: 'primary',\n    },\n  ];\n}\n"
      }
    ]
  },
  {
    name: "ShipMenu",
    selector: "sh-menu",
    package: "@ship-ui/core/ship-menu",
    kind: "component",
    path: "projects/ship-ui/ship-menu/ship-menu.ts",
    inputs: [
      {
        name: "asMultiLayer",
        type: "boolean",
        description: "Position the menu as a nested multi-layer flyout (used for submenus).",
        defaultValue: "false"
      },
      {
        name: "openIndicator",
        type: "boolean",
        description: "Show a caret-down indicator on the trigger to signal an openable menu.",
        defaultValue: "false"
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disable the menu so it cannot be opened or interacted with.",
        defaultValue: "false"
      },
      {
        name: "customOptionElementSelectors",
        type: "string[]",
        description: "CSS selectors used to collect the menu's option elements. The default\ntakes every `button` in the projected `[menu]` content except those that\nbelong to an embedded component (a datepicker or a form-field popover),\nwhich bring their own buttons and must not become menu items.",
        defaultValue: "[MENU_OPTION_SELECTOR]"
      },
      {
        name: "keepClickedOptionActive",
        type: "boolean",
        description: "Keep the clicked option marked active after selection instead of resetting.",
        defaultValue: "false"
      },
      {
        name: "closeOnClick",
        type: "boolean",
        description: "Close the menu automatically when an option is clicked.",
        defaultValue: "true"
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "Two-way bound open/closed state of the menu.",
        defaultValue: "false",
        twoWay: true
      },
      {
        name: "label",
        type: "string",
        description: "Accessible name for the combobox trigger. Without it the trigger labels\nitself from its projected content (a combobox has no name from content\nper the accname spec, so it references its own id).",
        defaultValue: "''"
      },
      {
        name: "searchable",
        type: "boolean",
        description: "Enable the search input for filtering and fuzzy-matching options.",
        defaultValue: "false"
      }
    ],
    outputs: [
      {
        name: "closed",
        type: "boolean",
        description: "Emits when the menu closes; `true` when closing via an active selection."
      }
    ],
    methods: [
      {
        name: "open",
        parameters: "",
        returnType: "void",
        description: "Open the menu (no-op when disabled); focuses the search input when searchable."
      },
      {
        name: "nextActiveIndex",
        parameters: "activeIndex: number",
        returnType: "number",
        description: "Returns the next selectable option index after `activeIndex`, skipping disabled options and wrapping around."
      },
      {
        name: "prevActiveIndex",
        parameters: "activeIndex: number",
        returnType: "number",
        description: "Returns the previous selectable option index before `activeIndex`, skipping disabled options and wrapping around."
      }
    ],
    cssVariables: [
      {
        name: "--menu-py",
        defaultValue: "var(--pad-y-3)"
      },
      {
        name: "--menu-px",
        defaultValue: "var(--pad-x-3)"
      },
      {
        name: "--menu-mh",
        defaultValue: "#{p2r(320)}"
      }
    ],
    examples: [
      {
        name: "icon-suffix-menu",
        html: '<sh-menu>\n  <button shButton class="outlined">Open menu</button>\n  <ng-container menu>\n    @for (item of menuItems; track item.value) {\n      <button (click)="select(item)" [class.selected]="selected() === item.value">\n        <sh-icon>circle</sh-icon>\n        {{ item.label }}\n        <span suffix>{{ item.hotkey }}</span>\n      </button>\n    }\n  </ng-container>\n</sh-menu>\n',
        ts: "import { Component, signal } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipMenu } from '@ship-ui/core/ship-menu';\n\n@Component({\n  selector: 'sh-icon-suffix-menu',\n  templateUrl: './icon-suffix-menu.html',\n  styleUrls: ['./icon-suffix-menu.scss'],\n\n  imports: [ShipMenu, ShipIcon, ShipButton],\n})\nexport class IconSuffixMenu {\n  menuItems = [\n    { label: 'Home', value: 'home', hotkey: '\u2318L' },\n    { label: 'Profile', value: 'profile', hotkey: '\u2318K' },\n    { label: 'Settings', value: 'settings', hotkey: '\u2318J' },\n  ];\n\n  selected = signal<string | null>(null);\n\n  select(item: any) {\n    this.selected.set(item.value);\n  }\n}\n"
      },
      {
        name: "daterange-menu-example",
        html: `<sh-menu [(isOpen)]="isOpen" [closeOnClick]="false" [openIndicator]="true">
  <button shButton class="outlined">Date range</button>
  <ng-container menu>
    @for (preset of presets; track preset.days) {
      <button (click)="applyPreset(preset.days)">{{ preset.label }}</button>
    }
    <div title>Custom</div>
    <sh-daterange-input masking="yyyy-MM-dd" (closed)="applyCustom($event)">
      <input type="text" [formField]="rangeForm.start" placeholder="Start" />
      <input type="text" [formField]="rangeForm.end" placeholder="End" />
    </sh-daterange-input>
  </ng-container>
</sh-menu>
<p>Applied: {{ applied().start | date: 'mediumDate' }} \u2013 {{ applied().end | date: 'mediumDate' }}</p>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { form, FormField } from '@angular/forms/signals';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipDaterangeInput } from '@ship-ui/core/ship-datepicker';\nimport { ShipMenu } from '@ship-ui/core/ship-menu';\n\nconst DAY = 86400000;\n\n@Component({\n  selector: 'app-daterange-menu-example',\n  imports: [ShipMenu, ShipButton, ShipDaterangeInput, FormField, DatePipe],\n  templateUrl: './daterange-menu-example.html',\n  styleUrl: './daterange-menu-example.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DaterangeMenuExample {\n  isOpen = signal(false);\n\n  // The daterange input keeps its inputs as parseable date strings, so the\n  // signal form model holds strings too.\n  range = signal({ start: new Date(Date.now() - 7 * DAY).toDateString(), end: new Date().toDateString() });\n  rangeForm = form(this.range);\n\n  applied = signal<{ start: Date | null; end: Date | null }>({\n    start: new Date(this.range().start),\n    end: new Date(this.range().end),\n  });\n\n  presets = [\n    { label: 'Last 7 days', days: 7 },\n    { label: 'Last 30 days', days: 30 },\n    { label: 'Last 90 days', days: 90 },\n  ];\n\n  applyPreset(days: number) {\n    const end = new Date();\n    const start = new Date(Date.now() - days * DAY);\n    this.range.set({ start: start.toDateString(), end: end.toDateString() });\n    this.applied.set({ start, end });\n    this.isOpen.set(false);\n  }\n\n  applyCustom(range: { start: Date | null; end: Date | null }) {\n    if (!range.start || !range.end) return;\n    this.applied.set(range);\n    this.isOpen.set(false);\n  }\n}\n"
      },
      {
        name: "titles-search-menu-example",
        html: '<sh-menu [searchable]="true">\n  <button shButton class="outlined">Menu with Titles and Search</button>\n  <ng-container menu>\n    @for (section of sections; track section.title) {\n      <h3>{{ section.title }}</h3>\n      @for (item of section.items; track item.value) {\n        <button (click)="select(item.value)" [class.selected]="selected === item.value">\n          {{ item.label }}\n        </button>\n      }\n    }\n  </ng-container>\n</sh-menu>\n',
        ts: "import { Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipMenu } from '@ship-ui/core/ship-menu';\n\n@Component({\n  selector: 'sh-titles-search-menu-example',\n  templateUrl: './titles-search-menu-example.html',\n  styleUrls: ['./titles-search-menu-example.scss'],\n  imports: [ShipMenu, ShipButton],\n  standalone: true,\n})\nexport class TitlesSearchMenuExample {\n  sections = [\n    {\n      title: 'Admin',\n      items: [\n        { label: 'Dashboard', value: 'dashboard' },\n        { label: 'Users', value: 'users' },\n        { label: 'Permissions', value: 'permissions' },\n      ]\n    },\n    {\n      title: 'Personal',\n      items: [\n        { label: 'Profile', value: 'profile' },\n        { label: 'Settings', value: 'settings' },\n        { label: 'Security', value: 'security' },\n      ]\n    },\n    {\n      title: 'Support',\n      items: [\n        { label: 'Help Center', value: 'help' },\n        { label: 'Feedback', value: 'feedback' },\n        { label: 'Contact Us', value: 'contact' },\n      ]\n    }\n  ];\n  selected: string | null = null;\n\n  select(value: string) {\n    this.selected = value;\n  }\n}\n"
      },
      {
        name: "search-menu-example",
        html: '<sh-menu [searchable]="true">\n  <button shButton class="outlined">Open searchable menu</button>\n  <ng-container menu>\n    @for (item of filteredItems; track item.value) {\n      <button (click)="select(item)" [class.selected]="selected === item.value">\n        <p>\n          hello world\n          <br />\n          {{ item.label }}\n        </p>\n      </button>\n    }\n  </ng-container>\n</sh-menu>\n\n<sh-menu [searchable]="true">\n  <button shButton class="outlined">Open searchable menu</button>\n  <ng-container menu>\n    @for (item of filteredItems; track item.value) {\n      <button (click)="select(item)" [class.selected]="selected === item.value">\n        <div class="option-col">\n          {{ item.label }} asdlkjadskljjkladsjkldaljkdaslkjad jklsjkl dasjkld as\n          <p>hello world but im extra long so i should wrap to the next line</p>\n        </div>\n      </button>\n    }\n  </ng-container>\n</sh-menu>\n',
        ts: "import { Component } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipMenu } from '@ship-ui/core/ship-menu';\n\n@Component({\n  selector: 'sh-search-menu-example',\n  templateUrl: './search-menu-example.html',\n  styleUrls: ['./search-menu-example.scss'],\n  imports: [FormsModule, ShipMenu, ShipButton],\n\n  standalone: true,\n})\nexport class SearchMenuExample {\n  menuItems = [\n    { label: 'Dashboard', value: 'dashboard' },\n    { label: 'Users', value: 'users' },\n    { label: 'Settings', value: 'settings' },\n    { label: 'Billing', value: 'billing' },\n    { label: 'Support', value: 'support' },\n  ];\n  search = '';\n  selected: string | null = null;\n\n  get filteredItems() {\n    return this.menuItems.filter((item) => item.label.toLowerCase().includes(this.search.toLowerCase()));\n  }\n\n  select(item: any) {\n    this.selected = item.value;\n  }\n}\n"
      },
      {
        name: "multi-layer-menu-example",
        html: '<sh-menu [asMultiLayer]="true">\n  <button shButton class="outlined">Open multi-layer menu</button>\n  <ng-container menu>\n    @for (item of menu; track $index) {\n      @if (item.children) {\n        <sh-menu [asMultiLayer]="true">\n          <button>{{ item.label }}</button>\n          <ng-container menu>\n            @for (sub of item.children; track sub.value) {\n              <button (click)="select(sub)" [class.selected]="selected === sub.value">\n                {{ sub.label }}\n              </button>\n            }\n          </ng-container>\n        </sh-menu>\n      } @else {\n        <button (click)="select(item)" [class.selected]="selected === item.value">\n          {{ item.label }}\n        </button>\n      }\n    }\n  </ng-container>\n</sh-menu>\n',
        ts: "import { Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipMenu } from '@ship-ui/core/ship-menu';\n\n@Component({\n  selector: 'sh-multi-layer-menu-example',\n  templateUrl: './multi-layer-menu-example.html',\n  styleUrls: ['./multi-layer-menu-example.scss'],\n  imports: [ShipMenu, ShipButton],\n\n  standalone: true,\n})\nexport class MultiLayerMenuExample {\n  menu = [\n    {\n      label: 'File',\n      children: [\n        { label: 'New', value: 'new' },\n        { label: 'Open', value: 'open' },\n        { label: 'Exit', value: 'exit' },\n      ],\n    },\n    {\n      label: 'Edit',\n      children: [\n        { label: 'Undo', value: 'undo' },\n        { label: 'Redo', value: 'redo' },\n      ],\n    },\n    { label: 'Help', value: 'help' },\n  ];\n  selected: string | null = null;\n  openSubmenu: number | null = null;\n\n  select(item: any) {\n    this.selected = item.value;\n  }\n\n  toggleSubmenu(idx: number) {\n    this.openSubmenu = this.openSubmenu === idx ? null : idx;\n  }\n}\n"
      },
      {
        name: "toggle-select-menu-example",
        html: '<sh-menu>\n  <button shButton class="outlined">Open toggle select menu</button>\n  <ng-container menu>\n    @for (item of menuItems; track item.value) {\n      <button (click)="toggle($event, item)">\n        <sh-checkbox [checked]="isSelected(item)" class="primary raised">\n          {{ item.label }}\n        </sh-checkbox>\n      </button>\n    }\n  </ng-container>\n</sh-menu>\n',
        ts: "import { Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCheckbox } from '@ship-ui/core/ship-checkbox';\nimport { ShipMenu } from '@ship-ui/core/ship-menu';\n\n@Component({\n  selector: 'sh-toggle-select-menu-example',\n  templateUrl: './toggle-select-menu-example.html',\n  styleUrls: ['./toggle-select-menu-example.scss'],\n  imports: [ShipMenu, ShipButton, ShipCheckbox],\n\n  standalone: true,\n})\nexport class ToggleSelectMenuExample {\n  menuItems = [\n    { label: 'Email Notifications', value: 'email' },\n    { label: 'SMS Alerts', value: 'sms' },\n    { label: 'Push Notifications', value: 'push' },\n  ];\n  selected: Set<string> = new Set();\n\n  toggle($event: MouseEvent, item: any) {\n    $event.stopPropagation();\n\n    if (this.selected.has(item.value)) {\n      this.selected.delete(item.value);\n    } else {\n      this.selected.add(item.value);\n    }\n    // Force change detection for Set\n    this.selected = new Set(this.selected);\n  }\n\n  isSelected(item: any) {\n    return this.selected.has(item.value);\n  }\n}\n"
      },
      {
        name: "base-menu-example",
        html: '<sh-menu>\n  <button shButton class="outlined">Open menu</button>\n  <ng-container menu>\n    @for (item of menuItems; track item.value) {\n      <button (click)="someFunction(item)">\n        {{ item.label }}\n      </button>\n    }\n  </ng-container>\n</sh-menu>\n',
        ts: "import { Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipMenu } from '@ship-ui/core/ship-menu';\n\n@Component({\n  selector: 'base-menu-example',\n  templateUrl: './base-menu-example.html',\n  styleUrls: ['./base-menu-example.scss'],\n\n  imports: [ShipMenu, ShipButton],\n})\nexport class BaseMenuExample {\n  menuItems = [\n    { label: 'Home', value: 'home' },\n    { label: 'Profile', value: 'profile' },\n    { label: 'Settings', value: 'settings' },\n  ];\n\n  someFunction(item: any) {\n    alert(item.label);\n  }\n}\n"
      }
    ],
    keywords: [
      "menu",
      "popup",
      "dropdown",
      "list",
      "context",
      "navigation"
    ]
  },
  {
    name: "ShipPopover",
    selector: "sh-popover",
    package: "@ship-ui/core/ship-popover",
    kind: "component",
    path: "projects/ship-ui/ship-popover/ship-popover.ts",
    description: "### Hover Trigger\n\nUse the\n`onHover`\nattribute or binding to open the popover on hover instead of click.\n\n### Nesting\n\nUse the\n`asMultiLayer`\nattribute to enable nested popover support.\n\n### Centered\n\nUse the\n`centered`\nattribute to center the popover horizontally under (or over) the trigger instead of edge-aligning it.\n\n### Customization\n\nThe\n`options`\nattribute accepts a configuration object with:\n`width`\n,\n`height`\n,\n`closeOnButton`\n, and\n`closeOnEsc`\n.",
    inputs: [
      {
        name: "asMultiLayer",
        type: "boolean",
        description: "Position the popover as a nested multi-layer flyout, preferring side placement.",
        defaultValue: "false"
      },
      {
        name: "asSheetOnMobile",
        type: "boolean",
        description: "Render the popover as a bottom sheet on mobile viewports (\u2264768px).",
        defaultValue: "false"
      },
      {
        name: "centered",
        type: "boolean",
        description: "Prefer centering the popover horizontally under/over the trigger (`bottom center`/`top center`) instead of edge-aligning it.",
        defaultValue: "false"
      },
      {
        name: "disableOpenByClick",
        type: "boolean",
        description: "Prevent the trigger click from toggling the popover (host drives `isOpen`).",
        defaultValue: "false"
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "Two-way bound open/closed state of the popover.",
        defaultValue: "false",
        twoWay: true
      },
      {
        name: "options",
        type: "Partial<ShipPopoverOptions>",
        description: "Behavior options merged over the defaults (width, height, close-on-esc/button/overlay)."
      }
    ],
    outputs: [
      {
        name: "closed",
        type: "void",
        description: "Emits when the popover closes."
      }
    ],
    methods: [],
    cssVariables: [
      {
        name: "--po-py",
        defaultValue: "var(--pad-y-5)"
      },
      {
        name: "--po-px",
        defaultValue: "var(--pad-x-5)"
      },
      {
        name: "--po-overlay",
        defaultValue: "rgb(from var(--dark-text) r g b / 50%)"
      },
      {
        name: "--po-d",
        defaultValue: "block"
      }
    ],
    examples: [
      {
        name: "sh-button-popover",
        html: "<sh-popover>\n  <a shButton>hello im a shButton trigger</a>\n  hello im content\n</sh-popover>\n",
        ts: "import { Component } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipPopover } from '@ship-ui/core/ship-popover';\n\n@Component({\n  selector: 'sh-button-popover',\n  standalone: true,\n  imports: [ShipPopover, ShipButton],\n  templateUrl: './sh-button-popover.html',\n\n  styleUrl: './sh-button-popover.scss',\n})\nexport class ShButtonPopover {}\n"
      },
      {
        name: "centered-popover",
        html: "<sh-popover centered>\n  <button>centered under the trigger</button>\n  hello im centered content\n</sh-popover>\n",
        ts: "import { Component } from '@angular/core';\nimport { ShipPopover } from '@ship-ui/core/ship-popover';\n\n@Component({\n  selector: 'centered-popover',\n  standalone: true,\n  imports: [ShipPopover],\n  templateUrl: './centered-popover.html',\n\n  styleUrl: './centered-popover.scss',\n})\nexport class CenteredPopover {}\n"
      },
      {
        name: "trigger-attribute-popover",
        html: "<sh-popover>\n  <div trigger>hello im a div trigger</div>\n  hello im content\n</sh-popover>\n",
        ts: "import { Component } from '@angular/core';\nimport { ShipPopover } from '@ship-ui/core/ship-popover';\n\n@Component({\n  selector: 'trigger-attribute-popover',\n  standalone: true,\n  imports: [ShipPopover],\n  templateUrl: './trigger-attribute-popover.html',\n\n  styleUrl: './trigger-attribute-popover.scss',\n})\nexport class TriggerAttributePopover {}\n"
      },
      {
        name: "button-popover",
        html: "<sh-popover>\n  <button>hello im a trigger plain button trigger</button>\n  hello im content\n</sh-popover>\n",
        ts: "import { Component } from '@angular/core';\nimport { ShipPopover } from '@ship-ui/core/ship-popover';\n\n@Component({\n  selector: 'button-popover',\n  standalone: true,\n  imports: [ShipPopover],\n  templateUrl: './button-popover.html',\n\n  styleUrl: './button-popover.scss',\n})\nexport class ButtonPopover {}\n"
      }
    ]
  },
  {
    name: "ShipProgressBar",
    selector: "sh-progress-bar",
    package: "@ship-ui/core/ship-progress-bar",
    kind: "component",
    path: "projects/ship-ui/ship-progress-bar/ship-progress-bar.ts",
    inputs: [
      {
        name: "value",
        type: "number | undefined",
        description: "Progress percentage from `0` to `100`; `undefined` renders an indeterminate bar.",
        defaultValue: "undefined"
      },
      {
        name: "label",
        type: "string",
        description: 'Accessible name announced by screen readers (e.g. "Upload progress").',
        defaultValue: "''"
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Color theme of the progress bar (`ShipColor`).",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "Visual sheet variant of the progress bar (`ShipSheetVariant`).",
        defaultValue: "null",
        options: [
          "simple",
          "outlined",
          "flat",
          "raised",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--pb-h",
        defaultValue: "#{p2r(8)}"
      },
      {
        name: "--pb-b",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--pb-bg",
        defaultValue: "var(--base-3)"
      },
      {
        name: "--pb-br",
        defaultValue: "var(--shape-2)"
      },
      {
        name: "--pbt-bg",
        defaultValue: "var(--base-6)"
      },
      {
        name: "--pbt-br",
        defaultValue: "inherit"
      }
    ],
    examples: [
      {
        name: "flat-progress-bar",
        html: '<sh-progress-bar label="Progress" variant="flat" [value]="10" />\n<sh-progress-bar label="Progress" variant="flat" color="primary" [value]="25" />\n<sh-progress-bar label="Progress" variant="flat" color="accent" [value]="50" />\n<sh-progress-bar label="Progress" variant="flat" color="warn" [value]="75" />\n<sh-progress-bar label="Progress" variant="flat" color="error" [value]="90" />\n<sh-progress-bar label="Progress" variant="flat" color="success" [value]="100" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipProgressBar } from '@ship-ui/core/ship-progress-bar';\n\n@Component({\n  selector: 'app-flat-progress-bar',\n  standalone: true,\n  imports: [ShipProgressBar],\n  templateUrl: './flat-progress-bar.html',\n  styleUrl: './flat-progress-bar.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FlatProgressBar {}\n"
      },
      {
        name: "indeterminte-progress-bar",
        html: '<sh-progress-bar label="Progress" class="indeterminate" />\n<sh-progress-bar label="Progress" class="indeterminate" color="primary" />\n<sh-progress-bar label="Progress" class="indeterminate" color="accent" />\n<sh-progress-bar label="Progress" class="indeterminate" color="warn" />\n<sh-progress-bar label="Progress" class="indeterminate" color="error" />\n<sh-progress-bar label="Progress" class="indeterminate" color="success" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipProgressBar } from '@ship-ui/core/ship-progress-bar';\n\n@Component({\n  selector: 'app-indeterminte-progress-bar',\n  imports: [ShipProgressBar],\n  templateUrl: './indeterminte-progress-bar.html',\n  styleUrl: './indeterminte-progress-bar.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class IndeterminteProgressBar {}\n"
      },
      {
        name: "outlined-progress-bar",
        html: '<sh-progress-bar label="Progress" variant="outlined" [value]="10" />\n<sh-progress-bar label="Progress" variant="outlined" color="primary" [value]="25" />\n<sh-progress-bar label="Progress" variant="outlined" color="accent" [value]="50" />\n<sh-progress-bar label="Progress" variant="outlined" color="warn" [value]="75" />\n<sh-progress-bar label="Progress" variant="outlined" color="error" [value]="90" />\n<sh-progress-bar label="Progress" variant="outlined" color="success" [value]="100" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipProgressBar } from '@ship-ui/core/ship-progress-bar';\n\n@Component({\n  selector: 'app-outlined-progress-bar',\n  standalone: true,\n  imports: [ShipProgressBar],\n  templateUrl: './outlined-progress-bar.html',\n  styleUrl: './outlined-progress-bar.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OutlinedProgressBar {}\n"
      },
      {
        name: "base-progress-bar",
        html: '<sh-progress-bar label="Progress" [value]="10" />\n<sh-progress-bar label="Progress" color="primary" [value]="25" />\n<sh-progress-bar label="Progress" color="accent" [value]="50" />\n<sh-progress-bar label="Progress" color="warn" [value]="75" />\n<sh-progress-bar label="Progress" color="error" [value]="90" />\n<sh-progress-bar label="Progress" color="success" [value]="100" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipProgressBar } from '@ship-ui/core/ship-progress-bar';\n\n@Component({\n  selector: 'app-base-progress-bar',\n  standalone: true,\n  imports: [ShipProgressBar],\n  templateUrl: './base-progress-bar.html',\n  styleUrl: './base-progress-bar.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseProgressBar {}\n"
      },
      {
        name: "raised-progress-bar",
        html: '<sh-progress-bar label="Progress" variant="raised" [value]="10" />\n<sh-progress-bar label="Progress" variant="raised" color="primary" [value]="25" />\n<sh-progress-bar label="Progress" variant="raised" color="accent" [value]="50" />\n<sh-progress-bar label="Progress" variant="raised" color="warn" [value]="75" />\n<sh-progress-bar label="Progress" variant="raised" color="error" [value]="90" />\n<sh-progress-bar label="Progress" variant="raised" color="success" [value]="100" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipProgressBar } from '@ship-ui/core/ship-progress-bar';\n\n@Component({\n  selector: 'app-raised-progress-bar',\n  standalone: true,\n  imports: [ShipProgressBar],\n  templateUrl: './raised-progress-bar.html',\n  styleUrl: './raised-progress-bar.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RaisedProgressBar {}\n"
      },
      {
        name: "basic-progress-bar",
        html: '<sh-progress-bar label="Progress" [value]="50" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipProgressBar } from '@ship-ui/core/ship-progress-bar';\n\n@Component({\n  selector: 'app-basic-progress-bar',\n  standalone: true,\n  imports: [ShipProgressBar],\n  templateUrl: './basic-progress-bar.html',\n  styleUrl: './basic-progress-bar.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicProgressBar {}\n"
      }
    ],
    keywords: [
      "progress",
      "bar",
      "loading",
      "indicator",
      "linear",
      "status"
    ]
  },
  {
    name: "ShipRadio",
    selector: "sh-radio",
    package: "@ship-ui/core/ship-radio",
    kind: "component",
    path: "projects/ship-ui/ship-radio/ship-radio.ts",
    inputs: [
      {
        name: "checked",
        type: "boolean",
        description: "Two-way bound checked state of the radio.",
        defaultValue: "false",
        twoWay: true
      },
      {
        name: "label",
        type: "string",
        description: "Accessible name for label-less usage; projected text content is used otherwise.",
        defaultValue: "''"
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Color theme of the radio (`ShipColor`).",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "Visual sheet variant of the radio (`ShipSheetVariant`).",
        defaultValue: "null",
        options: [
          "simple",
          "outlined",
          "flat",
          "raised",
          ""
        ]
      },
      {
        name: "readonly",
        type: "boolean",
        description: "When `true`, the radio is displayed but cannot be changed by the user.",
        defaultValue: "false"
      },
      {
        name: "disabled",
        type: "boolean",
        description: "When `true`, the radio is disabled and non-interactive.",
        defaultValue: "false"
      },
      {
        name: "noInternalInput",
        type: "boolean",
        description: 'When `true`, suppresses the built-in `<input type="radio">` and drives ARIA roles on the host instead.',
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipRangeSlider",
    selector: "sh-range-slider",
    package: "@ship-ui/core/ship-range-slider",
    kind: "component",
    path: "projects/ship-ui/ship-range-slider/ship-range-slider.ts",
    inputs: [
      {
        name: "unit",
        type: "string",
        description: "Unit suffix appended to the displayed min, max and current values (e.g. `%`, `px`).",
        defaultValue: "''"
      },
      {
        name: "value",
        type: "number",
        description: "Two-way bound current value of the slider, kept in sync with the projected range input.",
        defaultValue: "this.#initialDefaultValue",
        twoWay: true
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Color theme of the slider (`ShipColor`).",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipRangeSliderVariant | null",
        description: "Visual variant of the slider (`ShipRangeSliderVariant`).",
        defaultValue: "null",
        options: [
          "simple",
          "base",
          "thick",
          "outlined",
          "flat",
          "raised",
          ""
        ]
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "Size of the slider (`ShipSize`).",
        defaultValue: "null",
        options: [
          "small",
          "xsmall",
          ""
        ]
      },
      {
        name: "sharp",
        type: "boolean | undefined",
        description: "When `true`, renders the slider with sharp (non-rounded) corners.",
        defaultValue: "undefined"
      },
      {
        name: "alwaysShow",
        type: "boolean | undefined",
        description: "When `true`, always shows the value indicator instead of only while interacting.",
        defaultValue: "undefined"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--rs-h",
        defaultValue: "#{p2r(40)}"
      },
      {
        name: "--rs-f",
        defaultValue: "var(--paragraph-30)"
      },
      {
        name: "--rs-unit-g",
        defaultValue: "#{p2r(12)}"
      },
      {
        name: "--rs-unit-c",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--rst",
        defaultValue: "var(--base-3)"
      },
      {
        name: "--rst-bc",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--rst-bg",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--rst-h",
        defaultValue: "#{p2r(8)}"
      },
      {
        name: "--rst-s",
        defaultValue: "calc(var(--shape-2) / 2)"
      },
      {
        name: "--rs-thumb-c",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--rs-thumb-bc",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--rs-thumb-value-bg",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--rs-thumb-arrow",
        defaultValue: "var(--rs-thumb-value-bg)"
      },
      {
        name: "--rs-thumb-value-c",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--rs-thumb-si",
        defaultValue: "#{p2r(16)}"
      },
      {
        name: "--rs-thumb-w",
        defaultValue: "var(--rs-thumb-si)"
      },
      {
        name: "--rs-thumb-s",
        defaultValue: "calc(var(--rs-thumb-w) / 2)"
      }
    ],
    examples: [
      {
        name: "base-range-slider",
        html: '<sh-range-slider>\n  <label for="base-range-demo">Select a value:</label>\n  <input id="base-range-demo" type="range" min="0" max="100" [(ngModel)]="value" />\n</sh-range-slider>\n<p>Selected: {{ value() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';\n\n@Component({\n  selector: 'app-base-range-slider',\n  standalone: true,\n  imports: [FormsModule, ShipRangeSlider],\n  templateUrl: './base-range-slider.html',\n  styleUrl: './base-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseRangeSlider {\n  value = signal(50);\n}\n"
      },
      {
        name: "disabled-range-slider",
        html: '<sh-range-slider>\n  <label for="disabled-range-demo">Disabled value:</label>\n  <input id="disabled-range-demo" type="range" min="0" max="100" [(ngModel)]="value" disabled />\n</sh-range-slider>\n<p>Selected: {{ value() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';\n\n@Component({\n  selector: 'app-disabled-range-slider',\n  standalone: true,\n  imports: [FormsModule, ShipRangeSlider],\n  templateUrl: './disabled-range-slider.html',\n  styleUrl: './disabled-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DisabledRangeSlider {\n  value = signal(10);\n}\n"
      },
      {
        name: "range-slider-sandbox",
        html: '<sh-range-slider\n  [unit]="unit()"\n  [color]="color()"\n  [variant]="variant()"\n  [sharp]="sharp()"\n  [alwaysShow]="alwaysShow()">\n  <label>Sandbox value</label>\n  <input\n    type="range"\n    [min]="min()"\n    [max]="max()"\n    [step]="step()"\n    [(ngModel)]="value"\n    [disabled]="disabled()"\n    [readonly]="readonly()" />\n</sh-range-slider>\n<p>Selected: {{ value() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';\nimport { ShipRangeSliderVariant } from '@ship-ui/core';\n\n@Component({\n  selector: 'app-range-slider-sandbox',\n  standalone: true,\n  imports: [FormsModule, ShipRangeSlider],\n  templateUrl: './range-slider-sandbox.html',\n  styleUrl: './range-slider-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RangeSliderSandbox {\n  value = signal(50);\n  min = input<number | string>(0);\n  max = input<number | string>(100);\n  step = input<number | string>(1);\n  disabled = input(false);\n  readonly = input(false);\n  alwaysShow = input(false);\n  sharp = input(false);\n  unit = input('%');\n  color = input<'primary' | 'accent' | 'warn' | 'success' | 'error'>('primary');\n  variant = input<ShipRangeSliderVariant | null>(null);\n}\n"
      },
      {
        name: "always-show-indicator-range-slider",
        html: '<sh-range-slider class="always-show">\n  <label for="always-show-range-demo">Always show indicator:</label>\n  <input id="always-show-range-demo" type="range" min="0" max="100" [(ngModel)]="value" />\n</sh-range-slider>\n<p>Selected: {{ value() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';\n\n@Component({\n  selector: 'app-always-show-indicator-range-slider',\n  standalone: true,\n  imports: [FormsModule, ShipRangeSlider],\n  templateUrl: './always-show-indicator-range-slider.html',\n  styleUrl: './always-show-indicator-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class AlwaysShowIndicatorRangeSlider {\n  value = signal(33);\n}\n"
      },
      {
        name: "readonly-range-slider",
        html: '<sh-range-slider>\n  <label for="readonly-range-demo">Readonly value:</label>\n  <input id="readonly-range-demo" type="range" min="0" max="100" [(ngModel)]="value" readonly />\n</sh-range-slider>\n<p>Selected: {{ value() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';\n\n@Component({\n  selector: 'app-readonly-range-slider',\n  standalone: true,\n  imports: [FormsModule, ShipRangeSlider],\n  templateUrl: './readonly-range-slider.html',\n  styleUrl: './readonly-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ReadonlyRangeSlider {\n  value = signal(42);\n}\n"
      },
      {
        name: "live-updates-range-slider",
        html: '<sh-range-slider class="primary">\n  <label for="live-range">Driven externally:</label>\n  <input id="live-range" type="range" min="0" max="100" [(ngModel)]="value" />\n</sh-range-slider>\n\n<p>External value (updated every second): {{ value() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';\n\n@Component({\n  selector: 'app-live-updates-range-slider',\n  standalone: true,\n  imports: [FormsModule, ShipRangeSlider],\n  templateUrl: './live-updates-range-slider.html',\n  styleUrl: './live-updates-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class LiveUpdatesRangeSlider implements OnDestroy {\n  // Driven from OUTSIDE the component once per second. The slider's thumb, fill and\n  // indicator must follow every change \u2014 proving the internal state mirrors the model.\n  value = signal(50);\n\n  #timer = setInterval(() => this.value.update((v) => (v >= 100 ? 0 : v + 10)), 1000);\n\n  ngOnDestroy() {\n    clearInterval(this.#timer);\n  }\n}\n"
      },
      {
        name: "float-range-slider",
        html: `<sh-range-slider>
  <label for="float-range-demo">Decimal value:</label>
  <input id="float-range-demo" type="range" min="0" max="1" step="0.01" [(ngModel)]="value" />
</sh-range-slider>
<p>Selected: {{ value() | number: '1.2-2' }}</p>
`,
        ts: "import { DecimalPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';\n\n@Component({\n  selector: 'app-float-range-slider',\n  standalone: true,\n  imports: [FormsModule, ShipRangeSlider, DecimalPipe],\n  templateUrl: './float-range-slider.html',\n  styleUrl: './float-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FloatRangeSlider {\n  value = signal(0.12);\n}\n"
      },
      {
        name: "reactive-range-slider",
        html: '<sh-range-slider>\n  <label for="reactive-range-demo">Select a value (Reactive Form):</label>\n  <input id="reactive-range-demo" type="range" min="0" max="100" [formControl]="control" />\n</sh-range-slider>\n<p>Selected: {{ control.value }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, ReactiveFormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';\n\n@Component({\n  selector: 'app-reactive-range-slider',\n  standalone: true,\n  imports: [ReactiveFormsModule, ShipRangeSlider],\n  templateUrl: './reactive-range-slider.html',\n  styleUrl: './reactive-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ReactiveRangeSlider {\n  control = new FormControl(25);\n}\n"
      },
      {
        name: "signal-form-range-slider",
        html: '<sh-range-slider>\n  <label for="signal-range-demo">Select a value (Signal Form):</label>\n  <input id="signal-range-demo" type="range" [formField]="volumeForm" />\n</sh-range-slider>\n<p>Selected: {{ volume() }}</p>\n@for (error of volumeForm().errors(); track error.kind) {\n  <p class="error">{{ error.message }}</p>\n}\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { form, FormField, max, min, validate } from '@angular/forms/signals';\nimport { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';\n\n@Component({\n  selector: 'app-signal-form-range-slider',\n  imports: [FormField, ShipRangeSlider],\n  templateUrl: './signal-form-range-slider.html',\n  styleUrl: './signal-form-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SignalFormRangeSlider {\n  volume = signal(25);\n  volumeForm = form(this.volume, (path) => {\n    // min/max are reflected onto the native range input by signal forms.\n    min(path, 0);\n    max(path, 100);\n    validate(path, ({ value }) => (value() > 80 ? { kind: 'loud', message: 'Keep it under 80' } : undefined));\n  });\n}\n"
      },
      {
        name: "unit-range-slider",
        html: '<sh-range-slider unit="%">\n  <label for="unit-range-demo">Value with unit:</label>\n  <input id="unit-range-demo" type="range" min="0" max="100" [(ngModel)]="value" />\n</sh-range-slider>\n<p>Selected: {{ value() }}%</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';\n\n@Component({\n  selector: 'app-unit-range-slider',\n  standalone: true,\n  imports: [FormsModule, ShipRangeSlider],\n  templateUrl: './unit-range-slider.html',\n  styleUrl: './unit-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class UnitRangeSlider {\n  value = signal(75);\n}\n"
      }
    ],
    keywords: [
      "range",
      "slider",
      "track",
      "thumb",
      "value",
      "drag",
      "input"
    ]
  },
  {
    name: "ShipScreenreader",
    selector: "sh-screenreader",
    package: "@ship-ui/core/ship-screenreader",
    kind: "component",
    path: "projects/ship-ui/ship-screenreader/ship-screenreader.ts",
    description: "Floating screen-reader simulator panel for accessibility debugging. Drop\nit anywhere in the app during development: it transcribes what assistive\ntech would announce for focus moves and `aria-live` changes, with an\noptional SpeechSynthesis voice-over. The panel removes itself from the\naccessibility tree so it never announces itself.",
    inputs: [
      {
        name: "startEnabled",
        type: "boolean",
        description: "Start the simulator as soon as the panel renders.",
        defaultValue: "false"
      },
      {
        name: "position",
        type: "'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'",
        description: "Screen corner the panel is pinned to.",
        defaultValue: "'bottom-right'",
        options: [
          "bottom-right",
          "bottom-left",
          "top-right",
          "top-left"
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: [
      {
        name: "basic-screenreader",
        html: '<sh-screenreader startEnabled />\n\n<h4>Try it: tab through the controls below</h4>\n\n<div class="playground">\n  <button shButton class="primary raised" [attr.aria-expanded]="expanded()" (click)="toggle()">Settings</button>\n\n  <sh-checkbox class="primary">\n    <input type="checkbox" [formField]="termsForm" />\n    Accept terms\n  </sh-checkbox>\n\n  <sh-form-field>\n    <label>Email</label>\n    <input type="email" [formField]="emailForm" [attr.aria-required]="true" [attr.aria-invalid]="emailInvalid()" />\n  </sh-form-field>\n\n  <sh-list class="primary" listRole="listbox" label="Fruit" [(value)]="fruit">\n    <button value="pears">Pears</button>\n    <button value="apples">Apples</button>\n    <button value="plums">Plums</button>\n  </sh-list>\n\n  <button shButton class="primary" (click)="save()">Save draft (live region)</button>\n</div>\n',
        ts: "import { Component, computed, inject, signal } from '@angular/core';\nimport { form, FormField, required } from '@angular/forms/signals';\nimport { ShipScreenreader } from '@ship-ui/core/ship-screenreader';\nimport { ShipA11yAnnouncerService } from '@ship-ui/core/ship-a11y-announcer';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCheckbox } from '@ship-ui/core/ship-checkbox';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipList } from '@ship-ui/core/ship-list';\n\n@Component({\n  selector: 'basic-screenreader-example',\n  standalone: true,\n  imports: [ShipScreenreader, ShipButton, ShipCheckbox, ShipFormField, ShipList, FormField],\n  templateUrl: './basic-screenreader.html',\n  styleUrl: './basic-screenreader.scss',\n})\nexport class BasicScreenreader {\n  #announcer = inject(ShipA11yAnnouncerService);\n\n  expanded = signal(false);\n  saved = signal(0);\n\n  // Signal forms drive the checkbox and email field; the simulator announces\n  // the states these produce (checked, required, invalid \u2026).\n  terms = signal(true);\n  termsForm = form(this.terms);\n\n  email = signal('foo');\n  emailForm = form(this.email, (path) => {\n    required(path);\n  });\n  emailInvalid = computed(() => !this.email().includes('@'));\n\n  fruit = signal('apples');\n\n  toggle() {\n    this.expanded.update((value) => !value);\n  }\n\n  save() {\n    this.saved.update((count) => count + 1);\n    this.#announcer.announce(`Draft saved (${this.saved()})`);\n  }\n}\n"
      }
    ]
  },
  {
    name: "ShipSelect",
    selector: "sh-select",
    package: "@ship-ui/core/ship-select",
    kind: "component",
    path: "projects/ship-ui/ship-select/ship-select.ts",
    inputs: [
      {
        name: "value",
        type: "string",
        description: "Property path used to read each option's value (e.g. `id`); when unset, the option itself is the value."
      },
      {
        name: "label",
        type: "string",
        description: "Property path used to read each option's display label; when unset, the option itself is shown."
      },
      {
        name: "asFreeText",
        type: "boolean",
        description: "When `true`, allows the user to create new options by typing free text.",
        defaultValue: "false"
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Color theme of the select (`ShipColor`).",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipFormFieldVariant | null",
        description: "Visual variant of the underlying form field (`ShipFormFieldVariant`).",
        defaultValue: "null",
        options: [
          "base",
          "horizontal",
          "auto-width",
          "autosize",
          ""
        ]
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "Size of the select (`ShipSize`).",
        defaultValue: "null",
        options: [
          "small",
          "xsmall",
          ""
        ]
      },
      {
        name: "optionTitle",
        type: "string | null",
        description: "Optional heading shown above the option list.",
        defaultValue: "null"
      },
      {
        name: "freeTextTitle",
        type: "string | null",
        description: "Optional heading shown above the free-text create option.",
        defaultValue: "null"
      },
      {
        name: "freeTextPlaceholder",
        type: "string | null",
        description: "Placeholder text for the free-text create option.",
        defaultValue: "'Type to create a new option'"
      },
      {
        name: "validateFreeText",
        type: "ValidateFreeText",
        description: "Predicate that validates a free-text value before it can be added as a new option."
      },
      {
        name: "placeholder",
        type: "string",
        description: "Placeholder text shown when no option is selected."
      },
      {
        name: "readonly",
        type: "boolean",
        description: "Two-way bound readonly state; when `true`, the value is shown but cannot be changed.",
        defaultValue: "false",
        twoWay: true
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Two-way bound disabled state; when `true`, the select is non-interactive.",
        defaultValue: "false",
        twoWay: true
      },
      {
        name: "lazySearch",
        type: "boolean",
        description: "When `true`, enables server-side/lazy search where filtering is handled externally.",
        defaultValue: "false"
      },
      {
        name: "inlineSearch",
        type: "boolean",
        description: "When `true`, enables client-side inline filtering of the provided options.",
        defaultValue: "false"
      },
      {
        name: "asText",
        type: "boolean",
        description: "When `true`, renders selected values as plain text instead of chips.",
        defaultValue: "false"
      },
      {
        name: "isClearable",
        type: "boolean",
        description: "When `true`, allows clearing the current selection via a clear icon.",
        defaultValue: "true"
      },
      {
        name: "selectMultiple",
        type: "boolean",
        description: "When `true`, allows selecting multiple options.",
        defaultValue: "false"
      },
      {
        name: "optionTemplate",
        type: "TemplateRef<unknown> | null",
        description: "Custom template for rendering each option in the list.",
        defaultValue: "null"
      },
      {
        name: "selectedOptionTemplate",
        type: "TemplateRef<unknown> | null",
        description: "Custom template for rendering the selected option(s) in the trigger.",
        defaultValue: "null"
      },
      {
        name: "placeholderTemplate",
        type: "TemplateRef<unknown> | null",
        description: "Custom template for rendering the placeholder when nothing is selected.",
        defaultValue: "null"
      },
      {
        name: "freeTextOptionTemplate",
        type: "TemplateRef<unknown> | null",
        description: "Custom template for rendering the free-text create option.",
        defaultValue: "null"
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "Two-way bound open state of the options dropdown.",
        defaultValue: "false",
        twoWay: true
      },
      {
        name: "isLoading",
        type: "boolean",
        description: "Two-way bound loading state; shows a spinner while `true`.",
        defaultValue: "false",
        twoWay: true
      },
      {
        name: "options",
        type: "unknown[]",
        description: "Two-way bound list of available options.",
        defaultValue: "[]",
        twoWay: true
      },
      {
        name: "selectedOptions",
        type: "unknown[]",
        description: "Two-way bound list of currently selected options.",
        defaultValue: "[]",
        twoWay: true
      }
    ],
    outputs: [
      {
        name: "cleared",
        type: "void",
        description: "Emits when the selection is cleared."
      },
      {
        name: "onAddNewFreeTextOption",
        type: "string",
        description: "Emits the value of a newly created free-text option."
      }
    ],
    methods: [
      {
        name: "setSelectedOptionsFromValue",
        parameters: "value: string",
        returnType: "void",
        description: "Resolves the selected option(s) by matching the given comma-separated value against the options."
      },
      {
        name: "setInputValueFromOptions",
        parameters: "options: unknown[]",
        returnType: "void",
        description: "Updates the input value to the comma-joined values of the given options."
      }
    ],
    cssVariables: [
      {
        name: "--select-miw",
        defaultValue: "#{p2r(210)}"
      },
      {
        name: "--select-option-mih",
        defaultValue: "min-content"
      },
      {
        name: "--select-options-mh",
        defaultValue: "#{p2r(180)}"
      },
      {
        name: "--ff-mw",
        defaultValue: "var(--select-miw)"
      },
      {
        name: "--ff-py",
        defaultValue: "var(--pad-y-3)"
      },
      {
        name: "--ff-px",
        defaultValue: "var(--pad-x-2)"
      },
      {
        name: "--chip-h",
        defaultValue: "#{p2r(20)}"
      },
      {
        name: "--select-py",
        defaultValue: "var(--pad-y-2)"
      },
      {
        name: "--select-px",
        defaultValue: "var(--pad-x-4)"
      }
    ],
    examples: [
      {
        name: "inline-search-select",
        html: '<sh-select [options]="options()" label="label" value="value" [inlineSearch]="true">\n  <label>Favorite food (inline search)</label>\n  <input type="text" [(ngModel)]="selected" />\n</sh-select>\n\n<p>Selected: {{ selected() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\n\n@Component({\n  selector: 'app-inline-search-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect],\n  templateUrl: './inline-search-select.html',\n  styleUrl: './inline-search-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InlineSearchSelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n    { value: 'pasta', label: 'Pasta' },\n    { value: 'salad', label: 'Salad' },\n    { value: 'sandwich', label: 'Sandwich' },\n  ]);\n  selected = signal('pizza');\n\n  ngOnInit(): void {\n    setTimeout(() => {\n      this.selected.set('burger');\n    }, 1000);\n  }\n}\n"
      },
      {
        name: "disabled-select",
        html: '<sh-select [options]="options()" label="label" value="value">\n  <label>Favorite food (disabled)</label>\n  <input type="text" [(ngModel)]="selected" [disabled]="true" />\n</sh-select>\n\n<p>Selected: {{ selected() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\n\n@Component({\n  selector: 'app-disabled-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect],\n  templateUrl: './disabled-select.html',\n  styleUrl: './disabled-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DisabledSelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n  ]);\n  selected = signal('pizza');\n}\n"
      },
      {
        name: "multiple-select",
        html: `<sh-select color="primary" [options]="options()" label="label" value="value" [selectMultiple]="true">
  <label>
    Favorite foods (multiple)
    <sh-icon class="primary" [shTooltip]="'hello im a description'">question</sh-icon>
  </label>

  <input type="text" [(ngModel)]="selected" />
</sh-select>
<sh-select color="primary" [options]="options()" label="label" value="value" [selectMultiple]="true">
  <label>
    Favorite foods (multiple) another
    <sh-icon class="primary" [shTooltip]="'hello im a description'">question</sh-icon>
  </label>

  <input type="text" [(ngModel)]="selected" />
</sh-select>
<p>Selected: {{ selected() | json }}</p>
`,
        ts: "import { JsonPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\nimport { ShipTooltip } from '@ship-ui/core/ship-tooltip';\n\n@Component({\n  selector: 'app-multiple-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect, JsonPipe, ShipIcon, ShipTooltip],\n  templateUrl: './multiple-select.html',\n  styleUrl: './multiple-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class MultipleSelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n  ]);\n  selected = signal<string[]>(['pizza,burger']);\n}\n"
      },
      {
        name: "option-template-select",
        html: '<sh-select [options]="options()" label="label" value="value">\n  <label>Favorite food (custom option template)</label>\n  <input type="text" [(ngModel)]="selected" />\n  <ng-template let-option>\n    <span>{{ option.emoji }} {{ option.label }}</span>\n  </ng-template>\n</sh-select>\n\n<p>Selected: {{ selected() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\n\n@Component({\n  selector: 'app-option-template-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect],\n  templateUrl: './option-template-select.html',\n  styleUrl: './option-template-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OptionTemplateSelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza', emoji: '\u{1F355}' },\n    { value: 'burger', label: 'Burger', emoji: '\u{1F354}' },\n    { value: 'sushi', label: 'Sushi', emoji: '\u{1F363}' },\n  ]);\n  selected = signal('pizza');\n}\n"
      },
      {
        name: "placeholder-template-select",
        html: '<sh-select\n  [options]="options()"\n  label="label"\n  value="value"\n  [optionTemplate]="optionTemplate"\n  [placeholderTemplate]="placeholderTemplate">\n  <label>Favorite food (custom option template)</label>\n  <input type="text" [(ngModel)]="selected" />\n</sh-select>\n\n<ng-template let-option #optionTemplate>\n  <span>{{ option.emoji }} {{ option.label }}</span>\n</ng-template>\n\n<ng-template let-option #placeholderTemplate>\n  <div class="custom-option">Hell im a custom placeholder template \u{1F642}\u200D\u2194\uFE0F\u{1F642}\u200D\u2194\uFE0F</div>\n</ng-template>\n\n<p>Selected: {{ selected() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\n\n@Component({\n  selector: 'app-placeholder-template-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect],\n  templateUrl: './placeholder-template-select.html',\n  styleUrl: './placeholder-template-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class PlaceholderTemplateSelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza', emoji: '\u{1F355}' },\n    { value: 'burger', label: 'Burger', emoji: '\u{1F354}' },\n    { value: 'sushi', label: 'Sushi', emoji: '\u{1F363}' },\n  ]);\n  selected = signal('');\n}\n"
      },
      {
        name: "signal-form-select",
        html: `<sh-select [options]="options()" label="label" value="value">
  <label>Favorite food (signal form)</label>
  <input type="text" [formField]="foodForm" />
</sh-select>

<p>Selected: {{ food() || '\u2014' }}</p>
<p>Valid: {{ foodForm().valid() }}</p>
@for (error of foodForm().errors(); track error.kind) {
  <p class="error">{{ error.message }}</p>
}
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { form, FormField, required } from '@angular/forms/signals';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\n\n@Component({\n  selector: 'app-signal-form-select',\n  imports: [FormField, ShipSelect],\n  templateUrl: './signal-form-select.html',\n  styleUrl: './signal-form-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SignalFormSelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n  ]);\n\n  food = signal('');\n  foodForm = form(this.food, (path) => {\n    required(path, { message: 'Pick a food' });\n  });\n}\n"
      },
      {
        name: "reactive-select-disabled",
        html: '<sh-select [options]="options()" label="label" value="value">\n  <label>Favorite food (reactive form)</label>\n\n  <input type="text" [formControl]="control" />\n</sh-select>\n\n<p>Selected: {{ control.value }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormControl, ReactiveFormsModule } from '@angular/forms';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\n\n@Component({\n  selector: 'app-reactive-select-disabled',\n  standalone: true,\n  imports: [ReactiveFormsModule, ShipSelect],\n  templateUrl: './reactive-select-disabled.html',\n  styleUrl: './reactive-select-disabled.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ReactiveSelectDisabled {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n  ]);\n  control = new FormControl({\n    value: 'pizza',\n    disabled: true,\n  });\n}\n"
      },
      {
        name: "multiple-select-as-text",
        html: `<sh-select
  [options]="options()"
  label="value"
  value="value"
  [inlineSearch]="true"
  [selectMultiple]="true"
  [asText]="true"
  [asFreeText]="true"
  [freeTextTitle]="'Invite new user'"
  [optionTitle]="'Existing users'">
  <label>Favorite foods (multiple)</label>

  <input type="text" [(ngModel)]="selected" />
</sh-select>

<p>Selected: {{ selected() | json }}</p>
`,
        ts: "import { JsonPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\n\n@Component({\n  selector: 'app-multiple-select-as-text',\n  standalone: true,\n  imports: [FormsModule, ShipSelect, JsonPipe],\n  templateUrl: './multiple-select-as-text.html',\n  styleUrl: './multiple-select-as-text.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class MultipleSelectAsText {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n  ]);\n  selected = signal<string[]>(['pizza,burger']);\n}\n"
      },
      {
        name: "lazy-search-multiple-select",
        html: '<sh-select\n  [options]="options()"\n  label="label"\n  value="value"\n  [lazySearch]="true"\n  [selectMultiple]="true"\n  [isLoading]="resource.isLoading()">\n  <label>Favorite foods (lazy search, multiple)</label>\n  <input type="text" [(ngModel)]="lazySearchOption" />\n</sh-select>\n\n@if (resource.isLoading()) {\n  <p>Searching: {{ lazySearchOption() }}</p>\n} @else {\n  <p>Selected: {{ lazySearchOption() | json }}</p>\n}\n',
        ts: "import { JsonPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { rxResource } from '@angular/core/rxjs-interop';\nimport { FormsModule } from '@angular/forms';\nimport { delay, map, of } from 'rxjs';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\n\nconst DEFAULT_OPTIONS = [\n  { value: 'pizza', label: 'Pizza' },\n  { value: 'burger', label: 'Burger' },\n  { value: 'sushi', label: 'Sushi' },\n  { value: 'pasta', label: 'Pasta' },\n  { value: 'salad', label: 'Salad' },\n  { value: 'sandwich', label: 'Sandwich' },\n];\n@Component({\n  selector: 'app-lazy-search-multiple-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect, JsonPipe],\n  templateUrl: './lazy-search-multiple-select.html',\n  styleUrl: './lazy-search-multiple-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class LazySearchMultipleSelect {\n  lazySearchOption = signal('');\n\n  options = computed(() => (this.resource.hasValue() ? this.resource.value() : DEFAULT_OPTIONS));\n  resource = rxResource({\n    params: () => ({\n      query: this.lazySearchOption(),\n    }),\n    stream: ({ params }) => {\n      const search = params.query.toLowerCase();\n\n      return of(DEFAULT_OPTIONS).pipe(\n        delay(200),\n        map((res) => res.filter((opt) => opt.label.toLowerCase().includes(search)))\n      );\n    },\n  });\n}\n"
      },
      {
        name: "readonly-select",
        html: '<sh-select [options]="options()" label="label" value="value" [readonly]="true">\n  <label>Favorite food (readonly)</label>\n  <input type="text" [(ngModel)]="selected" />\n</sh-select>\n\n<p>Selected: {{ selected() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\n\n@Component({\n  selector: 'app-readonly-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect],\n  templateUrl: './readonly-select.html',\n  styleUrl: './readonly-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ReadonlySelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n  ]);\n  selected = signal('pizza');\n}\n"
      },
      {
        name: "inline-search-multiple-select",
        html: '<sh-select [options]="options()" label="label" value="value" [inlineSearch]="true" [selectMultiple]="true">\n  <label>Favorite foods (inline search, multiple)</label>\n  <input type="text" [(ngModel)]="selected" />\n</sh-select>\n\n<p>Selected: {{ selected() | json }}</p>\n',
        ts: "import { JsonPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\n\n@Component({\n  selector: 'app-inline-search-multiple-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect, JsonPipe],\n  templateUrl: './inline-search-multiple-select.html',\n  styleUrl: './inline-search-multiple-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InlineSearchMultipleSelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n    { value: 'pasta', label: 'Pasta' },\n    { value: 'salad', label: 'Salad' },\n    { value: 'sandwich', label: 'Sandwich' },\n  ]);\n  selected = signal<string[]>(['pizza']);\n}\n"
      },
      {
        name: "reactive-select",
        html: '<sh-select [options]="options()" label="label" value="value">\n  <label>Favorite food (reactive form)</label>\n\n  <input type="text" [formControl]="control" />\n</sh-select>\n\n<p>Selected: {{ control.value }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormControl, ReactiveFormsModule } from '@angular/forms';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\n\n@Component({\n  selector: 'app-reactive-select',\n  standalone: true,\n  imports: [ReactiveFormsModule, ShipSelect],\n  templateUrl: './reactive-select-example.html',\n  styleUrl: './reactive-select-example.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ReactiveSelectComponent {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n  ]);\n  control = new FormControl('pizza');\n}\n"
      },
      {
        name: "multiple-select-ellipsis",
        html: '<sh-select\n  class="ellipsis"\n  [options]="options()"\n  label="label"\n  value="value"\n  [selectMultiple]="true"\n  [asText]="true">\n  <label>Favorite foods (comma separated, truncated)</label>\n\n  <input type="text" [(ngModel)]="selected" />\n</sh-select>\n\n<p>Selected: {{ selected() | json }}</p>\n',
        ts: "import { JsonPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\n\n@Component({\n  selector: 'app-multiple-select-ellipsis',\n  standalone: true,\n  imports: [FormsModule, ShipSelect, JsonPipe],\n  templateUrl: './multiple-select-ellipsis.html',\n  styleUrl: './multiple-select-ellipsis.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class MultipleSelectEllipsis {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n    { value: 'tacos', label: 'Tacos' },\n    { value: 'ramen', label: 'Ramen' },\n    { value: 'pasta', label: 'Pasta' },\n    { value: 'salad', label: 'Salad' },\n  ]);\n  selected = signal<string[]>(['pizza', 'burger', 'sushi', 'tacos', 'ramen', 'pasta']);\n}\n"
      },
      {
        name: "base-select",
        html: '<sh-select [options]="options()" label="label" value="value">\n  <label>Favorite food</label>\n  <sh-icon prefix>desktop-tower</sh-icon>\n\n  <input type="text" [(ngModel)]="selected" (ngModelChange)="hello($event)" />\n</sh-select>\n\n<p>Selected: {{ selected() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\n\n@Component({\n  selector: 'app-base-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect, ShipIcon],\n  templateUrl: './base-select.html',\n  styleUrl: './base-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseSelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n  ]);\n  selected = signal('pizza');\n\n  hello(val: any) {\n    console.log('updated', val);\n  }\n}\n"
      },
      {
        name: "object-select",
        html: '<sh-select\n  [options]="options()"\n  label="name"\n  value="id"\n  [isClearable]="false"\n  (selectedOptionsChange)="newSelectedOptions($event)">\n  <label>Favorite food (object options, not clearable)</label>\n  <input type="text" [(ngModel)]="selected" />\n</sh-select>\n\n<p>Selected: {{ selected() }}</p>\n<pre>{{ selectedObject() | json }}</pre>\n',
        ts: "import { JsonPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\n\n@Component({\n  selector: 'app-object-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect, JsonPipe],\n  templateUrl: './object-select.html',\n  styleUrl: './object-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ObjectSelect {\n  options = signal([\n    { id: '1', name: 'Pizza' },\n    { id: '2', name: 'Burger' },\n    { id: '3', name: 'Sushi' },\n  ]);\n\n  selected = signal<string>('1');\n  selectedObject = computed(() => {\n    return this.options().find((opt) => opt.id === this.selected());\n  });\n\n  newSelectedOptions($event?: any) {\n    console.log('new selected options', $event);\n  }\n}\n"
      },
      {
        name: "lazy-search-select",
        html: '<sh-select [options]="options()" label="label" value="value" [lazySearch]="true" [isLoading]="resource.isLoading()">\n  <label>Favorite food (lazy search)</label>\n  <input type="text" [(ngModel)]="lazySearchOption" />\n</sh-select>\n\n@if (resource.isLoading()) {\n  <p>Searching: {{ lazySearchOption() }}</p>\n} @else {\n  <p>Selected: {{ lazySearchOption() }}</p>\n}\n',
        ts: "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { rxResource } from '@angular/core/rxjs-interop';\nimport { FormsModule } from '@angular/forms';\nimport { delay, map, of } from 'rxjs';\nimport { ShipSelect } from '@ship-ui/core/ship-select';\n\nconst DEFAULT_OPTIONS = [\n  { value: 'pizza', label: 'Pizza' },\n  { value: 'burger', label: 'Burger' },\n  { value: 'sushi', label: 'Sushi' },\n  { value: 'pasta', label: 'Pasta' },\n  { value: 'salad', label: 'Salad' },\n  { value: 'sandwich', label: 'Sandwich' },\n];\n@Component({\n  selector: 'app-lazy-search-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect],\n  templateUrl: './lazy-search-select.html',\n  styleUrl: './lazy-search-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class LazySearchSelect {\n  lazySearchOption = signal('pizza');\n\n  options = computed(() => (this.resource.hasValue() ? this.resource.value() : DEFAULT_OPTIONS));\n  resource = rxResource({\n    params: () => ({\n      query: this.lazySearchOption(),\n    }),\n    stream: ({ params }) => {\n      const search = params.query.toLowerCase();\n\n      return of(DEFAULT_OPTIONS).pipe(\n        delay(200),\n        map((res) => res.filter((opt) => opt.label.toLowerCase().includes(search)))\n      );\n    },\n  });\n}\n"
      }
    ],
    keywords: [
      "select",
      "dropdown",
      "option",
      "choices",
      "picker",
      "combo",
      "combo box",
      "listbox",
      "select box"
    ]
  },
  {
    name: "ShipSheetCheckboxCell",
    selector: "sh-sheet-checkbox-cell",
    package: "@ship-ui/core/ship-spreadsheet",
    kind: "component",
    path: "projects/ship-ui/ship-spreadsheet/cells/sheet-checkbox.ts",
    description: "The built-in checkbox type's renderer: one `sh-checkbox` instance per\nvisible cell, so the box is the library's own (its stylesheet arrives\nwith the instance \u2014 nothing to restate in a host). The grid owns the\ninteraction: the cell is inert, a click, Enter or Space toggles through\nthe extension's `activate`, so the checkbox is read-only and has no\ninput of its own.",
    inputs: [
      {
        name: "value",
        type: "string",
        description: "",
        defaultValue: "''"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipSheetSelectCell",
    selector: "sh-sheet-select-cell",
    package: "@ship-ui/core/ship-spreadsheet",
    kind: "component",
    path: "projects/ship-ui/ship-spreadsheet/cells/sheet-select.ts",
    description: "The select column's read-only cell: the option's label as a small\n`sh-chip` coloured through `--chip-c` (`dynamic` when the option carries\na colour), `unknown` for a key not among the options, nothing when empty.",
    inputs: [
      {
        name: "value",
        type: "string",
        description: "",
        defaultValue: "''"
      },
      {
        name: "extension",
        type: "SheetCellExtension",
        description: ""
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--chip-c",
        defaultValue: "var(--error-8)"
      }
    ],
    examples: []
  },
  {
    name: "ShipSheetSelectEditor",
    selector: "sh-sheet-select-editor",
    package: "@ship-ui/core/ship-spreadsheet",
    kind: "component",
    path: "projects/ship-ui/ship-spreadsheet/cells/sheet-select.ts",
    description: "The select column's editor: an `sh-menu` of the options opened over the\ncell. Arrows move, Enter picks, Escape or a click elsewhere cancels; the\ncharacter that opened the editor seeds the menu's search. A pick commits\nthe option's key and stays on the cell.",
    inputs: [
      {
        name: "value",
        type: "string",
        description: "",
        defaultValue: "''"
      },
      {
        name: "ctx",
        type: "SheetCellContext",
        description: ""
      },
      {
        name: "typed",
        type: "string | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "extension",
        type: "SheetCellExtension",
        description: ""
      },
      {
        name: "editor",
        type: "SheetCellEditorApi",
        description: ""
      }
    ],
    outputs: [],
    methods: [
      {
        name: "readValue",
        parameters: "",
        returnType: "string",
        description: "A Tab or a click elsewhere keeps the cell's value."
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipSidenav",
    selector: "sh-sidenav",
    package: "@ship-ui/core/ship-sidenav",
    kind: "component",
    path: "projects/ship-ui/ship-sidenav/ship-sidenav.ts",
    description: "### Variants\n\nSidenavs support multiple behaviors via the\n`variant`\nattribute:\n\n<li>\n**default**\n: Fixed position, non-toggleable.\n</li>\n<li>\n**simple**\n: Support for toggling width (e.g., icon-only vs. full expanded view).\n</li>\n<li>\n**overlay**\n: Overlays content when opened and supports swipe-to-close gestures.\n</li>\n\n### Drag Interaction\n\nUse the\n`disableDrag`\nattribute/binding to disable swipe gestures on the\n**overlay**\nvariant.",
    inputs: [
      {
        name: "disableDrag",
        type: "boolean",
        description: "When `true`, disables drag/swipe gestures for opening and closing the sidenav.",
        defaultValue: "false"
      },
      {
        name: "openWidth",
        type: "number",
        description: "Width in px the sidenav opens to. Also drives the drag threshold.",
        defaultValue: "280"
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "Two-way bound open/closed state of the sidenav.",
        defaultValue: "false",
        twoWay: true
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--sidenav-py",
        defaultValue: "var(--pad-y-5)"
      },
      {
        name: "--sidenav-px",
        defaultValue: "var(--pad-x-4)"
      },
      {
        name: "--sidenav-open-w",
        defaultValue: "#{p2r(280)}"
      },
      {
        name: "--sidenav-w",
        defaultValue: "var(--sidenav-open-w)"
      },
      {
        name: "--sidenav-wrap-w",
        defaultValue: "100vw"
      },
      {
        name: "--sidenav-wrap-h",
        defaultValue: "100dvh"
      }
    ],
    examples: [
      {
        name: "sandbox-sidenav",
        html: '<sh-sidenav [class]="sidenavType()" [(isOpen)]="isNavOpen" [disableDrag]="disableDrag()">\n  <ng-container sidenav>\n    <sh-list>\n      <a><sh-icon>squares-four</sh-icon>Dashboard</a>\n      <a><sh-icon>folder</sh-icon>Projects</a>\n      <a><sh-icon>chart-bar</sh-icon>Reports</a>\n      <a><sh-icon>gear</sh-icon>Settings</a>\n    </sh-list>\n  </ng-container>\n\n  <ng-container sidenav-closed-topbar><button (click)="isNavOpen.set(!isNavOpen())">hello</button></ng-container>\n\n  hello world\n</sh-sidenav>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipList } from '@ship-ui/core/ship-list';\nimport { ShipSidenav, ShipSidenavType } from '@ship-ui/core/ship-sidenav';\n\n@Component({\n  selector: 'app-sandbox-sidenav',\n  imports: [ShipIcon, ShipList, ShipSidenav],\n  templateUrl: './sandbox-sidenav.html',\n  styleUrl: './sandbox-sidenav.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SandboxSidenav {\n  sidenavType = input<ShipSidenavType>('simple');\n  isNavOpen = model(false);\n  disableDrag = input(false);\n}\n"
      },
      {
        name: "overlay-sidenav",
        html: '<sh-sidenav class="overlay" [(isOpen)]="isNavOpen">\n  <ng-container sidenav>\n    <div style="padding: 16px;">\n      <h3>Overlay</h3>\n      <sh-list>\n        <a><sh-icon>squares-four</sh-icon>Dashboard</a>\n        <a><sh-icon>folder</sh-icon>Projects</a>\n        <a><sh-icon>chart-bar</sh-icon>Reports</a>\n        <a><sh-icon>gear</sh-icon>Settings</a>\n      </sh-list>\n    </div>\n  </ng-container>\n\n  <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">\n    <button shButton class="primary" (click)="isNavOpen.set(true)">Open Overlay Sidenav</button>\n    <p>This variant completely overlays the content and provides a backdrop scrim that dismisses the nav on click.</p>\n  </div>\n</sh-sidenav>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipList } from '@ship-ui/core/ship-list';\nimport { ShipSidenav } from '@ship-ui/core/ship-sidenav';\n\n@Component({\n  selector: 'app-overlay-sidenav',\n  imports: [ShipIcon, ShipList, ShipSidenav, ShipButton],\n  templateUrl: './overlay-sidenav.html',\n  styleUrl: './overlay-sidenav.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OverlaySidenav {\n  isNavOpen = signal(false);\n}\n"
      },
      {
        name: "default-sidenav",
        html: '<sh-sidenav [(isOpen)]="isNavOpen">\n  <ng-container sidenav>\n    <div style="padding: 16px;">\n      <h3>Default Nav</h3>\n      <sh-list>\n        <a><sh-icon>squares-four</sh-icon>Dashboard</a>\n        <a><sh-icon>folder</sh-icon>Projects</a>\n        <a><sh-icon>chart-bar</sh-icon>Reports</a>\n        <a><sh-icon>gear</sh-icon>Settings</a>\n      </sh-list>\n    </div>\n  </ng-container>\n\n  <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">\n    <button shButton class="primary" (click)="isNavOpen.set(!isNavOpen())">Toggle Sidenav</button>\n    <p>This is the default fixed position sidenav variant.</p>\n  </div>\n</sh-sidenav>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipList } from '@ship-ui/core/ship-list';\nimport { ShipSidenav } from '@ship-ui/core/ship-sidenav';\nimport { ShipButton } from '@ship-ui/core/ship-button';\n\n@Component({\n  selector: 'app-default-sidenav',\n  imports: [ShipIcon, ShipList, ShipSidenav, ShipButton],\n  templateUrl: './default-sidenav.html',\n  styleUrl: './default-sidenav.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DefaultSidenav {\n  isNavOpen = signal(true);\n}\n"
      },
      {
        name: "simple-sidenav",
        html: '<sh-sidenav class="simple" [(isOpen)]="isNavOpen">\n  <ng-container sidenav>\n    <div style="padding: 16px;">\n      <h3>Simple</h3>\n      <sh-list [class.collapsed]="!isNavOpen()">\n        <a><sh-icon>squares-four</sh-icon>Dashboard</a>\n        <a><sh-icon>folder</sh-icon>Projects</a>\n        <a><sh-icon>chart-bar</sh-icon>Reports</a>\n        <a><sh-icon>gear</sh-icon>Settings</a>\n      </sh-list>\n    </div>\n  </ng-container>\n\n  <ng-container sidenav-closed-topbar>\n    <button shButton class="simple icon" (click)="isNavOpen.set(!isNavOpen())" aria-label="Toggle navigation">\n      <sh-icon>list</sh-icon>\n    </button>\n  </ng-container>\n\n  <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">\n    <button shButton class="primary" (click)="isNavOpen.set(!isNavOpen())">Toggle Simple Sidenav</button>\n    <p>This variant supports collapsing gracefully down to either an icon-only mode or top-bar mode based on breakpoints.</p>\n  </div>\n</sh-sidenav>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipList } from '@ship-ui/core/ship-list';\nimport { ShipSidenav } from '@ship-ui/core/ship-sidenav';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\n@Component({\n  selector: 'app-simple-sidenav',\n  imports: [ShipList, ShipSidenav, ShipButton, ShipIcon],\n  templateUrl: './simple-sidenav.html',\n  styleUrl: './simple-sidenav.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SimpleSidenav {\n  isNavOpen = signal(true);\n}\n"
      }
    ]
  },
  {
    name: "ShipSpinner",
    selector: "sh-spinner",
    package: "@ship-ui/core/ship-spinner",
    kind: "component",
    path: "projects/ship-ui/ship-spinner/ship-spinner.ts",
    description: "### Size & Thickness\n\nCustomize the spinner appearance using CSS variables:\n`--spinner-size`\nand\n`--spinner-thickness`\n.\n\n### Colors\n\nSpinner colors can be set using the\n`color`\nattribute. Valid options are:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**error**\n, and\n**success**\n.",
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "Color theme applied to the spinner.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--spinner-c",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--spinner-size",
        defaultValue: "#{p2r(40)}"
      },
      {
        name: "--spinner-thickness",
        defaultValue: "#{p2r(5)}"
      }
    ],
    examples: [
      {
        name: "sandbox-spinner",
        html: '<div class="content">\n  <sh-spinner [style.--spinner-thickness]="thicknessAsPixels()" [style.--spinner-size]="sizeAsPixels()"></sh-spinner>\n  <sh-spinner\n    [style.--spinner-thickness]="thicknessAsPixels()"\n    [style.--spinner-size]="sizeAsPixels()"\n    color="primary"></sh-spinner>\n  <sh-spinner\n    [style.--spinner-thickness]="thicknessAsPixels()"\n    [style.--spinner-size]="sizeAsPixels()"\n    color="accent"></sh-spinner>\n  <sh-spinner\n    [style.--spinner-thickness]="thicknessAsPixels()"\n    [style.--spinner-size]="sizeAsPixels()"\n    color="warn"></sh-spinner>\n  <sh-spinner\n    [style.--spinner-thickness]="thicknessAsPixels()"\n    [style.--spinner-size]="sizeAsPixels()"\n    color="error"></sh-spinner>\n  <sh-spinner\n    [style.--spinner-thickness]="thicknessAsPixels()"\n    [style.--spinner-size]="sizeAsPixels()"\n    color="success"></sh-spinner>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';\nimport { ShipSpinner } from '@ship-ui/core/ship-spinner';\n\n@Component({\n  selector: 'app-sandbox-spinner',\n  imports: [ShipSpinner],\n  templateUrl: './sandbox-spinner.html',\n  styleUrl: './sandbox-spinner.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SandboxSpinner {\n  size = input(40);\n  sizeAsPixels = computed(() => `${this.size()}px`);\n\n  thickness = input(5);\n  thicknessAsPixels = computed(() => `${this.thickness()}px`);\n}\n"
      },
      {
        name: "basic-spinner",
        html: "<sh-spinner></sh-spinner>\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipSpinner } from '@ship-ui/core/ship-spinner';\n\n@Component({\n  selector: 'app-basic-spinner',\n  standalone: true,\n  imports: [ShipSpinner],\n  templateUrl: './basic-spinner.html',\n  styleUrl: './basic-spinner.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicSpinner {}\n"
      }
    ]
  },
  {
    name: "ShipSpotlight",
    selector: "sh-spotlight",
    package: "@ship-ui/core/ship-spotlight",
    kind: "component",
    path: "projects/ship-ui/ship-spotlight/ship-spotlight.ts",
    inputs: [
      {
        name: "data",
        type: "ShipSpotlightServiceOptions",
        description: "Bulk configuration object; convenient when opening the spotlight from the service. Individual inputs below take precedence when both are set."
      },
      {
        name: "items",
        type: "ShipSpotlightItem[]",
        description: "The searchable items to display, grouped by their optional `category`.",
        defaultValue: "[]"
      },
      {
        name: "placeholder",
        type: "string",
        description: "Placeholder text shown in the search field while it is empty.",
        defaultValue: "'Search actions, settings, or pages...'"
      },
      {
        name: "customFilter",
        type: "boolean",
        description: "Disable the built-in fuzzy filtering and emit the raw query instead \u2014 bind `searchQuery` to filter items yourself (e.g. for a remote API).",
        defaultValue: "false"
      },
      {
        name: "searchQuery",
        type: "string",
        description: "Two-way bound current search text. Read it to drive custom filtering; write it to preset or clear the query.",
        defaultValue: "''",
        twoWay: true
      }
    ],
    outputs: [
      {
        name: "itemSelected",
        type: "ShipSpotlightItem",
        description: "Emits the chosen item when the user selects a result."
      },
      {
        name: "closed",
        type: "void",
        description: "Emits when the spotlight overlay is dismissed."
      }
    ],
    methods: [
      {
        name: "scrollToActiveItem",
        parameters: "",
        returnType: "void",
        description: "Scrolls the currently active result into view within the results list."
      }
    ],
    cssVariables: [],
    examples: [
      {
        name: "basic-spotlight",
        html: `<sh-card variant="type-c">
  <div>
    <button shButton (click)="openSpotlight()">Open Declarative Spotlight</button>
    <span class="hint-text">
      Or press
      <sh-kbd meta>K</sh-kbd>
      to trigger globally
    </span>
  </div>

  @if (selectedItem()) {
    <div class="selected-item">
      Selected Item:
      <strong>{{ selectedItem()?.label }}</strong>
      (ID:
      <code>{{ selectedItem()?.id }}</code>
      )
    </div>
  }
</sh-card>

<sh-dialog [(isOpen)]="isOpen" [options]="{ class: 'spotlight-dialog', width: '600px', maxWidth: '90vw' }">
  <sh-spotlight [items]="items" (itemSelected)="onItemSelected($event)" (closed)="onClosed()" />
</sh-dialog>
`,
        ts: "import { Component, signal } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipDialog } from '@ship-ui/core/ship-dialog';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipSpotlight, ShipSpotlightItem } from '@ship-ui/core/ship-spotlight';\nimport { ShipKbd } from '@ship-ui/core/ship-kbd';\n\n@Component({\n  selector: 'basic-spotlight-example',\n  standalone: true,\n  imports: [ShipButton, ShipDialog, ShipSpotlight, ShipCard, ShipKbd],\n  templateUrl: './basic-spotlight.html',\n  styleUrl: './basic-spotlight.scss',\n})\nexport class BasicSpotlightExample {\n  isOpen = signal(false);\n  selectedItem = signal<ShipSpotlightItem | null>(null);\n\n  items: ShipSpotlightItem[] = [\n    { id: 'welcome', label: 'Welcome to Ship', category: 'Navigation', icon: 'hand-waving', description: 'Go to the welcome guide page', shortcut: 'g+w' },\n    { id: 'start', label: 'Getting Started', category: 'Navigation', icon: 'play', description: 'Learn how to install and configure ShipUI' },\n    { id: 'theme', label: 'Open Theme Editor', category: 'Actions', icon: 'paint-roller', description: 'Customize component styling and design tokens', shortcut: 'meta+e' },\n    { id: 'buttons', label: 'View Buttons', category: 'Components', icon: 'plus', description: 'Check out the Button sandbox examples' },\n    { id: 'dialogs', label: 'View Dialogs', category: 'Components', icon: 'info', description: 'Check out the Dialog sandbox examples' },\n    { id: 'profile', label: 'View Profile', category: 'Settings', icon: 'gear', description: 'Edit your account settings and preferences', shortcut: 'meta+p' },\n    { id: 'logout', label: 'Log Out', category: 'Settings', icon: 'trash', description: 'Safely end your session' }\n  ];\n\n  openSpotlight() {\n    this.isOpen.set(true);\n  }\n\n  onItemSelected(item: ShipSpotlightItem) {\n    this.selectedItem.set(item);\n    this.isOpen.set(false);\n  }\n\n  onClosed() {\n    this.isOpen.set(false);\n  }\n}\n"
      },
      {
        name: "service-spotlight",
        html: '<sh-card variant="type-c">\n  <div>\n    <button shButton (click)="openSpotlight()">Open Manual Spotlight</button>\n    <span class="hint-text">\n      Or press\n      <sh-kbd meta>K</sh-kbd>\n      to trigger globally\n    </span>\n  </div>\n\n  <div class="toggle-group">\n    <sh-toggle [checked]="isShortcutsEnabled()" (checkedChange)="onShortcutsToggle($event)">\n      Global Keyboard Shortcuts\n    </sh-toggle>\n    <span class="hint-text">When active, Cmd+K opens the global spotlight search.</span>\n  </div>\n\n  <div class="toggle-group">\n    <sh-toggle [checked]="isContextualActive()" (checkedChange)="onContextualToggle($event)">\n      Register Contextual Items (Overwrite)\n    </sh-toggle>\n\n    <span class="hint-text">When active, Cmd+K will only show contextual items.</span>\n  </div>\n\n  @if (selectedItem()) {\n    <div class="selected-item">\n      Selected Item:\n      <strong>{{ selectedItem()?.label }}</strong>\n      (ID:\n      <code>{{ selectedItem()?.id }}</code>\n      )\n    </div>\n  }\n</sh-card>\n',
        ts: "import { Component, OnDestroy, effect, inject, signal } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCard } from '@ship-ui/core/ship-card';\nimport { ShipSpotlightItem, ShipSpotlightService } from '@ship-ui/core/ship-spotlight';\nimport { ShipToggle } from '@ship-ui/core/ship-toggle';\nimport { ShipKbd } from '@ship-ui/core/ship-kbd';\n\n@Component({\n  selector: 'service-spotlight-example',\n  standalone: true,\n  imports: [ShipButton, ShipCard, ShipToggle, ShipKbd],\n  templateUrl: './service-spotlight.html',\n  styleUrl: './service-spotlight.scss',\n})\nexport class ServiceSpotlightExample implements OnDestroy {\n  #spotlight = inject(ShipSpotlightService);\n\n  selectedItem = signal<ShipSpotlightItem | null>(null);\n\n  isContextualActive = this.#spotlight.hasOverwriteItems;\n  isShortcutsEnabled = this.#spotlight.isShortcutsEnabled;\n\n  items: ShipSpotlightItem[] = [\n    {\n      id: 'welcome',\n      label: 'Welcome to Ship (Service)',\n      category: 'Navigation',\n      icon: 'hand-waving',\n      description: 'Go to the welcome guide page',\n    },\n    {\n      id: 'start',\n      label: 'Getting Started',\n      category: 'Navigation',\n      icon: 'play',\n      description: 'Learn how to install and configure ShipUI',\n    },\n    {\n      id: 'new-file',\n      label: 'Create New Document',\n      category: 'Actions',\n      icon: 'plus',\n      description: 'Open file creation workflow',\n      shortcut: 'meta+e',\n    },\n    {\n      id: 'search-users',\n      label: 'Search Users',\n      category: 'Actions',\n      icon: 'magnifying-glass',\n      description: 'Find registered users in directory',\n    },\n    {\n      id: 'general-settings',\n      label: 'General Preferences',\n      category: 'Settings',\n      icon: 'gear',\n      description: 'Edit core preferences',\n      shortcut: 'meta+,',\n    },\n  ];\n\n  contextualItems: ShipSpotlightItem[] = [\n    {\n      id: 'ctx-1',\n      label: 'Contextual Action 1',\n      category: 'Page Actions',\n      icon: 'sparkle',\n      description: 'Available only on this page',\n    },\n    {\n      id: 'ctx-2',\n      label: 'Contextual Settings',\n      category: 'Page Settings',\n      icon: 'gear',\n      description: 'Specific to this view',\n    },\n  ];\n\n  #globalSelectedItemsEffect = effect(() => {\n    const item = this.#spotlight.globalItemSelected();\n    if (item) {\n      this.selectedItem.set(item);\n    }\n  });\n\n  constructor() {\n    this.#spotlight.registerItems(this.items);\n  }\n\n  ngOnDestroy() {\n    this.#spotlight.disableGlobalShortcuts();\n  }\n\n  openSpotlight() {\n    const spotlightRef = this.#spotlight.open({\n      placeholder: 'Search files, users or settings...',\n    });\n\n    spotlightRef.itemSelected.subscribe((item) => {\n      this.selectedItem.set(item);\n    });\n  }\n\n  onContextualToggle(checked: boolean) {\n    if (checked) {\n      this.#spotlight.setContextualItems(this.contextualItems, true);\n    } else {\n      this.#spotlight.clearContextualItems();\n    }\n  }\n\n  onShortcutsToggle(checked: boolean) {\n    if (checked) {\n      this.#spotlight.enableGlobalShortcuts();\n    } else {\n      this.#spotlight.disableGlobalShortcuts();\n    }\n  }\n}\n"
      }
    ],
    keywords: [
      "spotlight",
      "command palette",
      "global search",
      "kbd",
      "shortcut",
      "command",
      "navigation"
    ]
  },
  {
    name: "ShipSpreadsheet",
    selector: "sh-spreadsheet",
    package: "@ship-ui/core/ship-spreadsheet",
    kind: "component",
    path: "projects/ship-ui/ship-spreadsheet/ship-spreadsheet.ts",
    description: "`<sh-spreadsheet>` \u2014 the spreadsheet surface. An immutable `SheetModel`\nin, display state (selection) alongside; two `ShipVirtualWindow`\ninstances \u2014 one per axis, the column one horizontal \u2014 drive the\nvirtualized window exactly as `sh-code` virtualizes lines.\n\nBy default it is the lean read-only renderer: mouse and keyboard move a\nrectangular selection, the native copy event writes TSV + `<table>`\nclipboard flavors. With `editable`, the same surface becomes the\ncomposer: typing, Enter, or F2 opens an in-cell editor floated over the\nactive cell from the same prefix sums the selection boxes use; Delete\nclears; paste fills from TSV or a `<table>` (growing the grid to fit);\nheaders resize by drag and open a context menu for row/column\nstructure; Cmd/Ctrl+Z walks a history built from op inverses.\n\nEvery change is a `SheetOp[]` transaction: it is applied to `sheet`\n(a two-way model) and emitted through `ops`, so a host can persist,\nlog, or relay it. Concurrent changes from elsewhere arrive through\n`applyRemote`, which rebases the history over them with\n`transformSheetOps` instead of discarding it.\n\nCells stay raw strings: what the model holds is the source text, so ops,\nclipboard, and the `<table>` form never see a computed value. A cell\nwhose text starts with `=` is a formula: a `SheetEvaluator` kept in step\nwith the model derives its value (`values`), the grid shows the value or\nthe error token, and the in-cell editor and the formula bar show the\nsource. How a column's strings look and edit is a `SheetCellExtension`\nresolved from the column's type (`colTypes`) through the registry built\nfrom `extensions` \u2014 text by default, checkbox and the formatted types\nbuilt in; a formula in a typed column formats its evaluated value.",
    inputs: [
      {
        name: "sheet",
        type: "SheetModel",
        description: "The sheet snapshot. Two-way: the composer writes every transaction back\nhere. A model set from outside (a load, an editor undo) is adopted as\nis and clears the local history; a model the composer produced itself\nis recognized and leaves it intact.",
        twoWay: true
      },
      {
        name: "selection",
        type: "SheetSelection | null",
        description: "Two-way bound selection, `null` when nothing is selected. Mouse gestures\nfollow the spreadsheet conventions: click selects, drag sweeps,\nShift+click moves the active range's far corner, Cmd/Ctrl+click starts\nan additional range. Keyboard: arrows move, Shift+arrows extend.",
        defaultValue: "null",
        twoWay: true
      },
      {
        name: "defaultColWidth",
        type: "number",
        description: "Width for columns without an explicit width.",
        defaultValue: "96"
      },
      {
        name: "defaultRowHeight",
        type: "number",
        description: "Height for rows without an explicit height.",
        defaultValue: "28"
      },
      {
        name: "headers",
        type: "boolean | readonly string[]",
        description: "The header rails: `true` for A/B/C over the columns and 1/2/3 down the\nrows, `false` for none, or the column labels themselves (`['Title',\n'Status', \u2026]`, a column past the list falls back to its letter) for a\ndatabase view. Cell addresses stay A1-style whatever the labels.",
        defaultValue: "true"
      },
      {
        name: "letters",
        type: "boolean",
        description: "With labelled `headers`, `false` drops the letter and row-number rails:\nthe label row is the only chrome. With `headers: true` it hides both.",
        defaultValue: "true"
      },
      {
        name: "rowClass",
        type: "((row: number) => string | null | undefined) | null",
        description: "Extra classes for a row element (`.shs-row`), by row index \u2014 a group heading, a done record.",
        defaultValue: "null"
      },
      {
        name: "rowKind",
        type: "((row: number) => SheetRowKind | null | undefined) | null",
        description: "What kind of row a row is (`SheetRowKind`), by index; `null`/`undefined` for an ordinary one.",
        defaultValue: "null"
      },
      {
        name: "selectable",
        type: "boolean",
        description: "When `false`, mouse and keyboard selection is off \u2014 pure display surface.",
        defaultValue: "true"
      },
      {
        name: "editable",
        type: "boolean",
        description: "Turns the renderer into the composer: cell editing, paste, structure, resize, history.",
        defaultValue: "false"
      },
      {
        name: "extensions",
        type: "readonly SheetCellExtension[]",
        description: "Cell extensions beyond the built-in text and checkbox types, resolved by `colTypes`.",
        defaultValue: "[]"
      },
      {
        name: "formulaBar",
        type: "boolean",
        description: "Show a formula bar above the grid: the active cell's address and its\nsource (the `=` text of a formula, the typed form of a value), editable\nwhen the grid is \u2014 Enter commits, Escape reverts.",
        defaultValue: "false"
      },
      {
        name: "functions",
        type: "readonly SheetFunction[] | SheetFunctionRegistry",
        description: "Formula functions beyond the built-ins: a list merged over them (a\nbuilt-in's name overrides it), or a ready `SheetFunctionRegistry`.",
        defaultValue: "[]"
      },
      {
        name: "functionContext",
        type: "unknown",
        description: "What functions see as `ctx.external` \u2014 app data a custom function\nreads. A new value recomputes every formula; for data that changes\nbehind the same object, call `recalc()`.",
        defaultValue: "undefined"
      },
      {
        name: "workbook",
        type: "SheetWorkbook | null",
        description: "The other sheets of the workbook, for `Sheet2!A1` and `Tasks!Title` in\nformulas. A new value recomputes every formula, so hand in a new\nresolver whenever a referenced sheet changes; without one every\ncross-sheet reference is `#REF!`.",
        defaultValue: "null"
      }
    ],
    outputs: [
      {
        name: "ops",
        type: "SheetOp[]",
        description: "Every transaction the user makes, as the ops that were applied \u2014 one\nemission per edit, paste, structural change, resize, undo, or redo.\nRemote ops passed to `applyRemote` are not echoed."
      }
    ],
    methods: [
      {
        name: "recalc",
        parameters: "",
        returnType: "void",
        description: "Recompute every formula against the current `functionContext`: for a\nhost whose function data changed without a new context object."
      },
      {
        name: "rangeBox",
        parameters: "range: SheetRange",
        returnType: "{ top: number; left: number; width: number; height: number } | null",
        description: "The paint box of a range in body coordinates (px, past the row-header rail), clamped to the sheet \u2014\nwhat the selection boxes use, exposed so an overlay projected into the body (a peer's selection)\nlands on the same cells. `null` on an empty sheet. Reactive: reads the model and the geometry."
      },
      {
        name: "apply",
        parameters: "ops: readonly SheetOp[]",
        returnType: "void",
        description: "Apply a user transaction: the model advances, its inverse joins the undo\nstack, redo clears, and the ops are emitted. Empty transactions and\nno-op applications are ignored."
      },
      {
        name: "applyRemote",
        parameters: "ops: readonly SheetOp[]",
        returnType: "void",
        description: "Apply ops that originated elsewhere (another peer, a merged snapshot).\nThey are not emitted, and both history stacks are rebased over them\nwith `transformSheetOps` so undo keeps addressing the right cells."
      },
      {
        name: "undo",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "redo",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "focus",
        parameters: "",
        returnType: "void",
        description: "Focus the grid surface (not the in-cell editor)."
      },
      {
        name: "selectCell",
        parameters: "row: number, col: number, extend = false",
        returnType: "void",
        description: "Select one cell, clamped to the grid, and reveal it. With `extend`, move the active range's head instead."
      },
      {
        name: "selectRange",
        parameters: "range: SheetRange",
        returnType: "void",
        description: "Select a rectangle (corners in any order)."
      },
      {
        name: "selectAll",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "activeRange",
        parameters: "",
        returnType: "SheetRange | null",
        description: "The primary range, normalized, or `null`."
      },
      {
        name: "activateCell",
        parameters: "row: number, col: number",
        returnType: "boolean",
        description: "Activate a cell the way its extension defines (a checkbox toggles);\nreturns whether the extension handled it."
      },
      {
        name: "setColType",
        parameters: "col: number, type: string | null",
        returnType: "void",
        description: "Set (or clear) a column's cell type; the strings stay, only their interpretation changes."
      },
      {
        name: "fill",
        parameters: "source: SheetRange, target: SheetRange",
        returnType: "void",
        description: "Fill `target` from the pattern in `source` as one transaction, then select both."
      },
      {
        name: "startEdit",
        parameters: "initial?: string",
        returnType: "void",
        description: "Open the editor on the active cell, with `initial` (default: the cell's\ntext) as its content. A cell whose type edits by activation only\n(`editor: 'none'`) is activated instead; typed text goes through the\ntype's `parse` and commits directly."
      },
      {
        name: "commitEdit",
        parameters: "move: SheetCommitMove = 'none'",
        returnType: "void",
        description: "Write the editor's text into its cell (when changed) and move the\nselection on. A component editor is asked for its `readValue`; one\nwithout it is cancelled instead."
      },
      {
        name: "commitRaw",
        parameters: "raw: string, move: SheetCommitMove = 'none'",
        returnType: "void",
        description: "End the open edit by storing `raw` as is \u2014 the stored form, not typed\ntext \u2014 in the edited cell; what a component editor's `commit` does."
      },
      {
        name: "cancelEdit",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "moveHint",
        parameters: "delta: number",
        returnType: "void",
        description: "Move the active hint by `delta`, wrapping."
      },
      {
        name: "commitBar",
        parameters: "",
        returnType: "void",
        description: "Write the formula bar's text into its cell (through `parse`, a formula as is) and return focus to the grid."
      },
      {
        name: "cancelBar",
        parameters: "",
        returnType: "void",
        description: "Drop the formula bar's edit: the input shows the cell's source again."
      },
      {
        name: "pasteValues",
        parameters: "row: number, col: number, values: readonly (readonly string[])[]",
        returnType: "void",
        description: "Write a block of values at (row, col), inserting rows/columns so it\nfits. Each value passes through its column type's `parse`; a rejected\nvalue keeps the cell's current text."
      },
      {
        name: "selectionTsv",
        parameters: "",
        returnType: "string | null",
        description: "The active range as TSV, `null` when nothing is selected."
      },
      {
        name: "selectionAnchorValue",
        parameters: "",
        returnType: "string | null",
        description: "The value of the active range's anchor cell, for quick inspection."
      }
    ],
    cssVariables: [
      {
        name: "--shs-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--shs-fg",
        defaultValue: "var(--base-12)"
      },
      {
        name: "--shs-grid",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--shs-head-bg",
        defaultValue: "var(--base-2)"
      },
      {
        name: "--shs-head-fg",
        defaultValue: "var(--base-9)"
      },
      {
        name: "--shs-selection",
        defaultValue: "rgb(from var(--primary-9) r g b / 18%)"
      },
      {
        name: "--shs-sel-bc",
        defaultValue: "var(--primary-9)"
      },
      {
        name: "--shs-selection-bg",
        defaultValue: "var(--shs-head-bg)"
      },
      {
        name: "--shs-invalid",
        defaultValue: "var(--error-8)"
      },
      {
        name: "--shs-bs",
        defaultValue: "0 #{p2r(4)} #{p2r(12)} rgb(from var(--dark-text) r g b / 12%)"
      },
      {
        name: "--shs-f",
        defaultValue: "var(--paragraph-30)"
      }
    ],
    examples: [],
    keywords: [
      "spreadsheet",
      "sheet",
      "table",
      "grid",
      "cells",
      "virtualized",
      "excel"
    ]
  },
  {
    name: "ShipSpreadsheetBlock",
    selector: "sh-spreadsheet-block",
    package: "@ship-ui/core/ship-spreadsheet",
    kind: "component",
    path: "projects/ship-ui/ship-spreadsheet/ship-spreadsheet-block.ts",
    description: "The spreadsheet mounted as an `sh-editor` component block. Attrs are the\npersisted `SheetJSON`; the composer edits a model built from them, and\nevery transaction it emits is handed to the editor as one inner op\n(`applyInner`, a `block-inner` editor op carrying the `SheetOp[]`) \u2014 one\neditor transaction per sheet transaction, so the page's history and its\ncollab pipeline see the change as an edit *inside* the block and two\npeers editing the same sheet converge cell by cell. An editor without\ninner ops gets the attrs written back with `updateAttrs` (a block\nsplice) instead. Attrs that change from outside are adopted \u2014 through\nthe composer's `applyRemote` when the editor names the inner op that\nproduced them (history kept), wholesale otherwise; attrs that merely echo\nthis block's own write are not, so the composer's selection and in-cell\nhistory survive the round trip. Escape at the spreadsheet's edge hands\ncontrol back to the editor.",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipSpreadsheetRemoteSelections",
    selector: "sh-spreadsheet-remote-selections",
    package: "@ship-ui/core/ship-spreadsheet",
    kind: "component",
    path: "projects/ship-ui/ship-spreadsheet/ship-spreadsheet-remote-selections.ts",
    description: "Paints the cell selections of remote peers over an `sh-spreadsheet`: one\noutlined, tinted box per range in the peer's colour, the peer's name on the\nactive (last) range.\n\nProject it inside the grid \u2014 `<sh-spreadsheet \u2026><sh-spreadsheet-remote-selections\n[collab]=\"collab\" /></sh-spreadsheet>` \u2014 and it picks the grid up from the\nspreadsheet's injector. (Placing it elsewhere with an explicit `[grid]` input\nalso works, as long as the host sits in the grid body's coordinate space.) It\nrepaints on peer, model and geometry changes; ranges are cell coordinates,\nresolved to pixel boxes through the grid's own `rangeBox`, so they track\nresized tracks and structural edits.",
    inputs: [
      {
        name: "grid",
        type: "ShipSpreadsheet | null",
        description: "Grid override for placement outside the spreadsheet; defaults to the enclosing grid.",
        defaultValue: "null"
      },
      {
        name: "collab",
        type: "ShipSheetCollab",
        description: "The collab session whose peers should be painted."
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipStepper",
    selector: "sh-stepper",
    package: "@ship-ui/core/ship-stepper",
    kind: "component",
    path: "projects/ship-ui/ship-stepper/ship-stepper.ts",
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "Color theme applied to the stepper.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [
      {
        name: "updateProgress",
        parameters: "",
        returnType: "void",
        description: "Recalculates the active step position and updates the `--step-progress` CSS variable."
      }
    ],
    cssVariables: [
      {
        name: "--step-track-bg",
        defaultValue: "var(--base-3)"
      },
      {
        name: "--step-c",
        defaultValue: "var(--base-6)"
      },
      {
        name: "--step-radio-cbg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--step-radio-c",
        defaultValue: "var(--base-g2)"
      },
      {
        name: "--step-active-c",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--radiod-o",
        defaultValue: "1"
      },
      {
        name: "--radiod-c",
        defaultValue: "var(--step-radio-cbg)"
      }
    ],
    examples: [
      {
        name: "custom-stepper",
        html: `<sh-stepper [(value)]="activeStep">
  <div value="0">
    Step 1
  </div>
  <div value="1">
    Step 2
  </div>
  <div value="2">
    Step 3
  </div>
</sh-stepper>

@let _activeStep = activeStep();

<div class="step-content">
  @if (_activeStep === '0') {
    <div>Step 1 Content</div>
  } @else if (_activeStep === '1') {
    <div>Step 2 Content</div>
  } @else if (_activeStep === '2') {
    <div>Step 3 Content</div>
  }
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipStepper } from '@ship-ui/core/ship-stepper';\n\n@Component({\n  selector: 'app-custom-steppers',\n  standalone: true,\n  imports: [ShipStepper],\n  templateUrl: './custom-steppers.html',\n  styleUrls: ['./custom-steppers.scss'],\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class CustomSteppersComponent {\n  activeStep = signal('0');\n}\n"
      },
      {
        name: "router-stepper",
        html: '<sh-stepper class="primary">\n  <div routerLink="/steppers/examples/step-1" routerLinkActive="active">Step 1</div>\n  <div routerLink="/steppers/examples/step-2" routerLinkActive="active">Step 2</div>\n  <div routerLink="/steppers/examples/step-3" routerLinkActive="active">Step 3</div>\n  <div routerLink="/steppers/examples/step-4" routerLinkActive="active">Step 4</div>\n  <div routerLink="/steppers/examples/step-5" routerLinkActive="active">Step 5</div>\n</sh-stepper>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { RouterLink, RouterLinkActive } from '@angular/router';\nimport { ShipStepper } from '@ship-ui/core/ship-stepper';\n\n@Component({\n  selector: 'app-router-steppers',\n  standalone: true,\n  imports: [ShipStepper, RouterLink, RouterLinkActive],\n  templateUrl: './router-steppers.html',\n  styleUrl: './router-steppers.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class Steppers {}\n"
      },
      {
        name: "default-stepper",
        html: `<sh-stepper [(value)]="activeStep">
  <button value="0">
    Step 1
  </button>
  <button value="1">
    Step 2
  </button>
  <button value="2">
    Step 3
  </button>
</sh-stepper>

@let _activeStep = activeStep();

<div class="step-content">
  @if (_activeStep === '0') {
    <div>Step 1 Content</div>
  } @else if (_activeStep === '1') {
    <div>Step 2 Content</div>
  } @else if (_activeStep === '2') {
    <div>Step 3 Content</div>
  }
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipStepper } from '@ship-ui/core/ship-stepper';\n\n@Component({\n  selector: 'app-default-steppers',\n  standalone: true,\n  imports: [ShipStepper],\n  templateUrl: './default-steppers.html',\n  styleUrls: ['./default-steppers.scss'],\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DefaultStepperComponent {\n  activeStep = signal('0');\n}\n"
      },
      {
        name: "stepper-sandbox",
        html: `<sh-stepper [color]="color()" [(value)]="activeStep">
  <div value="0">Step 1</div>
  <div value="1">Step 2</div>
  <div value="2">Step 3</div>
</sh-stepper>

@let _activeStep = activeStep();

<div class="step-content">
  @if (_activeStep === '0') {
    <div>Step 1 Content</div>
  } @else if (_activeStep === '1') {
    <div>Step 2 Content</div>
  } @else if (_activeStep === '2') {
    <div>Step 3 Content</div>
  }
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipStepper } from '@ship-ui/core/ship-stepper';\n\n@Component({\n  selector: 'app-stepper-sandbox',\n  standalone: true,\n  imports: [ShipStepper],\n  templateUrl: './stepper-sandbox.html',\n  styleUrl: './stepper-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class StepperSandbox {\n  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('');\n  activeStep = signal('0');\n}\n"
      },
      {
        name: "basic-stepper",
        html: `<sh-stepper [(value)]="activeStep">
  <button value="0">Step 1</button>
  <button value="1">Step 2</button>
  <button value="2">Step 3</button>
</sh-stepper>

@let _activeStep = activeStep();

<div class="step-content">
  @if (_activeStep === '0') {
    <div>Step 1 Content</div>
  } @else if (_activeStep === '1') {
    <div>Step 2 Content</div>
  } @else if (_activeStep === '2') {
    <div>Step 3 Content</div>
  }
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipStepper } from '@ship-ui/core/ship-stepper';\n\n@Component({\n  selector: 'app-basic-stepper',\n  standalone: true,\n  imports: [ShipStepper],\n  templateUrl: './basic-stepper.html',\n  styleUrl: './basic-stepper.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicStepper {\n  activeStep = signal('0');\n}\n"
      }
    ],
    keywords: [
      "stepper",
      "wizard",
      "steps",
      "progress",
      "form",
      "navigation"
    ]
  },
  {
    name: "ShipTable",
    selector: "sh-table",
    package: "@ship-ui/core/ship-table",
    kind: "component",
    path: "projects/ship-ui/ship-table/ship-table.ts",
    description: "### Data & Loading\n\nProvide data via\n`[data]`\nand toggle a loading state using the\n`loading`\nattribute.\n\n### Sorting\n\nEnable sorting by applying\n`shSort`\nto header cells. Track the active column with\n`sortByColumn`\n(two-way bindable). With `[data]` the table orders the rows itself; without it (rows projected with\n`&#64;for`) listen to `(sortChange)`, which emits `{{ '{' }} key, direction {{ '}' }}`, order the\nrows yourself and keep `[sortByColumn]` bound so the header indicator follows.\n\n### Resizing\n\nApply the\n`shResize`\ndirective to header cells to allow column width adjustment. Available inputs:\n`resizable`\n,\n`minWidth`\n, and\n`maxWidth`\n.\n\n### Row Resizing\n\nApply the\n`shRowResize`\ndirective to body rows (\n`&lt;tr&gt;`\n) to allow row height adjustment by dragging the bottom edge or with\n<kbd>Shift+ArrowUp</kbd>/<kbd>Shift+ArrowDown</kbd> on a focused row. Available inputs:\n`resizable`\n,\n`minHeight`\n, and\n`maxHeight`\n.\n\n### Sticky Columns\n\nUse the\n`shStickyColumns`\nattribute (\n**start**\nor\n**end**\n) or apply\n`.sticky`\n/\n`.sticky-end`\nclasses to header cells to pin columns. Multiple sticky columns stack next to each other automatically\n&mdash; the table measures each pinned column and applies cumulative offsets, so adjacent sticky columns\nnever slide beneath one another.\n\n### Column Sizing\n\nUse the\n`size`\nattribute on\n`&lt;th&gt;`\nelements to set initial or fixed widths (e.g.,\n`size=\"1fr\"`\n,\n`size=\"200px\"`\n).",
    inputs: [
      {
        name: "grid",
        type: "boolean",
        description: 'Enables grid semantics and full keyboard cell navigation (`role="grid"`) instead of a plain table.',
        defaultValue: "false"
      },
      {
        name: "loading",
        type: "boolean",
        description: "Shows an indeterminate progress bar and marks the table as `aria-busy`.",
        defaultValue: "false"
      },
      {
        name: "data",
        type: "any",
        description: "The row data rendered by the table.",
        defaultValue: "[]"
      },
      {
        name: "sortByColumn",
        type: "string | null",
        description: "Two-way bound active sort, as a column id or `-id` for descending; `null` when unsorted.",
        defaultValue: "null",
        twoWay: true
      },
      {
        name: "variant",
        type: "ShipTableVariant | null",
        description: "Visual variant of the table.",
        defaultValue: "null",
        options: [
          "type-a",
          "type-b",
          ""
        ]
      },
      {
        name: "aria-label",
        type: "string | null",
        description: "Accessible label for the table.",
        defaultValue: "null"
      },
      {
        name: "aria-labelledby",
        type: "string | null",
        description: "Id of the element that labels the table.",
        defaultValue: "null"
      }
    ],
    outputs: [
      {
        name: "dataChange",
        type: "any",
        description: "Emits the reordered data whenever the active sort changes."
      },
      {
        name: "sortChange",
        type: "ShipSortChange",
        description: "Emits `{ key, direction }` whenever a `shSort` header is toggled (click or keyboard). Meant for tables\nwhose rows are projected without `[data]`: the consumer orders its rows, the table keeps the indicator."
      }
    ],
    methods: [
      {
        name: "updateColumnSizes",
        parameters: "",
        returnType: "void",
        description: "Recomputes the CSS grid column template after a column has been resized."
      },
      {
        name: "toggleSort",
        parameters: "column: string",
        returnType: "void",
        description: "Cycles the given column through ascending, descending, and unsorted states."
      }
    ],
    cssVariables: [
      {
        name: "--table-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--table-th-bg",
        defaultValue: "var(--base-2)"
      },
      {
        name: "--table-tr-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--table-td-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--table-th-c",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--table-th-f",
        defaultValue: "var(--paragraph-30)"
      },
      {
        name: "--table-td-c",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--table-td-f",
        defaultValue: "var(--paragraph-30)"
      },
      {
        name: "--table-th-py",
        defaultValue: "0"
      },
      {
        name: "--table-th-px",
        defaultValue: "var(--pad-x-5)"
      },
      {
        name: "--table-td-py",
        defaultValue: "0"
      },
      {
        name: "--table-td-px",
        defaultValue: "var(--pad-x-5)"
      },
      {
        name: "--table-th-mh",
        defaultValue: "#{p2r(48)}"
      },
      {
        name: "--table-td-mh",
        defaultValue: "#{p2r(78)}"
      },
      {
        name: "--table-th-g",
        defaultValue: "#{p2r(4)}"
      },
      {
        name: "--table-td-g",
        defaultValue: "#{p2r(8)}"
      },
      {
        name: "--table-ws",
        defaultValue: "nowrap"
      },
      {
        name: "--table-th-bw",
        defaultValue: "0"
      },
      {
        name: "--table-td-bw",
        defaultValue: "#{p2r(1 0 0)}"
      },
      {
        name: "--table-columns",
        defaultValue: "1fr 1fr 1fr max-content"
      },
      {
        name: "--table-sticky-bw",
        defaultValue: "#{p2r(1)}"
      },
      {
        name: "--table-caret-c",
        defaultValue: "var(--base-10)"
      },
      {
        name: "--table-caret-si",
        defaultValue: "#{p2r(6)}"
      }
    ],
    examples: [
      {
        name: "resizing-table",
        html: '<sh-table [data]="dataSource()" [variant]="variant()">\n  <tr thead>\n    @for (col of displayedColumns(); track col) {\n      <th shResize>{{ col }}</th>\n    }\n  </tr>\n\n  @for (row of dataSource(); track $index) {\n    <tr shRowResize>\n      @for (col of displayedColumns(); track col) {\n        <td>{{ row[col] }}</td>\n      }\n    </tr>\n  }\n\n  <div table-no-rows>No data available</div>\n</sh-table>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipResize, ShipRowResize, ShipTable } from '@ship-ui/core/ship-table';\nimport { ShipTableVariant } from '@ship-ui/core';\n\nconst ELEMENT_DATA = [\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n];\nconst COLUMNS = ['position', 'name', 'weight', 'symbol'] as const;\n\n@Component({\n  selector: 'resizing-table',\n  standalone: true,\n  imports: [ShipTable, ShipResize, ShipRowResize],\n  templateUrl: './resizing-table.html',\n  styleUrl: './resizing-table.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ResizingTable {\n  variant = input<ShipTableVariant | null>(null);\n  displayedColumns = signal([...COLUMNS]);\n  dataSource = signal([...ELEMENT_DATA]);\n}\n"
      },
      {
        name: "projected-sorting-table",
        html: `<pre>sortChange: {{ sort().key ?? '\u2014' }} {{ sort().direction ?? '' }}</pre>

<sh-table [sortByColumn]="sortByColumn()" (sortChange)="onSort($event)" [variant]="variant()">
  <tr>
    <th shSort="key">Key</th>
    <th shSort="title">Title</th>
    <th shSort="priority">Priority</th>
    <th shSort="due">Due</th>
  </tr>

  @for (task of rows(); track task.key) {
    <tr>
      <td>{{ task.key }}</td>
      <td>{{ task.title }}</td>
      <td>P{{ task.priority }}</td>
      <td>{{ task.due }}</td>
    </tr>
  }
</sh-table>
`,
        ts: "import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';\nimport { ShipTableVariant } from '@ship-ui/core';\nimport { parseSortByColumn, ShipSort, ShipSortChange, ShipTable } from '@ship-ui/core/ship-table';\n\nconst TASKS = [\n  { key: 'HAR-1', title: 'Board columns dialog', priority: 2, due: '2026-10-02' },\n  { key: 'HAR-2', title: 'Swimlanes by priority', priority: 1, due: '2026-09-28' },\n  { key: 'HAR-3', title: 'Keyboard card moves', priority: 3, due: '2026-10-10' },\n  { key: 'HAR-4', title: 'WIP limits', priority: 1, due: '2026-09-25' },\n];\n\ntype Task = (typeof TASKS)[number];\n\n/**\n * Rows are projected with @for and there is no [data]: the table only tracks the active sort and\n * draws the indicator, the component orders its own rows from (sortChange).\n */\n@Component({\n  selector: 'projected-sorting-table',\n  standalone: true,\n  imports: [ShipTable, ShipSort],\n  templateUrl: './projected-sorting-table.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ProjectedSortingTable {\n  variant = input<ShipTableVariant | null>(null);\n  sort = signal<ShipSortChange>({ key: null, direction: null });\n  /** The model value the table keeps; `sortByColumn` is `-key` for descending. */\n  sortByColumn = computed(() => (this.sort().key ? `${this.sort().direction === 'desc' ? '-' : ''}${this.sort().key}` : null));\n\n  rows = computed(() => {\n    const { key, direction } = this.sort();\n    if (!key) return TASKS;\n\n    const sorted = [...TASKS].sort((a, b) => {\n      const va = a[key as keyof Task];\n      const vb = b[key as keyof Task];\n      return va < vb ? -1 : va > vb ? 1 : 0;\n    });\n\n    return direction === 'desc' ? sorted.reverse() : sorted;\n  });\n\n  onSort(change: ShipSortChange) {\n    this.sort.set(change);\n  }\n\n  /** Restores a persisted sort (the same shape the table emits). */\n  restore(value: string | null) {\n    this.sort.set(parseSortByColumn(value));\n  }\n}\n"
      },
      {
        name: "base-table",
        html: '<sh-table [data]="dataSource()" [loading]="isLoading()" [variant]="variant()">\n  <button actionbar align-right>hello</button>\n\n  <tr thead>\n    @for (col of displayedColumns(); track col) {\n      <th>{{ col }}</th>\n    }\n  </tr>\n\n  @for (row of dataSource(); track $index) {\n    <tr>\n      @for (col of displayedColumns(); track col) {\n        <td>{{ row[col] }}</td>\n      }\n    </tr>\n  }\n\n  <div table-no-rows>No data available</div>\n</sh-table>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipTable } from '@ship-ui/core/ship-table';\n\nconst ELEMENT_DATA = [\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n];\nconst COLUMNS = ['position', 'name', 'weight', 'symbol'] as const;\n\n@Component({\n  selector: 'base-table',\n  standalone: true,\n  imports: [ShipTable],\n  templateUrl: './base-table.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseTableComponent {\n  variant = input<string | null>(null);\n  displayedColumns = signal([...COLUMNS]);\n  dataSource = signal([...ELEMENT_DATA]);\n  isLoading = signal(true);\n\n  ngOnInit() {\n    setTimeout(() => {\n      this.isLoading.set(false);\n    }, 450);\n  }\n}\n"
      },
      {
        name: "toggle-row-table",
        html: `<sh-table [data]="dataSource()" [loading]="isLoading()" [variant]="variant()">
  <tr>
    @for (col of displayedColumns(); track col) {
      <th>{{ col }}</th>
    }
  </tr>

  @for (row of dataSource(); track $index) {
    <tr (click)="toggleRow($index)">
      @for (col of displayedColumns(); track col) {
        <td>
          @if ($first) {
            <button shButton class="small primary raised" [attr.aria-label]="$index === openRowIndex() ? 'Collapse row' : 'Expand row'" [attr.aria-expanded]="$index === openRowIndex()">
              @if ($index === openRowIndex()) {
                <sh-icon>caret-up</sh-icon>
              } @else {
                <sh-icon>caret-down</sh-icon>
              }
            </button>
          }

          {{ row[col] }}
        </td>
      }
    </tr>

    @if ($index === openRowIndex()) {
      <tr>
        <td class="span-all" [style.background-color]="'red'">hi im a secondary row and i can be styled differently</td>
      </tr>
    }
  }

  <div table-no-rows>No data available</div>
</sh-table>
`,
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipTable } from '@ship-ui/core/ship-table';\nimport { ShipTableVariant } from '@ship-ui/core';\n\nconst ELEMENT_DATA = [\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n];\nconst COLUMNS = ['position', 'name', 'weight', 'symbol'] as const;\n\n@Component({\n  selector: 'toggle-row-table',\n  standalone: true,\n  imports: [ShipTable, ShipIcon, ShipButton],\n  templateUrl: './toggle-row-table.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ToggleRowTable {\n  variant = input<ShipTableVariant | null>(null);\n  displayedColumns = signal([...COLUMNS]);\n  dataSource = signal([...ELEMENT_DATA]);\n  isLoading = signal(true);\n  openRowIndex = signal<number | null>(null);\n\n  ngOnInit() {\n    setTimeout(() => {\n      this.isLoading.set(false);\n    }, 450);\n  }\n\n  toggleRow(index: number) {\n    this.openRowIndex.set(this.openRowIndex() === index ? null : index);\n  }\n}\n"
      },
      {
        name: "sorting-table",
        html: '<pre>Sort column by: {{ sortByColumn() }}</pre>\n\n<sh-table [data]="dataSource()" [(sortByColumn)]="sortByColumn" [variant]="variant()">\n  <tr>\n    @for (col of displayedColumns(); track col) {\n      <th [shSort]="col">\n        {{ col }}\n\n        @if (sortByColumn() === col) {\n          <sh-icon>caret-up</sh-icon>\n        } @else if (sortByColumn() === `-${col}`) {\n          <sh-icon>caret-down</sh-icon>\n        } @else {\n          <sh-icon>arrows-down-up</sh-icon>\n        }\n      </th>\n    }\n  </tr>\n\n  @for (row of dataSource(); track $index) {\n    <tr>\n      @for (col of displayedColumns(); track col) {\n        <td>{{ row[col] }}</td>\n      }\n    </tr>\n  }\n\n  <div table-no-rows>No data available</div>\n</sh-table>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipSort, ShipTable } from '@ship-ui/core/ship-table';\nimport { ShipTableVariant } from '@ship-ui/core';\n\nconst ELEMENT_DATA = [\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n];\nconst COLUMNS = ['position', 'name', 'weight', 'symbol'] as const;\n\n@Component({\n  selector: 'sorting-table',\n  standalone: true,\n  imports: [ShipTable, ShipSort, ShipIcon],\n  templateUrl: './sorting-table.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SortingTable {\n  variant = input<ShipTableVariant | null>(null);\n  displayedColumns = signal([...COLUMNS]);\n  dataSource = signal([...ELEMENT_DATA]);\n  sortByColumn = signal<string | null>(null);\n}\n"
      },
      {
        name: "config-table",
        html: `<sh-table
  [loading]="isLoading()"
  [data]="users()"
  (dataChange)="users.set($event)"
  [variant]="variant()"
  [grid]="gridMode()"
  aria-label="User Management Configuration Table">
  <button shButton actionbar class="small primary" (click)="toggleLoading()">
    <sh-icon>spinner</sh-icon>
    Toggle Loading
  </button>
  <button shButton actionbar class="small outline" [class.primary]="gridMode()" (click)="gridMode.set(!gridMode())">
    <sh-icon>{{ gridMode() ? 'check-square' : 'square' }}</sh-icon>
    Interactive Grid: {{ gridMode() ? 'ON' : 'OFF' }}
  </button>
  <button shButton actionbar class="small flat" (click)="resetData()">
    <sh-icon>arrow-counter-clockwise</sh-icon>
    Reset Data
  </button>

  <sh-table-content [columns]="columns()" [data]="users()" [rowResize]="true" />

  <!-- Custom User Column Template -->
  <ng-template #nameTemplate let-row>
    <div class="user-cell">
      <span class="user-name">{{ row.name }}</span>
      <span class="user-email">{{ row.email }}</span>
    </div>
  </ng-template>

  <!-- Custom Actions Column Template -->
  <ng-template #actionsTemplate let-row>
    <button shButton class="small text primary" (click)="editUser(row)" title="Edit user" aria-label="Edit user">
      <sh-icon>pencil-simple</sh-icon>
    </button>
    <button shButton class="small text error" (click)="deleteUser(row.id)" title="Delete user" aria-label="Delete user">
      <sh-icon>trash</sh-icon>
    </button>
  </ng-template>
</sh-table>
`,
        ts: "import { CommonModule } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, computed, input, signal, TemplateRef, viewChild } from '@angular/core';\nimport { ShipTableVariant } from '@ship-ui/core';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipTable, ShipTableColumn, ShipTableContent } from '@ship-ui/core/ship-table';\n\nexport interface ConfigUserElement {\n  id: number;\n  name: string;\n  email: string;\n  role: string;\n  active: boolean;\n  joined: string;\n  bio: string;\n}\n\nconst INITIAL_USERS: ConfigUserElement[] = [\n  {\n    id: 1,\n    name: 'Alice Vance',\n    email: 'alice@shipui.com',\n    role: 'Administrator',\n    active: true,\n    joined: '2025-01-15T09:30:00',\n    bio: 'Lead platform engineer and architect of the design system components.',\n  },\n  {\n    id: 2,\n    name: 'Bob Smith',\n    email: 'bob@shipui.com',\n    role: 'Developer',\n    active: true,\n    joined: '2025-03-22T17:15:00',\n    bio: 'Frontend engineer specializing in accessible interactive charts and graphs.',\n  },\n  {\n    id: 3,\n    name: 'Charlie Brown',\n    email: 'charlie@shipui.com',\n    role: 'Support',\n    active: false,\n    joined: '2025-06-05T11:00:00',\n    bio: 'Customer success advocate passionate about documentation and developer experience.',\n  },\n  {\n    id: 4,\n    name: 'Diana Prince',\n    email: 'diana@shipui.com',\n    role: 'Product Manager',\n    active: true,\n    joined: '2024-10-12T08:45:00',\n    bio: 'Product strategist steering the integration of AI-assisted coding tools.',\n  },\n  {\n    id: 5,\n    name: 'Evan Wright',\n    email: 'evan@shipui.com',\n    role: 'Designer',\n    active: false,\n    joined: '2024-12-01T14:20:00',\n    bio: 'UI/UX specialist designer who crafted the glassmorphism aesthetic guidelines.',\n  },\n];\n\n@Component({\n  selector: 'config-table',\n  standalone: true,\n  imports: [CommonModule, ShipTable, ShipTableContent, ShipButton, ShipIcon],\n  templateUrl: './config-table.html',\n  styleUrl: './config-table.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ConfigTable {\n  variant = input<ShipTableVariant | null>(null);\n\n  // Sample data\n  users = signal<ConfigUserElement[]>([...INITIAL_USERS]);\n  isLoading = signal<boolean>(false);\n  gridMode = signal<boolean>(false);\n\n  // Template viewChild references\n  nameTemplate = viewChild.required<TemplateRef<any>>('nameTemplate');\n  actionsTemplate = viewChild.required<TemplateRef<any>>('actionsTemplate');\n\n  // Reactively build columns once templates are loaded\n  columns = computed<ShipTableColumn<ConfigUserElement>[]>(() => [\n    {\n      id: 'id',\n      header: 'ID',\n      type: 'number',\n      sortable: true,\n      resizable: true,\n      size: '60px',\n      sticky: 'start',\n    },\n    {\n      id: 'name',\n      header: 'User',\n      type: 'string',\n      sortable: true,\n      size: '220px',\n      sticky: 'start',\n      cellTemplate: this.nameTemplate(),\n      rowHeader: true,\n    },\n    {\n      id: 'role',\n      header: 'Role',\n      type: 'badge',\n      sortable: true,\n      size: '150px',\n    },\n    {\n      id: 'active',\n      header: 'Active Status',\n      type: 'boolean',\n      sortable: true,\n      size: '120px',\n    },\n    {\n      id: 'joined',\n      header: 'Joined Date',\n      type: 'date',\n      sortable: true,\n      size: '140px',\n    },\n    {\n      id: 'bio',\n      header: 'Bio',\n      type: 'string',\n      resizable: true,\n      size: '1fr',\n    },\n    {\n      id: 'actions',\n      header: 'Actions',\n      sticky: 'end',\n      cellTemplate: this.actionsTemplate(),\n    },\n  ]);\n\n  toggleLoading() {\n    this.isLoading.set(true);\n    setTimeout(() => {\n      this.isLoading.set(false);\n    }, 1200);\n  }\n\n  deleteUser(id: number) {\n    this.users.update((current) => current.filter((u) => u.id !== id));\n  }\n\n  editUser(user: ConfigUserElement) {\n    alert(`Editing user: ${user.name}`);\n  }\n\n  resetData() {\n    this.users.set([...INITIAL_USERS]);\n  }\n}\n"
      },
      {
        name: "multi-table-header",
        html: '<sh-table [data]="dataSource()" [variant]="variant()">\n  <tr thead class="sticky">\n    @for (col of displayedColumns(); track col) {\n      <th>{{ col }}</th>\n    }\n  </tr>\n\n  <tr thead class="sticky">\n    @for (col of displayedColumns(); track col) {\n      <th>{{ col }}</th>\n    }\n  </tr>\n\n  @for (row of dataSource(); track $index) {\n    <tr [class.sticky]="$index % 3 === 2">\n      @for (col of displayedColumns(); track col) {\n        <td>{{ row[col] }}</td>\n      }\n    </tr>\n  }\n\n  <div table-no-rows>No data available</div>\n</sh-table>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipTable } from '@ship-ui/core/ship-table';\nimport { ShipTableVariant } from '@ship-ui/core';\n\nconst ELEMENT_DATA = [\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n];\nconst COLUMNS = ['position', 'name', 'weight', 'symbol'] as const;\n\n@Component({\n  selector: 'multi-table-header',\n  standalone: true,\n  imports: [ShipTable],\n  templateUrl: './multi-table-header.html',\n  styleUrl: './multi-table-header.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class MultiTableHeader {\n  variant = input<ShipTableVariant | null>(null);\n  displayedColumns = signal([...COLUMNS]);\n  dataSource = signal([...ELEMENT_DATA]);\n}\n"
      },
      {
        name: "full-featured-table",
        html: `<sh-table [data]="displayedUsers()" [loading]="isLoading()" [(sortByColumn)]="sortByColumn" [variant]="variant()">
  <sh-form-field actionbar size="small">
    <sh-icon prefix>magnifying-glass</sh-icon>
    <input
      type="text"
      [ngModel]="searchQuery()"
      (ngModelChange)="searchQuery.set($event)"
      placeholder="Filter by name, email, role or status..."
      class="search-input" />
  </sh-form-field>

  <button shButton actionbar align-right class="small primary" (click)="toggleLoading()">
    <sh-icon>spinner</sh-icon>
    Simulate API Load
  </button>

  @if (selectedUserIds().size > 0) {
    <button shButton actionbar align-right class="small error raised" (click)="deleteSelected()">
      <sh-icon>trash</sh-icon>
      Delete Selected ({{ selectedUserIds().size }})
    </button>
  }

  <button shButton actionbar align-right class="small flat" (click)="resetData()">
    <sh-icon>arrows-counter-clockwise</sh-icon>
    Reset Table
  </button>

  <tr thead>
    <div shStickyColumns>
      <th size="min-content">
        <sh-checkbox
          label="Select all rows"
          [checked]="isAllSelected()"
          [class.indeterminate]="isSomeSelected()"
          (checkedChange)="toggleSelectAll($event)"></sh-checkbox>
      </th>
    </div>
    <th shSort="id" shResize size="80px" class="sortable-header">
      ID
      @if (sortByColumn() === 'id') {
        <sh-icon>caret-up</sh-icon>
      } @else if (sortByColumn() === '-id') {
        <sh-icon>caret-down</sh-icon>
      } @else {
        <sh-icon>arrows-down-up</sh-icon>
      }
    </th>
    <th shSort="name" shResize class="sortable-header">
      User Name
      @if (sortByColumn() === 'name') {
        <sh-icon>caret-up</sh-icon>
      } @else if (sortByColumn() === '-name') {
        <sh-icon>caret-down</sh-icon>
      } @else {
        <sh-icon>arrows-down-up</sh-icon>
      }
    </th>
    <th shSort="email" shResize class="sortable-header">
      Email Address
      @if (sortByColumn() === 'email') {
        <sh-icon>caret-up</sh-icon>
      } @else if (sortByColumn() === '-email') {
        <sh-icon>caret-down</sh-icon>
      } @else {
        <sh-icon>arrows-down-up</sh-icon>
      }
    </th>
    <th shSort="role" shResize class="sortable-header">
      Role
      @if (sortByColumn() === 'role') {
        <sh-icon>caret-up</sh-icon>
      } @else if (sortByColumn() === '-role') {
        <sh-icon>caret-down</sh-icon>
      } @else {
        <sh-icon>arrows-down-up</sh-icon>
      }
    </th>
    <th shSort="status" shResize class="sortable-header">
      Status
      @if (sortByColumn() === 'status') {
        <sh-icon>caret-up</sh-icon>
      } @else if (sortByColumn() === '-status') {
        <sh-icon>caret-down</sh-icon>
      } @else {
        <sh-icon>arrows-down-up</sh-icon>
      }
    </th>
    <th shSort="lastActive" shResize class="sortable-header">
      Last Active
      @if (sortByColumn() === 'lastActive') {
        <sh-icon>caret-up</sh-icon>
      } @else if (sortByColumn() === '-lastActive') {
        <sh-icon>caret-down</sh-icon>
      } @else {
        <sh-icon>arrows-down-up</sh-icon>
      }
    </th>
    <div shStickyColumns="end">
      <th size="min-content">Actions</th>
    </div>
  </tr>

  @for (user of displayedUsers(); track user.id) {
    <tr
      shRowResize
      [maxHeight]="120"
      [class.selected]="selectedUserIds().has(user.id)"
      (click)="toggleExpandUser(user.id, $event)"
      class="clickable-row">
      <div shStickyColumns (click)="$event.stopPropagation()">
        <td>
          <sh-checkbox
            [label]="'Select ' + user.name"
            [checked]="selectedUserIds().has(user.id)"
            (checkedChange)="toggleSelectUser(user.id, $event)"></sh-checkbox>
        </td>
      </div>
      <td>{{ user.id }}</td>
      <td class="user-cell">
        <button shButton class="small text primary expand-btn" [attr.aria-label]="expandedUserIds().has(user.id) ? 'Collapse row' : 'Expand row'" [attr.aria-expanded]="expandedUserIds().has(user.id)">
          <sh-icon>{{ expandedUserIds().has(user.id) ? 'caret-up' : 'caret-down' }}</sh-icon>
        </button>
        <span class="user-name">{{ user.name }}</span>
      </td>
      <td>{{ user.email }}</td>
      <td>{{ user.role }}</td>
      <td>
        @if (user.status === 'active') {
          <sh-chip class="success text-only small">Active</sh-chip>
        } @else if (user.status === 'pending') {
          <sh-chip class="warn text-only small">Pending</sh-chip>
        } @else {
          <sh-chip class="flat text-only small">Inactive</sh-chip>
        }
      </td>
      <td>{{ user.lastActive | date: 'MMM d, h:mm a' }}</td>
      <div shStickyColumns="end" (click)="$event.stopPropagation()">
        <td class="actions-cell">
          <button
            shButton
            class="small text primary"
            (click)="editUser(user, $event)"
            [shTooltip]="'Edit ' + user.name">
            <sh-icon>pencil</sh-icon>
          </button>
          <button
            shButton
            class="small text error"
            (click)="deleteUser(user.id, $event)"
            [shTooltip]="'Delete ' + user.name">
            <sh-icon>trash</sh-icon>
          </button>
        </td>
      </div>
    </tr>

    @if (expandedUserIds().has(user.id)) {
      <tr class="expanded-row-wrapper" (click)="$event.stopPropagation()">
        <td class="span-all expanded-row-cell">
          <div class="expanded-content">
            <div class="user-bio-section">
              <h5 class="expanded-title">Biography</h5>
              <p class="expanded-text">{{ user.bio }}</p>
            </div>
            <div class="user-meta-section">
              <div class="meta-item">
                <span class="meta-label">Location</span>
                <span class="meta-value">{{ user.location }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Member Since</span>
                <span class="meta-value">{{ user.joined }}</span>
              </div>
            </div>
          </div>
        </td>
      </tr>
    }
  }

  <div table-no-rows class="no-rows-container">
    <sh-icon class="no-rows-icon">info</sh-icon>
    <p class="no-rows-text">No users found matching your filters.</p>
  </div>
</sh-table>
`,
        ts: "import { CommonModule } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipTableVariant } from '@ship-ui/core';\nimport { ShipTooltip } from '@ship-ui/core/ship-tooltip';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipCheckbox } from '@ship-ui/core/ship-checkbox';\nimport { ShipChip } from '@ship-ui/core/ship-chip';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipResize, ShipRowResize, ShipSort, ShipStickyColumns, ShipTable } from '@ship-ui/core/ship-table';\nimport { ShipFormField } from 'ship-ui/ship-form-field';\n\nexport interface UserElement {\n  id: number;\n  name: string;\n  email: string;\n  role: string;\n  status: 'active' | 'inactive' | 'pending';\n  lastActive: Date;\n  location: string;\n  joined: string;\n  bio: string;\n}\n\nconst INITIAL_USERS: UserElement[] = [\n  {\n    id: 1,\n    name: 'Alice Vance',\n    email: 'alice@shipui.com',\n    role: 'Administrator',\n    status: 'active',\n    lastActive: new Date('2026-06-10T09:30:00'),\n    location: 'San Francisco, CA',\n    joined: 'Jan 2025',\n    bio: 'Lead platform engineer and architect of the design system components.',\n  },\n  {\n    id: 2,\n    name: 'Bob Smith',\n    email: 'bob@shipui.com',\n    role: 'Developer',\n    status: 'active',\n    lastActive: new Date('2026-06-09T17:15:00'),\n    location: 'Seattle, WA',\n    joined: 'Mar 2025',\n    bio: 'Frontend engineer specializing in accessible interactive charts and graphs.',\n  },\n  {\n    id: 3,\n    name: 'Charlie Brown',\n    email: 'charlie@shipui.com',\n    role: 'Support',\n    status: 'pending',\n    lastActive: new Date('2026-06-08T11:00:00'),\n    location: 'Austin, TX',\n    joined: 'Jun 2025',\n    bio: 'Customer success advocate passionate about documentation and developer experience.',\n  },\n  {\n    id: 4,\n    name: 'Diana Prince',\n    email: 'diana@shipui.com',\n    role: 'Product Manager',\n    status: 'active',\n    lastActive: new Date('2026-06-10T08:45:00'),\n    location: 'New York, NY',\n    joined: 'Oct 2024',\n    bio: 'Product strategist steering the integration of AI-assisted coding tools.',\n  },\n  {\n    id: 5,\n    name: 'Evan Wright',\n    email: 'evan@shipui.com',\n    role: 'Designer',\n    status: 'inactive',\n    lastActive: new Date('2026-05-24T14:20:00'),\n    location: 'London, UK',\n    joined: 'Dec 2024',\n    bio: 'UI/UX specialist designer who crafted the glassmorphism aesthetic guidelines.',\n  },\n  {\n    id: 6,\n    name: 'Fiona Gallagher',\n    email: 'fiona@shipui.com',\n    role: 'Developer',\n    status: 'active',\n    lastActive: new Date('2026-06-10T10:05:00'),\n    location: 'Chicago, IL',\n    joined: 'Feb 2025',\n    bio: 'Full stack developer focusing on micro-services and database query optimization.',\n  },\n  {\n    id: 7,\n    name: 'George Clark',\n    email: 'george@shipui.com',\n    role: 'Security Specialist',\n    status: 'active',\n    lastActive: new Date('2026-06-10T07:10:00'),\n    location: 'Boston, MA',\n    joined: 'Jul 2024',\n    bio: 'AppSec lead responsible for penetration testing and client data safety protocols.',\n  },\n  {\n    id: 8,\n    name: 'Hannah Abbott',\n    email: 'hannah@shipui.com',\n    role: 'QA Lead',\n    status: 'pending',\n    lastActive: new Date('2026-06-09T16:40:00'),\n    location: 'Denver, CO',\n    joined: 'Nov 2024',\n    bio: 'Quality assurance manager developing end-to-end component testing suites.',\n  },\n];\n\n@Component({\n  selector: 'full-featured-table',\n  standalone: true,\n  imports: [\n    CommonModule,\n    ShipTable,\n    ShipSort,\n    ShipResize,\n    ShipRowResize,\n    ShipStickyColumns,\n    ShipCheckbox,\n    ShipButton,\n    ShipIcon,\n    ShipChip,\n    ShipTooltip,\n    FormsModule,\n    ShipFormField,\n  ],\n  templateUrl: './full-featured-table.html',\n  styleUrl: './full-featured-table.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FullFeaturedTable {\n  variant = input<ShipTableVariant | null>(null);\n\n  // States\n  users = signal<UserElement[]>([...INITIAL_USERS]);\n  searchQuery = signal<string>('');\n  isLoading = signal<boolean>(false);\n  sortByColumn = signal<string | null>(null);\n  selectedUserIds = signal<Set<number>>(new Set());\n  expandedUserIds = signal<Set<number>>(new Set());\n\n  // Filtered and sorted data\n  displayedUsers = computed(() => {\n    const query = this.searchQuery().toLowerCase().trim();\n    const currentUsers = this.users();\n    const sort = this.sortByColumn();\n\n    // 1. Filter\n    let result = query\n      ? currentUsers.filter(\n          (u) =>\n            u.name.toLowerCase().includes(query) ||\n            u.email.toLowerCase().includes(query) ||\n            u.role.toLowerCase().includes(query) ||\n            u.status.toLowerCase().includes(query)\n        )\n      : [...currentUsers];\n\n    // 2. Sort\n    if (sort) {\n      const column = sort.startsWith('-') ? sort.slice(1) : sort;\n      const isDescending = sort.startsWith('-');\n\n      result.sort((a: any, b: any) => {\n        const valA = a[column];\n        const valB = b[column];\n        let comp = 0;\n\n        if (typeof valA === 'number' && typeof valB === 'number') {\n          comp = valA - valB;\n        } else if (valA instanceof Date && valB instanceof Date) {\n          comp = valA.getTime() - valB.getTime();\n        } else {\n          comp = (valA ?? '').toString().localeCompare((valB ?? '').toString(), undefined, { sensitivity: 'base' });\n        }\n\n        return isDescending ? -comp : comp;\n      });\n    }\n\n    return result;\n  });\n\n  // Checkbox state helpers\n  isAllSelected = computed(() => {\n    const data = this.displayedUsers();\n    if (data.length === 0) return false;\n    return data.every((u) => this.selectedUserIds().has(u.id));\n  });\n\n  isSomeSelected = computed(() => {\n    const data = this.displayedUsers();\n    if (data.length === 0) return false;\n    const selectedCount = data.filter((u) => this.selectedUserIds().has(u.id)).length;\n    return selectedCount > 0 && selectedCount < data.length;\n  });\n\n  toggleSelectAll(checked: boolean) {\n    const data = this.displayedUsers();\n    const nextSelected = new Set(this.selectedUserIds());\n    if (checked) {\n      data.forEach((u) => nextSelected.add(u.id));\n    } else {\n      data.forEach((u) => nextSelected.delete(u.id));\n    }\n    this.selectedUserIds.set(nextSelected);\n  }\n\n  toggleSelectUser(id: number, checked: boolean) {\n    const nextSelected = new Set(this.selectedUserIds());\n    if (checked) {\n      nextSelected.add(id);\n    } else {\n      nextSelected.delete(id);\n    }\n    this.selectedUserIds.set(nextSelected);\n  }\n\n  toggleExpandUser(id: number, event: MouseEvent) {\n    event.stopPropagation();\n    const nextExpanded = new Set(this.expandedUserIds());\n    if (nextExpanded.has(id)) {\n      nextExpanded.delete(id);\n    } else {\n      nextExpanded.add(id);\n    }\n    this.expandedUserIds.set(nextExpanded);\n  }\n\n  toggleLoading() {\n    this.isLoading.set(true);\n    setTimeout(() => {\n      this.isLoading.set(false);\n    }, 1200);\n  }\n\n  deleteSelected() {\n    const selectedIds = this.selectedUserIds();\n    this.users.update((current) => current.filter((u) => !selectedIds.has(u.id)));\n    this.selectedUserIds.set(new Set());\n    this.expandedUserIds.set(new Set());\n  }\n\n  deleteUser(id: number, event: MouseEvent) {\n    event.stopPropagation();\n    this.users.update((current) => current.filter((u) => u.id !== id));\n\n    const nextSelected = new Set(this.selectedUserIds());\n    nextSelected.delete(id);\n    this.selectedUserIds.set(nextSelected);\n\n    const nextExpanded = new Set(this.expandedUserIds());\n    nextExpanded.delete(id);\n    this.expandedUserIds.set(nextExpanded);\n  }\n\n  editUser(user: UserElement, event: MouseEvent) {\n    event.stopPropagation();\n    alert(`Editing user: ${user.name} (${user.email})`);\n  }\n\n  resetData() {\n    this.users.set([...INITIAL_USERS]);\n    this.selectedUserIds.set(new Set());\n    this.expandedUserIds.set(new Set());\n    this.searchQuery.set('');\n    this.sortByColumn.set(null);\n  }\n}\n"
      },
      {
        name: "multi-sticky-table",
        html: '<sh-table [data]="dataSource()" [loading]="isLoading()" [variant]="variant()">\n  <tr class="sticky" thead>\n    <div shStickyColumns>\n      <th>im sticky</th>\n      <th>im sticky</th>\n    </div>\n\n    @for (col of displayedColumns(); track col) {\n      <th>{{ col }}</th>\n    }\n\n    <div shStickyColumns="end">\n      <th>im sticky end</th>\n      <th>im sticky end</th>\n    </div>\n  </tr>\n\n  @for (row of dataSource(); track $index) {\n    <tr [class.sticky]="$index % 3 === 0">\n      <div shStickyColumns>\n        <td>im sticky</td>\n        <td>im sticky</td>\n      </div>\n\n      @for (col of displayedColumns(); track col) {\n        <td>{{ row[col] }}</td>\n      }\n\n      <div shStickyColumns="end">\n        <td>im sticky end</td>\n        <td>im sticky end</td>\n      </div>\n    </tr>\n  }\n  <div table-no-rows>No data available</div>\n</sh-table>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipStickyColumns, ShipTable } from '@ship-ui/core/ship-table';\nimport { ShipTableVariant } from '@ship-ui/core';\n\nconst ELEMENT_DATA = [\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n];\nconst COLUMNS = ['position', 'name', 'weight', 'symbol'] as const;\n\n@Component({\n  selector: 'multi-sticky-table',\n  standalone: true,\n  imports: [ShipTable, ShipStickyColumns],\n  templateUrl: './multi-sticky-table.html',\n  styleUrl: './multi-sticky-table.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class MultiStickyTable {\n  variant = input<ShipTableVariant | null>(null);\n  displayedColumns = signal([...COLUMNS]);\n  dataSource = signal([...ELEMENT_DATA]);\n  sortByColumn = signal<string | null>(null);\n  isLoading = signal(false);\n}\n"
      }
    ]
  },
  {
    name: "ShipTableContent",
    selector: "sh-table-content",
    package: "@ship-ui/core/ship-table",
    kind: "component",
    path: "projects/ship-ui/ship-table/ship-table.ts",
    inputs: [
      {
        name: "columns",
        type: "ShipTableColumn[]",
        description: "Column definitions describing how each column is rendered, sorted, and formatted.",
        defaultValue: "[]"
      },
      {
        name: "data",
        type: "any[]",
        description: "The row data rendered into table rows.",
        defaultValue: "[]"
      },
      {
        name: "rowResize",
        type: "boolean",
        description: "When `true`, generated rows get the `shRowResize` drag/keyboard resize handle. Evaluated when rows are created.",
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipTableFilterBar",
    selector: "sh-table-filter-bar",
    package: "@ship-ui/core/ship-table-filter-bar",
    kind: "component",
    path: "projects/ship-ui/ship-table-filter-bar/ship-table-filter-bar.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipTabs",
    selector: "sh-tabs",
    package: "@ship-ui/core/ship-tabs",
    kind: "component",
    path: "projects/ship-ui/ship-tabs/ship-tabs.ts",
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "Color theme applied to the tabs.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--tabs-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--tabs-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--tabs-c",
        defaultValue: "var(--base-12)"
      },
      {
        name: "--tabs-c-hover",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--tabs-c-active",
        defaultValue: "var(--base-12)"
      },
      {
        name: "--tabs-f",
        defaultValue: "var(--paragraph-30)"
      },
      {
        name: "--tabs-sel-bg",
        defaultValue: "var(--base-12)"
      }
    ],
    examples: [
      {
        name: "basic-tab",
        html: `<sh-tabs color="primary" [(value)]="activeTab">
  <button value="tab1">Tab 1</button>
  <button value="tab2">Tab 2</button>
  <button value="tab3">Tab 3</button>
</sh-tabs>

@let _activeTab = activeTab();

<div class="tab-content">
  @if (_activeTab === 'tab1') {
    <div>Tab 1 Content</div>
  } @else if (_activeTab === 'tab2') {
    <div>Tab 2 Content</div>
  } @else if (_activeTab === 'tab3') {
    <div>Tab 3 Content</div>
  }
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipTabs } from '@ship-ui/core/ship-tabs';\n\n@Component({\n  selector: 'app-basic-tab',\n  standalone: true,\n  imports: [ShipTabs],\n  templateUrl: './basic-tab.html',\n  styleUrl: './basic-tab.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicTab {\n  activeTab = signal('tab1');\n}\n"
      },
      {
        name: "tabs-sandbox",
        html: `<sh-tabs [color]="color()" [(value)]="activeTab">
  <button value="tab1">
    <sh-icon>spinner</sh-icon>
    Tab 1
  </button>
  <button value="tab2">
    <sh-icon>hand-palm</sh-icon>
    Tab 2
  </button>
  <button value="tab3">
    <sh-icon>check</sh-icon>
    Tab 3
  </button>
</sh-tabs>

@let _activeTab = activeTab();

<div class="tab-content">
  @if (_activeTab === 'tab1') {
    <app-tab [id]="_activeTab"></app-tab>
  } @else if (_activeTab === 'tab2') {
    <app-tab [id]="_activeTab"></app-tab>
  } @else if (_activeTab === 'tab3') {
    <app-tab [id]="_activeTab"></app-tab>
  }
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipTabs } from '@ship-ui/core/ship-tabs';\nimport Tab from '../../tab/tab';\n\n@Component({\n  selector: 'app-tabs-sandbox',\n  standalone: true,\n  imports: [ShipTabs, ShipIcon, Tab],\n  templateUrl: './tabs-sandbox.html',\n  styleUrl: './tabs-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TabsSandbox {\n  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('');\n  activeTab = signal('tab1');\n}\n"
      },
      {
        name: "custom-tabs",
        html: `<sh-tabs class="primary" [(value)]="activeTab">
  <div value="tab1">
    <sh-icon>spinner</sh-icon>
    Tab 1
  </div>
  <div value="tab2">
    <sh-icon>hand-palm</sh-icon>
    Tab 2
  </div>
  <div value="tab3">
    <sh-icon>check</sh-icon>
    Tab 3
  </div>
</sh-tabs>

@let _activeTab = activeTab();

<div class="tab-content">
  @if (_activeTab === 'tab1') {
    <app-tab [id]="_activeTab"></app-tab>
  } @else if (_activeTab === 'tab2') {
    <app-tab [id]="_activeTab"></app-tab>
  } @else if (_activeTab === 'tab3') {
    <app-tab [id]="_activeTab"></app-tab>
  }
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipTabs } from '@ship-ui/core/ship-tabs';\nimport Tab from '../../tab/tab';\n\n@Component({\n  selector: 'app-custom-tabs',\n  standalone: true,\n  imports: [ShipTabs, ShipIcon, Tab],\n  templateUrl: './custom-tabs.html',\n  styleUrls: ['./custom-tabs.scss'],\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class CustomTabsComponent {\n  activeTab = signal('tab1');\n}\n"
      },
      {
        name: "router-tabs",
        html: '<sh-tabs class="primary">\n  <button routerLink="/tabs/examples/tab/1" routerLinkActive="active">\n    <sh-icon>spinner</sh-icon>\n    Tab 1\n  </button>\n\n  <button routerLink="/tabs/examples/tab/2" routerLinkActive="active">\n    <sh-icon>hand-palm</sh-icon>\n    Tab 2\n  </button>\n\n  <button routerLink="/tabs/examples/tab/3" routerLinkActive="active">\n    <sh-icon>check</sh-icon>\n    Tab 3\n  </button>\n</sh-tabs>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { RouterLink, RouterLinkActive } from '@angular/router';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipTabs } from '@ship-ui/core/ship-tabs';\n\n@Component({\n  selector: 'app-router-tabs',\n  imports: [ShipTabs, ShipIcon, RouterLinkActive, RouterLink],\n  templateUrl: './router-tabs.html',\n  styleUrl: './router-tabs.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RouterTabsComponent {}\n"
      },
      {
        name: "default-tabs",
        html: `<sh-tabs color="primary" [(value)]="activeTab">
  <button value="tab1">
    <sh-icon>spinner</sh-icon>
    Tab 1
  </button>
  <button value="tab2">
    <sh-icon>hand-palm</sh-icon>
    Tab 2
  </button>
  <button value="tab3">
    <sh-icon>check</sh-icon>
    Tab 3
  </button>
</sh-tabs>

@let _activeTab = activeTab();

<div class="tab-content">
  @if (_activeTab === 'tab1') {
    <app-tab [id]="_activeTab"></app-tab>
  } @else if (_activeTab === 'tab2') {
    <app-tab [id]="_activeTab"></app-tab>
  } @else if (_activeTab === 'tab3') {
    <app-tab [id]="_activeTab"></app-tab>
  }
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipTabs } from '@ship-ui/core/ship-tabs';\nimport Tab from '../../tab/tab';\n\n@Component({\n  selector: 'app-default-tabs',\n  standalone: true,\n  imports: [ShipTabs, ShipIcon, Tab],\n  templateUrl: './default-tabs.html',\n  styleUrls: ['./default-tabs.scss'],\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DefaultTabsComponent {\n  activeTab = signal('tab1');\n}\n"
      }
    ],
    keywords: [
      "tab",
      "panel",
      "navigation",
      "routing",
      "sections"
    ]
  },
  {
    name: "ShipThemeToggle",
    selector: "sh-theme-toggle",
    package: "@ship-ui/core/ship-theme-toggle",
    kind: "component",
    path: "projects/ship-ui/ship-theme-toggle/ship-theme-toggle.ts",
    description: '### ShipThemeState\n\n`ShipThemeState` is the root-provided service behind `sh-theme-toggle`. It owns the current\ntheme as a read-only signal, applies the `light`/`dark` class on\n`&lt;html&gt;` through an effect, and persists the choice to `localStorage` (SSR-safe \u2014\nstorage access is skipped on the server).\n\nTry it \u2014 this page uses the same root instance:\n\n<div class="service-demo-row">\n<button shButton color="primary" (click)="themeState.toggleTheme()">\ntoggleTheme() \u2014 current: {{ themeState.theme() ?? \'system\' }}\n</button>\n</div>\n\n### Reading and toggling\n\n`theme()` returns `\'light\'`, `\'dark\'` or `null` (system default).\n`toggleTheme()` cycles light \u2192 dark \u2192 system:\n\n<app-highlight lang="ts" [content]="codeUsage" />\n\n### Setting explicitly\n\n<app-highlight lang="ts" [content]="codeSetTheme" />\n\n### Avoiding the theme flash\n\nWith no stored choice the page follows the OS preference instantly through `color-scheme` and\n`light-dark()`, nothing to do. A stored `\'dark\'`/`\'light\'` choice, however,\nis only applied once Angular has bootstrapped, so on a cold reload (or a prerendered page) the browser paints\nthe system theme first and then swaps. Add this blocking script to `&lt;head&gt;`, before the\nstylesheet, to apply the stored theme before first paint:\n\n<app-highlight lang="html" [content]="codeInit" />\n<app-highlight lang="ts" [content]="codeInitConst" />\n\n### Reacting to theme changes\n\n<app-highlight lang="ts" [content]="codeReact" />',
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "Theme color applied to the underlying toggle button (project default via `ShipConfig.themeToggle.color`).",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "Visual variant applied to the underlying toggle button (project default via `ShipConfig.themeToggle.variant`).",
        defaultValue: "null",
        options: [
          "simple",
          "outlined",
          "flat",
          "raised",
          ""
        ]
      },
      {
        name: "size",
        type: "ShipButtonSize | null",
        description: "Size of the underlying toggle button; `ShipConfig.themeToggle.size` wins over the `small` default.",
        defaultValue: "null",
        options: [
          "small",
          "xsmall",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [
      {
        name: "setTheme",
        parameters: "theme: ShipThemeOption",
        returnType: "void",
        description: "Sets the active theme explicitly to `'light'`, `'dark'`, or `null` (system default)."
      }
    ],
    cssVariables: [],
    examples: [
      {
        name: "styled-theme-toggle",
        html: '<sh-theme-toggle variant="raised" color="primary" />\n<sh-theme-toggle variant="outlined" color="accent" />\n<sh-theme-toggle variant="flat" size="" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipThemeToggle } from '@ship-ui/core/ship-theme-toggle';\n\n@Component({\n  selector: 'app-styled-theme-toggle',\n  standalone: true,\n  imports: [ShipThemeToggle],\n  templateUrl: './styled-theme-toggle.html',\n  styleUrl: './styled-theme-toggle.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class StyledThemeToggle {}\n"
      },
      {
        name: "basic-theme-toggle",
        html: "<sh-theme-toggle />\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipThemeToggle } from '@ship-ui/core/ship-theme-toggle';\n\n@Component({\n  selector: 'app-basic-theme-toggle',\n  standalone: true,\n  imports: [ShipThemeToggle],\n  templateUrl: './basic-theme-toggle.html',\n  styleUrl: './basic-theme-toggle.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicThemeToggle {}\n"
      }
    ]
  },
  {
    name: "ShipToggle",
    selector: "sh-toggle",
    package: "@ship-ui/core/ship-toggle",
    kind: "component",
    path: "projects/ship-ui/ship-toggle/ship-toggle.ts",
    inputs: [
      {
        name: "checked",
        type: "boolean",
        description: "Two-way bound checked state of the toggle.",
        defaultValue: "false",
        twoWay: true
      },
      {
        name: "label",
        type: "string",
        description: "Accessible name for label-less usage; projected text content is used otherwise.",
        defaultValue: "''"
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Color theme applied to the toggle.",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "Sheet variant styling applied to the toggle.",
        defaultValue: "null",
        options: [
          "simple",
          "outlined",
          "flat",
          "raised",
          ""
        ]
      },
      {
        name: "readonly",
        type: "boolean",
        description: "When `true`, the toggle displays its state but cannot be changed by the user.",
        defaultValue: "false"
      },
      {
        name: "disabled",
        type: "boolean",
        description: "When `true`, the toggle is disabled and non-interactive.",
        defaultValue: "false"
      },
      {
        name: "noInternalInput",
        type: "boolean",
        description: "When `true`, no internal `<input>` is rendered and the host acts as an ARIA `switch`.",
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--toggle-bg",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--toggle-b",
        defaultValue: "0"
      },
      {
        name: "--togglek-bg",
        defaultValue: "var(--base-2)"
      },
      {
        name: "--togglek-bs",
        defaultValue: "var(--box-shadow-20)"
      }
    ],
    examples: [
      {
        name: "simple-toggle",
        html: '<sh-toggle [(checked)]="active" variant="simple" label="simple toggle" />\n<sh-toggle [(checked)]="active" variant="simple" color="primary" label="Primary simple toggle" />\n<sh-toggle [(checked)]="active" variant="simple" color="accent" label="Accent simple toggle" />\n<sh-toggle [(checked)]="active" variant="simple" color="warn" label="Warn simple toggle" />\n<sh-toggle [(checked)]="active" variant="simple" color="error" label="Error simple toggle" />\n<sh-toggle [(checked)]="active" variant="simple" color="success" label="Success simple toggle" />\n<sh-toggle [(checked)]="active" variant="simple" [disabled]="true" label="disabled simple toggle" />\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipToggle } from '@ship-ui/core/ship-toggle';\n\n@Component({\n  selector: 'app-simple-toggle',\n  standalone: true,\n  imports: [ShipToggle],\n  templateUrl: './simple-toggle.html',\n  styleUrl: './simple-toggle.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SimpleToggle {\n  active = signal(false);\n}\n"
      },
      {
        name: "raised-toggle",
        html: '<sh-toggle [(checked)]="active" variant="raised" label="raised toggle" />\n<sh-toggle [(checked)]="active" variant="raised" color="primary" label="Primary raised toggle" />\n<sh-toggle [(checked)]="active" variant="raised" color="accent" label="Accent raised toggle" />\n<sh-toggle [(checked)]="active" variant="raised" color="warn" label="Warn raised toggle" />\n<sh-toggle [(checked)]="active" variant="raised" color="error" label="Error raised toggle" />\n<sh-toggle [(checked)]="active" variant="raised" color="success" label="Success raised toggle" />\n<sh-toggle [(checked)]="active" variant="raised" [disabled]="true" label="disabled raised toggle" />\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipToggle } from '@ship-ui/core/ship-toggle';\n\n@Component({\n  selector: 'app-raised-toggle',\n  standalone: true,\n  imports: [ShipToggle],\n  templateUrl: './raised-toggle.html',\n  styleUrl: './raised-toggle.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RaisedToggle {\n  active = signal(false);\n}\n"
      },
      {
        name: "flat-toggle",
        html: '<sh-toggle [(checked)]="active" variant="flat" label="flat toggle" />\n<sh-toggle [(checked)]="active" variant="flat" color="primary" label="Primary flat toggle" />\n<sh-toggle [(checked)]="active" variant="flat" color="accent" label="Accent flat toggle" />\n<sh-toggle [(checked)]="active" variant="flat" color="warn" label="Warn flat toggle" />\n<sh-toggle [(checked)]="active" variant="flat" color="error" label="Error flat toggle" />\n<sh-toggle [(checked)]="active" variant="flat" color="success" label="Success flat toggle" />\n<sh-toggle [(checked)]="active" variant="flat" [disabled]="true" label="disabled flat toggle" />\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipToggle } from '@ship-ui/core/ship-toggle';\n\n@Component({\n  selector: 'app-flat-toggle',\n  standalone: true,\n  imports: [ShipToggle],\n  templateUrl: './flat-toggle.html',\n  styleUrl: './flat-toggle.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FlatToggle {\n  active = signal(false);\n}\n"
      },
      {
        name: "outlined-toggle",
        html: '<sh-toggle [(checked)]="active" variant="outlined" label="outlined toggle" />\n<sh-toggle [(checked)]="active" variant="outlined" color="primary" label="Primary outlined toggle" />\n<sh-toggle [(checked)]="active" variant="outlined" color="accent" label="Accent outlined toggle" />\n<sh-toggle [(checked)]="active" variant="outlined" color="warn" label="Warn outlined toggle" />\n<sh-toggle [(checked)]="active" variant="outlined" color="error" label="Error outlined toggle" />\n<sh-toggle [(checked)]="active" variant="outlined" color="success" label="Success outlined toggle" />\n<sh-toggle [(checked)]="active" variant="outlined" [disabled]="true" label="disabled outlined toggle" />\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipToggle } from '@ship-ui/core/ship-toggle';\n\n@Component({\n  selector: 'app-outlined-toggle',\n  standalone: true,\n  imports: [ShipToggle],\n  templateUrl: './outlined-toggle.html',\n  styleUrl: './outlined-toggle.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OutlinedToggle {\n  active = signal(false);\n}\n"
      },
      {
        name: "basic-toggle",
        html: '<sh-toggle [(checked)]="active" label="Base toggle" />\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipToggle } from '@ship-ui/core/ship-toggle';\n\n@Component({\n  selector: 'app-basic-toggle',\n  standalone: true,\n  imports: [ShipToggle],\n  templateUrl: './basic-toggle.html',\n  styleUrl: './basic-toggle.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicToggle {\n  active = signal(false);\n}\n"
      },
      {
        name: "base-toggle",
        html: '<sh-toggle [(checked)]="active" label="Base toggle" />\n<sh-toggle [(checked)]="active" color="primary" label="Primary toggle" />\n<sh-toggle [(checked)]="active" color="accent" label="Accent toggle" />\n<sh-toggle [(checked)]="active" color="warn" label="Warn toggle" />\n<sh-toggle [(checked)]="active" color="error" label="Error toggle" />\n<sh-toggle [(checked)]="active" color="success" label="Success toggle" />\n<sh-toggle [(checked)]="active" [disabled]="true" label="disabled toggle" />\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipToggle } from '@ship-ui/core/ship-toggle';\n\n@Component({\n  selector: 'app-base-toggle',\n  standalone: true,\n  imports: [ShipToggle],\n  templateUrl: './base-toggle.html',\n  styleUrl: './base-toggle.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseToggle {\n  active = signal(false);\n}\n"
      },
      {
        name: "signal-form-toggle",
        html: '<sh-toggle variant="raised" color="primary">\n  Notifications\n  <input type="checkbox" [formField]="settingsForm.notifications" />\n</sh-toggle>\n\n<sh-toggle variant="raised" color="primary">\n  Sound (requires notifications)\n  <input type="checkbox" [formField]="settingsForm.sound" />\n</sh-toggle>\n\n<pre>{{ settings() | json }}</pre>\n',
        ts: "import { JsonPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { disabled, form, FormField } from '@angular/forms/signals';\nimport { ShipToggle } from '@ship-ui/core/ship-toggle';\n\n@Component({\n  selector: 'app-signal-form-toggle',\n  imports: [JsonPipe, FormField, ShipToggle],\n  templateUrl: './signal-form-toggle.html',\n  styleUrl: './signal-form-toggle.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SignalFormToggle {\n  settings = signal({\n    notifications: true,\n    sound: false,\n  });\n\n  settingsForm = form(this.settings, (path) => {\n    // Sound can only be toggled while notifications are on.\n    disabled(path.sound, ({ valueOf }) => !valueOf(path.notifications));\n  });\n}\n"
      }
    ],
    keywords: [
      "toggle",
      "switch",
      "boolean",
      "on off",
      "checkbox"
    ]
  },
  {
    name: "ShipToggleCard",
    selector: "sh-toggle-card",
    package: "@ship-ui/core/ship-toggle-card",
    kind: "component",
    path: "projects/ship-ui/ship-toggle-card/ship-toggle-card.ts",
    inputs: [
      {
        name: "disableToggle",
        type: "boolean",
        description: "When `true`, disables collapsing and forces the card to stay expanded.",
        defaultValue: "false"
      },
      {
        name: "isActive",
        type: "boolean",
        description: "Two-way bound expanded state; `true` shows the card content.",
        defaultValue: "false",
        twoWay: true
      },
      {
        name: "variant",
        type: "ShipToggleCardVariant | null",
        description: "Visual variant applied via the `toggleCard` component classes.",
        defaultValue: "null",
        options: [
          "type-a",
          "type-b",
          "type-c",
          "type-d",
          ""
        ]
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--tc-py",
        defaultValue: "var(--pad-y-5)"
      },
      {
        name: "--tc-px",
        defaultValue: "var(--pad-x-5)"
      }
    ],
    examples: []
  },
  {
    name: "ShipTooltipWrapper",
    selector: "sh-tooltip-wrapper",
    package: "@ship-ui/core/ship-tooltip",
    kind: "component",
    path: "projects/ship-ui/ship-tooltip/ship-tooltip.ts",
    inputs: [
      {
        name: "positionAnchorName",
        type: "string",
        description: "CSS `position-anchor` name tying the tooltip to its anchor element for native anchor positioning."
      },
      {
        name: "anchorEl",
        type: "ElementRef<HTMLElement>",
        description: "Reference to the anchor element the tooltip is positioned against."
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "Whether the tooltip is currently shown.",
        defaultValue: "false"
      },
      {
        name: "content",
        type: "string | TemplateRef<any> | null | undefined",
        description: "Content to render; a plain string or a `TemplateRef` for custom markup."
      },
      {
        name: "close",
        type: "() => void",
        description: "Callback invoked to dismiss the tooltip, exposed to template content via context.",
        defaultValue: "() => {}"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--tt-bg",
        defaultValue: "var(--base-3)"
      },
      {
        name: "--tt-c",
        defaultValue: "var(--base-12)"
      },
      {
        name: "--tt-mh",
        defaultValue: "#{p2r(136)}"
      },
      {
        name: "--tt-py",
        defaultValue: "var(--pad-y-3)"
      },
      {
        name: "--tt-px",
        defaultValue: "var(--pad-x-3)"
      },
      {
        name: "--tt-mw",
        defaultValue: "#{p2r(280)}"
      },
      {
        name: "--tt-translate-y",
        defaultValue: "50%"
      }
    ],
    examples: []
  },
  {
    name: "ShipTree",
    selector: "sh-tree",
    package: "@ship-ui/core/ship-tree",
    kind: "component",
    path: "projects/ship-ui/ship-tree/ship-tree.ts",
    inputs: [
      {
        name: "items",
        type: "any[]",
        description: "Two-way bound flat list of tree nodes; updated in place when folders are toggled.",
        defaultValue: "[]",
        twoWay: true
      },
      {
        name: "sortableManager",
        type: "any",
        description: "Optional external sortable manager used for drag-and-drop reordering and computing visible nodes.",
        defaultValue: "null"
      },
      {
        name: "selectedId",
        type: "string | null",
        description: "Two-way bound id of the currently selected node.",
        defaultValue: "null",
        twoWay: true
      },
      {
        name: "getId",
        type: "(item: any) => string",
        description: "Accessor returning the unique id of a node.",
        defaultValue: "(item) => item.id"
      },
      {
        name: "getName",
        type: "(item: any) => string",
        description: "Accessor returning the display name of a node.",
        defaultValue: "(item) => item.name"
      },
      {
        name: "getParentId",
        type: "(item: any) => string | null",
        description: "Accessor returning the parent id of a node, or `null` for root nodes.",
        defaultValue: "(item) => item.parentId"
      },
      {
        name: "isFolder",
        type: "(item: any) => boolean",
        description: "Predicate deciding whether a node is a folder (expandable).",
        defaultValue: "(item) => item.type === 'dir'"
      },
      {
        name: "getIsOpen",
        type: "(item: any) => boolean",
        description: "Accessor returning whether a folder node is currently expanded.",
        defaultValue: "(item) => !!item.isOpen"
      },
      {
        name: "setIsOpen",
        type: "(item: any, isOpen: boolean) => void",
        description: "Setter that updates a node's expanded state.",
        defaultValue: "(item, open) => {\n    item.isOpen = open;\n  }"
      },
      {
        name: "getIcon",
        type: "(item: any) => string | null",
        description: "Accessor returning a custom icon name for a node, overriding the default folder/file icons.",
        defaultValue: "() => null"
      }
    ],
    outputs: [
      {
        name: "nodeClick",
        type: "any",
        description: "Emits the node when it is selected (clicked)."
      },
      {
        name: "nodeToggle",
        type: "{ node: any; isOpen: boolean }",
        description: "Emits the node and its new expanded state when a folder is toggled."
      }
    ],
    methods: [
      {
        name: "selectNode",
        parameters: "node: any",
        returnType: "void",
        description: "Marks the given node as selected and emits `nodeClick`."
      }
    ],
    cssVariables: [
      {
        name: "--tree-bg",
        defaultValue: "var(--base-2)"
      },
      {
        name: "--tree-bc",
        defaultValue: "var(--base-3)"
      },
      {
        name: "--tree-c",
        defaultValue: "var(--base-12)"
      },
      {
        name: "--tree-bg-h",
        defaultValue: "var(--base-3)"
      },
      {
        name: "--tree-bg-a",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--tree-bg-s",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--tree-guide-c",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--tree-caret-c",
        defaultValue: "var(--base-9)"
      },
      {
        name: "--tree-caret-c-h",
        defaultValue: "var(--base-12)"
      },
      {
        name: "--tree-ic",
        defaultValue: "var(--base-9)"
      },
      {
        name: "--tree-folder-ic",
        defaultValue: "var(--primary-8)"
      },
      {
        name: "--tree-indent-step",
        defaultValue: "#{p2r(12)}"
      },
      {
        name: "--tree-pl",
        defaultValue: "#{p2r(12)}"
      },
      {
        name: "--tree-pr",
        defaultValue: "#{p2r(6)}"
      }
    ],
    examples: [
      {
        name: "basic-tree",
        html: '<div class="tree-wrapper">\n  <sh-tree [(items)]="nodes">\n    <sh-icon openIcon>folder-open</sh-icon>\n    <sh-icon closedIcon>folder</sh-icon>\n  </sh-tree>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipTree, ShipTreeOpenIcon, ShipTreeClosedIcon } from '@ship-ui/core/ship-tree';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\n\ninterface TreeNode {\n  id: string;\n  name: string;\n  type: 'item' | 'dir';\n  parentId: string | null;\n  isOpen?: boolean;\n}\n\n@Component({\n  selector: 'app-basic-tree',\n  standalone: true,\n  imports: [ShipTree, ShipTreeOpenIcon, ShipTreeClosedIcon, ShipIcon],\n  templateUrl: './basic-tree.html',\n  styleUrl: './basic-tree.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicTree {\n  nodes = signal<TreeNode[]>([\n    { id: '1', name: 'documents', type: 'dir', parentId: null, isOpen: true },\n    { id: '1a', name: 'resume.pdf', type: 'item', parentId: '1' },\n    { id: '1b', name: 'photos', type: 'dir', parentId: '1', isOpen: false },\n    { id: '1b1', name: 'vacation.jpg', type: 'item', parentId: '1b' },\n    { id: '2', name: 'downloads', type: 'dir', parentId: null, isOpen: false },\n    { id: '2a', name: 'installer.dmg', type: 'item', parentId: '2' },\n    { id: '3', name: 'todo-list.txt', type: 'item', parentId: null },\n  ]);\n}\n"
      },
      {
        name: "sortable-tree",
        html: '<div class="sortable-demo">\n  <div class="tree-wrapper">\n    <sh-tree [(items)]="nodes" [sortableManager]="manager">\n      <sh-icon openIcon>folder-open</sh-icon>\n      <sh-icon closedIcon>folder</sh-icon>\n      <sh-icon itemIcon>file</sh-icon>\n\n      <ng-template #dirTemplate let-node>\n        <sh-tree-node>{{ node.name }}</sh-tree-node>\n      </ng-template>\n\n      <ng-template #nodeTemplate let-node>\n        <sh-tree-node>{{ node.name }}</sh-tree-node>\n      </ng-template>\n    </sh-tree>\n  </div>\n\n  <div class="state-panel">\n    <div class="state-header">\n      <sh-icon size="small">code</sh-icon>\n      <span>Live State</span>\n    </div>\n    <pre class="state-json">{{ nodesJson() }}</pre>\n  </div>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { ShipTree, ShipTreeNode, ShipTreeOpenIcon, ShipTreeClosedIcon, ShipTreeItemIcon } from '@ship-ui/core/ship-tree';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { createTreeSortableManager } from '@ship-ui/core/ship-sortable';\n\ninterface TreeNode {\n  id: string;\n  name: string;\n  type: 'item' | 'dir';\n  parentId: string | null;\n  isOpen?: boolean;\n}\n\n@Component({\n  selector: 'app-sortable-tree-example',\n  standalone: true,\n  imports: [ShipTree, ShipTreeNode, ShipTreeOpenIcon, ShipTreeClosedIcon, ShipTreeItemIcon, ShipIcon],\n  templateUrl: './sortable-tree.html',\n  styleUrl: './sortable-tree.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SortableTreeExample {\n  nodes = signal<TreeNode[]>([\n    { id: '1', name: 'src', type: 'dir', parentId: null, isOpen: true },\n    { id: '1a', name: 'app', type: 'dir', parentId: '1', isOpen: true },\n    { id: '1a1', name: 'components', type: 'dir', parentId: '1a', isOpen: true },\n    { id: '1a1a', name: 'sidebar.component.ts', type: 'item', parentId: '1a1' },\n    { id: '1a1b', name: 'header.component.ts', type: 'item', parentId: '1a1' },\n    { id: '1a1c', name: 'footer.component.ts', type: 'item', parentId: '1a1' },\n    { id: '1a2', name: 'services', type: 'dir', parentId: '1a', isOpen: false },\n    { id: '1a2a', name: 'auth.service.ts', type: 'item', parentId: '1a2' },\n    { id: '1a2b', name: 'api.service.ts', type: 'item', parentId: '1a2' },\n    { id: '1a3', name: 'app.component.ts', type: 'item', parentId: '1a' },\n    { id: '1a4', name: 'app.routes.ts', type: 'item', parentId: '1a' },\n    { id: '1b', name: 'assets', type: 'dir', parentId: '1', isOpen: false },\n    { id: '1b1', name: 'images', type: 'dir', parentId: '1b', isOpen: false },\n    { id: '1b1a', name: 'logo.svg', type: 'item', parentId: '1b1' },\n    { id: '1b2', name: 'styles.scss', type: 'item', parentId: '1b' },\n    { id: '1c', name: 'environments', type: 'dir', parentId: '1', isOpen: false },\n    { id: '1c1', name: 'environment.ts', type: 'item', parentId: '1c' },\n    { id: '1c2', name: 'environment.prod.ts', type: 'item', parentId: '1c' },\n    { id: '1d', name: 'main.ts', type: 'item', parentId: '1' },\n    { id: '1e', name: 'index.html', type: 'item', parentId: '1' },\n    { id: '2', name: 'package.json', type: 'item', parentId: null },\n    { id: '3', name: 'tsconfig.json', type: 'item', parentId: null },\n    { id: '4', name: 'angular.json', type: 'item', parentId: null },\n    { id: '5', name: 'README.md', type: 'item', parentId: null },\n  ]);\n\n  manager = createTreeSortableManager(this.nodes);\n\n  nodesJson = computed(() => JSON.stringify(this.nodes(), null, 2));\n}\n"
      },
      {
        name: "template-tree",
        html: `<div class="tree-wrapper">
  <sh-tree [(items)]="nodes" [getId]="getId" [getParentId]="getParentId" [getName]="getName" [isFolder]="isFolderNode">
    <!-- Custom Directory Template -->
    <ng-template #dirTemplate let-node>
      <sh-tree-node>
        @if (node.isOpen) {
          <sh-icon size="small">folder-open</sh-icon>
        } @else {
          <sh-icon size="small">folder</sh-icon>
        }
        {{ node.label }}

        <sh-tree-node-actions>
          <button class="delete-btn" aria-label="Delete node" (click)="deleteNode(node, $event)" type="button">
            <sh-icon size="small">trash</sh-icon>
          </button>
        </sh-tree-node-actions>
      </sh-tree-node>
    </ng-template>

    <!-- Custom File/Item Template -->
    <ng-template #nodeTemplate let-node>
      <sh-tree-node>
        @if (node.label.endsWith('.log')) {
          <sh-icon size="small">scroll</sh-icon>
        } @else if (node.label.endsWith('.yml')) {
          <sh-icon size="small">file-code</sh-icon>
        } @else {
          <sh-icon size="small">file</sh-icon>
        }

        {{ node.label }}

        <sh-tree-node-actions>
          <button class="delete-btn" aria-label="Delete node" (click)="deleteNode(node, $event)" type="button">
            <sh-icon size="small">trash</sh-icon>
          </button>
        </sh-tree-node-actions>
      </sh-tree-node>
    </ng-template>
  </sh-tree>
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipTree, ShipTreeNode, ShipTreeNodeActions } from '@ship-ui/core/ship-tree';\n\ninterface CustomNode {\n  uuid: string;\n  label: string;\n  kind: 'dir' | 'item';\n  ownerUuid: string | null;\n  isOpen?: boolean;\n}\n\n@Component({\n  selector: 'app-template-tree-example',\n  standalone: true,\n  imports: [ShipTree, ShipTreeNode, ShipTreeNodeActions, ShipIcon],\n  templateUrl: './template-tree.html',\n  styleUrl: './template-tree.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TemplateTreeExample {\n  nodes = signal<CustomNode[]>([\n    { uuid: '1', label: 'production-server', kind: 'dir', ownerUuid: null, isOpen: true },\n    { uuid: '1a', label: 'database-migration.log', kind: 'item', ownerUuid: '1' },\n    { uuid: '1b', label: 'docker-compose.yml', kind: 'item', ownerUuid: '1' },\n    { uuid: '2', label: 'staging-server', kind: 'dir', ownerUuid: null, isOpen: false },\n    { uuid: '2a', label: 'error.log', kind: 'item', ownerUuid: '2' },\n  ]);\n\n  getId = (node: CustomNode) => node.uuid;\n  getParentId = (node: CustomNode) => node.ownerUuid;\n  getName = (node: CustomNode) => node.label;\n  isFolderNode = (node: CustomNode) => node.kind === 'dir';\n\n  deleteNode(node: CustomNode, event: MouseEvent) {\n    event.stopPropagation();\n    this.nodes.update((list) => list.filter((n) => n.uuid !== node.uuid && n.ownerUuid !== node.uuid));\n  }\n}\n"
      },
      {
        name: "file-explorer",
        html: `<div class="explorer">
  <aside class="explorer-sidebar">
    <div class="explorer-toolbar">
      <sh-form-field size="small" class="explorer-search">
        <sh-icon prefix>magnifying-glass</sh-icon>
        <input type="search" placeholder="Filter files" [ngModel]="search()" (ngModelChange)="search.set($event)" />
      </sh-form-field>

      <button shButton class="small outlined" aria-label="New folder" title="New folder" (click)="create('dir')">
        <sh-icon>folder-plus</sh-icon>
      </button>
      <button shButton class="small outlined" aria-label="New file" title="New file" (click)="create('item')">
        <sh-icon>file-plus</sh-icon>
      </button>
    </div>

    <sh-tree
      [items]="visibleNodes()"
      (itemsChange)="onItemsChange($event)"
      [(selectedId)]="selectedId"
      [getIcon]="getIcon"
      (nodeClick)="onSelect($event)">
      <sh-icon openIcon>folder-open</sh-icon>
      <sh-icon closedIcon>folder</sh-icon>
      <span emptyState>No files match \u201C{{ search() }}\u201D</span>
    </sh-tree>

    <div class="explorer-footer">
      <button shButton class="small text" (click)="setAllOpen(true)">Expand all</button>
      <button shButton class="small text" (click)="setAllOpen(false)">Collapse all</button>
    </div>
  </aside>

  <section class="explorer-detail">
    @if (selected(); as node) {
      <nav class="explorer-breadcrumb" aria-label="Path">
        @for (crumb of selectedPath(); track crumb.id) {
          @if (!$first) {
            <sh-icon size="small" class="crumb-sep">caret-right</sh-icon>
          }
          <button
            type="button"
            class="crumb"
            [class.is-current]="$last"
            (click)="selectedId.set(crumb.id); onSelect(crumb)">
            {{ crumb.name }}
          </button>
        }
      </nav>

      <div class="explorer-hero">
        <sh-icon size="large" [color]="node.type === 'dir' ? 'primary' : null">
          {{ node.type === 'dir' ? 'folder' : getIcon(node) }}
        </sh-icon>
        <div>
          <h4>{{ node.name }}</h4>
          <span class="explorer-kind">{{ node.type === 'dir' ? 'Folder' : 'File' }}</span>
        </div>
      </div>

      <dl class="explorer-meta">
        @if (node.type === 'dir') {
          <dt>Contains</dt>
          <dd>{{ selectedChildCount() }} {{ selectedChildCount() === 1 ? 'item' : 'items' }}</dd>
        } @else {
          <dt>Size</dt>
          <dd>{{ formatSize(node.size) }}</dd>
        }
        <dt>Modified</dt>
        <dd>{{ node.modified ?? '\u2014' }}</dd>
      </dl>

      <div class="explorer-rename">
        <sh-form-field size="small">
          <label>Rename</label>
          <input
            type="text"
            [ngModel]="renameValue()"
            (ngModelChange)="renameValue.set($event)"
            (keydown.enter)="rename()" />
        </sh-form-field>
        <button shButton type="button" class="small primary raised" (click)="rename()">Save</button>
      </div>

      <div class="explorer-actions">
        <button shButton class="small outlined error" (click)="deleteSelected()">
          <sh-icon>trash</sh-icon>
          Delete {{ node.type === 'dir' ? 'folder' : 'file' }}
        </button>
      </div>
    } @else {
      <div class="explorer-empty">
        <sh-icon size="large">cursor-click</sh-icon>
        <p>Select a file or folder to see its details.</p>
      </div>
    }
  </section>
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButton } from '@ship-ui/core/ship-button';\nimport { ShipFormField } from '@ship-ui/core/ship-form-field';\nimport { ShipIcon } from '@ship-ui/core/ship-icon';\nimport { ShipTree, ShipTreeClosedIcon, ShipTreeOpenIcon } from '@ship-ui/core/ship-tree';\n\ninterface FsNode {\n  id: string;\n  name: string;\n  type: 'dir' | 'item';\n  parentId: string | null;\n  isOpen?: boolean;\n  size?: number;\n  modified?: string;\n}\n\nconst ICON_BY_EXTENSION: Record<string, string> = {\n  ts: 'file-ts',\n  js: 'file-js',\n  html: 'file-html',\n  scss: 'file-css',\n  css: 'file-css',\n  json: 'brackets-curly',\n  md: 'file-md',\n  svg: 'file-svg',\n  png: 'image',\n  jpg: 'image',\n};\n\n@Component({\n  selector: 'app-file-explorer-example',\n  standalone: true,\n  imports: [FormsModule, ShipTree, ShipTreeOpenIcon, ShipTreeClosedIcon, ShipIcon, ShipButton, ShipFormField],\n  templateUrl: './file-explorer.html',\n  styleUrl: './file-explorer.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FileExplorerExample {\n  nodes = signal<FsNode[]>([\n    { id: 'src', name: 'src', type: 'dir', parentId: null, isOpen: true },\n    { id: 'app', name: 'app', type: 'dir', parentId: 'src', isOpen: true },\n    { id: 'app-ts', name: 'app.ts', type: 'item', parentId: 'app', size: 1840, modified: '2026-09-01' },\n    { id: 'app-html', name: 'app.html', type: 'item', parentId: 'app', size: 920, modified: '2026-09-01' },\n    { id: 'app-scss', name: 'app.scss', type: 'item', parentId: 'app', size: 610, modified: '2026-08-28' },\n    { id: 'routes', name: 'app.routes.ts', type: 'item', parentId: 'app', size: 430, modified: '2026-08-20' },\n    { id: 'assets', name: 'assets', type: 'dir', parentId: 'src', isOpen: false },\n    { id: 'logo', name: 'logo.svg', type: 'item', parentId: 'assets', size: 3120, modified: '2026-07-14' },\n    { id: 'hero', name: 'hero.png', type: 'item', parentId: 'assets', size: 248000, modified: '2026-07-14' },\n    { id: 'main', name: 'main.ts', type: 'item', parentId: 'src', size: 210, modified: '2026-06-02' },\n    { id: 'index', name: 'index.html', type: 'item', parentId: 'src', size: 540, modified: '2026-06-02' },\n    { id: 'docs', name: 'docs', type: 'dir', parentId: null, isOpen: false },\n    { id: 'readme', name: 'README.md', type: 'item', parentId: 'docs', size: 4200, modified: '2026-08-30' },\n    { id: 'changelog', name: 'CHANGELOG.md', type: 'item', parentId: 'docs', size: 12800, modified: '2026-09-03' },\n    { id: 'pkg', name: 'package.json', type: 'item', parentId: null, size: 1650, modified: '2026-08-30' },\n    { id: 'tsconfig', name: 'tsconfig.json', type: 'item', parentId: null, size: 380, modified: '2026-05-11' },\n  ]);\n\n  selectedId = signal<string | null>('app-ts');\n  search = signal('');\n  renameValue = signal('app.ts');\n\n  /** Nodes shown in the tree: everything, or the search matches plus their ancestors forced open. */\n  visibleNodes = computed(() => {\n    const query = this.search().trim().toLowerCase();\n    const all = this.nodes();\n    if (!query) return all;\n\n    const keep = new Set<string>();\n    for (const node of all) {\n      if (!node.name.toLowerCase().includes(query)) continue;\n      let current: FsNode | undefined = node;\n      while (current) {\n        keep.add(current.id);\n        current = all.find((n) => n.id === current!.parentId);\n      }\n    }\n    return all.filter((n) => keep.has(n.id)).map((n) => (n.type === 'dir' ? { ...n, isOpen: true } : n));\n  });\n\n  selected = computed(() => this.nodes().find((n) => n.id === this.selectedId()) ?? null);\n\n  /** Breadcrumb from the root down to the selected node. */\n  selectedPath = computed(() => {\n    const trail: FsNode[] = [];\n    let current = this.selected();\n    while (current) {\n      trail.unshift(current);\n      current = this.nodes().find((n) => n.id === current!.parentId) ?? null;\n    }\n    return trail;\n  });\n\n  selectedChildCount = computed(() => {\n    const id = this.selectedId();\n    return this.nodes().filter((n) => n.parentId === id).length;\n  });\n\n  getIcon = (node: FsNode) => {\n    if (node.type === 'dir') return null;\n    const ext = node.name.split('.').pop()?.toLowerCase() ?? '';\n    return ICON_BY_EXTENSION[ext] ?? 'file';\n  };\n\n  /** Folder toggles arrive through itemsChange; copy the open state back onto the source list. */\n  onItemsChange(list: FsNode[]) {\n    if (!this.search().trim()) {\n      this.nodes.set(list);\n      return;\n    }\n    this.nodes.update((all) =>\n      all.map((n) => {\n        const updated = list.find((x) => x.id === n.id);\n        return updated && updated.isOpen !== n.isOpen ? { ...n, isOpen: updated.isOpen } : n;\n      })\n    );\n  }\n\n  onSelect(node: FsNode) {\n    this.renameValue.set(node.name);\n  }\n\n  /** Target folder for new entries: the selected folder, or the folder containing the selected file. */\n  #targetFolderId(): string | null {\n    const selected = this.selected();\n    if (!selected) return null;\n    return selected.type === 'dir' ? selected.id : selected.parentId;\n  }\n\n  create(type: 'dir' | 'item') {\n    const parentId = this.#targetFolderId();\n    const siblings = this.nodes().filter((n) => n.parentId === parentId && n.type === type);\n    const base = type === 'dir' ? 'new-folder' : 'untitled.ts';\n    let name = base;\n    for (let i = 2; siblings.some((n) => n.name === name); i++) {\n      name = type === 'dir' ? `${base}-${i}` : `untitled-${i}.ts`;\n    }\n\n    const node: FsNode = {\n      id: `${type}-${Date.now()}`,\n      name,\n      type,\n      parentId,\n      isOpen: type === 'dir' ? false : undefined,\n      size: type === 'item' ? 0 : undefined,\n      modified: new Date().toISOString().slice(0, 10),\n    };\n\n    // The tree renders in list order, so a child must sit inside its parent's\n    // block: insert it right after the parent's last descendant.\n    this.nodes.update((all) => {\n      const opened = all.map((n) => (n.id === parentId ? { ...n, isOpen: true } : n));\n      const insertAt = parentId === null ? opened.length : this.#subtreeEnd(opened, parentId);\n      return [...opened.slice(0, insertAt), node, ...opened.slice(insertAt)];\n    });\n    this.search.set('');\n    this.selectedId.set(node.id);\n    this.renameValue.set(node.name);\n  }\n\n  /** Index just past the last node inside `folderId`'s subtree. */\n  #subtreeEnd(list: FsNode[], folderId: string): number {\n    const inside = new Set([folderId]);\n    let end = list.findIndex((n) => n.id === folderId) + 1;\n    for (let i = end; i < list.length; i++) {\n      if (list[i].parentId && inside.has(list[i].parentId!)) {\n        inside.add(list[i].id);\n        end = i + 1;\n      }\n    }\n    return end;\n  }\n\n  rename() {\n    const id = this.selectedId();\n    const name = this.renameValue().trim();\n    if (!id || !name) return;\n    this.nodes.update((all) => all.map((n) => (n.id === id ? { ...n, name } : n)));\n  }\n\n  deleteSelected() {\n    const id = this.selectedId();\n    if (!id) return;\n    const doomed = new Set<string>([id]);\n    let grew = true;\n    while (grew) {\n      grew = false;\n      for (const n of this.nodes()) {\n        if (n.parentId && doomed.has(n.parentId) && !doomed.has(n.id)) {\n          doomed.add(n.id);\n          grew = true;\n        }\n      }\n    }\n    this.nodes.update((all) => all.filter((n) => !doomed.has(n.id)));\n    this.selectedId.set(null);\n  }\n\n  setAllOpen(open: boolean) {\n    this.nodes.update((all) => all.map((n) => (n.type === 'dir' ? { ...n, isOpen: open } : n)));\n  }\n\n  formatSize(bytes: number | undefined): string {\n    if (bytes == null) return '\u2014';\n    if (bytes < 1024) return `${bytes} B`;\n    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;\n    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;\n  }\n}\n"
      }
    ],
    keywords: [
      "tree",
      "treeview",
      "folder explorer",
      "file browser",
      "file manager",
      "flat tree",
      "nodes",
      "hierarchy",
      "folder structure",
      "nested",
      "expandable",
      "collapsible",
      "drag-and-drop",
      "sortable tree",
      "sidebar",
      "directory",
      "navigation",
      "project structure",
      "explorer panel",
      "file tree"
    ]
  },
  {
    name: "ShipTreeNode",
    selector: "sh-tree-node",
    package: "@ship-ui/core/ship-tree",
    kind: "component",
    path: "projects/ship-ui/ship-tree/ship-tree.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipTreeNodeActions",
    selector: "sh-tree-node-actions",
    package: "@ship-ui/core/ship-tree",
    kind: "component",
    path: "projects/ship-ui/ship-tree/ship-tree.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipVideo",
    selector: "sh-video",
    package: "@ship-ui/core/ship-video",
    kind: "component",
    path: "projects/ship-ui/ship-video/ship-video.ts",
    description: '### ShipVideoState\n\n`ShipVideoState` is the centralized player store. `sh-video` provides its own instance by\ndefault, but you can provide it on a wrapper component to share a single store between the player, custom\ncontrols and editor chrome. The store itself stays passive \u2014 commands delegate to whichever player registered via\n`attachPlayer()`.\n\n<app-highlight lang="ts" [content]="codeShare" />\n\n### Signals as the API\n\nThe writable signals are the control surface: setting `playing` plays, setting\n`currentTime` seeks, setting `quality` switches renditions. Observed signals like\n`duration`, `bufferedRanges`, `levels` or `isLive` are kept current by\nthe player engine.\n\n<app-highlight lang="ts" [content]="codeSignals" />\n\n### Command methods\n\nEverything that is a command rather than state goes through a method:\n\n<app-highlight lang="ts" [content]="codeCommands" />\n\n### Frame-accurate work\n\nFor editors and overlays, the store exposes frame callbacks and the underlying media element:\n\n<app-highlight lang="ts" [content]="codeFrames" />',
    inputs: [
      {
        name: "sources",
        type: "string | ShipVideoSource[] | null",
        description: "Video source(s): a URL or a list of `ShipVideoSource` (format/quality/language variants).",
        defaultValue: "null"
      },
      {
        name: "poster",
        type: "string | null",
        description: "Featured image shown before playback starts (also the video poster).",
        defaultValue: "null"
      },
      {
        name: "ad",
        type: "ShipVideoAd | null",
        description: "Pre-roll advertisement: inline creative or async resolver (VAST-ready).",
        defaultValue: "null"
      },
      {
        name: "tracks",
        type: "ShipVideoTrack[]",
        description: "Subtitle/caption tracks (WebVTT).",
        defaultValue: "[]"
      },
      {
        name: "loop",
        type: "boolean",
        description: "Loops the content video when `true`.",
        defaultValue: "false"
      },
      {
        name: "preload",
        type: "'auto' | 'metadata' | 'none'",
        description: "Preload strategy of the content video.",
        defaultValue: "'metadata'",
        options: [
          "auto",
          "metadata",
          "none"
        ]
      },
      {
        name: "firstFrame",
        type: "boolean | number",
        description: "Shows a video frame as the featured image when no poster is set.\n`true` (default) picks a frame ~10% into the video (capped at 20s) so\nfade-from-black intros still yield a real image; a number grabs the frame\nat that exact time in seconds; `false` opts out. Playback always starts\nfrom the beginning.",
        defaultValue: "true"
      },
      {
        name: "lazy",
        type: "boolean",
        description: "Defers all network work until the player nears the viewport.",
        defaultValue: "false"
      },
      {
        name: "resumeKey",
        type: "string | null",
        description: "localStorage key for resuming playback position.",
        defaultValue: "null"
      },
      {
        name: "playbackRates",
        type: "number[]",
        description: "Speeds offered by the settings menu.",
        defaultValue: "[0.5, 1, 1.25, 1.5, 2]"
      },
      {
        name: "interactive",
        type: "boolean",
        description: "When `false`, the player ignores clicks/keyboard \u2014 a wrapper (editor) drives it.",
        defaultValue: "true"
      },
      {
        name: "crossOrigin",
        type: "'anonymous' | 'use-credentials' | null",
        description: "`crossorigin` for the media elements. Required for auto first-frame\nscoring and canvas capture of cross-origin media whose server sends CORS\nheaders; leave `null` for hosts without CORS or the video won't load.",
        defaultValue: "null",
        options: [
          "anonymous",
          "use-credentials"
        ]
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Accent color of played bar and active states (`ShipColor`).",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "variant",
        type: "ShipVideoVariant | null",
        description: "Chrome variant: `base` (scrubber above buttons) or `edge` (scrubber flush with the bottom edge).",
        defaultValue: "null"
      },
      {
        name: "sharp",
        type: "boolean | undefined",
        description: "When `true`, renders the player with sharp (non-rounded) corners.",
        defaultValue: "undefined"
      },
      {
        name: "volume",
        type: "number",
        description: "Two-way bound volume from `0` to `1`.",
        defaultValue: "1",
        twoWay: true
      },
      {
        name: "muted",
        type: "boolean",
        description: "Two-way bound muted state.",
        defaultValue: "false",
        twoWay: true
      },
      {
        name: "playbackRate",
        type: "number",
        description: "Two-way bound playback rate.",
        defaultValue: "1",
        twoWay: true
      },
      {
        name: "quality",
        type: "'auto' | number",
        description: "Two-way bound quality: `'auto'` or a level id.",
        defaultValue: "'auto'",
        options: [
          "auto"
        ],
        twoWay: true
      },
      {
        name: "textTrack",
        type: "number | null",
        description: "Two-way bound subtitle track id, `null` = off.",
        defaultValue: "null",
        twoWay: true
      }
    ],
    outputs: [
      {
        name: "videoStarted",
        type: "void",
        description: "Emits when playback starts for the first time (before a potential ad)."
      },
      {
        name: "videoPlayed",
        type: "void",
        description: "Emits when the content video starts or resumes playing."
      },
      {
        name: "videoPaused",
        type: "void",
        description: "Emits when the content video is paused."
      },
      {
        name: "videoEnded",
        type: "void",
        description: "Emits when the content video ends."
      },
      {
        name: "videoTimeUpdated",
        type: "number",
        description: "Emits the content current time (seconds) while playing."
      },
      {
        name: "adStarted",
        type: "void",
        description: "Emits when the pre-roll ad starts."
      },
      {
        name: "adSkipped",
        type: "void",
        description: "Emits when the pre-roll ad is skipped."
      },
      {
        name: "adEnded",
        type: "void",
        description: "Emits when the pre-roll ad finishes (ended or skipped)."
      },
      {
        name: "adClicked",
        type: "string",
        description: "Emits the click-through URL when the ad link is clicked."
      },
      {
        name: "qualityLevels",
        type: "readonly ShipVideoQualityLevel[]",
        description: "Emits the quality ladder once known (engine manifest or height-tagged sources)."
      },
      {
        name: "videoError",
        type: "ShipVideoEngineError",
        description: "Emits engine/media errors."
      }
    ],
    methods: [
      {
        name: "requestCast",
        parameters: "",
        returnType: "void",
        description: "Opens the Chromecast/remote-playback device picker."
      },
      {
        name: "requestAirplay",
        parameters: "",
        returnType: "void",
        description: "Opens Safari's AirPlay target picker."
      },
      {
        name: "seekTo",
        parameters: "seconds: number, options?: { precise?: boolean }",
        returnType: "void",
        description: ""
      },
      {
        name: "step",
        parameters: "frames: number",
        returnType: "void",
        description: "Frame stepping; pauses playback. Frame duration measured from rVFC deltas."
      },
      {
        name: "onVideoFrame",
        parameters: "callback: (time: number) => void",
        returnType: "() => void",
        description: "`requestVideoFrameCallback` passthrough; returns an unsubscribe function."
      },
      {
        name: "goToLive",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "toggleFullscreen",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "togglePip",
        parameters: "",
        returnType: "void",
        description: ""
      }
    ],
    cssVariables: [
      {
        name: "--vid-accent",
        defaultValue: "var(--primary-8)"
      },
      {
        name: "--vid-ad-accent",
        defaultValue: "var(--warn-8)"
      },
      {
        name: "--vid-ad-accent-text",
        defaultValue: "var(--dark-text)"
      },
      {
        name: "--vid-chrome-text",
        defaultValue: "var(--light-text)"
      },
      {
        name: "--vid-chrome-bg",
        defaultValue: "linear-gradient(to top, rgb(from var(--dark-text) r g b / 72%), rgb(from var(--dark-text) r g b / 28%) 60%, transparent)"
      },
      {
        name: "--vid-chrome-bg-edge",
        defaultValue: "color-mix(in srgb, var(--dark-text) 93%, var(--light-text))"
      },
      {
        name: "--vid-surface-bg",
        defaultValue: "var(--dark-text)"
      },
      {
        name: "--vid-rail-bg",
        defaultValue: "rgb(from var(--light-text) r g b / 24%)"
      },
      {
        name: "--vid-rail-buffered",
        defaultValue: "rgb(from var(--light-text) r g b / 42%)"
      },
      {
        name: "--vid-rail-h",
        defaultValue: "#{p2r(3)}"
      },
      {
        name: "--vid-rail-h-a",
        defaultValue: "#{p2r(5)}"
      },
      {
        name: "--vid-knob-si",
        defaultValue: "#{p2r(12)}"
      },
      {
        name: "--vid-marker-bg",
        defaultValue: "rgb(from var(--light-text) r g b / 85%)"
      },
      {
        name: "--vid-btn-bg-h",
        defaultValue: "rgb(from var(--light-text) r g b / 14%)"
      },
      {
        name: "--vid-chip-bg",
        defaultValue: "rgb(from var(--dark-text) r g b / 72%)"
      },
      {
        name: "--vid-chip-bg-h",
        defaultValue: "rgb(from var(--dark-text) r g b / 90%)"
      },
      {
        name: "--vid-chip-bc",
        defaultValue: "rgb(from var(--light-text) r g b / 40%)"
      },
      {
        name: "--vid-thumb-bc",
        defaultValue: "rgb(from var(--light-text) r g b / 90%)"
      },
      {
        name: "--vid-dot-bg",
        defaultValue: "rgb(from var(--light-text) r g b / 50%)"
      },
      {
        name: "--vid-br",
        defaultValue: "var(--shape-2)"
      },
      {
        name: "--vid-focus",
        defaultValue: "var(--primary-8)"
      }
    ],
    examples: [
      {
        name: "ad-video",
        html: `<!-- blender.org serves no CORS headers, so the auto frame-scoring can't read
     pixels here \u2014 pick the featured frame explicitly instead -->
<sh-video [firstFrame]="30" sources="https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4" [ad]="ad" />
`,
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipVideo, ShipVideoAd } from '@ship-ui/core/ship-video';\n\n@Component({\n  selector: 'app-ad-video',\n  standalone: true,\n  imports: [ShipVideo],\n  templateUrl: './ad-video.html',\n  styleUrl: './ad-video.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class AdVideo {\n  ad: ShipVideoAd = {\n    src: 'https://www.w3schools.com/html/mov_bbb.mp4',\n    skipAfter: 5,\n    clickThroughUrl: 'https://shipui.com',\n    label: 'Ad',\n  };\n}\n"
      },
      {
        name: "ts-video",
        html: '<!-- Legacy MPEG-TS HLS: segments are transmuxed to fMP4 on the fly by the\n     built-in Zig\u2192wasm transmuxer (~10KB, lazily loaded only for .ts streams). -->\n<sh-video [firstFrame]="10" sources="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipVideo } from '@ship-ui/core/ship-video';\n\n@Component({\n  selector: 'app-ts-video',\n  standalone: true,\n  imports: [ShipVideo],\n  templateUrl: './ts-video.html',\n  styleUrl: './ts-video.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TsVideo {}\n"
      },
      {
        name: "composed-video",
        html: '<!-- Every composable control, in flex order. Cast/AirPlay render only when the\n     browser has a castable device / wireless target available. -->\n<!-- no poster: the featured image is a video frame ([firstFrame] time,\n     explicit because blender.org media is not CORS-readable for auto-scoring) -->\n<sh-video color="accent" [firstFrame]="30" [sources]="sources" [tracks]="tracks">\n  <sh-video-controls>\n    <sh-video-scrubber />\n\n    <sh-video-play-button />\n    <sh-video-volume />\n    <sh-video-time />\n    <!-- X-style countdown alternative to sh-video-time -->\n    <sh-video-playtime-left />\n\n    <span class="sh-video-spacer"></span>\n\n    <sh-video-captions-button />\n    <sh-video-settings />\n    <sh-video-cast-button />\n    <sh-video-airplay-button />\n    <sh-video-pip-button />\n    <sh-video-fullscreen-button />\n  </sh-video-controls>\n</sh-video>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport {\n  ShipVideo,\n  ShipVideoAirplayButton,\n  ShipVideoCaptionsButton,\n  ShipVideoCastButton,\n  ShipVideoControls,\n  ShipVideoFullscreenButton,\n  ShipVideoPipButton,\n  ShipVideoPlayButton,\n  ShipVideoPlaytimeLeft,\n  ShipVideoScrubber,\n  ShipVideoSettings,\n  ShipVideoSource,\n  ShipVideoTime,\n  ShipVideoTrack,\n  ShipVideoVolume,\n} from '@ship-ui/core/ship-video';\n\nconst SINTEL = 'https://download.blender.org/durian/trailer';\n\nfunction vtt(lines: string[]): string {\n  return 'data:text/vtt,' + encodeURIComponent(['WEBVTT', '', ...lines].join('\\n'));\n}\n\n@Component({\n  selector: 'app-composed-video',\n  standalone: true,\n  imports: [\n    ShipVideo,\n    ShipVideoControls,\n    ShipVideoScrubber,\n    ShipVideoPlayButton,\n    ShipVideoVolume,\n    ShipVideoTime,\n    ShipVideoPlaytimeLeft,\n    ShipVideoCaptionsButton,\n    ShipVideoSettings,\n    ShipVideoCastButton,\n    ShipVideoAirplayButton,\n    ShipVideoPipButton,\n    ShipVideoFullscreenButton,\n  ],\n  templateUrl: './composed-video.html',\n  styleUrl: './composed-video.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ComposedVideo {\n  /** height-tagged variants feed the quality section of the settings menu */\n  sources: ShipVideoSource[] = [\n    { src: `${SINTEL}/sintel_trailer-1080p.mp4`, height: 1080 },\n    { src: `${SINTEL}/sintel_trailer-720p.mp4`, height: 720 },\n    { src: `${SINTEL}/sintel_trailer-480p.mp4`, height: 480 },\n  ];\n\n  tracks: ShipVideoTrack[] = [\n    {\n      src: vtt(['00:00.000 --> 00:05.000', 'A fully composed ship-ui player', '', '00:05.000 --> 00:10.000', 'Every control is its own component']),\n      srclang: 'en',\n      label: 'English',\n      default: true,\n    },\n    {\n      src: vtt(['00:00.000 --> 00:05.000', 'En fuldt komponeret ship-ui afspiller', '', '00:05.000 --> 00:10.000', 'Hver kontrol er sin egen komponent']),\n      srclang: 'da',\n      label: 'Dansk',\n    },\n  ];\n}\n"
      },
      {
        name: "edge-video",
        html: '<!-- edge variant: the scrubber sits flush against the bottom of the frame -->\n<sh-video variant="edge" [firstFrame]="30" sources="https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipVideo } from '@ship-ui/core/ship-video';\n\n@Component({\n  selector: 'app-edge-video',\n  standalone: true,\n  imports: [ShipVideo],\n  templateUrl: './edge-video.html',\n  styleUrl: './edge-video.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class EdgeVideo {}\n"
      },
      {
        name: "hls-video",
        html: '<!-- fMP4/CMAF HLS through the in-house MSE engine: adaptive quality + audio\n     languages in settings. firstFrame=4 grabs the featured frame at 4s\n     because this stream fades in from black. -->\n<sh-video [firstFrame]="4" sources="https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipVideo } from '@ship-ui/core/ship-video';\n\n@Component({\n  selector: 'app-hls-video',\n  standalone: true,\n  imports: [ShipVideo],\n  templateUrl: './hls-video.html',\n  styleUrl: './hls-video.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class HlsVideo {}\n"
      },
      {
        name: "playlist-video",
        html: '<div class="player-with-playlist">\n  <sh-video #player [firstFrame]="30" />\n  <sh-video-playlist [player]="player" [items]="items" [autoAdvance]="true">\n    <header>Up next</header>\n  </sh-video-playlist>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipVideo, ShipVideoPlaylist, ShipVideoPlaylistItem } from '@ship-ui/core/ship-video';\n\n@Component({\n  selector: 'app-playlist-video',\n  standalone: true,\n  imports: [ShipVideo, ShipVideoPlaylist],\n  templateUrl: './playlist-video.html',\n  styleUrl: './playlist-video.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class PlaylistVideo {\n  items: ShipVideoPlaylistItem[] = [\n    {\n      title: 'Sintel Trailer',\n      subtitle: 'Blender Foundation',\n      duration: '0:52',\n      sources: 'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4',\n      poster: 'https://durian.blender.org/wp-content/uploads/2010/06/05.8b_comp_000272.jpg',\n    },\n    {\n      title: 'Big Buck Bunny',\n      subtitle: 'Blender Foundation',\n      duration: '0:10',\n      sources: 'https://www.w3schools.com/html/mov_bbb.mp4',\n      poster: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg',\n    },\n    {\n      title: 'Tears of Steel',\n      subtitle: 'Blender Foundation \u2014 full film',\n      duration: '12:14',\n      sources: 'https://download.blender.org/demo/movies/ToS/tears_of_steel_720p.mov',\n      poster: 'https://mango.blender.org/wp-content/uploads/2013/05/01_thom_celia_bridge.jpg',\n    },\n  ];\n}\n"
      },
      {
        name: "basic-video",
        html: '<sh-video\n  sources="https://www.w3schools.com/html/mov_bbb.mp4"\n  poster="https://peach.blender.org/wp-content/uploads/title_anouncement.jpg" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipVideo } from '@ship-ui/core/ship-video';\n\n@Component({\n  selector: 'app-basic-video',\n  standalone: true,\n  imports: [ShipVideo],\n  templateUrl: './basic-video.html',\n  styleUrl: './basic-video.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicVideo {}\n"
      }
    ]
  },
  {
    name: "ShipVideoAirplayButton",
    selector: "sh-video-airplay-button",
    package: "@ship-ui/core/ship-video",
    kind: "component",
    path: "projects/ship-ui/ship-video/ship-video-controls.ts",
    description: "AirPlay button (WebKit target picker \u2014 Safari).\nRenders nothing when no wireless playback target is available.",
    inputs: [
      {
        name: "alwaysVisible",
        type: "boolean",
        description: "Shows the button even without an available AirPlay target (demos, previews).",
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipVideoCaptionsButton",
    selector: "sh-video-captions-button",
    package: "@ship-ui/core/ship-video",
    kind: "component",
    path: "projects/ship-ui/ship-video/ship-video-controls.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipVideoCastButton",
    selector: "sh-video-cast-button",
    package: "@ship-ui/core/ship-video",
    kind: "component",
    path: "projects/ship-ui/ship-video/ship-video-controls.ts",
    description: "Chromecast/remote-device button (Remote Playback API \u2014 Chrome/Edge).\nRenders nothing when the browser has no remote device available.",
    inputs: [
      {
        name: "alwaysVisible",
        type: "boolean",
        description: "Shows the button even without an available cast target (demos, previews).",
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipVideoControls",
    selector: "sh-video-controls",
    package: "@ship-ui/core/ship-video",
    kind: "component",
    path: "projects/ship-ui/ship-video/ship-video-controls.ts",
    description: "Control bar. Project composable children, or let `sh-video` render it with\n`defaultLayout` for the batteries-included set.",
    inputs: [
      {
        name: "defaultLayout",
        type: "boolean",
        description: "Renders the full default control set instead of projected content.",
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipVideoFullscreenButton",
    selector: "sh-video-fullscreen-button",
    package: "@ship-ui/core/ship-video",
    kind: "component",
    path: "projects/ship-ui/ship-video/ship-video-controls.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipVideoLiveButton",
    selector: "sh-video-live-button",
    package: "@ship-ui/core/ship-video",
    kind: "component",
    path: "projects/ship-ui/ship-video/ship-video-controls.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipVideoPipButton",
    selector: "sh-video-pip-button",
    package: "@ship-ui/core/ship-video",
    kind: "component",
    path: "projects/ship-ui/ship-video/ship-video-controls.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipVideoPlayButton",
    selector: "sh-video-play-button",
    package: "@ship-ui/core/ship-video",
    kind: "component",
    path: "projects/ship-ui/ship-video/ship-video-controls.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipVideoPlaylist",
    selector: "sh-video-playlist",
    package: "@ship-ui/core/ship-video",
    kind: "component",
    path: "projects/ship-ui/ship-video/ship-video-playlist.ts",
    description: 'YouTube-style "up next" list. Standalone (`items` + `itemSelected`), or bind\n`[player]` to drive a `sh-video` instance: selection swaps its sources/poster,\n`autoAdvance` moves to the next item when the video ends.',
    inputs: [
      {
        name: "items",
        type: "ShipVideoPlaylistItem[]",
        description: ""
      },
      {
        name: "player",
        type: "ShipVideo | null",
        description: "Optional player instance this playlist drives.",
        defaultValue: "null"
      },
      {
        name: "autoAdvance",
        type: "boolean",
        description: "Advances to the next item when the bound player's video ends.",
        defaultValue: "false"
      },
      {
        name: "activeIndex",
        type: "number",
        description: "",
        defaultValue: "0",
        twoWay: true
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "Color theme of active item accents (`ShipColor`).",
        defaultValue: "null",
        options: [
          "primary",
          "accent",
          "warn",
          "error",
          "success",
          ""
        ]
      },
      {
        name: "sharp",
        type: "boolean | undefined",
        description: "When `true`, renders with sharp (non-rounded) corners.",
        defaultValue: "undefined"
      }
    ],
    outputs: [
      {
        name: "itemSelected",
        type: "{ item: ShipVideoPlaylistItem; index: number }",
        description: ""
      }
    ],
    methods: [],
    cssVariables: [
      {
        name: "--vpl-accent",
        defaultValue: "var(--primary-8)"
      },
      {
        name: "--vpl-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--vpl-item-hover",
        defaultValue: "var(--base-3)"
      },
      {
        name: "--vpl-br",
        defaultValue: "var(--shape-2)"
      }
    ],
    examples: []
  },
  {
    name: "ShipVideoPlaytimeLeft",
    selector: "sh-video-playtime-left",
    package: "@ship-ui/core/ship-video",
    kind: "component",
    path: "projects/ship-ui/ship-video/ship-video-controls.ts",
    description: "X/Twitter-style countdown pill showing time remaining \u2014 an alternative to\n`sh-video-time`. Counts down the ad while one plays.",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipVideoScrubber",
    selector: "sh-video-scrubber",
    package: "@ship-ui/core/ship-video",
    kind: "component",
    path: "projects/ship-ui/ship-video/ship-video-scrubber.ts",
    description: "Seek bar: buffered ranges, drag-seek, hover time tooltip with optional\nstoryboard thumbnails, chapter/cut markers, DVR mode when live, and a\nnon-interactive warn-colored ad progress while an ad plays.",
    inputs: [
      {
        name: "markers",
        type: "{ time: number; label?: string }[] | null",
        description: "Chapter/cut markers; falls back to `ShipVideoState.markers`.",
        defaultValue: "null"
      },
      {
        name: "storyboard",
        type: "string | null",
        description: "WebVTT storyboard URL (sprite/thumbnail cues) for hover previews.",
        defaultValue: "null"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipVideoSettings",
    selector: "sh-video-settings",
    package: "@ship-ui/core/ship-video",
    kind: "component",
    path: "projects/ship-ui/ship-video/ship-video-settings.ts",
    description: "Gear menu: quality (Auto + ladder), speed and subtitles, auto-populated from\n`ShipVideoState`. Sections without options hide themselves.",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipVideoTime",
    selector: "sh-video-time",
    package: "@ship-ui/core/ship-video",
    kind: "component",
    path: "projects/ship-ui/ship-video/ship-video-controls.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipVideoVolume",
    selector: "sh-video-volume",
    package: "@ship-ui/core/ship-video",
    kind: "component",
    path: "projects/ship-ui/ship-video/ship-video-controls.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipVirtualScroll",
    selector: "sh-virtual-scroll",
    package: "@ship-ui/core/ship-virtual-scroll",
    kind: "component",
    path: "projects/ship-ui/ship-virtual-scroll/ship-virtual-scroll.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: [
      {
        name: "basic-virtual-scroll",
        html: '<sh-virtual-scroll>\n  @for (item of items(); track item) {\n    <div #item class="item">{{ item }}</div>\n  }\n</sh-virtual-scroll>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipVirtualScroll } from '@ship-ui/core/ship-virtual-scroll';\n\n@Component({\n  selector: 'app-basic-virtual-scroll',\n  standalone: true,\n  imports: [ShipVirtualScroll],\n  templateUrl: './basic-virtual-scroll.html',\n  styleUrl: './basic-virtual-scroll.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BasicVirtualScroll {\n  items = signal<string[]>(Array.from({ length: 1000 }, (_, i) => 'Item ' + i));\n}\n"
      },
      {
        name: "directive-virtual-scroll",
        html: '<div class="scroller">\n  <div [shVirtualScroll]="rows().length" #vs="shVirtualScroll">\n    @for (row of rows().slice(vs.start(), vs.end()); track row.id) {\n      <div class="row">\n        <strong>{{ row.label }}</strong>\n        @if (row.detail) {\n          <div class="detail">{{ row.detail }}</div>\n        }\n      </div>\n    }\n  </div>\n</div>\n<p class="window-readout">Mounted rows {{ vs.start() }}\u2013{{ vs.end() }} of {{ rows().length }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipVirtualScrollDirective } from '@ship-ui/core/ship-virtual-scroll';\n\ntype Row = { id: number; label: string; detail: string | null };\n\n@Component({\n  selector: 'app-directive-virtual-scroll',\n  standalone: true,\n  imports: [ShipVirtualScrollDirective],\n  templateUrl: './directive-virtual-scroll.html',\n  styleUrl: './directive-virtual-scroll.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DirectiveVirtualScroll {\n  // 50,000 rows with varying heights \u2014 every third row carries a detail line.\n  rows = signal<Row[]>(\n    Array.from({ length: 50_000 }, (_, i) => ({\n      id: i,\n      label: `Row ${i}`,\n      detail: i % 3 === 0 ? 'Taller row with a second line of detail text.' : null,\n    }))\n  );\n}\n"
      }
    ]
  },
  {
    name: "ShipA11yAnnouncerService",
    selector: "ship-a11y-announcer-service",
    package: "@ship-ui/core/ship-a11y-announcer",
    kind: "service",
    path: "projects/ship-ui/ship-a11y-announcer/ship-a11y-announcer.service.ts",
    description: "Screen-reader announcements for state changes the DOM doesn't voice on its\nown \u2014 a selection sweep in `sh-spreadsheet`, a toast appearing, a block\nconversion in `sh-editor`.\n\nOne visually-hidden `aria-live` region per politeness level is lazily\nappended to `<body>` and reused for every announcement. The message is\nwritten on a short timer after clearing the region: assistive tech only\nspeaks *changes*, so announcing the same string twice (or in quick\nsuccession) needs the clear-then-set cycle.\n\n`'polite'` (default) waits for the screen reader to finish what it is\nsaying; reserve `'assertive'` for messages that lose their meaning if\ndelayed (errors, destructive results).",
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "announce",
        parameters: "message: string, politeness: ShipA11yPoliteness = 'polite'",
        returnType: "void",
        description: "Queue `message` for the screen reader. No-op during server-side rendering."
      },
      {
        name: "clear",
        parameters: "",
        returnType: "void",
        description: "Empty both live regions (e.g. before tearing down a noisy interaction)."
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipA11yKeybindingsService",
    selector: "ship-a11y-keybindings-service",
    package: "@ship-ui/core/ship-a11y-keybindings",
    kind: "service",
    path: "projects/ship-ui/ship-a11y-keybindings/ship-a11y-keybindings.service.ts",
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "pause",
        parameters: "",
        returnType: "void",
        description: "Pause keybinding matching; reference-counted so nested pauses require matching `resume` calls."
      },
      {
        name: "resume",
        parameters: "",
        returnType: "void",
        description: "Resume keybinding matching once all outstanding `pause` calls have been balanced."
      },
      {
        name: "registerDefaults",
        parameters: "defaults: Record<string, string>",
        returnType: "void",
        description: "Register default shortcuts for actions, without overriding any already-customised binding."
      },
      {
        name: "registerOverrides",
        parameters: "overrides: Record<string, string>",
        returnType: "void",
        description: "Override the active shortcuts for the given actions, replacing their defaults."
      },
      {
        name: "getShortcut",
        parameters: "action: string",
        returnType: "string | undefined",
        description: "Return the currently active shortcut string for an action, if any."
      },
      {
        name: "getDefaultShortcut",
        parameters: "action: string",
        returnType: "string | undefined",
        description: "Return the original default shortcut string for an action, ignoring overrides."
      },
      {
        name: "getDisplayShortcut",
        parameters: "action: string",
        returnType: "string | undefined",
        description: "Return a human-readable, platform-aware shortcut label for an action (e.g. for `aria-keyshortcuts`)."
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipAlertService",
    selector: "ship-alert-service",
    package: "@ship-ui/core/ship-alert",
    kind: "service",
    path: "projects/ship-ui/ship-alert/ship-alert.service.ts",
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "error",
        parameters: "message: string | null | undefined",
        returnType: "void",
        description: "Show an `error` alert (falls back to a default message when none is given)."
      },
      {
        name: "success",
        parameters: "message: string",
        returnType: "void",
        description: "Show a `success` alert with the given message."
      },
      {
        name: "question",
        parameters: "message: string",
        returnType: "void",
        description: "Show a `question` alert with the given message."
      },
      {
        name: "warning",
        parameters: "message: string",
        returnType: "void",
        description: "Show a `warn` alert with the given message."
      },
      {
        name: "info",
        parameters: "message: string",
        returnType: "void",
        description: "Show an informational (`primary`) alert with the given message."
      },
      {
        name: "addAlert",
        parameters: "alert: ShipAlertItem",
        returnType: "void",
        description: "Add an alert to the history, animate it in, and auto-hide it after a timeout."
      },
      {
        name: "removeAlert",
        parameters: "id: string",
        returnType: "void",
        description: "Animate out and remove the alert with the given `id` from the history."
      },
      {
        name: "hideAlert",
        parameters: "id: string",
        returnType: "void",
        description: "Mark the alert with the given `id` as closed without removing it from the history."
      },
      {
        name: "setHidden",
        parameters: "isHidden: boolean",
        returnType: "void",
        description: "Set whether the alert history panel is hidden."
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipCalendarService",
    selector: "ship-calendar-service",
    package: "@ship-ui/core/src",
    kind: "service",
    path: "projects/ship-ui/src/lib/utilities/ship-calendar.service.ts",
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "getOffsetDate",
        parameters: "monthOffset: number",
        returnType: "Date",
        description: ""
      },
      {
        name: "getLastVisibleMonth",
        parameters: "",
        returnType: "Date",
        description: ""
      },
      {
        name: "getMonthDates",
        parameters: "monthOffset: number",
        returnType: "Date[]",
        description: ""
      },
      {
        name: "nextMonth",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "previousMonth",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "goToMonth",
        parameters: "date: Date",
        returnType: "void",
        description: ""
      },
      {
        name: "ensureDateVisible",
        parameters: "date: Date",
        returnType: "void",
        description: ""
      },
      {
        name: "isCurrentMonth",
        parameters: "date: Date, monthOffset: number",
        returnType: "boolean",
        description: ""
      },
      {
        name: "isSameDay",
        parameters: "d1: Date | null | undefined, d2: Date | null | undefined",
        returnType: "boolean",
        description: ""
      },
      {
        name: "getMonthName",
        parameters: "date: Date",
        returnType: "string",
        description: ""
      },
      {
        name: "getFullYear",
        parameters: "date: Date",
        returnType: "number",
        description: ""
      },
      {
        name: "getAriaLabel",
        parameters: "date: Date",
        returnType: "string",
        description: ""
      },
      {
        name: "addDays",
        parameters: "date: Date, n: number",
        returnType: "Date",
        description: ""
      },
      {
        name: "addMonths",
        parameters: "date: Date, n: number",
        returnType: "Date",
        description: ""
      },
      {
        name: "addYears",
        parameters: "date: Date, n: number",
        returnType: "Date",
        description: ""
      },
      {
        name: "monthStart",
        parameters: "date: Date",
        returnType: "Date",
        description: ""
      },
      {
        name: "monthEnd",
        parameters: "date: Date",
        returnType: "Date",
        description: ""
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipCollabSession",
    selector: "ship-collab-session",
    package: "@ship-ui/core/ship-editor-collab",
    kind: "service",
    path: "projects/ship-ui/ship-editor-collab/collab-session.ts",
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "attachDocument",
        parameters: "document: CollabDocument<Op, Doc, Sel>, algebra: CollabAlgebra<Op>, options: ShipCollabSessionOptions<Op, Doc, Sel>",
        returnType: "void",
        description: "Wire a document and its algebra into a session over `options.transport`."
      },
      {
        name: "detach",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "flushLocal",
        parameters: "",
        returnType: "void",
        description: "Broadcast any unbroadcast local change now. Only needed when the service\nruns without Angular's effect scheduler (tests, non-Angular drivers) \u2014\ninside an app the version effect calls this automatically."
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipDialogService",
    selector: "ship-dialog-service",
    package: "@ship-ui/core/ship-dialog",
    kind: "service",
    path: "projects/ship-ui/ship-dialog/ship-dialog.service.ts",
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "open",
        parameters: "componentOrTemplate: Type<I> | (I extends TemplateRef<any> ? I : never), options?: _Options",
        returnType: "I extends TemplateRef<any> ? ShipDialogTemplateInstance<I> : ShipDialogInstance<I>",
        description: "Opens a component or template in a `ShipDialog`, returning a handle to close it and observe its result."
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipEditorCollab",
    selector: "ship-editor-collab",
    package: "@ship-ui/core/ship-editor-collab",
    kind: "service",
    path: "projects/ship-ui/ship-editor-collab/ship-editor-collab.ts",
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "attach",
        parameters: "engine: EditorEngineService, options: ShipEditorCollabOptions",
        returnType: "void",
        description: ""
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipListItemSwipeService",
    selector: "ship-list-item-swipe-service",
    package: "@ship-ui/core/ship-list-item-swipe",
    kind: "service",
    path: "projects/ship-ui/ship-list-item-swipe/ship-list-item-swipe.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipScreenreaderService",
    selector: "ship-screenreader-service",
    package: "@ship-ui/core/ship-screenreader",
    kind: "service",
    path: "projects/ship-ui/ship-screenreader/ship-screenreader.service.ts",
    description: "Screen-reader *simulator* for accessibility debugging: computes what\nassistive tech would announce (accessible name, role, states, value,\nposition per WCAG/ARIA) for focus moves and `aria-live` region changes,\nkeeps a transcript signal, and can voice it via SpeechSynthesis.\n\nThis is a dev tool \u2014 it approximates NVDA/VoiceOver behaviour; it is not\na substitute for testing with real screen readers.",
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "enable",
        parameters: "",
        returnType: "void",
        description: "Start listening for focus moves and live-region changes. SSR no-op."
      },
      {
        name: "disable",
        parameters: "",
        returnType: "void",
        description: "Stop listening and cancel any queued speech."
      },
      {
        name: "toggleSpeech",
        parameters: "on?: boolean",
        returnType: "void",
        description: ""
      },
      {
        name: "clearLog",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "announce",
        parameters: "text: string, source: ShipScreenreaderSource = 'manual'",
        returnType: "void",
        description: "Push a text announcement, as a live region change or manually."
      },
      {
        name: "utteranceFor",
        parameters: "target: Element | string",
        returnType: "string",
        description: "What the simulator would announce for `target` (Element or selector) \u2014\ncomputed on demand, nothing is logged or focused. Empty string when the\nelement is missing or hidden from assistive tech."
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipSheetCollab",
    selector: "ship-sheet-collab",
    package: "@ship-ui/core/ship-spreadsheet",
    kind: "service",
    path: "projects/ship-ui/ship-spreadsheet/sheet-collab.ts",
    description: "Collaboration for a standalone `sh-spreadsheet`: the same session,\nprotocol and transports as `ShipEditorCollab`, with `SheetOp[]`\ntransactions as the op and `transformSheetOps` as the algebra.\n\n```ts\ncollab = inject(ShipSheetCollab);            // provided on the page component\nafterNextRender(() => this.collab.attach(this.grid(), { transport }));\n```",
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "attach",
        parameters: "grid: ShipSpreadsheet, options: ShipSheetCollabOptions",
        returnType: "void",
        description: ""
      },
      {
        name: "detach",
        parameters: "",
        returnType: "void",
        description: ""
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipSortableService",
    selector: "ship-sortable-service",
    package: "@ship-ui/core/ship-sortable",
    kind: "service",
    path: "projects/ship-ui/ship-sortable/ship-sortable.ts",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipSpotlightService",
    selector: "ship-spotlight-service",
    package: "@ship-ui/core/ship-spotlight",
    kind: "service",
    path: "projects/ship-ui/ship-spotlight/ship-spotlight.service.ts",
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "registerItems",
        parameters: "items: ShipSpotlightItem[], overwrite = false",
        returnType: "() => void",
        description: "Register items to appear whenever the spotlight opens. Returns a cleanup function that unregisters them (auto-called on the caller's `DestroyRef`)."
      },
      {
        name: "setContextualItems",
        parameters: "items: ShipSpotlightItem[], overwrite = false",
        returnType: "void",
        description: "Replace the current context's items (e.g. for the active route/view). Supersedes any previous contextual set."
      },
      {
        name: "clearContextualItems",
        parameters: "",
        returnType: "void",
        description: "Remove the items registered via `setContextualItems`."
      },
      {
        name: "enableGlobalShortcuts",
        parameters: "options?: Partial<ShipSpotlightServiceOptions>",
        returnType: "void",
        description: "Register the global `Cmd/Ctrl + K` listener that opens the spotlight. Optionally seed the options used for that global instance."
      },
      {
        name: "disableGlobalShortcuts",
        parameters: "",
        returnType: "void",
        description: "Remove the global `Cmd/Ctrl + K` listener registered by `enableGlobalShortcuts`."
      },
      {
        name: "open",
        parameters: "options?: ShipSpotlightServiceOptions",
        returnType: "ShipSpotlightInstance",
        description: "Open the spotlight overlay imperatively and return a handle with `itemSelected` / `closed` observables."
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipThemeState",
    selector: "ship-theme-state",
    package: "@ship-ui/core/ship-theme-toggle",
    kind: "service",
    path: "projects/ship-ui/ship-theme-toggle/ship-theme-state.ts",
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "localStorage",
        parameters: "",
        returnType: "void",
        description: "Returns the platform `localStorage` (where the theme is persisted), or `null` during server-side rendering."
      },
      {
        name: "toggleTheme",
        parameters: "",
        returnType: "void",
        description: "Advances the theme to the next value in `THEME_ORDER` (light \u2192 dark \u2192 system) and persists it."
      },
      {
        name: "setTheme",
        parameters: "theme: ShipThemeOption",
        returnType: "void",
        description: "Sets and persists the theme; passing `null` clears the stored preference and reverts to system default."
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipVideoState",
    selector: "ship-video-state",
    package: "@ship-ui/core/ship-video",
    kind: "service",
    path: "projects/ship-ui/ship-video/ship-video-state.ts",
    description: "Centralized player state. Provided by `sh-video` by default; provide it on a\nwrapper (e.g. a video editor shell) to share one store between the wrapper,\nthe projected player and every control:\n\n```ts",
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "attachPlayer",
        parameters: "hooks: ShipVideoPlayerHooks",
        returnType: "void",
        description: "Registers the player that executes commands. Called by `sh-video`."
      },
      {
        name: "detachPlayer",
        parameters: "hooks: ShipVideoPlayerHooks",
        returnType: "void",
        description: ""
      },
      {
        name: "start",
        parameters: "",
        returnType: "void",
        description: "Starts playback for the first time (runs the pre-roll ad when configured)."
      },
      {
        name: "togglePlay",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "toggleMute",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "seekTo",
        parameters: "seconds: number, options?: { precise?: boolean }",
        returnType: "void",
        description: ""
      },
      {
        name: "step",
        parameters: "frames: number",
        returnType: "void",
        description: "Frame stepping (pauses playback); frame duration derived from rVFC deltas."
      },
      {
        name: "onVideoFrame",
        parameters: "callback: (time: number) => void",
        returnType: "() => void",
        description: "`requestVideoFrameCallback` passthrough; returns an unsubscribe function."
      },
      {
        name: "goToLive",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "skipAd",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "toggleFullscreen",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "togglePip",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "requestCast",
        parameters: "",
        returnType: "void",
        description: "Opens the Chromecast/remote-playback device picker (Remote Playback API)."
      },
      {
        name: "requestAirplay",
        parameters: "",
        returnType: "void",
        description: "Opens Safari's AirPlay target picker."
      },
      {
        name: "mediaElement",
        parameters: "",
        returnType: "HTMLVideoElement | null",
        description: "The underlying `<video>` element (canvas capture, filmstrips); `null` on SSR."
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipViewTransitions",
    selector: "ship-view-transitions",
    package: "@ship-ui/core/ship-view-transition",
    kind: "service",
    path: "projects/ship-ui/ship-view-transition/ship-view-transition.service.ts",
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "register",
        parameters: "animation: ShipViewTransitionAnimation",
        returnType: "void",
        description: "Makes an animation referencable by name from `shViewTransition` specs."
      },
      {
        name: "onCreated",
        parameters: "info: ViewTransitionInfo",
        returnType: "void",
        description: "Called by the router feature for every created transition."
      },
      {
        name: "beginInteractive",
        parameters: "",
        returnType: "ShipViewTransitionScrubber",
        description: "Prepares the next router transition to be driven by a gesture instead of\nplaying on its own. Call it right before triggering the navigation\n(typically `Location.back()`), then feed the returned scrubber."
      },
      {
        name: "activated",
        parameters: "name: string, spec: ShipViewTransitionSpec | null, frame: boolean, radius = '0px'",
        returnType: "void",
        description: "Called by the directive when its outlet activates a new page. Writes the\nanimation rules for that outlet if a transition is in flight."
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "GlobalVariables",
    selector: "global-variables",
    kind: "service",
    path: "projects/ship-ui/styles/core/core/variables.scss",
    description: "Global CSS variables for ShipUI including colors, typography, and spacing.",
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--font-size",
        defaultValue: "16px"
      },
      {
        name: "--border-width",
        defaultValue: "1px"
      },
      {
        name: "--shape-scale",
        defaultValue: "1"
      },
      {
        name: "--pad-y",
        defaultValue: "#{p2r(8)}"
      },
      {
        name: "--pad-x",
        defaultValue: "#{p2r(12)}"
      },
      {
        name: "--font-family",
        defaultValue: "'Inter Tight', sans-serif"
      },
      {
        name: "--border-10",
        defaultValue: "var(--border-width) solid var(--base-4)"
      },
      {
        name: "--border-20",
        defaultValue: "var(--border-width) solid var(--base-8)"
      },
      {
        name: "--display-10",
        defaultValue: "600 #{p2r(80)} / normal var(--font-family)"
      },
      {
        name: "--display-20",
        defaultValue: "600 #{p2r(72)} / normal var(--font-family)"
      },
      {
        name: "--display-30",
        defaultValue: "600 #{p2r(64)} / normal var(--font-family)"
      },
      {
        name: "--display-40",
        defaultValue: "600 #{p2r(56)} / normal var(--font-family)"
      },
      {
        name: "--display-50",
        defaultValue: "600 #{p2r(48)} / normal var(--font-family)"
      },
      {
        name: "--title-10",
        defaultValue: "500 #{p2r(40)} / normal var(--font-family)"
      },
      {
        name: "--title-20",
        defaultValue: "500 #{p2r(32)} / normal var(--font-family)"
      },
      {
        name: "--title-30",
        defaultValue: "500 #{p2r(24)} / normal var(--font-family)"
      },
      {
        name: "--title-10B",
        defaultValue: "600 #{p2r(40)} / normal var(--font-family)"
      },
      {
        name: "--title-20B",
        defaultValue: "600 #{p2r(32)} / normal var(--font-family)"
      },
      {
        name: "--title-30B",
        defaultValue: "600 #{p2r(24)} / normal var(--font-family)"
      },
      {
        name: "--paragraph-10",
        defaultValue: "500 #{p2r(18)} / normal var(--font-family)"
      },
      {
        name: "--paragraph-20",
        defaultValue: "500 #{p2r(16)} / normal var(--font-family)"
      },
      {
        name: "--paragraph-30",
        defaultValue: "500 #{p2r(14)} / normal var(--font-family)"
      },
      {
        name: "--paragraph-40",
        defaultValue: "500 #{p2r(12)} / normal var(--font-family)"
      },
      {
        name: "--paragraph-10B",
        defaultValue: "600 #{p2r(18)} / normal var(--font-family)"
      },
      {
        name: "--paragraph-20B",
        defaultValue: "600 #{p2r(16)} / normal var(--font-family)"
      },
      {
        name: "--paragraph-30B",
        defaultValue: "600 #{p2r(14)} / #{p2r(18)} var(--font-family)"
      },
      {
        name: "--paragraph-40B",
        defaultValue: "600 #{p2r(12)} / normal var(--font-family)"
      },
      {
        name: "--code-10",
        defaultValue: "500 #{p2r(16)} / normal monospace"
      },
      {
        name: "--code-20",
        defaultValue: "500 #{p2r(14)} / normal monospace"
      },
      {
        name: "--code-30",
        defaultValue: "500 #{p2r(12)} / normal monospace"
      },
      {
        name: "--shape-1",
        defaultValue: "calc(#{p2r(4)} * var(--shape-scale))"
      },
      {
        name: "--shape-2",
        defaultValue: "calc(#{p2r(8)} * var(--shape-scale))"
      },
      {
        name: "--shape-3",
        defaultValue: "calc(#{p2r(12)} * var(--shape-scale))"
      },
      {
        name: "--shape-4",
        defaultValue: "calc(#{p2r(16)} * var(--shape-scale))"
      },
      {
        name: "--shape-5",
        defaultValue: "calc(#{p2r(20)} * var(--shape-scale))"
      },
      {
        name: "--space-1",
        defaultValue: "#{p2r(4)}"
      },
      {
        name: "--space-2",
        defaultValue: "#{p2r(8)}"
      },
      {
        name: "--space-3",
        defaultValue: "#{p2r(12)}"
      },
      {
        name: "--space-4",
        defaultValue: "#{p2r(16)}"
      },
      {
        name: "--space-5",
        defaultValue: "#{p2r(24)}"
      },
      {
        name: "--space-6",
        defaultValue: "#{p2r(32)}"
      },
      {
        name: "--space-7",
        defaultValue: "#{p2r(48)}"
      },
      {
        name: "--space-8",
        defaultValue: "#{p2r(64)}"
      },
      {
        name: "--box-shadow-10",
        defaultValue: "0 1px 2px 0 rgba(18, 18, 23, 0.07)"
      },
      {
        name: "--box-shadow-20",
        defaultValue: "0 1px 3px 0 rgba(18, 18, 23, 0.1)"
      },
      {
        name: "--box-shadow-30",
        defaultValue: "0 1px 4px -1px rgba(18, 18, 23, 0.08)"
      },
      {
        name: "--box-shadow-35",
        defaultValue: "0 4px 6px -1px rgba(18, 18, 23, 0.08)"
      },
      {
        name: "--box-shadow-40",
        defaultValue: "0 10px 15px -3px rgba(18, 18, 23, 0.08)"
      },
      {
        name: "--box-shadow-50",
        defaultValue: "0 20px 25px -5px rgba(18, 18, 23, 0.1)"
      },
      {
        name: "--box-shadow-60",
        defaultValue: "0 25px 50px -12px rgba(18, 18, 23, 0.25)"
      },
      {
        name: "--dark-text",
        defaultValue: "#000"
      },
      {
        name: "--light-text",
        defaultValue: "#fff"
      }
    ],
    examples: []
  },
  {
    name: "SheetVariables",
    selector: "sheet-variables",
    kind: "service",
    path: "projects/ship-ui/styles/skins/_sheet.scss",
    description: 'Common CSS variables for components using the "sh-sheet" class. These variables control background, border, and color scales for different variants.',
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--sheet-c",
        defaultValue: "var(--base-12)"
      },
      {
        name: "--sheet-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--sheet-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--sheet-s",
        defaultValue: "var(--shape-2)"
      },
      {
        name: "--sheet-ic",
        defaultValue: "var(--base-12)"
      },
      {
        name: "--loader-c",
        defaultValue: "var(--sheet-ic)"
      },
      {
        name: "--sheet-p-c",
        defaultValue: "rgb(from var(--sheet-c) r g b / 0.65)"
      },
      {
        name: "--sheet-bg-h",
        defaultValue: "var(--base-2)"
      }
    ],
    examples: []
  }
];

// src/icons.json
var icons_default = [
  "acorn",
  "address-book",
  "address-book-tabs",
  "air-traffic-control",
  "airplane",
  "airplane-in-flight",
  "airplane-landing",
  "airplane-takeoff",
  "airplane-taxiing",
  "airplane-tilt",
  "airplay",
  "alarm",
  "alien",
  "align-bottom",
  "align-bottom-simple",
  "align-center-horizontal",
  "align-center-horizontal-simple",
  "align-center-vertical",
  "align-center-vertical-simple",
  "align-left",
  "align-left-simple",
  "align-right",
  "align-right-simple",
  "align-top",
  "align-top-simple",
  "amazon-logo",
  "ambulance",
  "anchor",
  "anchor-simple",
  "android-logo",
  "angle",
  "angular-logo",
  "aperture",
  "app-store-logo",
  "app-window",
  "apple-logo",
  "apple-podcasts-logo",
  "approximate-equals",
  "archive",
  "armchair",
  "arrow-arc-left",
  "arrow-arc-right",
  "arrow-bend-double-up-left",
  "arrow-bend-double-up-right",
  "arrow-bend-down-left",
  "arrow-bend-down-right",
  "arrow-bend-left-down",
  "arrow-bend-left-up",
  "arrow-bend-right-down",
  "arrow-bend-right-up",
  "arrow-bend-up-left",
  "arrow-bend-up-right",
  "arrow-circle-down",
  "arrow-circle-down-left",
  "arrow-circle-down-right",
  "arrow-circle-left",
  "arrow-circle-right",
  "arrow-circle-up",
  "arrow-circle-up-left",
  "arrow-circle-up-right",
  "arrow-clockwise",
  "arrow-counter-clockwise",
  "arrow-down",
  "arrow-down-left",
  "arrow-down-right",
  "arrow-elbow-down-left",
  "arrow-elbow-down-right",
  "arrow-elbow-left",
  "arrow-elbow-left-down",
  "arrow-elbow-left-up",
  "arrow-elbow-right",
  "arrow-elbow-right-down",
  "arrow-elbow-right-up",
  "arrow-elbow-up-left",
  "arrow-elbow-up-right",
  "arrow-fat-down",
  "arrow-fat-left",
  "arrow-fat-line-down",
  "arrow-fat-line-left",
  "arrow-fat-line-right",
  "arrow-fat-line-up",
  "arrow-fat-lines-down",
  "arrow-fat-lines-left",
  "arrow-fat-lines-right",
  "arrow-fat-lines-up",
  "arrow-fat-right",
  "arrow-fat-up",
  "arrow-left",
  "arrow-line-down",
  "arrow-line-down-left",
  "arrow-line-down-right",
  "arrow-line-left",
  "arrow-line-right",
  "arrow-line-up",
  "arrow-line-up-left",
  "arrow-line-up-right",
  "arrow-right",
  "arrow-square-down",
  "arrow-square-down-left",
  "arrow-square-down-right",
  "arrow-square-in",
  "arrow-square-left",
  "arrow-square-out",
  "arrow-square-right",
  "arrow-square-up",
  "arrow-square-up-left",
  "arrow-square-up-right",
  "arrow-u-down-left",
  "arrow-u-down-right",
  "arrow-u-left-down",
  "arrow-u-left-up",
  "arrow-u-right-down",
  "arrow-u-right-up",
  "arrow-u-up-left",
  "arrow-u-up-right",
  "arrow-up",
  "arrow-up-left",
  "arrow-up-right",
  "arrows-clockwise",
  "arrows-counter-clockwise",
  "arrows-down-up",
  "arrows-horizontal",
  "arrows-in",
  "arrows-in-cardinal",
  "arrows-in-line-horizontal",
  "arrows-in-line-vertical",
  "arrows-in-simple",
  "arrows-left-right",
  "arrows-merge",
  "arrows-out",
  "arrows-out-cardinal",
  "arrows-out-line-horizontal",
  "arrows-out-line-vertical",
  "arrows-out-simple",
  "arrows-split",
  "arrows-vertical",
  "article",
  "article-medium",
  "article-ny-times",
  "asclepius, caduceus",
  "asterisk",
  "asterisk-simple",
  "at",
  "atom",
  "avocado",
  "axe",
  "baby",
  "baby-carriage",
  "backpack",
  "backspace",
  "bag",
  "bag-simple",
  "balloon",
  "bandaids",
  "bank",
  "barbell",
  "barcode",
  "barn",
  "barricade",
  "baseball",
  "baseball-cap",
  "baseball-helmet",
  "basket",
  "basketball",
  "bathtub",
  "battery-charging",
  "battery-charging-vertical",
  "battery-empty",
  "battery-full",
  "battery-high",
  "battery-low",
  "battery-medium",
  "battery-plus",
  "battery-plus-vertical",
  "battery-vertical-empty",
  "battery-vertical-full",
  "battery-vertical-high",
  "battery-vertical-low",
  "battery-vertical-medium",
  "battery-warning",
  "battery-warning-vertical",
  "beach-ball",
  "beanie",
  "bed",
  "beer-bottle",
  "beer-stein",
  "behance-logo",
  "bell",
  "bell-ringing",
  "bell-simple",
  "bell-simple-ringing",
  "bell-simple-slash",
  "bell-simple-z",
  "bell-slash",
  "bell-z",
  "belt",
  "bezier-curve",
  "bicycle",
  "binary",
  "binoculars",
  "biohazard",
  "bird",
  "blueprint",
  "bluetooth",
  "bluetooth-connected",
  "bluetooth-slash",
  "bluetooth-x",
  "boat",
  "bomb",
  "bone",
  "book",
  "book-bookmark",
  "book-open",
  "book-open-text",
  "book-open-user",
  "bookmark",
  "bookmark-simple",
  "bookmarks",
  "bookmarks-simple",
  "books",
  "boot",
  "boules",
  "bounding-box",
  "bowl-food",
  "bowl-steam",
  "bowling-ball",
  "box-arrow-down, archive-box",
  "box-arrow-up",
  "boxing-glove",
  "brackets-angle",
  "brackets-curly",
  "brackets-round",
  "brackets-square",
  "brain",
  "brandy",
  "bread",
  "bridge",
  "briefcase",
  "briefcase-metal",
  "broadcast",
  "broom",
  "browser",
  "browsers",
  "bug",
  "bug-beetle",
  "bug-droid",
  "building",
  "building-apartment",
  "building-office",
  "buildings",
  "bulldozer",
  "bus",
  "butterfly",
  "cable-car",
  "cactus",
  "cake",
  "calculator",
  "calendar",
  "calendar-blank",
  "calendar-check",
  "calendar-dot",
  "calendar-dots",
  "calendar-heart",
  "calendar-minus",
  "calendar-plus",
  "calendar-slash",
  "calendar-star",
  "calendar-x",
  "call-bell",
  "camera",
  "camera-plus",
  "camera-rotate",
  "camera-slash",
  "campfire",
  "car",
  "car-battery",
  "car-profile",
  "car-simple",
  "cardholder",
  "cards",
  "cards-three",
  "caret-circle-double-down",
  "caret-circle-double-left",
  "caret-circle-double-right",
  "caret-circle-double-up",
  "caret-circle-down",
  "caret-circle-left",
  "caret-circle-right",
  "caret-circle-up",
  "caret-circle-up-down",
  "caret-double-down",
  "caret-double-left",
  "caret-double-right",
  "caret-double-up",
  "caret-down",
  "caret-left",
  "caret-line-down",
  "caret-line-left",
  "caret-line-right",
  "caret-line-up",
  "caret-right",
  "caret-up",
  "caret-up-down",
  "carrot",
  "cash-register",
  "cassette-tape",
  "castle-turret",
  "cat",
  "cell-signal-full",
  "cell-signal-high",
  "cell-signal-low",
  "cell-signal-medium",
  "cell-signal-none",
  "cell-signal-slash",
  "cell-signal-x",
  "cell-tower",
  "certificate",
  "chair",
  "chalkboard",
  "chalkboard-simple",
  "chalkboard-teacher",
  "champagne",
  "charging-station",
  "chart-bar",
  "chart-bar-horizontal",
  "chart-donut",
  "chart-line",
  "chart-line-down",
  "chart-line-up",
  "chart-pie",
  "chart-pie-slice",
  "chart-polar",
  "chart-scatter",
  "chat",
  "chat-centered",
  "chat-centered-dots",
  "chat-centered-slash",
  "chat-centered-text",
  "chat-circle",
  "chat-circle-dots",
  "chat-circle-slash",
  "chat-circle-text",
  "chat-dots",
  "chat-slash",
  "chat-teardrop",
  "chat-teardrop-dots",
  "chat-teardrop-slash",
  "chat-teardrop-text",
  "chat-text",
  "chats",
  "chats-circle",
  "chats-teardrop",
  "check",
  "check-circle",
  "check-fat",
  "check-square",
  "check-square-offset",
  "checkerboard",
  "checks",
  "cheers",
  "cheese",
  "chef-hat",
  "cherries",
  "church",
  "cigarette",
  "cigarette-slash",
  "circle",
  "circle-dashed",
  "circle-half",
  "circle-half-tilt",
  "circle-notch",
  "circles-four",
  "circles-three",
  "circles-three-plus",
  "circuitry",
  "city",
  "clipboard",
  "clipboard-text",
  "clock",
  "clock-afternoon",
  "clock-clockwise",
  "clock-countdown",
  "clock-counter-clockwise",
  "clock-user",
  "closed-captioning",
  "cloud",
  "cloud-arrow-down",
  "cloud-arrow-up",
  "cloud-check",
  "cloud-fog",
  "cloud-lightning",
  "cloud-moon",
  "cloud-rain",
  "cloud-slash",
  "cloud-snow",
  "cloud-sun",
  "cloud-warning",
  "cloud-x",
  "clover",
  "club",
  "coat-hanger",
  "coda-logo",
  "code",
  "code-block",
  "code-simple",
  "codepen-logo",
  "codesandbox-logo",
  "coffee",
  "coffee-bean",
  "coin",
  "coin-vertical",
  "coins",
  "columns",
  "columns-plus-left",
  "columns-plus-right",
  "command",
  "compass",
  "compass-rose",
  "compass-tool",
  "computer-tower",
  "confetti",
  "contactless-payment",
  "control",
  "cookie",
  "cooking-pot",
  "copy",
  "copy-simple",
  "copyleft",
  "copyright",
  "corners-in",
  "corners-out",
  "couch",
  "court-basketball",
  "cow",
  "cowboy-hat",
  "cpu",
  "crane",
  "crane-tower",
  "credit-card",
  "cricket",
  "crop",
  "cross",
  "crosshair",
  "crosshair-simple",
  "crown",
  "crown-cross",
  "crown-simple",
  "cube",
  "cube-focus",
  "cube-transparent",
  "currency-btc",
  "currency-circle-dollar",
  "currency-cny",
  "currency-dollar",
  "currency-dollar-simple",
  "currency-eth",
  "currency-eur",
  "currency-gbp",
  "currency-inr",
  "currency-jpy",
  "currency-krw",
  "currency-kzt",
  "currency-ngn",
  "currency-rub",
  "cursor",
  "cursor-click",
  "cursor-text",
  "cylinder",
  "database",
  "desk",
  "desktop",
  "desktop-tower",
  "detective",
  "dev-to-logo",
  "device-mobile",
  "device-mobile-camera",
  "device-mobile-slash",
  "device-mobile-speaker",
  "device-rotate",
  "device-tablet",
  "device-tablet-camera",
  "device-tablet-speaker",
  "devices",
  "diamond",
  "diamonds-four",
  "dice-five",
  "dice-four",
  "dice-one",
  "dice-six",
  "dice-three",
  "dice-two",
  "disc",
  "disco-ball",
  "discord-logo",
  "divide",
  "dna",
  "dog",
  "door",
  "door-open",
  "dot",
  "dot-outline",
  "dots-nine",
  "dots-six",
  "dots-six-vertical",
  "dots-three",
  "dots-three-circle",
  "dots-three-circle-vertical",
  "dots-three-outline",
  "dots-three-outline-vertical",
  "dots-three-vertical",
  "download",
  "download-simple",
  "dress",
  "dresser",
  "dribbble-logo",
  "drone",
  "drop",
  "drop-half",
  "drop-half-bottom",
  "drop-simple",
  "drop-slash",
  "dropbox-logo",
  "ear",
  "ear-slash",
  "egg",
  "egg-crack",
  "eject",
  "eject-simple",
  "elevator",
  "empty",
  "engine",
  "envelope",
  "envelope-open",
  "envelope-simple",
  "envelope-simple-open",
  "equalizer",
  "equals",
  "eraser",
  "escalator-down",
  "escalator-up",
  "exam",
  "exclamation-mark",
  "exclude",
  "exclude-square",
  "export",
  "eye",
  "eye-closed",
  "eye-slash",
  "eyedropper",
  "eyedropper-sample",
  "eyeglasses",
  "eyes",
  "face-mask",
  "facebook-logo",
  "factory",
  "faders",
  "faders-horizontal",
  "fallout-shelter",
  "fan",
  "farm",
  "fast-forward",
  "fast-forward-circle",
  "feather",
  "fediverse-logo",
  "figma-logo",
  "file",
  "file-archive",
  "file-arrow-down",
  "file-arrow-up",
  "file-audio",
  "file-c",
  "file-c-sharp",
  "file-cloud",
  "file-code",
  "file-cpp",
  "file-css",
  "file-csv",
  "file-dashed, file-dotted",
  "file-doc",
  "file-html",
  "file-image",
  "file-ini",
  "file-jpg",
  "file-js",
  "file-jsx",
  "file-lock",
  "file-magnifying-glass, file-search",
  "file-md",
  "file-minus",
  "file-pdf",
  "file-plus",
  "file-png",
  "file-ppt",
  "file-py",
  "file-rs",
  "file-sql",
  "file-svg",
  "file-text",
  "file-ts",
  "file-tsx",
  "file-txt",
  "file-video",
  "file-vue",
  "file-x",
  "file-xls",
  "file-zip",
  "files",
  "film-reel",
  "film-script",
  "film-slate",
  "film-strip",
  "fingerprint",
  "fingerprint-simple",
  "finn-the-human",
  "fire",
  "fire-extinguisher",
  "fire-simple",
  "fire-truck",
  "first-aid",
  "first-aid-kit",
  "fish",
  "fish-simple",
  "flag",
  "flag-banner",
  "flag-banner-fold",
  "flag-checkered",
  "flag-pennant",
  "flame",
  "flashlight",
  "flask",
  "flip-horizontal",
  "flip-vertical",
  "floppy-disk",
  "floppy-disk-back",
  "flow-arrow",
  "flower",
  "flower-lotus",
  "flower-tulip",
  "flying-saucer",
  "folder, folder-notch",
  "folder-dashed, folder-dotted",
  "folder-lock",
  "folder-minus, folder-notch-minus",
  "folder-open, folder-notch-open",
  "folder-plus, folder-notch-plus",
  "folder-simple",
  "folder-simple-dashed, folder-simple-dotted",
  "folder-simple-lock",
  "folder-simple-minus",
  "folder-simple-plus",
  "folder-simple-star",
  "folder-simple-user",
  "folder-star",
  "folder-user",
  "folders",
  "football",
  "football-helmet",
  "footprints",
  "fork-knife",
  "four-k",
  "frame-corners",
  "framer-logo",
  "function",
  "funnel",
  "funnel-simple",
  "funnel-simple-x",
  "funnel-x",
  "game-controller",
  "garage",
  "gas-can",
  "gas-pump",
  "gauge",
  "gavel",
  "gear",
  "gear-fine",
  "gear-six",
  "gender-female",
  "gender-intersex",
  "gender-male",
  "gender-neuter",
  "gender-nonbinary",
  "gender-transgender",
  "ghost",
  "gif",
  "gift",
  "git-branch",
  "git-commit",
  "git-diff",
  "git-fork",
  "git-merge",
  "git-pull-request",
  "github-logo",
  "gitlab-logo",
  "gitlab-logo-simple",
  "globe",
  "globe-hemisphere-east",
  "globe-hemisphere-west",
  "globe-simple",
  "globe-simple-x",
  "globe-stand",
  "globe-x",
  "goggles",
  "golf",
  "goodreads-logo",
  "google-cardboard-logo",
  "google-chrome-logo",
  "google-drive-logo",
  "google-logo",
  "google-photos-logo",
  "google-play-logo",
  "google-podcasts-logo",
  "gps",
  "gps-fix",
  "gps-slash",
  "gradient",
  "graduation-cap",
  "grains",
  "grains-slash",
  "graph",
  "graphics-card",
  "greater-than",
  "greater-than-or-equal",
  "grid-four",
  "grid-nine",
  "guitar",
  "hair-dryer",
  "hamburger",
  "hammer",
  "hand",
  "hand-arrow-down",
  "hand-arrow-up",
  "hand-coins",
  "hand-deposit",
  "hand-eye",
  "hand-fist",
  "hand-grabbing",
  "hand-heart",
  "hand-palm",
  "hand-peace",
  "hand-pointing",
  "hand-soap",
  "hand-swipe-left",
  "hand-swipe-right",
  "hand-tap",
  "hand-waving",
  "hand-withdraw",
  "handbag",
  "handbag-simple",
  "hands-clapping",
  "hands-praying",
  "handshake",
  "hard-drive",
  "hard-drives",
  "hard-hat",
  "hash",
  "hash-straight",
  "head-circuit",
  "headlights",
  "headphones",
  "headset",
  "heart",
  "heart-break",
  "heart-half",
  "heart-straight",
  "heart-straight-break",
  "heartbeat",
  "hexagon",
  "high-definition",
  "high-heel",
  "highlighter",
  "highlighter-circle",
  "hockey",
  "hoodie",
  "horse",
  "hospital",
  "hourglass",
  "hourglass-high",
  "hourglass-low",
  "hourglass-medium",
  "hourglass-simple",
  "hourglass-simple-high",
  "hourglass-simple-low",
  "hourglass-simple-medium",
  "house",
  "house-line",
  "house-simple",
  "hurricane",
  "ice-cream",
  "identification-badge",
  "identification-card",
  "image",
  "image-broken",
  "image-square",
  "images",
  "images-square",
  "infinity, lemniscate",
  "info",
  "instagram-logo",
  "intersect",
  "intersect-square",
  "intersect-three",
  "intersection",
  "invoice",
  "island",
  "jar",
  "jar-label",
  "jeep",
  "joystick",
  "kanban",
  "key",
  "key-return",
  "keyboard",
  "keyhole",
  "knife",
  "ladder",
  "ladder-simple",
  "lamp",
  "lamp-pendant",
  "laptop",
  "lasso",
  "lastfm-logo",
  "layout",
  "leaf",
  "lectern",
  "lego",
  "lego-smiley",
  "less-than",
  "less-than-or-equal",
  "letter-circle-h",
  "letter-circle-p",
  "letter-circle-v",
  "lifebuoy",
  "lightbulb",
  "lightbulb-filament",
  "lighthouse",
  "lightning",
  "lightning-a",
  "lightning-slash",
  "line-segment",
  "line-segments",
  "line-vertical",
  "link",
  "link-break",
  "link-simple",
  "link-simple-break",
  "link-simple-horizontal",
  "link-simple-horizontal-break",
  "linkedin-logo",
  "linktree-logo",
  "linux-logo",
  "list",
  "list-bullets",
  "list-checks",
  "list-dashes",
  "list-heart",
  "list-magnifying-glass",
  "list-numbers",
  "list-plus",
  "list-star",
  "lock",
  "lock-key",
  "lock-key-open",
  "lock-laminated",
  "lock-laminated-open",
  "lock-open",
  "lock-simple",
  "lock-simple-open",
  "lockers",
  "log",
  "magic-wand",
  "magnet",
  "magnet-straight",
  "magnifying-glass",
  "magnifying-glass-minus",
  "magnifying-glass-plus",
  "mailbox",
  "map-pin",
  "map-pin-area",
  "map-pin-line",
  "map-pin-plus",
  "map-pin-simple",
  "map-pin-simple-area",
  "map-pin-simple-line",
  "map-trifold",
  "markdown-logo",
  "marker-circle",
  "martini",
  "mask-happy",
  "mask-sad",
  "mastodon-logo",
  "math-operations",
  "matrix-logo",
  "medal",
  "medal-military",
  "medium-logo",
  "megaphone",
  "megaphone-simple",
  "member-of",
  "memory",
  "messenger-logo",
  "meta-logo",
  "meteor",
  "metronome",
  "microphone",
  "microphone-slash",
  "microphone-stage",
  "microscope",
  "microsoft-excel-logo",
  "microsoft-outlook-logo",
  "microsoft-powerpoint-logo",
  "microsoft-teams-logo",
  "microsoft-word-logo",
  "minus",
  "minus-circle",
  "minus-square",
  "money",
  "money-wavy",
  "monitor",
  "monitor-arrow-up",
  "monitor-play",
  "moon",
  "moon-stars",
  "moped",
  "moped-front",
  "mosque",
  "motorcycle",
  "mountains",
  "mouse",
  "mouse-left-click",
  "mouse-middle-click",
  "mouse-right-click",
  "mouse-scroll",
  "mouse-simple",
  "music-note",
  "music-note-simple",
  "music-notes",
  "music-notes-minus",
  "music-notes-plus",
  "music-notes-simple",
  "navigation-arrow",
  "needle",
  "network",
  "network-slash",
  "network-x",
  "newspaper",
  "newspaper-clipping",
  "not-equals",
  "not-member-of",
  "not-subset-of",
  "not-superset-of",
  "notches",
  "note",
  "note-blank",
  "note-pencil",
  "notebook",
  "notepad",
  "notification",
  "notion-logo",
  "nuclear-plant",
  "number-circle-eight",
  "number-circle-five",
  "number-circle-four",
  "number-circle-nine",
  "number-circle-one",
  "number-circle-seven",
  "number-circle-six",
  "number-circle-three",
  "number-circle-two",
  "number-circle-zero",
  "number-eight",
  "number-five",
  "number-four",
  "number-nine",
  "number-one",
  "number-seven",
  "number-six",
  "number-square-eight",
  "number-square-five",
  "number-square-four",
  "number-square-nine",
  "number-square-one",
  "number-square-seven",
  "number-square-six",
  "number-square-three",
  "number-square-two",
  "number-square-zero",
  "number-three",
  "number-two",
  "number-zero",
  "numpad",
  "nut",
  "ny-times-logo",
  "octagon",
  "office-chair",
  "onigiri",
  "open-ai-logo",
  "option",
  "orange",
  "orange-slice",
  "oven",
  "package",
  "paint-brush",
  "paint-brush-broad",
  "paint-brush-household",
  "paint-bucket",
  "paint-roller",
  "palette",
  "panorama",
  "pants",
  "paper-plane",
  "paper-plane-right",
  "paper-plane-tilt",
  "paperclip",
  "paperclip-horizontal",
  "parachute",
  "paragraph",
  "parallelogram",
  "park",
  "password",
  "path",
  "patreon-logo",
  "pause",
  "pause-circle",
  "paw-print",
  "paypal-logo",
  "peace",
  "pen",
  "pen-nib",
  "pen-nib-straight",
  "pencil",
  "pencil-circle",
  "pencil-line",
  "pencil-ruler",
  "pencil-simple",
  "pencil-simple-line",
  "pencil-simple-slash",
  "pencil-slash",
  "pentagon",
  "pentagram",
  "pepper",
  "percent",
  "person",
  "person-arms-spread",
  "person-simple",
  "person-simple-bike",
  "person-simple-circle",
  "person-simple-hike",
  "person-simple-run",
  "person-simple-ski",
  "person-simple-snowboard",
  "person-simple-swim",
  "person-simple-tai-chi",
  "person-simple-throw",
  "person-simple-walk",
  "perspective",
  "phone",
  "phone-call",
  "phone-disconnect",
  "phone-incoming",
  "phone-list",
  "phone-outgoing",
  "phone-pause",
  "phone-plus",
  "phone-slash",
  "phone-transfer",
  "phone-x",
  "phosphor-logo",
  "pi",
  "piano-keys",
  "picnic-table",
  "picture-in-picture",
  "piggy-bank",
  "pill",
  "ping-pong",
  "pint-glass",
  "pinterest-logo",
  "pinwheel",
  "pipe",
  "pipe-wrench",
  "pix-logo",
  "pizza",
  "placeholder",
  "planet",
  "plant",
  "play",
  "play-circle",
  "play-pause",
  "playlist",
  "plug",
  "plug-charging",
  "plugs",
  "plugs-connected",
  "plus",
  "plus-circle",
  "plus-minus",
  "plus-square",
  "poker-chip",
  "police-car",
  "polygon",
  "popcorn",
  "popsicle",
  "potted-plant",
  "power",
  "prescription",
  "presentation",
  "presentation-chart",
  "printer",
  "prohibit",
  "prohibit-inset",
  "projector-screen",
  "projector-screen-chart",
  "pulse, activity",
  "push-pin",
  "push-pin-simple",
  "push-pin-simple-slash",
  "push-pin-slash",
  "puzzle-piece",
  "qr-code",
  "question",
  "question-mark",
  "queue",
  "quotes",
  "rabbit",
  "racquet",
  "radical",
  "radio",
  "radio-button",
  "radioactive",
  "rainbow",
  "rainbow-cloud",
  "ranking",
  "read-cv-logo",
  "receipt",
  "receipt-x",
  "record",
  "rectangle",
  "rectangle-dashed",
  "recycle",
  "reddit-logo",
  "repeat",
  "repeat-once",
  "replit-logo",
  "resize",
  "rewind",
  "rewind-circle",
  "road-horizon",
  "robot",
  "rocket",
  "rocket-launch",
  "rows",
  "rows-plus-bottom",
  "rows-plus-top",
  "rss",
  "rss-simple",
  "rug",
  "ruler",
  "sailboat",
  "scales",
  "scan",
  "scan-smiley",
  "scissors",
  "scooter",
  "screencast",
  "screwdriver",
  "scribble",
  "scribble-loop",
  "scroll",
  "seal, circle-wavy",
  "seal-check, circle-wavy-check",
  "seal-percent",
  "seal-question, circle-wavy-question",
  "seal-warning, circle-wavy-warning",
  "seat",
  "seatbelt",
  "security-camera",
  "selection",
  "selection-all",
  "selection-background",
  "selection-foreground",
  "selection-inverse",
  "selection-plus",
  "selection-slash",
  "shapes",
  "share",
  "share-fat",
  "share-network",
  "shield",
  "shield-check",
  "shield-checkered",
  "shield-chevron",
  "shield-plus",
  "shield-slash",
  "shield-star",
  "shield-warning",
  "shipping-container",
  "shirt-folded",
  "shooting-star",
  "shopping-bag",
  "shopping-bag-open",
  "shopping-cart",
  "shopping-cart-simple",
  "shovel",
  "shower",
  "shrimp",
  "shuffle",
  "shuffle-angular",
  "shuffle-simple",
  "sidebar",
  "sidebar-simple",
  "sigma",
  "sign-in",
  "sign-out",
  "signature",
  "signpost",
  "sim-card",
  "siren",
  "sketch-logo",
  "skip-back",
  "skip-back-circle",
  "skip-forward",
  "skip-forward-circle",
  "skull",
  "skype-logo",
  "slack-logo",
  "sliders",
  "sliders-horizontal",
  "slideshow",
  "smiley",
  "smiley-angry",
  "smiley-blank",
  "smiley-meh",
  "smiley-melting",
  "smiley-nervous",
  "smiley-sad",
  "smiley-sticker",
  "smiley-wink",
  "smiley-x-eyes",
  "snapchat-logo",
  "sneaker",
  "sneaker-move",
  "snowflake",
  "soccer-ball",
  "sock",
  "solar-panel",
  "solar-roof",
  "sort-ascending",
  "sort-descending",
  "soundcloud-logo",
  "spade",
  "sparkle",
  "speaker-hifi",
  "speaker-high",
  "speaker-low",
  "speaker-none",
  "speaker-simple-high",
  "speaker-simple-low",
  "speaker-simple-none",
  "speaker-simple-slash",
  "speaker-simple-x",
  "speaker-slash",
  "speaker-x",
  "speedometer",
  "sphere",
  "spinner",
  "spinner-ball",
  "spinner-gap",
  "spiral",
  "split-horizontal",
  "split-vertical",
  "spotify-logo",
  "spray-bottle",
  "square",
  "square-half",
  "square-half-bottom",
  "square-logo",
  "square-split-horizontal",
  "square-split-vertical",
  "squares-four",
  "stack",
  "stack-minus",
  "stack-overflow-logo",
  "stack-plus",
  "stack-simple",
  "stairs",
  "stamp",
  "standard-definition",
  "star",
  "star-and-crescent",
  "star-four",
  "star-half",
  "star-of-david",
  "steam-logo",
  "steering-wheel",
  "steps",
  "stethoscope",
  "sticker",
  "stool",
  "stop",
  "stop-circle",
  "storefront",
  "strategy",
  "stripe-logo",
  "student",
  "subset-of",
  "subset-proper-of",
  "subtitles",
  "subtitles-slash",
  "subtract",
  "subtract-square",
  "subway",
  "suitcase",
  "suitcase-rolling",
  "suitcase-simple",
  "sun",
  "sun-dim",
  "sun-horizon",
  "sunglasses",
  "superset-of",
  "superset-proper-of",
  "swap",
  "swatches",
  "swimming-pool",
  "sword",
  "synagogue",
  "syringe",
  "t-shirt",
  "table",
  "tabs",
  "tag",
  "tag-chevron",
  "tag-simple",
  "target",
  "taxi",
  "tea-bag",
  "telegram-logo",
  "television",
  "television-simple",
  "tennis-ball",
  "tent",
  "terminal",
  "terminal-window",
  "test-tube",
  "text-a-underline",
  "text-aa",
  "text-align-center",
  "text-align-justify",
  "text-align-left",
  "text-align-right",
  "text-b, text-bolder",
  "text-columns",
  "text-h",
  "text-h-five",
  "text-h-four",
  "text-h-one",
  "text-h-six",
  "text-h-three",
  "text-h-two",
  "text-indent",
  "text-italic",
  "text-outdent",
  "text-strikethrough",
  "text-subscript",
  "text-superscript",
  "text-t",
  "text-t-slash",
  "text-underline",
  "textbox",
  "thermometer",
  "thermometer-cold",
  "thermometer-hot",
  "thermometer-simple",
  "threads-logo",
  "three-d",
  "thumbs-down",
  "thumbs-up",
  "ticket",
  "tidal-logo",
  "tiktok-logo",
  "tilde",
  "timer",
  "tip-jar",
  "tipi",
  "tire",
  "toggle-left",
  "toggle-right",
  "toilet",
  "toilet-paper",
  "toolbox",
  "tooth",
  "tornado",
  "tote",
  "tote-simple",
  "towel",
  "tractor",
  "trademark",
  "trademark-registered",
  "traffic-cone",
  "traffic-sign",
  "traffic-signal",
  "train",
  "train-regional",
  "train-simple",
  "tram",
  "translate",
  "trash",
  "trash-simple",
  "tray",
  "tray-arrow-down, archive-tray",
  "tray-arrow-up",
  "treasure-chest",
  "tree",
  "tree-evergreen",
  "tree-palm",
  "tree-structure",
  "tree-view",
  "trend-down",
  "trend-up",
  "triangle",
  "triangle-dashed",
  "trolley",
  "trolley-suitcase",
  "trophy",
  "truck",
  "truck-trailer",
  "tumblr-logo",
  "twitch-logo",
  "twitter-logo",
  "umbrella",
  "umbrella-simple",
  "union",
  "unite",
  "unite-square",
  "upload",
  "upload-simple",
  "usb",
  "user",
  "user-check",
  "user-circle",
  "user-circle-check",
  "user-circle-dashed",
  "user-circle-gear",
  "user-circle-minus",
  "user-circle-plus",
  "user-focus",
  "user-gear",
  "user-list",
  "user-minus",
  "user-plus",
  "user-rectangle",
  "user-sound",
  "user-square",
  "user-switch",
  "users",
  "users-four",
  "users-three",
  "van",
  "vault",
  "vector-three",
  "vector-two",
  "vibrate",
  "video",
  "video-camera",
  "video-camera-slash",
  "video-conference",
  "vignette",
  "vinyl-record",
  "virtual-reality",
  "virus",
  "visor",
  "voicemail",
  "volleyball",
  "wall",
  "wallet",
  "warehouse",
  "warning",
  "warning-circle",
  "warning-diamond",
  "warning-octagon",
  "washing-machine",
  "watch",
  "wave-sawtooth",
  "wave-sine",
  "wave-square",
  "wave-triangle",
  "waveform",
  "waveform-slash",
  "waves",
  "webcam",
  "webcam-slash",
  "webhooks-logo",
  "wechat-logo",
  "whatsapp-logo",
  "wheelchair",
  "wheelchair-motion",
  "wifi-high",
  "wifi-low",
  "wifi-medium",
  "wifi-none",
  "wifi-slash",
  "wifi-x",
  "wind",
  "windmill",
  "windows-logo",
  "wine",
  "wrench",
  "x",
  "x-circle",
  "x-logo",
  "x-square",
  "yarn",
  "yin-yang",
  "youtube-logo"
];

// src/extension.ts
function isCursorInsideShIcon(document, position) {
  const offset = document.offsetAt(position);
  const startOffset = Math.max(0, offset - 1e3);
  const textBefore = document.getText(new vscode.Range(document.positionAt(startOffset), position));
  const lastOpenTag = textBefore.lastIndexOf("<sh-icon");
  if (lastOpenTag === -1)
    return false;
  const lastCloseTag = textBefore.lastIndexOf("</sh-icon>");
  if (lastCloseTag > lastOpenTag)
    return false;
  const remainingTextFromTag = textBefore.substring(lastOpenTag);
  const tagCloseBracket = remainingTextFromTag.indexOf(">");
  if (tagCloseBracket === -1)
    return false;
  const contentArea = remainingTextFromTag.substring(tagCloseBracket + 1);
  if (contentArea.includes("<"))
    return false;
  return true;
}
function activate(context) {
  console.log("ShipUI Intellisense is now active!");
  const completionItems = [];
  for (const component of components_default) {
    if (!component.selector)
      continue;
    const selectorBase = component.selector.replace(/[[\]]/g, "");
    const isAttribute = component.selector.startsWith("[");
    const tag = isAttribute ? component.selector === "[shButton]" ? "button" : "div" : selectorBase;
    const commonInputs = component.inputs.filter(
      (i) => ["color", "variant", "size", "readonly"].includes(i.name)
    );
    if (commonInputs.length > 0) {
      const item = new vscode.CompletionItem(`${selectorBase}-full`, vscode.CompletionItemKind.Snippet);
      let snippetString = "";
      const attrs = commonInputs.map((i, idx) => {
        if (i.options && i.options.length > 0) {
          return `${i.name}="\${${idx + 1}|${i.options.join(",")}|}"`;
        }
        return `[${i.name}]="\${${idx + 1}:${i.defaultValue || "''"}}"`;
      }).join(" ");
      if (isAttribute) {
        snippetString = `<${tag} ${selectorBase} ${attrs}>
  $0
</${tag}>`;
      } else {
        snippetString = `<${selectorBase} ${attrs}>
  $0
</${selectorBase}>`;
      }
      item.insertText = new vscode.SnippetString(snippetString);
      item.detail = `ShipUI: Full ${component.name}`;
      item.documentation = component.description;
      item.command = {
        command: "ship-ui.autoImport",
        title: "Auto Import ShipUI Component",
        arguments: [component.name]
      };
      completionItems.push(item);
    }
    const basicItem = new vscode.CompletionItem(selectorBase, vscode.CompletionItemKind.Snippet);
    if (isAttribute) {
      basicItem.insertText = new vscode.SnippetString(`<${tag} ${selectorBase}>$0</${tag}>`);
    } else {
      basicItem.insertText = new vscode.SnippetString(`<${selectorBase}>$0</${selectorBase}>`);
    }
    basicItem.detail = `ShipUI: Basic ${component.name}`;
    basicItem.command = {
      command: "ship-ui.autoImport",
      title: "Auto Import ShipUI Component",
      arguments: [component.name]
    };
    completionItems.push(basicItem);
  }
  const componentProvider = vscode.languages.registerCompletionItemProvider(
    { language: "html" },
    {
      provideCompletionItems(document, position, token, context2) {
        if (isCursorInsideShIcon(document, position)) {
          return void 0;
        }
        return completionItems;
      }
    }
  );
  context.subscriptions.push(componentProvider);
  const iconCompletionItems = [];
  const iconWeights = [
    { name: "", labelSuffix: "", detail: "Phosphor: Regular", assetFolder: "regular", filenameSuffix: "" },
    { name: "thin", labelSuffix: "-thin", detail: "Phosphor: Thin", assetFolder: "thin", filenameSuffix: "-thin" },
    { name: "light", labelSuffix: "-light", detail: "Phosphor: Light", assetFolder: "light", filenameSuffix: "-light" },
    { name: "bold", labelSuffix: "-bold", detail: "Phosphor: Bold", assetFolder: "bold", filenameSuffix: "-bold" },
    { name: "fill", labelSuffix: "-fill", detail: "Phosphor: Fill", assetFolder: "fill", filenameSuffix: "-fill" },
    { name: "duotone", labelSuffix: "-duotone", detail: "Phosphor: Duotone", assetFolder: "duotone", filenameSuffix: "-duotone" }
  ];
  for (const icon of icons_default) {
    for (const weight of iconWeights) {
      const fullLabel = `${icon}${weight.labelSuffix}`;
      const item = new vscode.CompletionItem(fullLabel, vscode.CompletionItemKind.Value);
      item.detail = weight.detail;
      const doc = new vscode.MarkdownString();
      doc.supportHtml = true;
      doc.appendMarkdown(`### ${icon} (${weight.name || "Regular"})

`);
      const url = `https://raw.githubusercontent.com/phosphor-icons/core/main/assets/${weight.assetFolder}/${icon}${weight.filenameSuffix}.svg`;
      doc.appendMarkdown(`![${fullLabel}](${url})
`);
      item.documentation = doc;
      iconCompletionItems.push(item);
    }
  }
  const iconProvider = vscode.languages.registerCompletionItemProvider(
    { language: "html" },
    {
      provideCompletionItems(document, position, token, context2) {
        if (isCursorInsideShIcon(document, position)) {
          return iconCompletionItems;
        }
        return void 0;
      }
    },
    ">",
    "-"
  );
  context.subscriptions.push(iconProvider);
  const autoImportCommand = vscode.commands.registerCommand("ship-ui.autoImport", async (componentName) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !componentName)
      return;
    const htmlPath = editor.document.uri.fsPath;
    if (!htmlPath.endsWith(".html"))
      return;
    const currentDir = path.dirname(htmlPath);
    const files = fs.readdirSync(currentDir);
    const tsFiles = files.filter((f) => f.endsWith(".ts") && !f.endsWith(".spec.ts"));
    let targetTsFile = "";
    const baseName = path.basename(htmlPath, ".html");
    const exactMatch = tsFiles.find((f) => f === `${baseName}.ts`);
    if (exactMatch) {
      targetTsFile = path.join(currentDir, exactMatch);
    } else if (tsFiles.length === 1) {
      targetTsFile = path.join(currentDir, tsFiles[0]);
    } else {
      for (const ts of tsFiles) {
        const content2 = fs.readFileSync(path.join(currentDir, ts), "utf8");
        if (content2.includes("@Component")) {
          targetTsFile = path.join(currentDir, ts);
          break;
        }
      }
    }
    if (!targetTsFile)
      return;
    const tsUri = vscode.Uri.file(targetTsFile);
    const tsDoc = await vscode.workspace.openTextDocument(tsUri);
    const content = tsDoc.getText();
    const workspaceEdit = new vscode.WorkspaceEdit();
    let hasChanges = false;
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"](@ship-ui\/core|ship-ui)['"]/g;
    let importMatch;
    let existingImportMatch = null;
    let alreadyImported = false;
    while ((importMatch = importRegex.exec(content)) !== null) {
      const pkg = importMatch[2];
      const importedSymbols = importMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
      if (importedSymbols.includes(componentName)) {
        alreadyImported = true;
        break;
      }
      if (!existingImportMatch || pkg === "@ship-ui/core") {
        existingImportMatch = {
          text: importMatch[0],
          index: importMatch.index,
          imports: importedSymbols,
          pkg
        };
      }
    }
    if (!alreadyImported) {
      if (existingImportMatch) {
        const newImports = [...existingImportMatch.imports, componentName].join(", ");
        const newImportStr = `import { ${newImports} } from '${existingImportMatch.pkg}'`;
        const startPos = tsDoc.positionAt(existingImportMatch.index);
        const endPos = tsDoc.positionAt(existingImportMatch.index + existingImportMatch.text.length);
        workspaceEdit.replace(tsUri, new vscode.Range(startPos, endPos), newImportStr);
        hasChanges = true;
      } else {
        const insertPos = new vscode.Position(0, 0);
        workspaceEdit.insert(tsUri, insertPos, `import { ${componentName} } from '@ship-ui/core';
`);
        hasChanges = true;
      }
    }
    const decoratorKeyword = "@Component(";
    const startIdx = content.indexOf(decoratorKeyword);
    if (startIdx !== -1) {
      const openBraceIdx = content.indexOf("{", startIdx + decoratorKeyword.length);
      if (openBraceIdx !== -1) {
        let depth = 1;
        let endBraceIdx = -1;
        let inSingleQuote = false;
        let inDoubleQuote = false;
        let inTemplateLiteral = false;
        let escaped = false;
        for (let i = openBraceIdx + 1; i < content.length; i++) {
          const char = content[i];
          if (escaped) {
            escaped = false;
            continue;
          }
          if (char === "\\") {
            escaped = true;
            continue;
          }
          if (inSingleQuote) {
            if (char === "'")
              inSingleQuote = false;
            continue;
          }
          if (inDoubleQuote) {
            if (char === '"')
              inDoubleQuote = false;
            continue;
          }
          if (inTemplateLiteral) {
            if (char === "`")
              inTemplateLiteral = false;
            continue;
          }
          if (char === "'") {
            inSingleQuote = true;
            continue;
          }
          if (char === '"') {
            inDoubleQuote = true;
            continue;
          }
          if (char === "`") {
            inTemplateLiteral = true;
            continue;
          }
          if (char === "{") {
            depth++;
          } else if (char === "}") {
            depth--;
            if (depth === 0) {
              endBraceIdx = i;
              break;
            }
          }
        }
        if (endBraceIdx !== -1) {
          const decoratorContent = content.substring(openBraceIdx + 1, endBraceIdx);
          const importsMatch = decoratorContent.match(/imports\s*:\s*\[([\s\S]*?)\]/);
          if (importsMatch) {
            const existingArray = importsMatch[1];
            const existingImports = existingArray.split(",").map((s) => s.trim()).filter(Boolean);
            if (!existingImports.includes(componentName)) {
              const newImports = [...existingImports, componentName].join(", ");
              const originalImportsText = importsMatch[0];
              const replacementImportsText = `imports: [${newImports}]`;
              const relativeStart = decoratorContent.indexOf(originalImportsText);
              const absStart = openBraceIdx + 1 + relativeStart;
              const startPos = tsDoc.positionAt(absStart);
              const endPos = tsDoc.positionAt(absStart + originalImportsText.length);
              workspaceEdit.replace(tsUri, new vscode.Range(startPos, endPos), replacementImportsText);
              hasChanges = true;
            }
          } else {
            const startPos = tsDoc.positionAt(openBraceIdx + 1);
            const isMultiline = decoratorContent.includes("\n");
            let injection = "";
            if (isMultiline) {
              const lines = decoratorContent.split("\n");
              const firstPropLine = lines.find((line) => line.trim().length > 0) || "";
              const indentMatch = firstPropLine.match(/^\s+/);
              const indent = indentMatch ? indentMatch[0] : "  ";
              injection = `
${indent}imports: [${componentName}],`;
            } else {
              injection = ` imports: [${componentName}],`;
            }
            workspaceEdit.insert(tsUri, startPos, injection);
            hasChanges = true;
          }
        }
      }
    }
    if (hasChanges) {
      await vscode.workspace.applyEdit(workspaceEdit);
      await tsDoc.save();
    }
  });
  context.subscriptions.push(autoImportCommand);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});

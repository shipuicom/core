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
    name: "ShipTooltipWrapper",
    selector: "ship-tooltip-wrapper",
    path: "projects/ship-ui/src/lib/directives/ship-tooltip.directive.ts",
    description: "",
    keywords: [],
    inputs: [
      {
        name: "isOpen",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "content",
        type: "string | TemplateRef<any> | null | undefined",
        description: ""
      },
      {
        name: "close",
        type: "() => void",
        description: "",
        defaultValue: "("
      }
    ],
    outputs: [],
    methods: [
      {
        name: "while",
        parameters: "parent",
        returnType: "any",
        description: ""
      },
      {
        name: "return",
        parameters: "pos.left >= 0 &&\n      pos.top >= 0 &&\n      pos.left + m.width <= window.innerWidth &&\n      pos.top + m.height <= window.innerHeight\n    );\n  }\n\n  #clampToViewport(pos: { left: number; top: number }, m: DOMRect",
        returnType: "any",
        description: ""
      },
      {
        name: "untracked",
        parameters: "() => {\n      if (this.isOpen() && openRef?.component === this && openRef?.wrapperComponentRef",
        returnType: "any",
        description: ""
      },
      {
        name: "onMouseEnter",
        parameters: "event: MouseEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "onMouseLeave",
        parameters: "event: MouseEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "clearTimeout",
        parameters: "this.destroyTimeout);\n      this.destroyTimeout = null;\n    }\n  }\n\n  private showTooltip(",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipFileDragDrop",
    selector: "[shDragDrop]",
    path: "projects/ship-ui/src/lib/directives/ship-file-drag-drop.directive.ts",
    description: "",
    keywords: [],
    inputs: [],
    outputs: [
      {
        name: "filesDropped",
        type: "FileList",
        description: ""
      }
    ],
    methods: [],
    cssVariables: [
      {
        name: "--fu-bg-active",
        defaultValue: "rgba(0, 0, 0, 0.1)"
      }
    ],
    examples: []
  },
  {
    name: "ShipInputMask",
    selector: "[shInputMask]",
    path: "projects/ship-ui/src/lib/directives/ship-input-mask.ts",
    description: "",
    keywords: [],
    inputs: [
      {
        name: "shInputMask",
        type: "string | MaskingFunction",
        description: "",
        defaultValue: "'(999"
      }
    ],
    outputs: [],
    methods: [
      {
        name: "onInput",
        parameters: "event: Event",
        returnType: "any",
        description: ""
      },
      {
        name: "while",
        parameters: "newCursorPos < maskedValue.length && digitsFound < digitsBeforeCursor",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipPreventWheel",
    selector: "[shPreventWheel]",
    path: "projects/ship-ui/src/lib/directives/ship-prevent-wheel.directive.ts",
    description: "",
    keywords: [],
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipSidenav",
    selector: "sh-sidenav",
    path: "projects/ship-ui/src/lib/ship-sidenav/ship-sidenav.ts",
    description: "### Variants\n\nSidenavs support multiple behaviors via the\n`variant`\nattribute:\n\n<li>\n**default**\n: Fixed position, non-toggleable.\n</li>\n<li>\n**simple**\n: Support for toggling width (e.g., icon-only vs. full expanded view).\n</li>\n<li>\n**overlay**\n: Overlays content when opened and supports swipe-to-close gestures.\n</li>\n\n### Drag Interaction\n\nUse the\n`disableDrag`\nattribute/binding to disable swipe gestures on the\n**overlay**\nvariant.",
    keywords: [
      "sidenav",
      "sidebar",
      "drawer",
      "navigation",
      "menu",
      "layout"
    ],
    inputs: [
      {
        name: "disableDrag",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "",
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [
      {
        name: "runInInjectionContext",
        parameters: "elementRef.nativeElement, () => {\n    if (observer",
        returnType: "any",
        description: ""
      },
      {
        name: "drop",
        parameters: "e: DragEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "dragEnd",
        parameters: "e: DragEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "dragEnter",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "dragLeave",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "dragStart",
        parameters: "e: DragEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "drag",
        parameters: "e: DragEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "touchStart",
        parameters: "e: TouchEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "touchMove",
        parameters: "e: TouchEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "touchCancel",
        parameters: "e: TouchEvent",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [
      {
        name: "--sidenav-width",
        defaultValue: "#{p2r(280)}"
      },
      {
        name: "--sidenav-wrap-w",
        defaultValue: "100vw"
      },
      {
        name: "--sidenav-wrap-h",
        defaultValue: "100vh"
      }
    ],
    examples: [
      {
        name: "sandbox-sidenav",
        html: `<div class="controls">
  <p>Controls</p>
  <header>
    <div class="row">
      <sh-toggle [(checked)]="isNavOpen" class="primary raised">Open/Close</sh-toggle>

      <sh-button-group class="small" [(value)]="sidenavType">
        <button value="">Default</button>
        <button value="overlay">Overlay</button>
        <button value="simple">Simple</button>
      </sh-button-group>
    </div>

    @if (sidenavType() === 'overlay') {
      <div class="row">
        <sh-toggle [(checked)]="disableDrag" class="primary raised">Disable Drag</sh-toggle>
      </div>
    }
  </header>
</div>

<div class="sandbox">
  <sh-sidenav [class]="sidenavType()" [(isOpen)]="isNavOpen" [disableDrag]="disableDrag()">
    <ng-container sidenav>sidenav</ng-container>

    <ng-container sidenav-closed-topbar><button (click)="isNavOpen.set(!isNavOpen())">hello</button></ng-container>

    hello world
  </sh-sidenav>
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButtonGroup, ShipSidenav, ShipSidenavType, ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-sandbox-sidenav',\n  imports: [FormsModule, ShipSidenav, ShipButtonGroup, ShipToggle],\n  templateUrl: './sandbox-sidenav.html',\n  styleUrl: './sandbox-sidenav.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SandboxSidenav {\n  sidenavType = signal<ShipSidenavType>('simple');\n  isNavOpen = signal(false);\n  disableDrag = signal(false);\n}\n"
      },
      {
        name: "overlay-sidenav",
        html: '<div class="sandbox">\n  <sh-sidenav class="overlay" [(isOpen)]="isNavOpen">\n    <ng-container sidenav>\n      <div style="padding: 16px;">\n        <h3>Overlay</h3>\n        <p>Links</p>\n      </div>\n    </ng-container>\n\n    <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">\n      <button shButton class="primary" (click)="isNavOpen.set(true)">Open Overlay Sidenav</button>\n      <p>This variant completely overlays the content and provides a backdrop scrim that dismisses the nav on click.</p>\n    </div>\n  </sh-sidenav>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipButton, ShipSidenav } from 'ship-ui';\n\n@Component({\n  selector: 'app-overlay-sidenav',\n  imports: [ShipSidenav, ShipButton],\n  templateUrl: './overlay-sidenav.html',\n  styleUrl: './overlay-sidenav.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OverlaySidenav {\n  isNavOpen = signal(false);\n}\n"
      },
      {
        name: "default-sidenav",
        html: '<div class="sandbox">\n  <sh-sidenav [(isOpen)]="isNavOpen">\n    <ng-container sidenav>\n      <div style="padding: 16px;">\n        <h3>Default Nav</h3>\n        <p>Links</p>\n      </div>\n    </ng-container>\n\n    <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">\n      <button shButton class="primary" (click)="isNavOpen.set(!isNavOpen())">Toggle Sidenav</button>\n      <p>This is the default fixed position sidenav variant.</p>\n    </div>\n  </sh-sidenav>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipSidenav, ShipButton } from 'ship-ui';\n\n@Component({\n  selector: 'app-default-sidenav',\n  imports: [ShipSidenav, ShipButton],\n  templateUrl: './default-sidenav.html',\n  styleUrl: './default-sidenav.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DefaultSidenav {\n  isNavOpen = signal(true);\n}\n"
      },
      {
        name: "simple-sidenav",
        html: '<div class="sandbox">\n  <sh-sidenav class="simple" [(isOpen)]="isNavOpen">\n    <ng-container sidenav>\n      <div style="padding: 16px;">\n        <h3>Simple</h3>\n        <p>Links</p>\n      </div>\n    </ng-container>\n\n    <ng-container sidenav-closed-topbar>\n      <button shButton class="simple icon" (click)="isNavOpen.set(!isNavOpen())">\n        <sh-icon>list</sh-icon>\n      </button>\n    </ng-container>\n\n    <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">\n      <button shButton class="primary" (click)="isNavOpen.set(!isNavOpen())">Toggle Simple Sidenav</button>\n      <p>This variant supports collapsing gracefully down to either an icon-only mode or top-bar mode based on breakpoints.</p>\n    </div>\n  </sh-sidenav>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipSidenav, ShipButton, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-simple-sidenav',\n  imports: [ShipSidenav, ShipButton, ShipIcon],\n  templateUrl: './simple-sidenav.html',\n  styleUrl: './simple-sidenav.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SimpleSidenav {\n  isNavOpen = signal(true);\n}\n"
      }
    ]
  },
  {
    name: "ShipCard",
    selector: "sh-card",
    path: "projects/ship-ui/src/lib/ship-card/ship-card.ts",
    description: "### Variants\n\nCard variants can be set using the\n`variant`\nattribute. Available options:\n**type-a**\n,\n**type-b**\n,\n**type-c**\n, and\n**default**\n.\n\n### Toggle Card\n\nUse\n`&lt;sh-toggle-card&gt;`\nfor collapsible content. Use the\n`disableToggle`\nattribute or binding to keep the card open.",
    keywords: [
      "card",
      "container",
      "panel",
      "surface",
      "layout",
      "box"
    ],
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipCardVariant | null",
        description: "",
        defaultValue: "null"
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
        name: "--card-p",
        defaultValue: "#{p2r(24)}"
      },
      {
        name: "--card-shp",
        defaultValue: "#{p2r(8)}"
      }
    ],
    examples: [
      {
        name: "card-sandbox",
        html: '<div class="controls">\n  <header>\n    <div class="column">\n      <p>Controls (sh-card)</p>\n      <sh-button-group class="small" [(value)]="cardType">\n        <button value="type-a">Type A</button>\n        <button value="type-b">Type B</button>\n        <button value="type-c">Type C</button>\n      </sh-button-group>\n    </div>\n\n    <div class="column">\n      <p>Controls (sh-toggle-card)</p>\n      <sh-toggle [(checked)]="disableToggle" color="primary" variant="raised">Disable Toggle</sh-toggle>\n    </div>\n  </header>\n</div>\n\n<div class="sandbox">\n  <sh-card [variant]="cardType()">Hello world (sh-card)</sh-card>\n\n  <sh-toggle-card [variant]="cardType()" [disableToggle]="disableToggle()">\n    <ng-container title>Advanced options</ng-container>\n    <p>Hello world (sh-toggle-card)</p>\n\n    <p>\n      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore\n      magna aliqua.\n    </p>\n\n    <p>\n      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore\n      magna aliqua.\n    </p>\n  </sh-toggle-card>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipButtonGroup, ShipCard, ShipToggle, ShipToggleCard } from 'ship-ui';\n\n@Component({\n  selector: 'app-card-sandbox',\n  imports: [ShipCard, ShipToggleCard, ShipButtonGroup, ShipToggle],\n  templateUrl: './card-sandbox.html',\n  styleUrl: './card-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class CardSandbox {\n  cardType = signal<'type-a' | 'type-b' | 'type-c'>('type-a');\n  useToggleCard = signal<boolean>(false);\n  disableToggle = signal<boolean>(false);\n}\n"
      },
      {
        name: "toggle-card",
        html: "<sh-toggle-card>\n  <ng-container title>Advanced options</ng-container>\n  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>\n</sh-toggle-card>\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipToggleCard } from 'ship-ui';\n\n@Component({\n  selector: 'app-toggle-card-example',\n  standalone: true,\n  imports: [ShipToggleCard],\n  templateUrl: './toggle-card.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ToggleCardExampleComponent {}\n"
      },
      {
        name: "base-card",
        html: '<sh-card>\n  <header>Base Card Title</header>\n  <div class="content">\n    <p>This is an example of the default base card layout. It features standard padding, background, and borders.</p>\n  </div>\n  <footer>\n    <button shButton variant="outlined" size="small">Cancel</button>\n    <button shButton variant="raised" color="primary" size="small">Confirm</button>\n  </footer>\n</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton, ShipCard } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-card',\n  imports: [ShipCard, ShipButton],\n  templateUrl: './base-card.html',\n  styleUrl: './base-card.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseCardComponent {}\n"
      },
      {
        name: "type-a-card",
        html: '<sh-card variant="type-a">hello world</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipCard } from 'ship-ui';\n\n@Component({\n  selector: 'app-type-a-card',\n  standalone: true,\n  imports: [ShipCard],\n  templateUrl: './type-a-card.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TypeACardComponent {}\n"
      },
      {
        name: "type-b-card",
        html: '<sh-card variant="type-b">hello world</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipCard } from 'ship-ui';\n\n@Component({\n  selector: 'app-type-b-card',\n  standalone: true,\n  imports: [ShipCard],\n  templateUrl: './type-b-card.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TypeBCardComponent {}\n"
      },
      {
        name: "type-c-card",
        html: '<sh-card variant="type-c">hello world</sh-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipCard } from 'ship-ui';\n\n@Component({\n  selector: 'app-type-c-card',\n  standalone: true,\n  imports: [ShipCard],\n  templateUrl: './type-c-card.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TypeCCardComponent {}\n"
      },
      {
        name: "toggle-card-disallowed",
        html: '<sh-toggle-card [disableToggle]="true">\n  <ng-container title>Advanced options</ng-container>\n  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>\n</sh-toggle-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipToggleCard } from 'ship-ui';\n\n@Component({\n  selector: 'app-toggle-card-disallowed-example',\n  standalone: true,\n  imports: [ShipToggleCard],\n  templateUrl: './toggle-card-disallowed.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ToggleCardDisallowedExampleComponent {}\n"
      }
    ]
  },
  {
    name: "ShipFormFieldExperimental",
    selector: "sh-form-field-experimental",
    path: "projects/ship-ui/src/lib/sh-form-field-experimental/sh-form-field-experimental.ts",
    description: "",
    keywords: [],
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "myClick",
        parameters: "",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipEventCard",
    selector: "sh-event-card",
    path: "projects/ship-ui/src/lib/ship-event-card/ship-event-card.ts",
    description: "### Variants\n\nEvent card variants can be set using the\n`variant`\nattribute. Valid options are:\n**simple**\n,\n**outlined**\n,\n**flat**\n, and\n**raised**\n.\n\n### Colors\n\nColors can be set using the\n`color`\nattribute. Valid options are:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**error**\n, and\n**success**\n.\n\n:::info\nThis component utilizes the **Ship Sheet** utility for its visual structure. It supports standard sheet variations and is affected by global sheet variables.\n:::",
    keywords: [
      "event",
      "card",
      "calendar",
      "scheduling",
      "date",
      "meeting"
    ],
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "",
        defaultValue: "null"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--btn-bs",
        defaultValue: "none"
      }
    ],
    examples: [
      {
        name: "outlined-event-card",
        html: '<sh-event-card class="outlined">\n  <h3>Default</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="outlined primary">\n  <h3>Primary</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="outlined accent">\n  <h3>Accent</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="outlined warn">\n  <h3>Warn</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="outlined error">\n  <h3>Error</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="outlined success">\n  <h3>Success</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton, ShipEventCard } from 'ship-ui';\n\n@Component({\n  selector: 'app-outlined-event-card',\n  imports: [ShipEventCard, ShipButton],\n  templateUrl: './outlined-event-card.html',\n  styleUrl: './outlined-event-card.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OutlinedEventCard {}\n"
      },
      {
        name: "simple-event-card",
        html: '<sh-event-card class="simple">\n  <h3>Default</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="simple primary">\n  <h3>Primary</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="simple accent">\n  <h3>Accent</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="simple warn">\n  <h3>Warn</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="simple error">\n  <h3>Error</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="simple success">\n  <h3>Success</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton, ShipEventCard } from 'ship-ui';\n\n@Component({\n  selector: 'app-simple-event-card',\n  imports: [ShipEventCard, ShipButton],\n  templateUrl: './simple-event-card.html',\n  styleUrl: './simple-event-card.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SimpleEventCard {}\n"
      },
      {
        name: "raised-event-card",
        html: '<sh-event-card class="raised">\n  <h3>Default</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="raised primary">\n  <h3>Primary</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="raised accent">\n  <h3>Accent</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="raised warn">\n  <h3>Warn</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="raised error">\n  <h3>Error</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="raised success">\n  <h3>Success</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton, ShipEventCard } from 'ship-ui';\n\n@Component({\n  selector: 'app-raised-event-card',\n  imports: [ShipEventCard, ShipButton],\n  templateUrl: './raised-event-card.html',\n  styleUrl: './raised-event-card.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RaisedEventCard {}\n"
      },
      {
        name: "base-event-card",
        html: '<sh-event-card>\n  <h3>Default</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="primary">\n  <h3>Primary</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="accent">\n  <h3>Accent</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="warn">\n  <h3>Warn</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="error">\n  <h3>Error</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="success">\n  <h3>Success</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton, ShipEventCard } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-event-card',\n  imports: [ShipEventCard, ShipButton],\n  templateUrl: './base-event-card.html',\n  styleUrl: './base-event-card.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseEventCard {}\n"
      },
      {
        name: "event-card-sandbox",
        html: '<div class="controls">\n  <p>Controls</p>\n  <header>\n    <div class="row">\n      <sh-toggle [(checked)]="useDynamicColor" color="primary" variant="raised">Use dynamic color</sh-toggle>\n\n      @if (useDynamicColor()) {\n        <input\n          type="color"\n          [disabled]="!useDynamicColor()"\n          [ngModel]="dynamicColor()"\n          (ngModelChange)="dynamicColor.set($event)" />\n      }\n    </div>\n\n    @if (!useDynamicColor()) {\n      <div class="row">\n        <sh-button-group class="small" [(value)]="colorClass">\n          <button value="">Default</button>\n          <button value="primary">Primary</button>\n          <button value="accent">Accent</button>\n          <button value="warn">Warn</button>\n          <button value="error">Error</button>\n          <button value="success">Success</button>\n        </sh-button-group>\n\n        <sh-button-group class="small" [(value)]="variationClass">\n          <button value="">Default</button>\n          <button value="simple">Simple</button>\n          <button value="outlined">Outlined</button>\n          <button value="flat">Flat</button>\n          <button value="raised">Raised</button>\n        </sh-button-group>\n      </div>\n    }\n  </header>\n</div>\n\n<div class="sandbox">\n  <sh-event-card [class]="exampleClass()" [style.--sheet-c]="useDynamicColor() ? dynamicColor() : null">\n    Just text in the card\n  </sh-event-card>\n\n  <sh-event-card [class]="exampleClass()" [style.--sheet-c]="useDynamicColor() ? dynamicColor() : null">\n    <h3>Card with title</h3>\n    <p>and description</p>\n  </sh-event-card>\n\n  <sh-event-card [class]="exampleClass()" [style.--sheet-c]="useDynamicColor() ? dynamicColor() : null">\n    <h3>Card with title</h3>\n    <p>and description</p>\n\n    <button shButton>Action 1</button>\n  </sh-event-card>\n\n  <sh-event-card [class]="exampleClass()" [style.--sheet-c]="useDynamicColor() ? dynamicColor() : null">\n    Event card with just buttons projected as actions Event card with just buttons projected as actionsEvent card with\n    just buttons projected as actionsEvent card with just buttons projected as actionsEvent card with just buttons\n    projected as actionsEvent card with just buttons projected as actions\n\n    <button shButton>Action 1</button>\n    <button shButton>Action 2</button>\n  </sh-event-card>\n\n  <sh-event-card [class]="exampleClass()" [style.--sheet-c]="useDynamicColor() ? dynamicColor() : null">\n    <h3>Card with title</h3>\n    <p>and description</p>\n    <button shButton>And a action button</button>\n  </sh-event-card>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButton, ShipButtonGroup, ShipEventCard, ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-event-card-sandbox',\n  imports: [FormsModule, ShipEventCard, ShipButton, ShipToggle, ShipButtonGroup],\n  templateUrl: './event-card-sandbox.html',\n  styleUrl: './event-card-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class EventCardSandbox {\n  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');\n  variationClass = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('simple');\n\n  useDynamicColor = signal<boolean>(false);\n  dynamicColor = signal<string>('#2f54eb');\n\n  exampleClass = computed(() => {\n    if (this.useDynamicColor()) return 'dynamic';\n\n    return this.variationClass() + ' ' + this.colorClass();\n  });\n}\n"
      },
      {
        name: "flat-event-card",
        html: '<sh-event-card class="flat">\n  <h3>Default</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="flat primary">\n  <h3>Primary</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="flat accent">\n  <h3>Accent</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="flat warn">\n  <h3>Warn</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="flat error">\n  <h3>Error</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n\n<sh-event-card class="flat success">\n  <h3>Success</h3>\n  <p>and description</p>\n  <button shButton>Action 1</button>\n</sh-event-card>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton, ShipEventCard } from 'ship-ui';\n\n@Component({\n  selector: 'app-flat-event-card',\n  imports: [ShipEventCard, ShipButton],\n  templateUrl: './flat-event-card.html',\n  styleUrl: './flat-event-card.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FlatEventCard {}\n"
      }
    ]
  },
  {
    name: "ShipFileUpload",
    selector: "sh-file-upload",
    path: "projects/ship-ui/src/lib/ship-file-upload/ship-file-upload.ts",
    description: '### Files\n\nSelected files are available via the\n`files`\nattribute. Use\n`[(files)]`\nfor two-way binding.\n\n### Selection\n\nCustomize selection behavior:\n\n<li>\n`multiple`\n: Allows selecting more than one file.\n</li>\n<li>\n`accept`\n: Restricts file types (e.g.,\n`accept=".png,.jpg"`\n).\n</li>\n\n### Text\n\nCustomize displayed labels:\n\n<li>\n`placeholder`\n: Text shown when empty.\n</li>\n<li>\n`overlayText`\n: Text shown during drag-and-drop.\n</li>',
    keywords: [
      "file",
      "upload",
      "drag and drop",
      "dropzone",
      "attachment",
      "upload input"
    ],
    inputs: [
      {
        name: "multiple",
        type: "boolean | null",
        description: ""
      },
      {
        name: "accept",
        type: "string | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "overlayText",
        type: "string",
        description: "",
        defaultValue: "'Drop files here'"
      },
      {
        name: "placeholder",
        type: "string",
        description: "",
        defaultValue: "'Click or drag files here'"
      },
      {
        name: "files",
        type: "File[]",
        description: "",
        defaultValue: "[]"
      }
    ],
    outputs: [],
    methods: [
      {
        name: "handleFileUpload",
        parameters: "newFiles: File[]",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [
      {
        name: "--fu-bg-active",
        defaultValue: "rgba(0, 0, 0, 0.1)"
      }
    ],
    examples: [
      {
        name: "base-file-upload",
        html: '<sh-file-upload [(files)]="files" accept=".json,.png" />\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipFileUpload } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-file-upload',\n  imports: [ShipFileUpload],\n  templateUrl: './base-file-upload.html',\n  styleUrl: './base-file-upload.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseFileUpload {\n  files = signal<File[]>([]);\n}\n"
      },
      {
        name: "file-upload-sandbox",
        html: '<div class="controls">\n  <p>Controls</p>\n\n  <div class="row">\n    <sh-form-field>\n      <label>Accept</label>\n      <input type="text" [(ngModel)]="accept" />\n    </sh-form-field>\n\n    <sh-form-field>\n      <label>Placeholder</label>\n      <input type="text" [(ngModel)]="placeholder" />\n    </sh-form-field>\n\n    <sh-form-field>\n      <label>Overlay Text</label>\n      <input type="text" [(ngModel)]="overlayText" />\n    </sh-form-field>\n\n    <sh-checkbox class="primary raised" [(checked)]="multiple">\n      Multiple\n    </sh-checkbox>\n  </div>\n</div>\n\n<div class="sandbox">\n  <sh-file-upload\n    [(files)]="files"\n    [multiple]="multiple()"\n    [accept]="accept()"\n    [placeholder]="placeholder()"\n    [overlayText]="overlayText()" />\n</div>\n\n<div class="files-list">\n  <h4>Selected Files</h4>\n  <ul>\n    @for (file of files(); track file.name) {\n      <li>{{ file.name }}</li>\n    }\n  </ul>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipCheckbox, ShipFileUpload, ShipFormField } from 'ship-ui';\n\n@Component({\n  selector: 'app-file-upload-sandbox',\n  standalone: true,\n  imports: [FormsModule, ShipFileUpload, ShipCheckbox, ShipFormField],\n  templateUrl: './file-upload-sandbox.html',\n  styleUrl: './file-upload-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FileUploadSandbox {\n  files = signal<File[]>([]);\n  multiple = signal<boolean>(true);\n  accept = signal<string>('.json,.png');\n  placeholder = signal<string>('Click or drag files here');\n  overlayText = signal<string>('Drop files here');\n}\n"
      }
    ]
  },
  {
    name: "ShipTabs",
    selector: "sh-tabs",
    path: "projects/ship-ui/src/lib/ship-tabs/ship-tabs.ts",
    description: "### Colors\n\nTab colors can be set using the\n`color`\nattribute. Available options are:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**error**\n, and\n**success**\n.",
    keywords: [
      "tab",
      "panel",
      "navigation",
      "routing",
      "sections"
    ],
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "",
        defaultValue: "null"
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
        name: "tabs-sandbox",
        html: `<div class="controls">
  <p>Controls</p>
  <header>
    <div class="row">
      <sh-button-group class="small" [(value)]="colorClass">
        <button value="">Default</button>
        <button value="primary">Primary</button>
        <button value="accent">Accent</button>
        <button value="warn">Warn</button>
        <button value="error">Error</button>
        <button value="success">Success</button>
      </sh-button-group>
    </div>
  </header>
</div>

<div class="sandbox">
  <sh-tabs [color]="colorClass()" [(value)]="activeTab">
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
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { ShipButtonGroup, ShipIcon, ShipTabs } from 'ship-ui';\nimport Tab from '../../tab/tab';\n\n@Component({\n  selector: 'app-tabs-sandbox',\n  standalone: true,\n  imports: [ShipTabs, ShipIcon, ShipButtonGroup, Tab],\n  templateUrl: './tabs-sandbox.html',\n  styleUrl: './tabs-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TabsSandbox {\n  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('');\n  tabsClass = computed(() => (this.colorClass() === '' ? '' : this.colorClass()));\n  activeTab = signal('tab1');\n}\n"
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
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipIcon, ShipTabs } from 'ship-ui';\nimport Tab from '../../tab/tab';\n\n@Component({\n  selector: 'app-custom-tabs',\n  standalone: true,\n  imports: [ShipTabs, ShipIcon, Tab],\n  templateUrl: './custom-tabs.html',\n  styleUrls: ['./custom-tabs.scss'],\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class CustomTabsComponent {\n  activeTab = signal('tab1');\n}\n"
      },
      {
        name: "router-tabs",
        html: '<sh-tabs class="primary">\n  <button routerLink="/tabs/tab/1" routerLinkActive="active">\n    <sh-icon>spinner</sh-icon>\n    Tab 1\n  </button>\n\n  <button routerLink="/tabs/tab/2" routerLinkActive="active">\n    <sh-icon>hand-palm</sh-icon>\n    Tab 2\n  </button>\n\n  <button routerLink="/tabs/tab/3" routerLinkActive="active">\n    <sh-icon>check</sh-icon>\n    Tab 3\n  </button>\n</sh-tabs>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { RouterLink, RouterLinkActive } from '@angular/router';\nimport { ShipIcon, ShipTabs } from 'ship-ui';\n\n@Component({\n  selector: 'app-router-tabs',\n  imports: [ShipTabs, ShipIcon, RouterLinkActive, RouterLink],\n  templateUrl: './router-tabs.html',\n  styleUrl: './router-tabs.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RouterTabsComponent {}\n"
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
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipIcon, ShipTabs } from 'ship-ui';\nimport Tab from '../../tab/tab';\n\n@Component({\n  selector: 'app-default-tabs',\n  standalone: true,\n  imports: [ShipTabs, ShipIcon, Tab],\n  templateUrl: './default-tabs.html',\n  styleUrls: ['./default-tabs.scss'],\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DefaultTabsComponent {\n  activeTab = signal('tab1');\n}\n"
      }
    ]
  },
  {
    name: "ShipVirtualScroll",
    selector: "sh-virtual-scroll",
    path: "projects/ship-ui/src/lib/ship-virtual-scroll/ship-virtual-scroll.component.ts",
    description: "",
    keywords: [],
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "onScroll",
        parameters: "",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipProgressBar",
    selector: "sh-progress-bar",
    path: "projects/ship-ui/src/lib/ship-progress-bar/ship-progress-bar.ts",
    description: "### Variants\n\nProgress bar variants can be set using the\n`variant`\nattribute. Available variants:\n**base**\n,\n**flat**\n,\n**outlined**\n, and\n**raised**\n.\n\n### Colors\n\nProgress bar colors can be set using the\n`color`\nattribute. Available colors:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**error**\n, and\n**success**\n.\n\n### Disabled\n\nThe progress bar can be disabled using the standard\n`disabled`\nattribute or\n`[disabled]`\nbinding.",
    keywords: [
      "progress",
      "bar",
      "loading",
      "indicator",
      "linear",
      "status"
    ],
    inputs: [
      {
        name: "value",
        type: "number | undefined",
        description: "",
        defaultValue: "undefined"
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "",
        defaultValue: "null"
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
        html: '<sh-progress-bar variant="flat" [value]="10" />\n<sh-progress-bar variant="flat" color="primary" [value]="25" />\n<sh-progress-bar variant="flat" color="accent" [value]="50" />\n<sh-progress-bar variant="flat" color="warn" [value]="75" />\n<sh-progress-bar variant="flat" color="error" [value]="90" />\n<sh-progress-bar variant="flat" color="success" [value]="100" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipProgressBar } from 'ship-ui';\n\n@Component({\n  selector: 'app-flat-progress-bar',\n  standalone: true,\n  imports: [ShipProgressBar],\n  templateUrl: './flat-progress-bar.html',\n  styleUrl: './flat-progress-bar.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FlatProgressBar {}\n"
      },
      {
        name: "indeterminte-progress-bar",
        html: '<sh-progress-bar class="indeterminate" />\n<sh-progress-bar class="indeterminate" color="primary" />\n<sh-progress-bar class="indeterminate" color="accent" />\n<sh-progress-bar class="indeterminate" color="warn" />\n<sh-progress-bar class="indeterminate" color="error" />\n<sh-progress-bar class="indeterminate" color="success" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipProgressBar } from 'ship-ui';\n\n@Component({\n  selector: 'app-indeterminte-progress-bar',\n  imports: [ShipProgressBar],\n  templateUrl: './indeterminte-progress-bar.html',\n  styleUrl: './indeterminte-progress-bar.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class IndeterminteProgressBar {}\n"
      },
      {
        name: "outlined-progress-bar",
        html: '<sh-progress-bar variant="outlined" [value]="10" />\n<sh-progress-bar variant="outlined" color="primary" [value]="25" />\n<sh-progress-bar variant="outlined" color="accent" [value]="50" />\n<sh-progress-bar variant="outlined" color="warn" [value]="75" />\n<sh-progress-bar variant="outlined" color="error" [value]="90" />\n<sh-progress-bar variant="outlined" color="success" [value]="100" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipProgressBar } from 'ship-ui';\n\n@Component({\n  selector: 'app-outlined-progress-bar',\n  standalone: true,\n  imports: [ShipProgressBar],\n  templateUrl: './outlined-progress-bar.html',\n  styleUrl: './outlined-progress-bar.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OutlinedProgressBar {}\n"
      },
      {
        name: "base-progress-bar",
        html: '<sh-progress-bar [value]="10" />\n<sh-progress-bar color="primary" [value]="25" />\n<sh-progress-bar color="accent" [value]="50" />\n<sh-progress-bar color="warn" [value]="75" />\n<sh-progress-bar color="error" [value]="90" />\n<sh-progress-bar color="success" [value]="100" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipProgressBar } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-progress-bar',\n  standalone: true,\n  imports: [ShipProgressBar],\n  templateUrl: './base-progress-bar.html',\n  styleUrl: './base-progress-bar.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseProgressBar {}\n"
      },
      {
        name: "raised-progress-bar",
        html: '<sh-progress-bar variant="raised" [value]="10" />\n<sh-progress-bar variant="raised" color="primary" [value]="25" />\n<sh-progress-bar variant="raised" color="accent" [value]="50" />\n<sh-progress-bar variant="raised" color="warn" [value]="75" />\n<sh-progress-bar variant="raised" color="error" [value]="90" />\n<sh-progress-bar variant="raised" color="success" [value]="100" />\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipProgressBar } from 'ship-ui';\n\n@Component({\n  selector: 'app-raised-progress-bar',\n  standalone: true,\n  imports: [ShipProgressBar],\n  templateUrl: './raised-progress-bar.html',\n  styleUrl: './raised-progress-bar.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RaisedProgressBar {}\n"
      }
    ]
  },
  {
    name: "ShipSortable",
    selector: "[shSortable]",
    path: "projects/ship-ui/src/lib/ship-sortable/ship-sortable.ts",
    description: '### Enable Sorting\n\nApply the\n`shSortable`\ndirective to a\n`sh-list`\nor any container element to enable drag-and-drop reordering.\n\n### Event Handling\n\nListen to the\n`sortDrop`\nevent to update your data source when an item is moved. For complex implementations, skip events and use the\n`SortableManager`\n(see below).\n\n### Sortable Manager (Recommended)\n\nVastly simplify drag-and-drop state by passing a unified manager to the\n`shSortable`\ninput. Pass a dictionary of signals to\n`createSortableManager()`\n, and bind it using\n`[shSortable]="manager" sortableGroup="listId"`\n. For single lists, simply use\n`[shSortable]="manager"`\n. You can even provide an\n`onBeforeDrop`\nhook to await an API request (Promise or RxJS Observable) before accepting the drop automatically!\n\n### Handles\n\nAdd the\n`sort-handle`\nattribute to a specific element within a sortable item to limit dragging to that specific area.',
    keywords: [
      "sortable",
      "drag and drop",
      "list",
      "ordering",
      "dnd",
      "draggable",
      "cross list"
    ],
    inputs: [
      {
        name: "shSortable",
        type: "any",
        description: ""
      },
      {
        name: "sortableGroup",
        type: "string",
        description: ""
      }
    ],
    outputs: [
      {
        name: "sortDrop",
        type: "ShipDropEvent",
        description: ""
      },
      {
        name: "afterDrop",
        type: "AfterDropResponse",
        description: ""
      },
      {
        name: "crossDrop",
        type: "CrossDropResponse",
        description: ""
      }
    ],
    methods: [
      {
        name: "getIndexOfElement",
        parameters: "element: HTMLElement",
        returnType: "any",
        description: ""
      },
      {
        name: "dragStart",
        parameters: "e: DragEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "dragEnter",
        parameters: "e: DragEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "dragLeave",
        parameters: "e: DragEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "dragOver",
        parameters: "e: DragEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "getVisualIndexOfElement",
        parameters: "i: number",
        returnType: "number",
        description: ""
      },
      {
        name: "drop",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "dragEnd",
        parameters: "",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: [
      {
        name: "handle-sortable",
        html: '<sh-list [shSortable]="manager">\n  @for (item of items(); track item) {\n    <div class="list-item" draggable="true">\n      <div class="drag-handle" sort-handle>\n        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n          <circle cx="9" cy="12" r="1"></circle>\n          <circle cx="9" cy="5" r="1"></circle>\n          <circle cx="9" cy="19" r="1"></circle>\n          <circle cx="15" cy="12" r="1"></circle>\n          <circle cx="15" cy="5" r="1"></circle>\n          <circle cx="15" cy="19" r="1"></circle>\n        </svg>\n      </div>\n      <div class="content">{{ item }}</div>\n    </div>\n  }\n</sh-list>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { createSortableManager, ShipList, ShipSortable } from 'ship-ui';\n\n@Component({\n  selector: 'app-handle-sortable',\n  standalone: true,\n  imports: [ShipList, ShipSortable],\n  templateUrl: './handle-sortable.html',\n  styleUrl: './handle-sortable.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class HandleSortable {\n  items = signal(['Task 1: Design Review', 'Task 2: Build Sortables', 'Task 3: Drag Handles', 'Task 4: Publish SDK', 'Task 5: Profit']);\n  manager = createSortableManager(this.items);\n}\n"
      },
      {
        name: "grid-sortable",
        html: '<div class="grid-container" [shSortable]="manager">\n  @for (item of items(); track item) {\n    <div class="grid-item" draggable="true">\n      {{ item }}\n    </div>\n  }\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { createSortableManager, ShipSortable } from 'ship-ui';\n\n@Component({\n  selector: 'app-grid-sortable-example',\n  standalone: true,\n  imports: [ShipSortable],\n  templateUrl: './grid-sortable-example.html',\n  styleUrl: './grid-sortable-example.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class GridSortableExample {\n  items = signal(Array.from({ length: 12 }, (_, i) => `Item ${i + 1}`));\n\n\n  manager = createSortableManager(this.items);\n}\n"
      },
      {
        name: "base-sortable",
        html: '<sh-list [shSortable]="manager">\n  @for (todo of todos(); track $index) {\n    <div item [draggable]="true" [class.active]="todo.done" (click)="toggleTodo($index)">\n      <sh-checkbox [checked]="todo.done" class="primary raised" />\n\n      @if (todo.done) {\n        <s>{{ todo.title }}</s>\n      } @else {\n        {{ todo.title }}\n      }\n    </div>\n  }\n</sh-list>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { createSortableManager, ShipCheckbox, ShipList, ShipSortable } from 'ship-ui';\n\nconst TODOS = [\n  {\n    title: 'Simple sorting of list',\n    done: true,\n  },\n  {\n    title: 'Sorting animation',\n    done: true,\n  },\n  {\n    title: 'Support sortable handle',\n    done: true,\n  },\n  {\n    title: 'Support gap in sorting list ',\n    done: true,\n  },\n  {\n    title: 'Support placeholder',\n    done: true,\n  },\n  {\n    title: 'Support animation only when dragging',\n    done: true,\n  },\n  {\n    title: 'Support multiple lists',\n    done: false,\n  },\n  {\n    title: 'Support draggable grids',\n    done: false,\n  },\n];\n\ntype Todo = (typeof TODOS)[0];\n\n@Component({\n  selector: 'app-base-sortable',\n  standalone: true,\n  imports: [ShipList, ShipSortable, ShipCheckbox],\n  templateUrl: './base-sortable.html',\n  styleUrl: './base-sortable.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseSortable {\n  todos = signal(TODOS);\n  manager = createSortableManager(this.todos);\n\n  toggleTodo(index: number) {\n    this.todos.update((todos) => {\n      todos[index].done = !todos[index].done;\n\n      return todos;\n    });\n  }\n}\n"
      },
      {
        name: "cross-list-sortable",
        html: '<div class="board">\n  <sh-card class="column">\n    <h3>To Do</h3>\n    <div [shSortable]="manager" sortableGroup="todo" class="sortable-list">\n      @for (item of todoList(); track item; let i = $index) {\n        <div class="item" draggable="true">\n          {{ item }}\n        </div>\n      }\n    </div>\n  </sh-card>\n\n  <sh-card class="column">\n    <h3>In Progress</h3>\n    <div [shSortable]="manager" sortableGroup="inProgress" class="sortable-list">\n      @for (item of inProgressList(); track item; let i = $index) {\n        <div class="item" draggable="true">\n          {{ item }}\n        </div>\n      }\n    </div>\n  </sh-card>\n\n  <sh-card class="column">\n    <h3>Done</h3>\n    <div [shSortable]="manager" sortableGroup="done" class="sortable-list">\n      @for (item of doneList(); track item; let i = $index) {\n        <div class="item" draggable="true">\n          {{ item }}\n        </div>\n      }\n    </div>\n  </sh-card>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { createSortableManager, ShipCard, ShipSortable } from 'ship-ui';\n\n@Component({\n  selector: 'app-cross-list-sortable',\n  standalone: true,\n  imports: [ShipSortable, ShipCard],\n  templateUrl: './cross-list-sortable.html',\n  styleUrl: './cross-list-sortable.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class CrossListSortable {\n  todoList = signal(['Implement Grids', 'Implement multiple boards', 'Refactor drag drop core']);\n  inProgressList = signal(['Write implementation plan', 'Check examples']);\n  doneList = signal(['Read documentation', 'Setup ship-ui workspace']);\n\n  manager = createSortableManager({\n    todo: this.todoList,\n    inProgress: this.inProgressList,\n    done: this.doneList,\n  });\n}\n"
      },
      {
        name: "mixed-size-sortable",
        html: '<div class="mixed-list" [shSortable]="manager">\n  @for (item of items(); track item.id) {\n    <div class="item" [draggable]="true" [class]="item.size">\n      {{ item.text }}\n    </div>\n  }\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { createSortableManager, ShipSortable } from 'ship-ui';\n\nconst ITEMS = [\n  { id: 1, text: 'Small item', size: 'small' },\n  { id: 2, text: 'This is a much larger item that spans multiple lines to show off the fact that the sortable handles differently sized elements cleanly.', size: 'large' },\n  { id: 3, text: 'Medium item with a bit more content.', size: 'medium' },\n  { id: 4, text: 'Another small item', size: 'small' },\n  { id: 5, text: 'Massive item. Huge block of text here to make it really tall. '.repeat(3), size: 'extra-large' },\n];\n\n@Component({\n  selector: 'app-mixed-size-sortable',\n  standalone: true,\n  imports: [ShipSortable],\n  templateUrl: './mixed-size-sortable.html',\n  styleUrl: './mixed-size-sortable.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class MixedSizeSortable {\n  items = signal(ITEMS);\n  manager = createSortableManager(this.items);\n}\n"
      }
    ]
  },
  {
    name: "ShipFormField",
    selector: "sh-form-field",
    path: "projects/ship-ui/src/lib/ship-form-field/ship-form-field.ts",
    description: "### label\n\nOptional label for the form field. Can include icons or other elements.\n\n### prefix/suffix\n\nProject content before or after the input using\n`prefix`\nor\n`suffix`\nslots.\n\n### placeholder\n\nPlaceholder text for the input or textarea.\n\n### boxPref/boxSuffix\n\nProject content before or after the input but inside a box style\n`boxPrefix`\nor\n`boxSuffix`\nslots.\n\n### hint\n\nOptional hint text shown below the input.\n\n### error\n\nOptional error text shown below the input when in error state.\n\n### disabled\n\nDisables the input or textarea.\n\n### size/class\n\nUse\n`small`\n,\n`autosize`\n,\n`center`\nclasses for different layouts.",
    keywords: [],
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipFormFieldVariant | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "readonly",
        type: "boolean",
        description: "",
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [
      {
        name: "onClick",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "afterNextRender",
        parameters: "() => {\n      const el = this.#selfRef.nativeElement;\n      const inputEl = el.querySelector('input') || el.querySelector('textarea');\n      const labelEl = el.querySelector('label');\n      const errorEl = el.querySelector('[error]');\n      const hintEl = el.querySelector('[hint]');\n\n      if (inputEl",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [
      {
        name: "--ff-space",
        defaultValue: "#{p2r(7 10)}"
      },
      {
        name: "--ff-input-space",
        defaultValue: "#{p2r(6 10)}"
      },
      {
        name: "--ff-f",
        defaultValue: "var(--paragraph-40B)"
      },
      {
        name: "--ff-s",
        defaultValue: "var(--shape-2)"
      },
      {
        name: "--ff-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--ff-boxfix-bg",
        defaultValue: "var(--base-2)"
      },
      {
        name: "--ff-suffix-bg",
        defaultValue: "transparent"
      },
      {
        name: "--ff-ic",
        defaultValue: "var(--base-11)"
      },
      {
        name: "--ff-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--ff-spinner-size",
        defaultValue: "#{p2r(20)}"
      },
      {
        name: "--ff-spinner-thickness",
        defaultValue: "#{p2r(2)}"
      },
      {
        name: "--ff-mw",
        defaultValue: "auto"
      },
      {
        name: "--ff-bs",
        defaultValue: "var(--box-shadow-10)"
      },
      {
        name: "--spinner-size",
        defaultValue: "var(--ff-spinner-size)"
      },
      {
        name: "--spinner-thickness",
        defaultValue: "var(--ff-spinner-thickness)"
      }
    ],
    examples: [
      {
        name: "experimental-form-field",
        html: '<section>\n  <sh-form-field-experimental>\n    <label>ReactiveFormsField: {{ reactiveFormValue() }}</label>\n    <input placeholder="Placeholder no label..." type="text" [formControl]="reactiveFormControl" />\n  </sh-form-field-experimental>\n\n  <sh-form-field-experimental>\n    <label>NgModel: {{ ngModelControl() }}</label>\n    <input placeholder="Placeholder no label..." type="text" [(ngModel)]="ngModelControl" />\n  </sh-form-field-experimental>\n</section>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { toSignal } from '@angular/core/rxjs-interop';\nimport { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';\nimport { ShipFormFieldExperimental } from 'ship-ui';\n\n@Component({\n  selector: 'app-experimental-form-field',\n  imports: [ShipFormFieldExperimental, FormsModule, ReactiveFormsModule],\n  templateUrl: './experimental-form-field.html',\n  styleUrl: './experimental-form-field.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport default class ExperimentalFormField {\n  reactiveFormControl = new FormControl('reactive hello');\n  ngModelControl = signal('yellow');\n\n  reactiveFormValue = toSignal(this.reactiveFormControl.valueChanges);\n\n  ngOnInit() {\n    setTimeout(() => {\n      this.reactiveFormControl.setValue('123 reactive');\n      this.ngModelControl.set('678 ngModel');\n    }, 5000);\n  }\n}\n"
      },
      {
        name: "base-form-field",
        html: '<sh-form-field>\n  <input placeholder="Placeholder no label..." type="text" />\n  <div boxPrefix>\n    Hello\n    <sh-icon>circle</sh-icon>\n  </div>\n\n  <div boxSuffix>hello 123</div>\n</sh-form-field>\n\n<sh-form-field>\n  <input placeholder="Placeholder no label..." />\n  <sh-icon prefix>circle</sh-icon>\n\n  <ng-container suffix>hello 123</ng-container>\n</sh-form-field>\n\n<sh-form-field variant="autosize">\n  <input type="time" />\n  <div boxPrefix>\n    <sh-icon>clock</sh-icon>\n  </div>\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input placeholder="Placeholder..." />\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input placeholder="Placeholder..." />\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon>circle</sh-icon>\n</sh-form-field>\n\n<sh-icon>circle</sh-icon>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input [formControl]="disabledCtrl" placeholder="Placeholder..." />\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon>circle</sh-icon>\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n    <sh-icon class="error" shTooltip="hello world">acorn-bold</sh-icon>\n  </label>\n  <input [formControl]="baseCtrl" placeholder="Placeholder..." #input />\n  <span hint>Hint</span>\n\n  <span hint>{{ baseCtrl.value?.length ?? 0 }}/10</span>\n\n  @if ((baseCtrl.value?.length ?? 0) > 10) {\n    <span error>Write a message in this alert area</span>\n  }\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Error without hint\n    <sh-icon>question</sh-icon>\n  </label>\n\n  <input placeholder="Placeholder with error ..." [formControl]="errorCtrl1" />\n\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon suffix>circle</sh-icon>\n\n  @if (errorCtrl1.invalid && errorCtrl1.touched) {\n    <span error>Write a message in this alert area</span>\n  }\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n\n  <input placeholder="Placeholder with error ..." [formControl]="errorCtrl" />\n\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon suffix>circle</sh-icon>\n\n  @if (errorCtrl.invalid && errorCtrl.touched) {\n    <span error>Write a message in this alert area</span>\n  }\n\n  <span hint>{{ errorCtrl.value?.length ?? 0 }}/10</span>\n</sh-form-field>\n\n<sh-form-field variant="autosize" class="center">\n  <label>\n    Number without suffix auto\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <sh-icon prefix>circle</sh-icon>\n  <span textPrefix>Hello</span>\n</sh-form-field>\n\n<sh-form-field variant="autosize" class="center">\n  <label>\n    Number without suffix\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n</sh-form-field>\n\n<sh-form-field variant="auto-width">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <sh-icon prefix>circle</sh-icon>\n  <span textPrefix>Hello</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <span textPrefix>$&nbsp;</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input [formControl]="disabledCtrl" type="number" placeholder="0" />\n  <span textPrefix>$&nbsp;</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field>\n  <label>Textarea</label>\n  <textarea></textarea>\n</sh-form-field>\n\n<sh-form-field>\n  <label>Textarea</label>\n  <textarea>\nwith some value very long text with some value very long text with some value very long text with some value very long text with some value very long text </textarea\n  >\n</sh-form-field>\n\n<sh-form-field>\n  <label>Textarea</label>\n  <textarea [formControl]="disabledCtrl"></textarea>\n</sh-form-field>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';\nimport { ShipFormField, ShipIcon, ShipTooltip } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-form-field',\n  imports: [ShipFormField, ShipIcon, ShipTooltip, FormsModule, ReactiveFormsModule],\n  templateUrl: './base-form-field.html',\n  styleUrl: './base-form-field.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseFormFieldComponent {\n  baseCtrl = new FormControl('');\n  disabledCtrl = new FormControl({ value: '', disabled: true });\n  errorCtrl = new FormControl('', [Validators.required]);\n  errorCtrl1 = new FormControl('', [Validators.required, Validators.minLength(10)]);\n\n  ngOnInit() {\n    this.errorCtrl.markAsTouched();\n    this.errorCtrl.markAsDirty();\n  }\n}\n"
      },
      {
        name: "form-field-sandbox",
        html: `<div class="controls">
  <div class="row">
    <sh-checkbox color="primary" variant="raised" [(checked)]="showLabel">Label</sh-checkbox>
    <sh-checkbox color="primary" variant="raised" [(checked)]="showPrefix">Prefix</sh-checkbox>
    <sh-checkbox color="primary" variant="raised" [(checked)]="showSuffix">Suffix</sh-checkbox>
    <sh-checkbox color="primary" variant="raised" [(checked)]="showHint">Hint</sh-checkbox>
    <sh-checkbox color="primary" variant="raised" [(checked)]="showError">Error</sh-checkbox>
    <sh-checkbox color="primary" variant="raised" [(checked)]="disabled">Disabled</sh-checkbox>
  </div>

  <div class="row">
    <sh-button-group class="small" [(value)]="inputType">
      <button type="button" value="text">Text</button>
      <button type="button" value="number">Number</button>
      <button type="button" value="textarea">Textarea</button>
    </sh-button-group>

    <sh-button-group class="small" [(value)]="variant">
      <button type="button" value="">Default</button>
      <button type="button" value="small">Small</button>
      <button type="button" value="autosize">Autosize</button>
      <button type="button" value="center">Center</button>
    </sh-button-group>
  </div>
  <div class="row">
    @if (showLabel()) {
      <sh-form-field><input [(ngModel)]="label" placeholder="Label text" /></sh-form-field>
    }
    @if (showPrefix()) {
      <sh-form-field><input [(ngModel)]="prefix" placeholder="Prefix content" /></sh-form-field>
    }
    @if (showSuffix()) {
      <sh-form-field><input [(ngModel)]="suffix" placeholder="Suffix content" /></sh-form-field>
    }
    @if (showHint()) {
      <sh-form-field><input [(ngModel)]="hint" placeholder="Hint text" /></sh-form-field>
    }
    @if (showError()) {
      <sh-form-field><input [(ngModel)]="error" placeholder="Error text" /></sh-form-field>
    }
    <sh-form-field><input [(ngModel)]="placeholder" placeholder="Placeholder" /></sh-form-field>
  </div>
</div>

<div class="sandbox">
  <sh-form-field [variant]="variant()">
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
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButtonGroup, ShipCheckbox, ShipFormField, ShipFormFieldVariant } from 'ship-ui';\n\n@Component({\n  selector: 'app-form-field-sandbox',\n  standalone: true,\n  imports: [FormsModule, ShipFormField, ShipButtonGroup, ShipCheckbox],\n  templateUrl: './form-field-sandbox.html',\n  styleUrl: './form-field-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FormFieldSandbox {\n  label = signal<string>('Label');\n  showLabel = signal<boolean>(true);\n  prefix = signal<string>('');\n  showPrefix = signal<boolean>(false);\n  suffix = signal<string>('');\n  showSuffix = signal<boolean>(false);\n  placeholder = signal<string>('Placeholder...');\n  hint = signal<string>('');\n  showHint = signal<boolean>(false);\n  error = signal<string>('');\n  showError = signal<boolean>(false);\n  disabled = signal<boolean>(false);\n  inputType = signal<'text' | 'number' | 'textarea'>('text');\n  variant = signal<ShipFormFieldVariant>(''); // '', 'small', 'autosize', etc.\n  value = signal<string>('');\n}\n"
      },
      {
        name: "small-form-field",
        html: '<sh-form-field class="small">\n  <input placeholder="Placeholder no label..." />\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input placeholder="Placeholder..." />\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input placeholder="Placeholder..." />\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon>circle</sh-icon>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input [formControl]="disabledCtrl" placeholder="Placeholder..." />\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon>circle</sh-icon>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input [formControl]="baseCtrl" placeholder="Placeholder..." #input />\n  <span hint>Hint</span>\n\n  <span hint>{{ baseCtrl.value?.length ?? 0 }}/10</span>\n\n  @if ((baseCtrl.value?.length ?? 0) > 10) {\n    <span error>Write a message in this alert area</span>\n  }\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n\n  <input placeholder="Placeholder with error ..." [formControl]="errorCtrl" />\n\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon suffix>circle</sh-icon>\n\n  @if (errorCtrl.invalid && errorCtrl.touched) {\n    <span error>Write a message in this alert area</span>\n  }\n\n  <span hint>{{ errorCtrl.value?.length ?? 0 }}/10</span>\n</sh-form-field>\n\n<sh-form-field class="small center autosize">\n  <label>\n    Number without suffix\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <sh-icon prefix>circle</sh-icon>\n  <span textPrefix>Hello</span>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <sh-icon prefix>circle</sh-icon>\n  <span textPrefix>Hello</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <span textPrefix>$&nbsp;</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input [formControl]="disabledCtrl" type="number" placeholder="0" />\n  <span textPrefix>$&nbsp;</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>Textarea</label>\n  <textarea></textarea>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>Textarea</label>\n  <textarea>\nwith some value very long text with some value very long text with some value very long text with some value very long text with some value very long text </textarea\n  >\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>Textarea</label>\n  <textarea [formControl]="disabledCtrl"></textarea>\n</sh-form-field>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';\nimport { ShipFormField, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-small-form-field',\n  imports: [ShipFormField, ShipIcon, FormsModule, ReactiveFormsModule],\n  templateUrl: './small-form-field.html',\n  styleUrl: './small-form-field.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SmallFormField {\n  baseCtrl = new FormControl('');\n  disabledCtrl = new FormControl({ value: '', disabled: true });\n  errorCtrl = new FormControl('', [Validators.required]);\n  errorCtrl1 = new FormControl('', [Validators.required, Validators.minLength(10)]);\n\n  ngOnInit() {\n    this.errorCtrl.markAsTouched();\n    this.errorCtrl.markAsDirty();\n  }\n}\n"
      }
    ]
  },
  {
    name: "ShipFormFieldPopover",
    selector: "sh-form-field-popover",
    path: "projects/ship-ui/src/lib/ship-form-field/ship-form-field-popover.ts",
    description: "### label\n\nOptional label for the form field. Can include icons or other elements.\n\n### prefix/suffix\n\nProject content before or after the input using\n`prefix`\nor\n`suffix`\nslots.\n\n### placeholder\n\nPlaceholder text for the input or textarea.\n\n### boxPref/boxSuffix\n\nProject content before or after the input but inside a box style\n`boxPrefix`\nor\n`boxSuffix`\nslots.\n\n### hint\n\nOptional hint text shown below the input.\n\n### error\n\nOptional error text shown below the input when in error state.\n\n### disabled\n\nDisables the input or textarea.\n\n### size/class\n\nUse\n`small`\n,\n`autosize`\n,\n`center`\nclasses for different layouts.",
    keywords: [],
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipFormFieldVariant | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "readonly",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "",
        defaultValue: "false"
      }
    ],
    outputs: [
      {
        name: "closed",
        type: "void",
        description: ""
      }
    ],
    methods: [
      {
        name: "onClick",
        parameters: "event: MouseEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "close",
        parameters: "",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: [
      {
        name: "experimental-form-field",
        html: '<section>\n  <sh-form-field-experimental>\n    <label>ReactiveFormsField: {{ reactiveFormValue() }}</label>\n    <input placeholder="Placeholder no label..." type="text" [formControl]="reactiveFormControl" />\n  </sh-form-field-experimental>\n\n  <sh-form-field-experimental>\n    <label>NgModel: {{ ngModelControl() }}</label>\n    <input placeholder="Placeholder no label..." type="text" [(ngModel)]="ngModelControl" />\n  </sh-form-field-experimental>\n</section>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { toSignal } from '@angular/core/rxjs-interop';\nimport { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';\nimport { ShipFormFieldExperimental } from 'ship-ui';\n\n@Component({\n  selector: 'app-experimental-form-field',\n  imports: [ShipFormFieldExperimental, FormsModule, ReactiveFormsModule],\n  templateUrl: './experimental-form-field.html',\n  styleUrl: './experimental-form-field.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport default class ExperimentalFormField {\n  reactiveFormControl = new FormControl('reactive hello');\n  ngModelControl = signal('yellow');\n\n  reactiveFormValue = toSignal(this.reactiveFormControl.valueChanges);\n\n  ngOnInit() {\n    setTimeout(() => {\n      this.reactiveFormControl.setValue('123 reactive');\n      this.ngModelControl.set('678 ngModel');\n    }, 5000);\n  }\n}\n"
      },
      {
        name: "base-form-field",
        html: '<sh-form-field>\n  <input placeholder="Placeholder no label..." type="text" />\n  <div boxPrefix>\n    Hello\n    <sh-icon>circle</sh-icon>\n  </div>\n\n  <div boxSuffix>hello 123</div>\n</sh-form-field>\n\n<sh-form-field>\n  <input placeholder="Placeholder no label..." />\n  <sh-icon prefix>circle</sh-icon>\n\n  <ng-container suffix>hello 123</ng-container>\n</sh-form-field>\n\n<sh-form-field variant="autosize">\n  <input type="time" />\n  <div boxPrefix>\n    <sh-icon>clock</sh-icon>\n  </div>\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input placeholder="Placeholder..." />\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input placeholder="Placeholder..." />\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon>circle</sh-icon>\n</sh-form-field>\n\n<sh-icon>circle</sh-icon>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input [formControl]="disabledCtrl" placeholder="Placeholder..." />\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon>circle</sh-icon>\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n    <sh-icon class="error" shTooltip="hello world">acorn-bold</sh-icon>\n  </label>\n  <input [formControl]="baseCtrl" placeholder="Placeholder..." #input />\n  <span hint>Hint</span>\n\n  <span hint>{{ baseCtrl.value?.length ?? 0 }}/10</span>\n\n  @if ((baseCtrl.value?.length ?? 0) > 10) {\n    <span error>Write a message in this alert area</span>\n  }\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Error without hint\n    <sh-icon>question</sh-icon>\n  </label>\n\n  <input placeholder="Placeholder with error ..." [formControl]="errorCtrl1" />\n\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon suffix>circle</sh-icon>\n\n  @if (errorCtrl1.invalid && errorCtrl1.touched) {\n    <span error>Write a message in this alert area</span>\n  }\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n\n  <input placeholder="Placeholder with error ..." [formControl]="errorCtrl" />\n\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon suffix>circle</sh-icon>\n\n  @if (errorCtrl.invalid && errorCtrl.touched) {\n    <span error>Write a message in this alert area</span>\n  }\n\n  <span hint>{{ errorCtrl.value?.length ?? 0 }}/10</span>\n</sh-form-field>\n\n<sh-form-field variant="autosize" class="center">\n  <label>\n    Number without suffix auto\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <sh-icon prefix>circle</sh-icon>\n  <span textPrefix>Hello</span>\n</sh-form-field>\n\n<sh-form-field variant="autosize" class="center">\n  <label>\n    Number without suffix\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n</sh-form-field>\n\n<sh-form-field variant="auto-width">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <sh-icon prefix>circle</sh-icon>\n  <span textPrefix>Hello</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <span textPrefix>$&nbsp;</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field>\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input [formControl]="disabledCtrl" type="number" placeholder="0" />\n  <span textPrefix>$&nbsp;</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field>\n  <label>Textarea</label>\n  <textarea></textarea>\n</sh-form-field>\n\n<sh-form-field>\n  <label>Textarea</label>\n  <textarea>\nwith some value very long text with some value very long text with some value very long text with some value very long text with some value very long text </textarea\n  >\n</sh-form-field>\n\n<sh-form-field>\n  <label>Textarea</label>\n  <textarea [formControl]="disabledCtrl"></textarea>\n</sh-form-field>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';\nimport { ShipFormField, ShipIcon, ShipTooltip } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-form-field',\n  imports: [ShipFormField, ShipIcon, ShipTooltip, FormsModule, ReactiveFormsModule],\n  templateUrl: './base-form-field.html',\n  styleUrl: './base-form-field.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseFormFieldComponent {\n  baseCtrl = new FormControl('');\n  disabledCtrl = new FormControl({ value: '', disabled: true });\n  errorCtrl = new FormControl('', [Validators.required]);\n  errorCtrl1 = new FormControl('', [Validators.required, Validators.minLength(10)]);\n\n  ngOnInit() {\n    this.errorCtrl.markAsTouched();\n    this.errorCtrl.markAsDirty();\n  }\n}\n"
      },
      {
        name: "form-field-sandbox",
        html: `<div class="controls">
  <div class="row">
    <sh-checkbox color="primary" variant="raised" [(checked)]="showLabel">Label</sh-checkbox>
    <sh-checkbox color="primary" variant="raised" [(checked)]="showPrefix">Prefix</sh-checkbox>
    <sh-checkbox color="primary" variant="raised" [(checked)]="showSuffix">Suffix</sh-checkbox>
    <sh-checkbox color="primary" variant="raised" [(checked)]="showHint">Hint</sh-checkbox>
    <sh-checkbox color="primary" variant="raised" [(checked)]="showError">Error</sh-checkbox>
    <sh-checkbox color="primary" variant="raised" [(checked)]="disabled">Disabled</sh-checkbox>
  </div>

  <div class="row">
    <sh-button-group class="small" [(value)]="inputType">
      <button type="button" value="text">Text</button>
      <button type="button" value="number">Number</button>
      <button type="button" value="textarea">Textarea</button>
    </sh-button-group>

    <sh-button-group class="small" [(value)]="variant">
      <button type="button" value="">Default</button>
      <button type="button" value="small">Small</button>
      <button type="button" value="autosize">Autosize</button>
      <button type="button" value="center">Center</button>
    </sh-button-group>
  </div>
  <div class="row">
    @if (showLabel()) {
      <sh-form-field><input [(ngModel)]="label" placeholder="Label text" /></sh-form-field>
    }
    @if (showPrefix()) {
      <sh-form-field><input [(ngModel)]="prefix" placeholder="Prefix content" /></sh-form-field>
    }
    @if (showSuffix()) {
      <sh-form-field><input [(ngModel)]="suffix" placeholder="Suffix content" /></sh-form-field>
    }
    @if (showHint()) {
      <sh-form-field><input [(ngModel)]="hint" placeholder="Hint text" /></sh-form-field>
    }
    @if (showError()) {
      <sh-form-field><input [(ngModel)]="error" placeholder="Error text" /></sh-form-field>
    }
    <sh-form-field><input [(ngModel)]="placeholder" placeholder="Placeholder" /></sh-form-field>
  </div>
</div>

<div class="sandbox">
  <sh-form-field [variant]="variant()">
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
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButtonGroup, ShipCheckbox, ShipFormField, ShipFormFieldVariant } from 'ship-ui';\n\n@Component({\n  selector: 'app-form-field-sandbox',\n  standalone: true,\n  imports: [FormsModule, ShipFormField, ShipButtonGroup, ShipCheckbox],\n  templateUrl: './form-field-sandbox.html',\n  styleUrl: './form-field-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FormFieldSandbox {\n  label = signal<string>('Label');\n  showLabel = signal<boolean>(true);\n  prefix = signal<string>('');\n  showPrefix = signal<boolean>(false);\n  suffix = signal<string>('');\n  showSuffix = signal<boolean>(false);\n  placeholder = signal<string>('Placeholder...');\n  hint = signal<string>('');\n  showHint = signal<boolean>(false);\n  error = signal<string>('');\n  showError = signal<boolean>(false);\n  disabled = signal<boolean>(false);\n  inputType = signal<'text' | 'number' | 'textarea'>('text');\n  variant = signal<ShipFormFieldVariant>(''); // '', 'small', 'autosize', etc.\n  value = signal<string>('');\n}\n"
      },
      {
        name: "small-form-field",
        html: '<sh-form-field class="small">\n  <input placeholder="Placeholder no label..." />\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input placeholder="Placeholder..." />\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input placeholder="Placeholder..." />\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon>circle</sh-icon>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input [formControl]="disabledCtrl" placeholder="Placeholder..." />\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon>circle</sh-icon>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input [formControl]="baseCtrl" placeholder="Placeholder..." #input />\n  <span hint>Hint</span>\n\n  <span hint>{{ baseCtrl.value?.length ?? 0 }}/10</span>\n\n  @if ((baseCtrl.value?.length ?? 0) > 10) {\n    <span error>Write a message in this alert area</span>\n  }\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n\n  <input placeholder="Placeholder with error ..." [formControl]="errorCtrl" />\n\n  <sh-icon prefix>circle</sh-icon>\n  <sh-icon suffix>circle</sh-icon>\n\n  @if (errorCtrl.invalid && errorCtrl.touched) {\n    <span error>Write a message in this alert area</span>\n  }\n\n  <span hint>{{ errorCtrl.value?.length ?? 0 }}/10</span>\n</sh-form-field>\n\n<sh-form-field class="small center autosize">\n  <label>\n    Number without suffix\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <sh-icon prefix>circle</sh-icon>\n  <span textPrefix>Hello</span>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <sh-icon prefix>circle</sh-icon>\n  <span textPrefix>Hello</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input type="number" placeholder="0" />\n  <span textPrefix>$&nbsp;</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>\n    Label\n    <sh-icon>question</sh-icon>\n  </label>\n  <input [formControl]="disabledCtrl" type="number" placeholder="0" />\n  <span textPrefix>$&nbsp;</span>\n  <span textSuffix>.00</span>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>Textarea</label>\n  <textarea></textarea>\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>Textarea</label>\n  <textarea>\nwith some value very long text with some value very long text with some value very long text with some value very long text with some value very long text </textarea\n  >\n</sh-form-field>\n\n<sh-form-field class="small">\n  <label>Textarea</label>\n  <textarea [formControl]="disabledCtrl"></textarea>\n</sh-form-field>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';\nimport { ShipFormField, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-small-form-field',\n  imports: [ShipFormField, ShipIcon, FormsModule, ReactiveFormsModule],\n  templateUrl: './small-form-field.html',\n  styleUrl: './small-form-field.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SmallFormField {\n  baseCtrl = new FormControl('');\n  disabledCtrl = new FormControl({ value: '', disabled: true });\n  errorCtrl = new FormControl('', [Validators.required]);\n  errorCtrl1 = new FormControl('', [Validators.required, Validators.minLength(10)]);\n\n  ngOnInit() {\n    this.errorCtrl.markAsTouched();\n    this.errorCtrl.markAsDirty();\n  }\n}\n"
      }
    ]
  },
  {
    name: "ShipAccordion",
    selector: "sh-accordion",
    path: "projects/ship-ui/src/lib/ship-accordion/ship-accordion.ts",
    description: "### Usage\n\nShipAccordion seamlessly wraps the native\n`&lt;details&gt;`\nHTML element. Use\n`allowMultiple`\nto control open exclusivity natively, or allow multi-expand.",
    keywords: [
      "accordion",
      "expand",
      "collapse",
      "panel",
      "toggle",
      "detail"
    ],
    inputs: [
      {
        name: "name",
        type: "string",
        description: "",
        defaultValue: "`sh-accordion-${Math.random("
      },
      {
        name: "allowMultiple",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "variant",
        type: "ShipVariant | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "size",
        type: "string | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "value",
        type: "string | null",
        description: "",
        defaultValue: "null"
      }
    ],
    outputs: [],
    methods: [
      {
        name: "effect",
        parameters: "() => {\n      const isMultiple = this.allowMultiple();\n      const groupName = this.name();\n      const valStr = this.value();\n      const vals = valStr ? valStr.split(',').filter((v) => v !== ''",
        returnType: "[];\n\n      this.items().forEach((details) =>",
        description: ""
      }
    ],
    cssVariables: [
      {
        name: "--acc-pad",
        defaultValue: "#{p2r(16)}"
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
        html: '<div class="controls">\n  <p>Controls</p>\n  <header>\n    <div class="row">\n      <sh-toggle [(checked)]="allowMultiple" class="primary raised">Allow Multiple Open</sh-toggle>\n      <sh-select color="primary" [selectMultiple]="allowMultiple()" [options]="availablePanels">\n        <label>Open Panels</label>\n        <input type="text" [(ngModel)]="selectedPanelsArray" style="display: none" />\n      </sh-select>\n\n      <sh-select color="primary" [options]="availableVariants" label="label" value="value" [isClearable]="false">\n        <label>Variant</label>\n        <input type="text" [(ngModel)]="variantType" style="display: none" />\n      </sh-select>\n    </div>\n  </header>\n</div>\n\n<div class="sandbox">\n  <sh-accordion [(value)]="openPanels" [allowMultiple]="allowMultiple()" [variant]="variantType()">\n    <details value="panel1">\n      <summary>Personal Information</summary>\n      <p>\n        This is standard content projected inside native HTML tags! The entire accordion is configured seamlessly with\n        DOM structure.\n      </p>\n    </details>\n\n    <details value="panel2">\n      <summary>Advanced Settings</summary>\n      <sh-form-field>\n        <label>Settings A</label>\n        <input type="text" value="Configuration" />\n      </sh-form-field>\n    </details>\n\n    <details value="panel3">\n      <summary>Danger Zone</summary>\n      <button shButton color="error" variant="flat" size="small">Delete Account</button>\n    </details>\n  </sh-accordion>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipAccordion, ShipButton, ShipFormField, ShipSelect, ShipToggle, ShipVariant } from 'ship-ui';\n\n@Component({\n  selector: 'app-sandbox-accordion',\n  imports: [FormsModule, ShipAccordion, ShipToggle, ShipSelect, ShipFormField, ShipButton],\n  templateUrl: './sandbox-accordion.html',\n  styleUrl: './sandbox-accordion.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SandboxAccordion {\n  openPanels = signal<string>('panel1');\n  allowMultiple = signal<boolean>(false);\n  variantType = signal<ShipVariant | null>(null);\n\n  availableVariants = [\n    { value: '', label: 'Default' },\n    { value: 'type-b', label: 'Type B' },\n  ];\n\n  availablePanels = ['panel1', 'panel2', 'panel3'];\n  selectedPanelsArray = signal<string[]>(['panel1']);\n\n  constructor() {\n    effect(() => {\n      const arrStr = this.selectedPanelsArray().join(',');\n      if (this.openPanels() !== arrStr) {\n        this.openPanels.set(arrStr);\n      }\n    });\n\n    effect(() => {\n      const valStr = this.openPanels();\n      const currentArr = valStr ? valStr.split(',').filter((x) => x) : [];\n      if (currentArr.join(',') !== this.selectedPanelsArray().join(',')) {\n        this.selectedPanelsArray.set(currentArr);\n      }\n    });\n  }\n}\n"
      },
      {
        name: "base-accordion",
        html: "<sh-accordion>\n  <details>\n    <summary>Personal Information</summary>\n    <p>This is standard content projected inside native HTML tags!</p>\n  </details>\n  <details>\n    <summary>Advanced Settings</summary>\n    <p>More detailed settings go here.</p>\n  </details>\n  <details>\n    <summary>Danger Zone</summary>\n    <p>Critical actions are located here.</p>\n  </details>\n</sh-accordion>\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipAccordion } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-accordion',\n  imports: [ShipAccordion],\n  templateUrl: './base-accordion.html',\n  styleUrl: './base-accordion.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseAccordion {}\n"
      },
      {
        name: "type-b-accordion",
        html: '<sh-accordion variant="type-b">\n  <details>\n    <summary>Personal Information</summary>\n    <p>Notice the sharp corners and full-width layout built for seamless UI integration.</p>\n  </details>\n  <details>\n    <summary>Advanced Settings</summary>\n    <p>Configure everything completely flat.</p>\n  </details>\n  <details>\n    <summary>Danger Zone</summary>\n    <p>Critical actions here.</p>\n  </details>\n</sh-accordion>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipAccordion } from 'ship-ui';\n\n@Component({\n  selector: 'app-type-b-accordion',\n  imports: [ShipAccordion],\n  templateUrl: './type-b-accordion.html',\n  styleUrl: './type-b-accordion.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TypeBAccordion {}\n"
      }
    ]
  },
  {
    name: "ShipRangeSlider",
    selector: "sh-range-slider",
    path: "projects/ship-ui/src/lib/ship-range-slider/ship-range-slider.ts",
    description: '### Binding\n\nTwo-way bindable value. Use\n`[(ngModel)]`\nor\n`[formControl]`\n.\n\n### Constraints\n\nSet the range limits and increments using the\n`min`\n,\n`max`\n, and\n`step`\nattributes.\n\n### Visuals\n\nCustomize the look and feel:\n\n<li>\n`color`\n:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**success**\n, or\n**error**\n.\n</li>\n<li>\n`variant`\n:\n**base**\n,\n**thick**\n,\n**outlined**\n,\n**flat**\n, or\n**raised**\n.\n</li>\n<li>\n`sharp`\n: Use sharp corners instead of rounded.\n</li>\n<li>\n`always-show`\n: Keep the value indicator visible at all times.\n</li>\n\n### Unit\n\nSpecify a suffix for the value display using the\n`unit`\nattribute (e.g.,\n`unit="%"`\n).\n\n### Disabled\n\nThe slider can be disabled using the standard\n`disabled`\nattribute or\n`[disabled]`\nbinding.',
    keywords: [
      "range",
      "slider",
      "track",
      "thumb",
      "value",
      "drag",
      "input"
    ],
    inputs: [
      {
        name: "unit",
        type: "string",
        description: "",
        defaultValue: "''"
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipRangeSliderVariant | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "sharp",
        type: "boolean | undefined",
        description: "",
        defaultValue: "undefined"
      },
      {
        name: "alwaysShow",
        type: "boolean | undefined",
        description: "",
        defaultValue: "undefined"
      },
      {
        name: "value",
        type: "number",
        description: "",
        defaultValue: "this.#initialDefaultValue"
      }
    ],
    outputs: [],
    methods: [
      {
        name: "trackEvent",
        parameters: "e: MouseEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "get",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "set",
        parameters: "newVal",
        returnType: "any",
        description: ""
      }
    ],
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
        html: '<sh-range-slider>\n  <label for="range-slider">Select a value:</label>\n  <input id="range-slider" type="range" min="0" max="100" [(ngModel)]="value" />\n</sh-range-slider>\n<p>Selected: {{ value() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-range-slider',\n  standalone: true,\n  imports: [FormsModule, ShipRangeSlider],\n  templateUrl: './base-range-slider.html',\n  styleUrl: './base-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseRangeSlider {\n  value = signal(50);\n}\n"
      },
      {
        name: "disabled-range-slider",
        html: '<sh-range-slider>\n  <label for="disabled-range-slider">Disabled value:</label>\n  <input id="disabled-range-slider" type="range" min="0" max="100" [(ngModel)]="value" disabled />\n</sh-range-slider>\n<p>Selected: {{ value() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from 'ship-ui';\n\n@Component({\n  selector: 'app-disabled-range-slider',\n  standalone: true,\n  imports: [FormsModule, ShipRangeSlider],\n  templateUrl: './disabled-range-slider.html',\n  styleUrl: './disabled-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DisabledRangeSlider {\n  value = signal(10);\n}\n"
      },
      {
        name: "range-slider-sandbox",
        html: `<div class="controls">
  <div class="row">
    <sh-toggle class="primary raised" [(checked)]="disabled">Disabled</sh-toggle>
    <sh-toggle class="primary raised" [(checked)]="readonly">Read-only</sh-toggle>

    @if (variation() !== 'thick') {
      <sh-toggle class="primary raised" [(checked)]="alwaysShow">Always show value indicator</sh-toggle>
    }
    <sh-toggle class="primary raised" [(checked)]="sharp">Sharp</sh-toggle>
  </div>

  <sh-button-group [(value)]="color">
    <button value="primary">Primary</button>
    <button value="accent">Accent</button>
    <button value="warn">Warn</button>
    <button value="error">Error</button>
    <button value="success">Success</button>
  </sh-button-group>

  <sh-button-group [(value)]="variation">
    <button value="base">Default</button>
    <button value="simple">Simple</button>
    <button value="outlined">Outlined</button>
    <button value="flat">Flat</button>
    <button value="raised">Raised</button>
  </sh-button-group>

  <div class="fields">
    <sh-form-field>
      <label>Unit</label>
      <input type="text" [(ngModel)]="unit" />
    </sh-form-field>

    <sh-form-field>
      <label>Min</label>
      <input type="text" [(ngModel)]="min" />
    </sh-form-field>

    <sh-form-field>
      <label>Max</label>
      <input type="text" [(ngModel)]="max" />
    </sh-form-field>

    <sh-form-field>
      <label>Step</label>
      <input type="text" [(ngModel)]="step" />
    </sh-form-field>
  </div>
</div>

<div class="sandbox-example">
  <sh-range-slider
    [unit]="unit()"
    [color]="color()"
    [variant]="variation()"
    [sharp]="sharp()"
    [alwaysShow]="alwaysShow()">
    <input
      type="range"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [(ngModel)]="value"
      [disabled]="disabled()"
      [readonly]="readonly()" />
  </sh-range-slider>
  <p>Selected: {{ value() }}</p>
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButtonGroup, ShipFormField, ShipRangeSlider, ShipRangeSliderVariant, ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-range-slider-sandbox',\n  standalone: true,\n  imports: [FormsModule, ShipRangeSlider, ShipButtonGroup, ShipToggle, ShipFormField],\n  templateUrl: './range-slider-sandbox.html',\n  styleUrl: './range-slider-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RangeSliderSandbox {\n  value = signal(50);\n  min = signal(0);\n  max = signal(100);\n  step = signal(1);\n  disabled = signal(false);\n  readonly = signal(false);\n  alwaysShow = signal(false);\n  sharp = signal(false);\n  unit = signal('%');\n  color = signal<'primary' | 'accent' | 'warn' | 'success' | 'error'>('primary');\n  variation = signal<ShipRangeSliderVariant | null>(null);\n}\n"
      },
      {
        name: "always-show-indicator-range-slider",
        html: '<sh-range-slider class="always-show">\n  <label for="always-show-indicator-range-slider">Always show indicator:</label>\n  <input id="always-show-indicator-range-slider" type="range" min="0" max="100" [(ngModel)]="value" />\n</sh-range-slider>\n<p>Selected: {{ value() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from 'ship-ui';\n\n@Component({\n  selector: 'app-always-show-indicator-range-slider',\n  standalone: true,\n  imports: [FormsModule, ShipRangeSlider],\n  templateUrl: './always-show-indicator-range-slider.html',\n  styleUrl: './always-show-indicator-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class AlwaysShowIndicatorRangeSlider {\n  value = signal(33);\n}\n"
      },
      {
        name: "readonly-range-slider",
        html: '<sh-range-slider>\n  <label for="readonly-range-slider">Readonly value:</label>\n  <input id="readonly-range-slider" type="range" min="0" max="100" [(ngModel)]="value" readonly />\n</sh-range-slider>\n<p>Selected: {{ value() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from 'ship-ui';\n\n@Component({\n  selector: 'app-readonly-range-slider',\n  standalone: true,\n  imports: [FormsModule, ShipRangeSlider],\n  templateUrl: './readonly-range-slider.html',\n  styleUrl: './readonly-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ReadonlyRangeSlider {\n  value = signal(42);\n}\n"
      },
      {
        name: "float-range-slider",
        html: `<sh-range-slider>
  <label for="float-range-slider">Decimal value:</label>
  <input id="float-range-slider" type="range" min="0" max="1" step="0.01" [(ngModel)]="value" />
</sh-range-slider>
<p>Selected: {{ value() | number: '1.2-2' }}</p>
`,
        ts: "import { DecimalPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from 'ship-ui';\n\n@Component({\n  selector: 'app-float-range-slider',\n  standalone: true,\n  imports: [FormsModule, ShipRangeSlider, DecimalPipe],\n  templateUrl: './float-range-slider.html',\n  styleUrl: './float-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FloatRangeSlider {\n  value = signal(0.12);\n}\n"
      },
      {
        name: "reactive-range-slider",
        html: '<sh-range-slider>\n  <label for="range-slider">Select a value (Reactive Form):</label>\n  <input id="range-slider" type="range" min="0" max="100" [formControl]="control" />\n</sh-range-slider>\n<p>Selected: {{ control.value }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, ReactiveFormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from 'ship-ui';\n\n@Component({\n  selector: 'app-reactive-range-slider',\n  standalone: true,\n  imports: [ReactiveFormsModule, ShipRangeSlider],\n  templateUrl: './reactive-range-slider.html',\n  styleUrl: './reactive-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ReactiveRangeSlider {\n  control = new FormControl(25);\n}\n"
      },
      {
        name: "unit-range-slider",
        html: '<sh-range-slider unit="%">\n  <label for="unit-range-slider">Value with unit:</label>\n  <input id="unit-range-slider" type="range" min="0" max="100" [(ngModel)]="value" />\n</sh-range-slider>\n<p>Selected: {{ value() }}%</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipRangeSlider } from 'ship-ui';\n\n@Component({\n  selector: 'app-unit-range-slider',\n  standalone: true,\n  imports: [FormsModule, ShipRangeSlider],\n  templateUrl: './unit-range-slider.html',\n  styleUrl: './unit-range-slider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class UnitRangeSlider {\n  value = signal(75);\n}\n"
      }
    ]
  },
  {
    name: "ShipResize",
    selector: "[shResize]",
    path: "projects/ship-ui/src/lib/ship-table/ship-table.ts",
    description: '### Data & Loading\n\nProvide data via\n`[data]`\nand toggle a loading state using the\n`loading`\nattribute.\n\n### Sorting\n\nEnable sorting by applying\n`shSort`\nto header cells. Track the active column with\n`sortByColumn`\n(two-way bindable).\n\n### Resizing\n\nApply the\n`shResize`\ndirective to header cells to allow column width adjustment. Available inputs:\n`resizable`\n,\n`minWidth`\n, and\n`maxWidth`\n.\n\n### Sticky Columns\n\nUse the\n`shStickyColumns`\nattribute (\n**start**\nor\n**end**\n) or apply\n`.sticky`\n/\n`.sticky-end`\nclasses to header cells to pin columns.\n\n### Column Sizing\n\nUse the\n`size`\nattribute on\n`&lt;th&gt;`\nelements to set initial or fixed widths (e.g.,\n`size="1fr"`\n,\n`size="200px"`\n).',
    keywords: [
      "table",
      "grid",
      "data",
      "rows",
      "columns",
      "sort",
      "pagination"
    ],
    inputs: [
      {
        name: "resizable",
        type: "boolean",
        description: "",
        defaultValue: "true"
      },
      {
        name: "minWidth",
        type: "number",
        description: "",
        defaultValue: "50"
      },
      {
        name: "maxWidth",
        type: "number | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "shSort",
        type: "string",
        description: ""
      },
      {
        name: "shStickyColumns",
        type: "'start' | 'end' | (string & {})",
        description: "",
        defaultValue: "'start'"
      },
      {
        name: "loading",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "data",
        type: "any",
        description: "",
        defaultValue: "[]"
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipTableVariant | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "sortByColumn",
        type: "string | null",
        description: "",
        defaultValue: "null"
      }
    ],
    outputs: [
      {
        name: "dataChange",
        type: "any",
        description: ""
      }
    ],
    methods: [
      {
        name: "onMouseMove",
        parameters: "event: MouseEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "cancelAnimationFrame",
        parameters: "this.#animationFrameRequest);\n    }\n  }\n}\n\n@Directive({\n  selector: '[shSort]',\n  standalone: true,\n  host: {\n    class: 'sortable',\n    '(mousedown)': 'toggleSort()',\n    '[class.sort-asc]': 'sortAsc()',\n    '[class.sort-desc]': 'sortDesc()',\n  },\n})\nexport class ShipSort {\n  #table = inject(ShipTable);\n  shSort = input<string>();\n\n  sortAsc = computed(() => {\n    const currentSort = this.#table.sortByColumn();\n    const thisColumn = this.shSort();\n\n    if (!currentSort || !thisColumn) return false;\n\n    return currentSort === thisColumn;\n  });\n\n  sortDesc = computed(() => {\n    const currentSort = this.#table.sortByColumn();\n    const thisColumn = this.shSort();\n\n    if (!currentSort || !thisColumn) return false;\n\n    return currentSort === `-${thisColumn}`;\n  });\n\n  toggleSort(",
        returnType: "any",
        description: ""
      },
      {
        name: "updateColumnSizes",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "onScroll",
        parameters: "",
        returnType: "void",
        description: ""
      },
      {
        name: "onResize",
        parameters: "event: Event",
        returnType: "any",
        description: ""
      },
      {
        name: "toggleSort",
        parameters: "column: string",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [
      {
        name: "--table-bc",
        defaultValue: "var(--base-4)"
      },
      {
        name: "--table-th-bg",
        defaultValue: "var(--base-1)"
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
        name: "--table-th-p",
        defaultValue: "#{p2r(0 20)}"
      },
      {
        name: "--table-td-p",
        defaultValue: "#{p2r(0 20)}"
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
        name: "--caret-color",
        defaultValue: "var(--base-10)"
      },
      {
        name: "--caret-size",
        defaultValue: "#{p2r(6)}"
      }
    ],
    examples: [
      {
        name: "resizing-table",
        html: '<sh-table [data]="dataSource()" [variant]="variant()">\n  <tr thead>\n    @for (col of displayedColumns(); track col) {\n      <th shResize>{{ col }}</th>\n    }\n  </tr>\n\n  @for (row of dataSource(); track $index) {\n    <tr>\n      @for (col of displayedColumns(); track col) {\n        <td>{{ row[col] }}</td>\n      }\n    </tr>\n  }\n\n  <div table-no-rows>No data available</div>\n</sh-table>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipResize, ShipTable, ShipTableVariant } from 'ship-ui';\n\nconst ELEMENT_DATA = [\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n];\nconst COLUMNS = ['position', 'name', 'weight', 'symbol'] as const;\n\n@Component({\n  selector: 'resizing-table',\n  standalone: true,\n  imports: [ShipTable, ShipResize],\n  templateUrl: './resizing-table.html',\n  styleUrl: './resizing-table.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ResizingTable {\n  variant = input<ShipTableVariant | null>(null);\n  displayedColumns = signal([...COLUMNS]);\n  dataSource = signal([...ELEMENT_DATA]);\n}\n"
      },
      {
        name: "base-table",
        html: '<sh-table [data]="dataSource()" [loading]="isLoading()" [variant]="variant()">\n  <button actionbar>hello</button>\n\n  <tr thead>\n    @for (col of displayedColumns(); track col) {\n      <th>{{ col }}</th>\n    }\n  </tr>\n\n  @for (row of dataSource(); track $index) {\n    <tr>\n      @for (col of displayedColumns(); track col) {\n        <td>{{ row[col] }}</td>\n      }\n    </tr>\n  }\n\n  <div table-no-rows>No data available</div>\n</sh-table>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipTable } from 'ship-ui';\n\nconst ELEMENT_DATA = [\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n];\nconst COLUMNS = ['position', 'name', 'weight', 'symbol'] as const;\n\n@Component({\n  selector: 'base-table',\n  standalone: true,\n  imports: [ShipTable],\n  templateUrl: './base-table.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseTableComponent {\n  variant = input<string | null>(null);\n  displayedColumns = signal([...COLUMNS]);\n  dataSource = signal([...ELEMENT_DATA]);\n  isLoading = signal(true);\n\n  ngOnInit() {\n    setTimeout(() => {\n      this.isLoading.set(false);\n    }, 450);\n  }\n}\n"
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
            <button shButton class="small primary raised">
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
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipButton, ShipIcon, ShipTable, ShipTableVariant } from 'ship-ui';\n\nconst ELEMENT_DATA = [\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n];\nconst COLUMNS = ['position', 'name', 'weight', 'symbol'] as const;\n\n@Component({\n  selector: 'toggle-row-table',\n  standalone: true,\n  imports: [ShipTable, ShipIcon, ShipButton],\n  templateUrl: './toggle-row-table.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ToggleRowTable {\n  variant = input<ShipTableVariant | null>(null);\n  displayedColumns = signal([...COLUMNS]);\n  dataSource = signal([...ELEMENT_DATA]);\n  isLoading = signal(true);\n  openRowIndex = signal<number | null>(null);\n\n  ngOnInit() {\n    setTimeout(() => {\n      this.isLoading.set(false);\n    }, 450);\n  }\n\n  toggleRow(index: number) {\n    this.openRowIndex.set(this.openRowIndex() === index ? null : index);\n  }\n}\n"
      },
      {
        name: "sorting-table",
        html: '<pre>Sort column by: {{ sortByColumn() }}</pre>\n\n<sh-table [data]="dataSource()" [(sortByColumn)]="sortByColumn" [variant]="variant()">\n  <tr>\n    @for (col of displayedColumns(); track col) {\n      <th [shSort]="col">\n        {{ col }}\n\n        @if (sortByColumn() === col) {\n          <sh-icon>caret-up</sh-icon>\n        }\n        @if (sortByColumn() === `-${col}`) {\n          <sh-icon>caret-down</sh-icon>\n        }\n      </th>\n    }\n  </tr>\n\n  @for (row of dataSource(); track $index) {\n    <tr>\n      @for (col of displayedColumns(); track col) {\n        <td>{{ row[col] }}</td>\n      }\n    </tr>\n  }\n\n  <div table-no-rows>No data available</div>\n</sh-table>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipIcon, ShipSort, ShipTable, ShipTableVariant } from 'ship-ui';\n\nconst ELEMENT_DATA = [\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n];\nconst COLUMNS = ['position', 'name', 'weight', 'symbol'] as const;\n\n@Component({\n  selector: 'sorting-table',\n  standalone: true,\n  imports: [ShipTable, ShipSort, ShipIcon],\n  templateUrl: './sorting-table.html',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SortingTable {\n  variant = input<ShipTableVariant | null>(null);\n  displayedColumns = signal([...COLUMNS]);\n  dataSource = signal([...ELEMENT_DATA]);\n  sortByColumn = signal<string | null>(null);\n}\n"
      },
      {
        name: "multi-table-header",
        html: '<sh-table [data]="dataSource()" [variant]="variant()">\n  <tr thead class="sticky">\n    @for (col of displayedColumns(); track col) {\n      <th>{{ col }}</th>\n    }\n  </tr>\n\n  <tr thead class="sticky">\n    @for (col of displayedColumns(); track col) {\n      <th>{{ col }}</th>\n    }\n  </tr>\n\n  @for (row of dataSource(); track $index) {\n    <tr [class.sticky]="$index % 3 === 2">\n      @for (col of displayedColumns(); track col) {\n        <td>{{ row[col] }}</td>\n      }\n    </tr>\n  }\n\n  <div table-no-rows>No data available</div>\n</sh-table>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipTable, ShipTableVariant } from 'ship-ui';\n\nconst ELEMENT_DATA = [\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n];\nconst COLUMNS = ['position', 'name', 'weight', 'symbol'] as const;\n\n@Component({\n  selector: 'multi-table-header',\n  standalone: true,\n  imports: [ShipTable],\n  templateUrl: './multi-table-header.html',\n  styleUrl: './multi-table-header.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class MultiTableHeader {\n  variant = input<ShipTableVariant | null>(null);\n  displayedColumns = signal([...COLUMNS]);\n  dataSource = signal([...ELEMENT_DATA]);\n}\n"
      },
      {
        name: "multi-sticky-table",
        html: '<sh-table [data]="dataSource()" [loading]="isLoading()" [variant]="variant()">\n  <tr class="sticky" thead>\n    <div shStickyColumns>\n      <th>im sticky</th>\n      <th>im sticky</th>\n    </div>\n\n    @for (col of displayedColumns(); track col) {\n      <th>{{ col }}</th>\n    }\n\n    <div shStickyColumns="end">\n      <th>im sticky end</th>\n      <th>im sticky end</th>\n    </div>\n  </tr>\n\n  @for (row of dataSource(); track $index) {\n    <tr [class.sticky]="$index % 3 === 0">\n      <div shStickyColumns>\n        <td>im sticky</td>\n        <td>im sticky</td>\n      </div>\n\n      @for (col of displayedColumns(); track col) {\n        <td>{{ row[col] }}</td>\n      }\n\n      <div shStickyColumns="end">\n        <td>im sticky end</td>\n        <td>im sticky end</td>\n      </div>\n    </tr>\n  }\n  <div table-no-rows>No data available</div>\n</sh-table>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipStickyColumns, ShipTable, ShipTableVariant } from 'ship-ui';\n\nconst ELEMENT_DATA = [\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },\n  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },\n  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },\n  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },\n  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },\n  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },\n  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },\n  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },\n  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },\n  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },\n];\nconst COLUMNS = ['position', 'name', 'weight', 'symbol'] as const;\n\n@Component({\n  selector: 'multi-sticky-table',\n  standalone: true,\n  imports: [ShipTable, ShipStickyColumns],\n  templateUrl: './multi-sticky-table.html',\n  styleUrl: './multi-sticky-table.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class MultiStickyTable {\n  variant = input<ShipTableVariant | null>(null);\n  displayedColumns = signal([...COLUMNS]);\n  dataSource = signal([...ELEMENT_DATA]);\n  sortByColumn = signal<string | null>(null);\n  isLoading = signal(false);\n}\n"
      }
    ]
  },
  {
    name: "ShipTableFilterBar",
    selector: "sh-table-filter-bar",
    path: "projects/ship-ui/src/lib/ship-table-filter-bar/ship-table-filter-bar.ts",
    description: "",
    keywords: [],
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipSpinner",
    selector: "sh-spinner",
    path: "projects/ship-ui/src/lib/ship-spinner/ship-spinner.component.ts",
    description: "### Size & Thickness\n\nCustomize the spinner appearance using CSS variables:\n`--spinner-size`\nand\n`--spinner-thickness`\n.\n\n### Colors\n\nSpinner colors can be set using the\n`color`\nattribute. Valid options are:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**error**\n, and\n**success**\n.",
    keywords: [
      "spinner",
      "loading",
      "progress",
      "indicator",
      "loader",
      "circular"
    ],
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
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
        html: '<div class="controls">\n  <sh-range-slider class="primary raised" unit="px">\n    <label for="range-slider">Set spinner size</label>\n    <input id="range-slider" type="range" step="2" min="24" max="120" [(ngModel)]="value" />\n  </sh-range-slider>\n\n  <sh-range-slider class="primary raised" unit="px">\n    <label for="range-slider">Spinner thickness</label>\n    <input id="range-slider" type="range" step="1" min="1" max="10" [(ngModel)]="thickness" />\n  </sh-range-slider>\n</div>\n\n<div class="content">\n  <sh-spinner [style.--spinner-thickness]="thicknessAsPixels()" [style.--spinner-size]="valueAsPixels()"></sh-spinner>\n  <sh-spinner\n    [style.--spinner-thickness]="thicknessAsPixels()"\n    [style.--spinner-size]="valueAsPixels()"\n    color="primary"></sh-spinner>\n  <sh-spinner\n    [style.--spinner-thickness]="thicknessAsPixels()"\n    [style.--spinner-size]="valueAsPixels()"\n    color="accent"></sh-spinner>\n  <sh-spinner\n    [style.--spinner-thickness]="thicknessAsPixels()"\n    [style.--spinner-size]="valueAsPixels()"\n    color="warn"></sh-spinner>\n  <sh-spinner\n    [style.--spinner-thickness]="thicknessAsPixels()"\n    [style.--spinner-size]="valueAsPixels()"\n    color="error"></sh-spinner>\n  <sh-spinner\n    [style.--spinner-thickness]="thicknessAsPixels()"\n    [style.--spinner-size]="valueAsPixels()"\n    color="success"></sh-spinner>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipRangeSlider, ShipSpinner } from 'ship-ui';\n\n@Component({\n  selector: 'app-sandbox-spinner',\n  imports: [FormsModule, ShipSpinner, ShipRangeSlider],\n  templateUrl: './sandbox-spinner.html',\n  styleUrl: './sandbox-spinner.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SandboxSpinner {\n  value = signal(40);\n  valueAsPixels = computed(() => `${this.value()}px`);\n\n  thickness = signal(5);\n  thicknessAsPixels = computed(() => `${this.thickness()}px`);\n}\n"
      }
    ]
  },
  {
    name: "ShipStepper",
    selector: "sh-stepper",
    path: "projects/ship-ui/src/lib/ship-stepper/ship-stepper.ts",
    description: "### Colors\n\nStepper colors can be set using the\n`color`\nattribute. Available options are:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**error**\n, and\n**success**\n.\n\n:::info\nThis component utilizes the **Ship Sheet** utility for its visual structure. It supports standard sheet variations and is affected by global sheet variables.\n:::",
    keywords: [
      "stepper",
      "wizard",
      "steps",
      "progress",
      "form",
      "navigation"
    ],
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      }
    ],
    outputs: [],
    methods: [
      {
        name: "super",
        parameters: "'[value], [step], [routerLinkActive], button, a', 'active', { hostRole: 'tablist', itemRole: 'tab' });\n\n    effect(() => {\n      this.items().forEach((item) => {\n        if (!item.querySelector('.sh-radio')",
        returnType: "any",
        description: ""
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
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipStepper } from 'ship-ui';\n\n@Component({\n  selector: 'app-custom-steppers',\n  standalone: true,\n  imports: [ShipStepper],\n  templateUrl: './custom-steppers.html',\n  styleUrls: ['./custom-steppers.scss'],\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class CustomSteppersComponent {\n  activeStep = signal('0');\n}\n"
      },
      {
        name: "router-stepper",
        html: '<sh-stepper class="primary">\n  <div routerLink="/steppers/step-1" routerLinkActive="active">Step 1</div>\n  <div routerLink="/steppers/step-2" routerLinkActive="active">Step 2</div>\n  <div routerLink="/steppers/step-3" routerLinkActive="active">Step 3</div>\n  <div routerLink="/steppers/step-4" routerLinkActive="active">Step 4</div>\n  <div routerLink="/steppers/step-5" routerLinkActive="active">Step 5</div>\n</sh-stepper>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { RouterLink, RouterLinkActive } from '@angular/router';\nimport { ShipStepper } from 'ship-ui';\n\n@Component({\n  selector: 'app-router-steppers',\n  standalone: true,\n  imports: [ShipStepper, RouterLink, RouterLinkActive],\n  templateUrl: './router-steppers.html',\n  styleUrl: './router-steppers.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class Steppers {}\n"
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
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipStepper } from 'ship-ui';\n\n@Component({\n  selector: 'app-default-steppers',\n  standalone: true,\n  imports: [ShipStepper],\n  templateUrl: './default-steppers.html',\n  styleUrls: ['./default-steppers.scss'],\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DefaultStepperComponent {\n  activeStep = signal('0');\n}\n"
      },
      {
        name: "stepper-sandbox",
        html: `<div class="controls">
  <p>Controls</p>
  <header>
    <div class="row">
      <sh-button-group class="small" [(value)]="colorClass">
        <button value="">Default</button>
        <button value="primary">Primary</button>
        <button value="accent">Accent</button>
        <button value="warn">Warn</button>
        <button value="error">Error</button>
        <button value="success">Success</button>
      </sh-button-group>
    </div>
  </header>
</div>

<div class="sandbox">
  <sh-stepper [color]="colorClass()" [(value)]="activeStep">
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
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { ShipButtonGroup, ShipStepper } from 'ship-ui';\n\n@Component({\n  selector: 'app-stepper-sandbox',\n  standalone: true,\n  imports: [ShipStepper, ShipButtonGroup],\n  templateUrl: './stepper-sandbox.html',\n  styleUrl: './stepper-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class StepperSandbox {\n  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('');\n  stepperClass = computed(() => (this.colorClass() === '' ? '' : this.colorClass()));\n  activeStep = signal('0');\n}\n"
      }
    ]
  },
  {
    name: "ShipChip",
    selector: "sh-chip",
    path: "projects/ship-ui/src/lib/ship-chip/ship-chip.ts",
    description: '### Variants\n\nChip variants can be set using the\n`variant`\nattribute. Valid options are:\n**simple**\n,\n**outlined**\n,\n**flat**\n, and\n**raised**\n.\n\n### Sizes\n\nChip sizes can be set using the\n`size`\nattribute. For example:\n`size="small"`\n.\n\n### Colors\n\nChip colors can be set using the\n`color`\nattribute. Valid options are:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**error**\n, and\n**success**\n.\n\n### Dynamic Coloring\n\nYou can set a custom color using the CSS variable\n`--chip-c`\ntogether with the\n`dynamic`\ninput (as an attribute or binding). This is ideal for tagging purposes where you need a wide range of colors.\n\n### Icons\n\nChips can contain icons using the\n`sh-icon`\ncomponent. Use the\n`suffix`\nattribute for trailing icons.\n\n### Readonly\n\nThe chip can be set to readonly through the\n`readonly`\ninput (adds the\n`readonly`\nclass).\n\n### Disabled\n\nThe chip can be disabled using the standard\n`disabled`\nattribute or\n`[disabled]`\nbinding.\n\n:::info\nThis component utilizes the **Ship Sheet** utility for its visual structure. It supports standard sheet variations and is affected by global sheet variables.\n:::',
    keywords: [
      "chip",
      "pill",
      "tag",
      "badge",
      "token",
      "input"
    ],
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "sharp",
        type: "boolean | undefined",
        description: "",
        defaultValue: "undefined"
      },
      {
        name: "dynamic",
        type: "boolean | undefined",
        description: "",
        defaultValue: "undefined"
      },
      {
        name: "readonly",
        type: "boolean",
        description: "",
        defaultValue: "false"
      }
    ],
    outputs: [],
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
        name: "--sheet-c",
        defaultValue: "var(--chip-c)"
      },
      {
        name: "--sheet-s",
        defaultValue: "var(--chip-s)"
      },
      {
        name: "--chip-bs",
        defaultValue: "var(--box-shadow-10)"
      }
    ],
    examples: [
      {
        name: "base-chip",
        html: '<sh-chip>\n  <sh-icon>circle</sh-icon>\n</sh-chip>\n\n<sh-chip>\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip disabled>\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipChip, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-chip',\n  imports: [ShipIcon, ShipChip],\n  templateUrl: './base-chip.html',\n  styleUrl: './base-chip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseChip {}\n"
      },
      {
        name: "flat-chip",
        html: '<sh-chip variant="flat">\n  <sh-icon>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="flat">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="flat" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="flat" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="flat" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="flat" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="flat" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip disabled variant="flat">\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipChip, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-flat-chip',\n  imports: [ShipIcon, ShipChip],\n  templateUrl: './flat-chip.html',\n  styleUrl: './flat-chip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FlatChip {}\n"
      },
      {
        name: "chip-sandbox",
        html: `<div class="controls">
  <p>Controls</p>
  <header>
    <div class="row">
      <sh-toggle [(checked)]="isSmall" color="primary" variant="raised">Small</sh-toggle>
      <sh-toggle [(checked)]="isSharp" color="primary" variant="raised">Sharp</sh-toggle>
      <sh-toggle [(checked)]="isDynamic" color="primary" variant="raised">Dynamic coloring</sh-toggle>
    </div>

    <div class="row">
      @if (isDynamic()) {
        <div>
          <p>It's not great at colors to light, we're working on a better css based color algorithm.</p>
          <br />
          <sh-color-picker
            [renderingType]="'hsl'"
            [showDarkColors]="true"
            [selectedColor]="selectedColor()"
            (currentColor)="currentColor.set($event)" />
        </div>
      } @else {
        <sh-button-group class="small" [(value)]="colorClass">
          <button value="">Default</button>
          <button value="primary">Primary</button>
          <button value="accent">Accent</button>
          <button value="warn">Warn</button>
          <button value="error">Error</button>
          <button value="success">Success</button>
        </sh-button-group>

        <sh-button-group class="small" [(value)]="variationClass">
          <button value="">Default</button>
          <button value="simple">Simple</button>
          <button value="outlined">Outlined</button>
          <button value="flat">Flat</button>
          <button value="raised">Raised</button>
        </sh-button-group>
      }
    </div>
  </header>
</div>

<div class="sandbox">
  <sh-chip
    [color]="colorClass()"
    [variant]="variationClass()"
    [size]="sizeClass()"
    [sharp]="isSharp()"
    [dynamic]="isDynamic()"
    [style.--chip-c]="isDynamic() ? currentColor()?.hsl : undefined">
    <sh-icon>circle</sh-icon>
  </sh-chip>

  <sh-chip
    [color]="colorClass()"
    [variant]="variationClass()"
    [size]="sizeClass()"
    [sharp]="isSharp()"
    [dynamic]="isDynamic()"
    [style.--chip-c]="isDynamic() ? currentColor()?.hsl : undefined">
    <span>Chip</span>
    <sh-icon>circle</sh-icon>
  </sh-chip>

  <sh-chip
    [color]="colorClass()"
    [variant]="variationClass()"
    [size]="sizeClass()"
    [sharp]="isSharp()"
    [dynamic]="isDynamic()"
    [style.--chip-c]="isDynamic() ? currentColor()?.hsl : undefined">
    <sh-icon>circle</sh-icon>
    <span>Chip</span>
  </sh-chip>

  <sh-chip
    [color]="colorClass()"
    [variant]="variationClass()"
    [size]="sizeClass()"
    [sharp]="isSharp()"
    [dynamic]="isDynamic()"
    [style.--chip-c]="isDynamic() ? currentColor()?.hsl : undefined">
    <sh-icon>circle</sh-icon>
    <span>Chip</span>
    <sh-icon>circle</sh-icon>
  </sh-chip>

  <sh-chip
    [color]="colorClass()"
    [variant]="variationClass()"
    [size]="sizeClass()"
    [sharp]="isSharp()"
    [dynamic]="isDynamic()"
    [style.--chip-c]="isDynamic() ? currentColor()?.hsl : undefined">
    <sh-icon>circle</sh-icon>
  </sh-chip>

  <sh-chip
    [color]="colorClass()"
    [variant]="variationClass()"
    [size]="sizeClass()"
    [sharp]="isSharp()"
    [dynamic]="isDynamic()"
    [style.--chip-c]="isDynamic() ? currentColor()?.hsl : undefined">
    <sh-icon>circle</sh-icon>
  </sh-chip>

  <sh-chip
    [color]="colorClass()"
    [variant]="variationClass()"
    [size]="sizeClass()"
    [sharp]="isSharp()"
    [dynamic]="isDynamic()"
    [style.--chip-c]="isDynamic() ? currentColor()?.hsl : undefined">
    <span>Chip</span>
  </sh-chip>
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { ShipButtonGroup, ShipChip, ShipColorPicker, ShipIcon, ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-chip-sandbox',\n  imports: [ShipIcon, ShipChip, ShipButtonGroup, ShipToggle, ShipColorPicker],\n  templateUrl: './chip-sandbox.html',\n  styleUrl: './chip-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ChipSandbox {\n  isSmall = signal<boolean>(false);\n  isSharp = signal<boolean>(false);\n  isDynamic = signal<boolean>(false);\n  hasIcon = signal<boolean>(true);\n  hasSuffixIcon = signal<boolean>(true);\n  hasText = signal<boolean>(true);\n\n  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');\n  variationClass = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');\n  sizeClass = computed(() => (this.isSmall() ? 'small' : ''));\n\n  // Color picker\n  selectedColor = signal<[number, number, number]>([60, 131, 246]);\n  currentColor = signal<{ rgb: string; hex: string; hsl: string; hue: number; saturation: number } | null>(null);\n\n  // colorEffect = effect(() => {\n  //   if (this.isDynamic()) {\n  //     this.currentColor.set({\n  //       rgb: 'rgb(132,156,255)',\n  //       hex: '#849cff',\n  //       hsl: 'hsl(228, 100%, 76%)',\n  //       hue: 228,\n  //       saturation: 100,\n  //     });\n  //   }\n  // });\n}\n"
      },
      {
        name: "simple-chip",
        html: '<sh-chip variant="simple">\n  <sh-icon>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="simple">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="simple" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="simple" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="simple" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="simple" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="simple" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip disabled variant="simple">\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipChip, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-simple-chip',\n  imports: [ShipIcon, ShipChip],\n  templateUrl: './simple-chip.html',\n  styleUrl: './simple-chip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SimpleChip {}\n"
      },
      {
        name: "raised-chip",
        html: '<sh-chip variant="raised">\n  <sh-icon>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="raised">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="raised" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="raised" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="raised" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="raised" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="raised" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip disabled variant="raised">\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipChip, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-raised-chip',\n  imports: [ShipIcon, ShipChip],\n  templateUrl: './raised-chip.html',\n  styleUrl: './raised-chip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RaisedChip {}\n"
      },
      {
        name: "outlined-chip",
        html: '<sh-chip variant="outlined">\n  <sh-icon>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="outlined">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="outlined" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="outlined" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="outlined" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="outlined" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip variant="outlined" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n\n<sh-chip disabled variant="outlined">\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon suffix>circle</sh-icon>\n</sh-chip>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipChip, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-outlined-chip',\n  imports: [ShipIcon, ShipChip],\n  templateUrl: './outlined-chip.html',\n  styleUrl: './outlined-chip.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OutlinedChip {}\n"
      }
    ]
  },
  {
    name: "ShipThemeState",
    selector: "ship-theme-state",
    path: "projects/ship-ui/src/lib/ship-theme-toggle/ship-theme-state.ts",
    description: "",
    keywords: [],
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "localStorage",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "setTheme",
        parameters: "theme: ShipThemeOption",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipThemeToggle",
    selector: "ship-theme-toggle",
    path: "projects/ship-ui/src/lib/ship-theme-toggle/ship-theme-toggle.ts",
    description: "",
    keywords: [],
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "toggleTheme",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "setTheme",
        parameters: "theme: ShipThemeOption",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ChildComponent",
    selector: "app-child",
    path: "projects/ship-ui/src/lib/utilities/create-input-example.component.ts",
    description: "",
    keywords: [],
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "toggleTextInput",
        parameters: "",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipList",
    selector: "sh-list",
    path: "projects/ship-ui/src/lib/ship-list/ship-list.ts",
    description: "### item\n\nAdd the\n`item`\nattribute to a child element of\n`sh-list`\nto make it a list item.\n\n### action\n\nAdd the\n`action`\nattribute to a child element of\n`sh-list`\nto make it an actionable item (e.g., clickable).\n\n### suffix\n\nAdd the\n`suffix`\nattribute to an element inside a list item to align it to the right.",
    keywords: [],
    inputs: [],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--list-s",
        defaultValue: "var(--shape-2)"
      },
      {
        name: "--list-active-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--list-color",
        defaultValue: "var(--base-9)"
      },
      {
        name: "--list-active-bs",
        defaultValue: "none"
      },
      {
        name: "--list-item-b",
        defaultValue: "1px solid transparent"
      },
      {
        name: "--list-item-active-b",
        defaultValue: "1px solid --list-active-bg"
      },
      {
        name: "--list-p",
        defaultValue: "#{p2r(20 16)}"
      },
      {
        name: "--list-item-p",
        defaultValue: "#{p2r(8 12)}"
      },
      {
        name: "--list-item-gap",
        defaultValue: "#{p2r(8)}"
      }
    ],
    examples: [
      {
        name: "base-list-example",
        html: '<sh-list class="primary">\n  <h3 title>Basic</h3>\n  <div item>\n    <sh-icon>circle</sh-icon>\n    Simple item\n    <span suffix>\u2318O</span>\n  </div>\n  <div item>\n    <sh-icon>circle</sh-icon>\n    Another simple item\n    <span suffix>\u2318O</span>\n  </div>\n  <div action [class.active]="active()" (click)="active.set(!active())">\n    <sh-icon>circle</sh-icon>\n    Actionable item\n    <span suffix>\u2318O</span>\n  </div>\n  <div item (click)="checkbox1.setValue(!checkbox1.value)">\n    <sh-icon>circle</sh-icon>\n    Checkbox item with reactive form control\n    <sh-checkbox suffix>\n      <input type="checkbox" [formControl]="checkbox1" />\n    </sh-checkbox>\n  </div>\n  <div item (click)="checkbox2.set(!checkbox2())">\n    <sh-checkbox>\n      <input type="checkbox" [ngModel]="checkbox2()" />\n    </sh-checkbox>\n    Checkbox item with ngModel\n  </div>\n</sh-list>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';\nimport { ShipCheckbox, ShipIcon, ShipList } from 'ship-ui';\n\n@Component({\n  selector: 'base-list-example',\n  standalone: true,\n  imports: [FormsModule, ReactiveFormsModule, ShipList, ShipIcon, ShipCheckbox],\n  templateUrl: './base-list-example.html',\n  styleUrls: ['./base-list-example.scss'],\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseListExample {\n  active = signal(false);\n  checkbox1 = new FormControl(false);\n  checkbox2 = signal(false);\n}\n"
      }
    ]
  },
  {
    name: "ShipMenu",
    selector: "sh-menu",
    path: "projects/ship-ui/src/lib/ship-menu/ship-menu.ts",
    description: "### Searchable\n\nEnable a wildcard search input to filter menu options using the\n`searchable`\nattribute.\n\n### Behavior\n\nCustomize menu interaction:\n\n<li>\n`asMultiLayer`\n: Enables nested menu support.\n</li>\n<li>\n`closeOnClick`\n: Determines if the menu closes when an option is selected (default: true).\n</li>\n<li>\n`disabled`\n: Disables the menu trigger and content.\n</li>\n\n### Slots\n\nAdd a\n`suffix`\nattribute to an element inside a menu option to display hotkeys, icons, or secondary information at the trailing\nend.",
    keywords: [
      "menu",
      "popup",
      "dropdown",
      "list",
      "context",
      "navigation"
    ],
    inputs: [
      {
        name: "asMultiLayer",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "openIndicator",
        type: "any",
        description: "",
        defaultValue: "false"
      },
      {
        name: "disabled",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "customOptionElementSelectors",
        type: "string[]",
        description: "",
        defaultValue: "['button']"
      },
      {
        name: "keepClickedOptionActive",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "closeOnClick",
        type: "boolean",
        description: "",
        defaultValue: "true"
      },
      {
        name: "searchable",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "",
        defaultValue: "false"
      }
    ],
    outputs: [
      {
        name: "closed",
        type: "boolean",
        description: ""
      }
    ],
    methods: [
      {
        name: "onCleanup",
        parameters: "() => {\n      const index = ShipMenu.openMenus.indexOf(this);\n      if (index > -1",
        returnType: "any",
        description: ""
      },
      {
        name: "toggleIsOpen",
        parameters: "event: MouseEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "open",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "nextActiveIndex",
        parameters: "activeIndex: number",
        returnType: "number",
        description: ""
      },
      {
        name: "prevActiveIndex",
        parameters: "activeIndex: number",
        returnType: "number",
        description: ""
      },
      {
        name: "close",
        parameters: "action: 'fromPopover' | 'closed' | 'active' = 'closed', event?: MouseEvent",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [
      {
        name: "--menu-mh",
        defaultValue: "#{p2r(320)}"
      }
    ],
    examples: [
      {
        name: "icon-suffix-menu",
        html: '<sh-menu>\n  <button shButton class="outlined">Open menu</button>\n  <ng-container menu>\n    @for (item of menuItems; track item.value) {\n      <button (click)="select(item)" [class.selected]="selected() === item.value">\n        <sh-icon>circle</sh-icon>\n        {{ item.label }}\n        <span suffix>{{ item.hotkey }}</span>\n      </button>\n    }\n  </ng-container>\n</sh-menu>\n',
        ts: "import { Component, signal } from '@angular/core';\nimport { ShipButton, ShipIcon, ShipMenu } from 'ship-ui';\n\n@Component({\n  selector: 'sh-icon-suffix-menu',\n  templateUrl: './icon-suffix-menu.html',\n  styleUrls: ['./icon-suffix-menu.scss'],\n  imports: [ShipMenu, ShipIcon, ShipButton],\n})\nexport class IconSuffixMenu {\n  menuItems = [\n    { label: 'Home', value: 'home', hotkey: '\u2318L' },\n    { label: 'Profile', value: 'profile', hotkey: '\u2318K' },\n    { label: 'Settings', value: 'settings', hotkey: '\u2318J' },\n  ];\n\n  selected = signal<string | null>(null);\n\n  select(item: any) {\n    this.selected.set(item.value);\n  }\n}\n"
      },
      {
        name: "search-menu-example",
        html: '<sh-menu [searchable]="true">\n  <button shButton class="outlined">Open searchable menu</button>\n  <ng-container menu>\n    @for (item of filteredItems; track item.value) {\n      <button (click)="select(item)" [class.selected]="selected === item.value">\n        <p>\n          hello world\n          <br />\n          {{ item.label }}\n        </p>\n      </button>\n    }\n  </ng-container>\n</sh-menu>\n\n<sh-menu [searchable]="true">\n  <button shButton class="outlined">Open searchable menu</button>\n  <ng-container menu>\n    @for (item of filteredItems; track item.value) {\n      <button (click)="select(item)" [class.selected]="selected === item.value">\n        <div class="option-col">\n          {{ item.label }} asdlkjadskljjkladsjkldaljkdaslkjad jklsjkl dasjkld as\n          <p>hello world but im extra long so i should wrap to the next line</p>\n        </div>\n      </button>\n    }\n  </ng-container>\n</sh-menu>\n',
        ts: "import { Component } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButton, ShipMenu } from 'ship-ui';\n\n@Component({\n  selector: 'sh-search-menu-example',\n  templateUrl: './search-menu-example.html',\n  styleUrls: ['./search-menu-example.scss'],\n  imports: [FormsModule, ShipMenu, ShipButton],\n  standalone: true,\n})\nexport class SearchMenuExample {\n  menuItems = [\n    { label: 'Dashboard', value: 'dashboard' },\n    { label: 'Users', value: 'users' },\n    { label: 'Settings', value: 'settings' },\n    { label: 'Billing', value: 'billing' },\n    { label: 'Support', value: 'support' },\n  ];\n  search = '';\n  selected: string | null = null;\n\n  get filteredItems() {\n    return this.menuItems.filter((item) => item.label.toLowerCase().includes(this.search.toLowerCase()));\n  }\n\n  select(item: any) {\n    this.selected = item.value;\n  }\n}\n"
      },
      {
        name: "multi-layer-menu-example",
        html: '<sh-menu [asMultiLayer]="true">\n  <button shButton class="outlined">Open multi-layer menu</button>\n  <ng-container menu>\n    @for (item of menu; track $index) {\n      @if (item.children) {\n        <sh-menu [asMultiLayer]="true">\n          <button>{{ item.label }}</button>\n          <ng-container menu>\n            @for (sub of item.children; track sub.value) {\n              <button (click)="select(sub)" [class.selected]="selected === sub.value">\n                {{ sub.label }}\n              </button>\n            }\n          </ng-container>\n        </sh-menu>\n      } @else {\n        <button (click)="select(item)" [class.selected]="selected === item.value">\n          {{ item.label }}\n        </button>\n      }\n    }\n  </ng-container>\n</sh-menu>\n',
        ts: "import { Component } from '@angular/core';\nimport { ShipButton, ShipMenu } from 'ship-ui';\n\n@Component({\n  selector: 'sh-multi-layer-menu-example',\n  templateUrl: './multi-layer-menu-example.html',\n  styleUrls: ['./multi-layer-menu-example.scss'],\n  imports: [ShipMenu, ShipButton],\n  standalone: true,\n})\nexport class MultiLayerMenuExample {\n  menu = [\n    {\n      label: 'File',\n      children: [\n        { label: 'New', value: 'new' },\n        { label: 'Open', value: 'open' },\n        { label: 'Exit', value: 'exit' },\n      ],\n    },\n    {\n      label: 'Edit',\n      children: [\n        { label: 'Undo', value: 'undo' },\n        { label: 'Redo', value: 'redo' },\n      ],\n    },\n    { label: 'Help', value: 'help' },\n  ];\n  selected: string | null = null;\n  openSubmenu: number | null = null;\n\n  select(item: any) {\n    this.selected = item.value;\n  }\n\n  toggleSubmenu(idx: number) {\n    this.openSubmenu = this.openSubmenu === idx ? null : idx;\n  }\n}\n"
      },
      {
        name: "toggle-select-menu-example",
        html: '<sh-menu>\n  <button shButton class="outlined">Open toggle select menu</button>\n  <ng-container menu>\n    @for (item of menuItems; track item.value) {\n      <button (click)="toggle($event, item)">\n        <sh-checkbox [checked]="isSelected(item)" class="primary raised">\n          {{ item.label }}\n        </sh-checkbox>\n      </button>\n    }\n  </ng-container>\n</sh-menu>\n',
        ts: "import { Component } from '@angular/core';\nimport { ShipButton, ShipCheckbox, ShipMenu } from 'ship-ui';\n\n@Component({\n  selector: 'sh-toggle-select-menu-example',\n  templateUrl: './toggle-select-menu-example.html',\n  styleUrls: ['./toggle-select-menu-example.scss'],\n  imports: [ShipMenu, ShipButton, ShipCheckbox],\n  standalone: true,\n})\nexport class ToggleSelectMenuExample {\n  menuItems = [\n    { label: 'Email Notifications', value: 'email' },\n    { label: 'SMS Alerts', value: 'sms' },\n    { label: 'Push Notifications', value: 'push' },\n  ];\n  selected: Set<string> = new Set();\n\n  toggle($event: MouseEvent, item: any) {\n    $event.stopPropagation();\n\n    if (this.selected.has(item.value)) {\n      this.selected.delete(item.value);\n    } else {\n      this.selected.add(item.value);\n    }\n    // Force change detection for Set\n    this.selected = new Set(this.selected);\n  }\n\n  isSelected(item: any) {\n    return this.selected.has(item.value);\n  }\n}\n"
      },
      {
        name: "base-menu-example",
        html: '<sh-menu>\n  <button shButton class="outlined">Open menu</button>\n  <ng-container menu>\n    @for (item of menuItems; track item.value) {\n      <button (click)="someFunction(item)">\n        {{ item.label }}\n      </button>\n    }\n  </ng-container>\n</sh-menu>\n',
        ts: "import { Component } from '@angular/core';\nimport { ShipButton, ShipMenu } from 'ship-ui';\n\n@Component({\n  selector: 'base-menu-example',\n  templateUrl: './base-menu-example.html',\n  styleUrls: ['./base-menu-example.scss'],\n  imports: [ShipMenu, ShipButton],\n})\nexport class BaseMenuExample {\n  menuItems = [\n    { label: 'Home', value: 'home' },\n    { label: 'Profile', value: 'profile' },\n    { label: 'Settings', value: 'settings' },\n  ];\n\n  someFunction(item: any) {\n    alert(item.label);\n  }\n}\n"
      }
    ]
  },
  {
    name: "ShipAlert",
    selector: "sh-alert",
    path: "projects/ship-ui/src/lib/ship-alert/ship-alert.ts",
    description: "### Variants\n\nAlert variants can be set using the\n`variant`\nattribute. Valid options are:\n**simple**\n,\n**outlined**\n,\n**flat**\n, and\n**raised**\n.\n\n### Colors\n\nAlert colors can be set using the\n`color`\nattribute. Valid options are:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**error**\n, and\n**success**\n.\n\n:::info\nThis component utilizes the **Ship Sheet** utility for its visual structure. It supports standard sheet variations and is affected by global sheet variables.\n:::",
    keywords: [
      "alert",
      "notification",
      "banner",
      "warning",
      "error",
      "info",
      "success",
      "message"
    ],
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "alertService",
        type: "ShipAlertService | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "id",
        type: "string | null",
        description: "",
        defaultValue: "null"
      }
    ],
    outputs: [],
    methods: [
      {
        name: "removeAlert",
        parameters: "",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [
      {
        name: "--alert-ad",
        defaultValue: "400ms"
      },
      {
        name: "--alert-bs",
        defaultValue: "var(--box-shadow-10)"
      },
      {
        name: "--alert-p",
        defaultValue: "#{p2r(8)}"
      },
      {
        name: "--sheet-c",
        defaultValue: "#fff"
      }
    ],
    examples: [
      {
        name: "flat-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="flat">Flat alert</sh-alert>\n<sh-alert variant="flat" color="primary">Primary flat alert</sh-alert>\n<sh-alert variant="flat" color="accent">Accent flat alert</sh-alert>\n<sh-alert variant="flat" color="warn">Warn flat alert</sh-alert>\n<sh-alert variant="flat" color="error">Error flat alert</sh-alert>\n<sh-alert variant="flat" color="success">\n  Success flat alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="flat">Flat alert</sh-alert>\n<sh-alert class="flat primary">Primary flat alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from 'ship-ui';\n\n@Component({\n  selector: 'app-flat-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './flat-alert.html',\n  styleUrl: './flat-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FlatAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "simple-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="simple">Simple alert</sh-alert>\n<sh-alert variant="simple" color="primary">Primary simple alert</sh-alert>\n<sh-alert variant="simple" color="accent">Accent simple alert</sh-alert>\n<sh-alert variant="simple" color="warn">Warn simple alert</sh-alert>\n<sh-alert variant="simple" color="error">Error simple alert</sh-alert>\n<sh-alert variant="simple" color="success">\n  Success simple alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="simple">Simple alert</sh-alert>\n<sh-alert class="simple primary">Primary simple alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from 'ship-ui';\n\n@Component({\n  selector: 'app-simple-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './simple-alert.html',\n  styleUrl: './simple-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SimpleAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "base-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert>Default alert</sh-alert>\n<sh-alert color="primary">Primary alert</sh-alert>\n<sh-alert color="accent">Accent alert</sh-alert>\n<sh-alert color="warn">Warn alert</sh-alert>\n<sh-alert color="error">Error alert</sh-alert>\n<sh-alert color="success">Success alert</sh-alert>\n<sh-alert color="success">\n  Success alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<sh-alert color="primary">\n  Success alert\n  <button shButton color="primary" variant="outlined" size="small">Button</button>\n</sh-alert>\n\n<sh-alert color="primary">\n  Success alert\n  <p>with a paragraph</p>\n  <button shButton color="primary" variant="outlined" size="small">Button</button>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="primary">Primary alert</sh-alert>\n<sh-alert class="accent">Accent alert</sh-alert>\n<button shButton class="outlined primary small">Button</button>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert, ShipButton } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-alert',\n  standalone: true,\n  imports: [ShipAlert, ShipButton],\n  templateUrl: './base-alert.html',\n  styleUrl: './base-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "raised-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="raised">Raised alert</sh-alert>\n<sh-alert variant="raised" color="primary">Primary raised alert</sh-alert>\n<sh-alert variant="raised" color="accent">Accent raised alert</sh-alert>\n<sh-alert variant="raised" color="warn">Warn raised alert</sh-alert>\n<sh-alert variant="raised" color="error">Error raised alert</sh-alert>\n<sh-alert variant="raised" color="success">\n  Success raised alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="raised">Raised alert</sh-alert>\n<sh-alert class="raised primary">Primary raised alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from 'ship-ui';\n\n@Component({\n  selector: 'app-raised-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './raised-alert.html',\n  styleUrl: './raised-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RaisedAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "outlined-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="outlined">Outlined alert</sh-alert>\n<sh-alert variant="outlined" color="primary">Primary outlined alert</sh-alert>\n<sh-alert variant="outlined" color="accent">Accent outlined alert</sh-alert>\n<sh-alert variant="outlined" color="warn">Warn outlined alert</sh-alert>\n<sh-alert variant="outlined" color="error">Error outlined alert</sh-alert>\n<sh-alert variant="outlined" color="success">\n  Success outlined alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="outlined">Outlined alert</sh-alert>\n<sh-alert class="outlined primary">Primary outlined alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from 'ship-ui';\n\n@Component({\n  selector: 'app-outlined-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './outlined-alert.html',\n  styleUrl: './outlined-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OutlinedAlert {\n  active = signal(false);\n}\n"
      }
    ]
  },
  {
    name: "ShipAlertService",
    selector: "ship-alert-service",
    path: "projects/ship-ui/src/lib/ship-alert/ship-alert.service.ts",
    description: "### Variants\n\nAlert variants can be set using the\n`variant`\nattribute. Valid options are:\n**simple**\n,\n**outlined**\n,\n**flat**\n, and\n**raised**\n.\n\n### Colors\n\nAlert colors can be set using the\n`color`\nattribute. Valid options are:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**error**\n, and\n**success**\n.",
    keywords: [
      "alert",
      "notification",
      "banner",
      "warning",
      "error",
      "info",
      "success",
      "message"
    ],
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "error",
        parameters: "message: string | null | undefined",
        returnType: "any",
        description: ""
      },
      {
        name: "success",
        parameters: "message: string",
        returnType: "any",
        description: ""
      },
      {
        name: "question",
        parameters: "message: string",
        returnType: "any",
        description: ""
      },
      {
        name: "warning",
        parameters: "message: string",
        returnType: "any",
        description: ""
      },
      {
        name: "info",
        parameters: "message: string",
        returnType: "any",
        description: ""
      },
      {
        name: "addAlert",
        parameters: "alert: ShipAlertItem",
        returnType: "any",
        description: ""
      },
      {
        name: "setHidden",
        parameters: "isHidden: boolean",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: [
      {
        name: "flat-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="flat">Flat alert</sh-alert>\n<sh-alert variant="flat" color="primary">Primary flat alert</sh-alert>\n<sh-alert variant="flat" color="accent">Accent flat alert</sh-alert>\n<sh-alert variant="flat" color="warn">Warn flat alert</sh-alert>\n<sh-alert variant="flat" color="error">Error flat alert</sh-alert>\n<sh-alert variant="flat" color="success">\n  Success flat alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="flat">Flat alert</sh-alert>\n<sh-alert class="flat primary">Primary flat alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from 'ship-ui';\n\n@Component({\n  selector: 'app-flat-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './flat-alert.html',\n  styleUrl: './flat-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FlatAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "simple-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="simple">Simple alert</sh-alert>\n<sh-alert variant="simple" color="primary">Primary simple alert</sh-alert>\n<sh-alert variant="simple" color="accent">Accent simple alert</sh-alert>\n<sh-alert variant="simple" color="warn">Warn simple alert</sh-alert>\n<sh-alert variant="simple" color="error">Error simple alert</sh-alert>\n<sh-alert variant="simple" color="success">\n  Success simple alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="simple">Simple alert</sh-alert>\n<sh-alert class="simple primary">Primary simple alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from 'ship-ui';\n\n@Component({\n  selector: 'app-simple-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './simple-alert.html',\n  styleUrl: './simple-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SimpleAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "base-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert>Default alert</sh-alert>\n<sh-alert color="primary">Primary alert</sh-alert>\n<sh-alert color="accent">Accent alert</sh-alert>\n<sh-alert color="warn">Warn alert</sh-alert>\n<sh-alert color="error">Error alert</sh-alert>\n<sh-alert color="success">Success alert</sh-alert>\n<sh-alert color="success">\n  Success alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<sh-alert color="primary">\n  Success alert\n  <button shButton color="primary" variant="outlined" size="small">Button</button>\n</sh-alert>\n\n<sh-alert color="primary">\n  Success alert\n  <p>with a paragraph</p>\n  <button shButton color="primary" variant="outlined" size="small">Button</button>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="primary">Primary alert</sh-alert>\n<sh-alert class="accent">Accent alert</sh-alert>\n<button shButton class="outlined primary small">Button</button>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert, ShipButton } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-alert',\n  standalone: true,\n  imports: [ShipAlert, ShipButton],\n  templateUrl: './base-alert.html',\n  styleUrl: './base-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "raised-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="raised">Raised alert</sh-alert>\n<sh-alert variant="raised" color="primary">Primary raised alert</sh-alert>\n<sh-alert variant="raised" color="accent">Accent raised alert</sh-alert>\n<sh-alert variant="raised" color="warn">Warn raised alert</sh-alert>\n<sh-alert variant="raised" color="error">Error raised alert</sh-alert>\n<sh-alert variant="raised" color="success">\n  Success raised alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="raised">Raised alert</sh-alert>\n<sh-alert class="raised primary">Primary raised alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from 'ship-ui';\n\n@Component({\n  selector: 'app-raised-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './raised-alert.html',\n  styleUrl: './raised-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RaisedAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "outlined-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="outlined">Outlined alert</sh-alert>\n<sh-alert variant="outlined" color="primary">Primary outlined alert</sh-alert>\n<sh-alert variant="outlined" color="accent">Accent outlined alert</sh-alert>\n<sh-alert variant="outlined" color="warn">Warn outlined alert</sh-alert>\n<sh-alert variant="outlined" color="error">Error outlined alert</sh-alert>\n<sh-alert variant="outlined" color="success">\n  Success outlined alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="outlined">Outlined alert</sh-alert>\n<sh-alert class="outlined primary">Primary outlined alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from 'ship-ui';\n\n@Component({\n  selector: 'app-outlined-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './outlined-alert.html',\n  styleUrl: './outlined-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OutlinedAlert {\n  active = signal(false);\n}\n"
      }
    ]
  },
  {
    name: "ShipAlertContainer",
    selector: "ship-alert-container",
    path: "projects/ship-ui/src/lib/ship-alert/ship-alert-container.ts",
    description: "### Variants\n\nAlert variants can be set using the\n`variant`\nattribute. Valid options are:\n**simple**\n,\n**outlined**\n,\n**flat**\n, and\n**raised**\n.\n\n### Colors\n\nAlert colors can be set using the\n`color`\nattribute. Valid options are:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**error**\n, and\n**success**\n.",
    keywords: [
      "alert",
      "notification",
      "banner",
      "warning",
      "error",
      "info",
      "success",
      "message"
    ],
    inputs: [
      {
        name: "inline",
        type: "string | null",
        description: "",
        defaultValue: "null"
      }
    ],
    outputs: [],
    methods: [
      {
        name: "onMouseOver",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "transitionDelay",
        parameters: "i: number, allOpen = false",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: [
      {
        name: "flat-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="flat">Flat alert</sh-alert>\n<sh-alert variant="flat" color="primary">Primary flat alert</sh-alert>\n<sh-alert variant="flat" color="accent">Accent flat alert</sh-alert>\n<sh-alert variant="flat" color="warn">Warn flat alert</sh-alert>\n<sh-alert variant="flat" color="error">Error flat alert</sh-alert>\n<sh-alert variant="flat" color="success">\n  Success flat alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="flat">Flat alert</sh-alert>\n<sh-alert class="flat primary">Primary flat alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from 'ship-ui';\n\n@Component({\n  selector: 'app-flat-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './flat-alert.html',\n  styleUrl: './flat-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FlatAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "simple-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="simple">Simple alert</sh-alert>\n<sh-alert variant="simple" color="primary">Primary simple alert</sh-alert>\n<sh-alert variant="simple" color="accent">Accent simple alert</sh-alert>\n<sh-alert variant="simple" color="warn">Warn simple alert</sh-alert>\n<sh-alert variant="simple" color="error">Error simple alert</sh-alert>\n<sh-alert variant="simple" color="success">\n  Success simple alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="simple">Simple alert</sh-alert>\n<sh-alert class="simple primary">Primary simple alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from 'ship-ui';\n\n@Component({\n  selector: 'app-simple-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './simple-alert.html',\n  styleUrl: './simple-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SimpleAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "base-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert>Default alert</sh-alert>\n<sh-alert color="primary">Primary alert</sh-alert>\n<sh-alert color="accent">Accent alert</sh-alert>\n<sh-alert color="warn">Warn alert</sh-alert>\n<sh-alert color="error">Error alert</sh-alert>\n<sh-alert color="success">Success alert</sh-alert>\n<sh-alert color="success">\n  Success alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<sh-alert color="primary">\n  Success alert\n  <button shButton color="primary" variant="outlined" size="small">Button</button>\n</sh-alert>\n\n<sh-alert color="primary">\n  Success alert\n  <p>with a paragraph</p>\n  <button shButton color="primary" variant="outlined" size="small">Button</button>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="primary">Primary alert</sh-alert>\n<sh-alert class="accent">Accent alert</sh-alert>\n<button shButton class="outlined primary small">Button</button>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert, ShipButton } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-alert',\n  standalone: true,\n  imports: [ShipAlert, ShipButton],\n  templateUrl: './base-alert.html',\n  styleUrl: './base-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "raised-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="raised">Raised alert</sh-alert>\n<sh-alert variant="raised" color="primary">Primary raised alert</sh-alert>\n<sh-alert variant="raised" color="accent">Accent raised alert</sh-alert>\n<sh-alert variant="raised" color="warn">Warn raised alert</sh-alert>\n<sh-alert variant="raised" color="error">Error raised alert</sh-alert>\n<sh-alert variant="raised" color="success">\n  Success raised alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="raised">Raised alert</sh-alert>\n<sh-alert class="raised primary">Primary raised alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from 'ship-ui';\n\n@Component({\n  selector: 'app-raised-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './raised-alert.html',\n  styleUrl: './raised-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RaisedAlert {\n  active = signal(false);\n}\n"
      },
      {
        name: "outlined-alert",
        html: '<!-- Using attribute inputs -->\n<sh-alert variant="outlined">Outlined alert</sh-alert>\n<sh-alert variant="outlined" color="primary">Primary outlined alert</sh-alert>\n<sh-alert variant="outlined" color="accent">Accent outlined alert</sh-alert>\n<sh-alert variant="outlined" color="warn">Warn outlined alert</sh-alert>\n<sh-alert variant="outlined" color="error">Error outlined alert</sh-alert>\n<sh-alert variant="outlined" color="success">\n  Success outlined alert\n  <p>with a paragraph</p>\n</sh-alert>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<sh-alert class="outlined">Outlined alert</sh-alert>\n<sh-alert class="outlined primary">Primary outlined alert</sh-alert>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipAlert } from 'ship-ui';\n\n@Component({\n  selector: 'app-outlined-alert',\n  standalone: true,\n  imports: [ShipAlert],\n  templateUrl: './outlined-alert.html',\n  styleUrl: './outlined-alert.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OutlinedAlert {\n  active = signal(false);\n}\n"
      }
    ]
  },
  {
    name: "ShipDatepickerInput",
    selector: "sh-datepicker-input",
    path: "projects/ship-ui/src/lib/ship-datepicker/ship-datepicker-input.ts",
    description: "### Selection\n\nSelected values are available via\n`date`\nand\n`endDate`\n. Use\n`[(date)]`\nand\n`[(endDate)]`\nfor two-way binding.\n\n### Configuration\n\nCustomize the picker behavior:\n\n<li>\n`asRange`\n: Enable range selection mode.\n</li>\n<li>\n`monthsToShow`\n: Set the number of months displayed (default: 1).\n</li>\n<li>\n`startOfWeek`\n: Specify the first day of the week (0-6).\n</li>\n<li>\n`weekdayLabels`\n: Provide custom labels for week days.\n</li>\n\n### Input Display\n\nCustomize how dates appear in inputs:\n\n<li>\n`masking`\n: Set the date format mask (e.g.,\n`'mediumDate'`\n).\n</li>\n<li>\n`size`\n: Use the\n`small`\nattribute/class for a compact input.\n</li>\n\n### Interaction\n\n<li>\n`closed`\n: Event emitted when the picker is dismissed.\n</li>\n<li>\n`disabled`\n: Standard attribute to disable interaction.\n</li>\n\n### Local Time & Timezones\n\nThe datepicker operates using standard native JavaScript\n`Date`\nobjects, so it automatically adapts to the user's operating system timezone.\n\n<strong>Testing different timezones:</strong>\nBecause it relies on the browser's native timezone API, you cannot spoof the timezone programmatically within the\ncomponent. To test how the datepicker looks and behaves in other regions, use your browser's Developer Tools. In\nChrome or Edge, open DevTools, press\n`Esc`\nto bring up the bottom drawer, find the\n<strong>Sensors</strong>\ntab, and change the Location override to a different city (e.g., Tokyo or London).",
    keywords: [
      "date",
      "picker",
      "calendar",
      "day",
      "month",
      "year",
      "time",
      "scheduling",
      "range"
    ],
    inputs: [
      {
        name: "masking",
        type: "any",
        description: "",
        defaultValue: "'mediumDate'"
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "",
        defaultValue: "false"
      }
    ],
    outputs: [
      {
        name: "closed",
        type: "Date | null",
        description: ""
      }
    ],
    methods: [
      {
        name: "onDateChange",
        parameters: "date: Date | null",
        returnType: "any",
        description: ""
      },
      {
        name: "close",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "get",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "set",
        parameters: "newVal",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: [
      {
        name: "input-datepicker-ngmodel",
        html: `<div class="row">
  <sh-datepicker-input class="primary sharp">
    <label>Date (ngModel)</label>
    <input type="text" [(ngModel)]="date" />
  </sh-datepicker-input>

  <sh-form-field class="autosize">
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
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipDatepickerInput, ShipFormField, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-input-datepicker-ngmodel',\n  standalone: true,\n  imports: [FormsModule, ShipDatepickerInput, ShipFormField, ShipIcon, DatePipe],\n  templateUrl: './input-datepicker-ngmodel.html',\n  styleUrl: './input-datepicker-ngmodel.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InputDatepickerNgModelComponent {\n  date = signal<Date | null>(new Date());\n  time = signal<`${string}:${string}` | null>(\n    `${this.date()?.getHours() ?? '00'}:${this.date()?.getMinutes() ?? '00'}`\n  );\n\n  timeEffect = effect(() => {\n    const time = this.time();\n\n    if (time === null) return;\n\n    const [hours, minutes, seconds] = time.split(':');\n\n    this.date.update((x) => {\n      if (!x) return x;\n\n      const newDate = new Date(x);\n      newDate.setHours(parseInt(hours ?? '0'), parseInt(minutes ?? '0'), parseInt(seconds ?? '0'));\n\n      return newDate;\n    });\n  });\n}\n"
      },
      {
        name: "datepicker-sandbox",
        html: `<div class="controls">
  <sh-toggle class="raised primary" [(checked)]="disabled">Disabled</sh-toggle>
  <sh-toggle class="raised primary" [(checked)]="sharp">Sharp</sh-toggle>

  <sh-button-group class="type-b" [(value)]="colors">
    <button value="">Default</button>
    <button value="primary">Primary</button>
    <button value="accent">Accent</button>
    <button value="warn">Warn</button>
    <button value="error">Error</button>
    <button value="success">Success</button>
  </sh-button-group>

  <sh-button-group class="type-b" [(value)]="startOfWeek">
    <button value="1">Monday</button>
    <button value="2">Tuesday</button>
    <button value="3">Wednesday</button>
    <button value="4">Thursday</button>
    <button value="5">Friday</button>
    <button value="6">Saturday</button>
    <button value="0">Sunday</button>
  </sh-button-group>
</div>

<div class="content">
  <sh-datepicker
    class="raised"
    [class]="exampleClass()"
    [(date)]="date"
    [disabled]="disabled()"
    [startOfWeek]="startOfWeekComputed()" />

  <p>Selected date: {{ date() | date: 'mediumDate' }}</p>
</div>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButtonGroup, ShipDatepicker, ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-datepicker-sandbox',\n  standalone: true,\n  imports: [FormsModule, ShipDatepicker, ShipToggle, ShipButtonGroup, DatePipe],\n  templateUrl: './datepicker-sandbox.html',\n  styleUrl: './datepicker-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DatepickerSandbox {\n  date = signal<Date | null>(new Date());\n  disabled = signal(false);\n  sharp = signal(false);\n  startOfWeek = signal('1');\n  colors = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');\n\n  exampleClass = computed(() => this.colors() + ' ' + (this.sharp() ? 'sharp' : ''));\n\n  startOfWeekComputed = computed(() => parseInt(this.startOfWeek()));\n}\n"
      },
      {
        name: "range-datepicker",
        html: `<label for="range-datepicker">Select a date range:</label>
<sh-datepicker [(date)]="startDate" [(endDate)]="endDate" [asRange]="true"></sh-datepicker>
<p>Start: {{ startDate() ? (startDate() | date: 'mediumDate') : 'None' }}</p>
<p>End: {{ endDate() ? (endDate() | date: 'mediumDate') : 'None' }}</p>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipDatepicker } from 'ship-ui';\n\n@Component({\n  selector: 'app-range-datepicker',\n  standalone: true,\n  imports: [FormsModule, ShipDatepicker, DatePipe],\n  templateUrl: './range-datepicker.html',\n  styleUrl: './range-datepicker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RangeDatepicker {\n  startDate = signal<Date | null>(null);\n  endDate = signal<Date | null>(null);\n}\n"
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
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, ReactiveFormsModule } from '@angular/forms';\nimport { ShipDaterangeInput, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-range-input-datepicker',\n  standalone: true,\n  imports: [ReactiveFormsModule, ShipDaterangeInput, ShipIcon, DatePipe],\n  templateUrl: './range-input-datepicker.html',\n  styleUrl: './range-input-datepicker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RangeInputDatepicker {\n  startDate = new FormControl(new Date());\n  endDate = new FormControl(new Date(Date.now() + 86400000)); // Tomorrow\n}\n"
      },
      {
        name: "base-datepicker",
        html: `<label for="datepicker">Select a date:</label>
<sh-datepicker [(date)]="selectedDate"></sh-datepicker>
<p>Selected: {{ selectedDate() | date: 'mediumDate' }}</p>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipDatepicker } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-datepicker',\n  standalone: true,\n  imports: [FormsModule, ShipDatepicker, DatePipe],\n  templateUrl: './base-datepicker.html',\n  styleUrl: './base-datepicker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseDatepicker {\n  selectedDate = signal(new Date());\n}\n"
      },
      {
        name: "input-datepicker-reactive",
        html: `<sh-datepicker-input>
  <label>Date (Reactive Form)</label>
  <input type="text" [formControl]="dateControl" />
</sh-datepicker-input>
<p>Selected: {{ dateControl.value | date: 'mediumDate' }}</p>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, ReactiveFormsModule } from '@angular/forms';\nimport { ShipDatepickerInput } from 'ship-ui';\n\n@Component({\n  selector: 'app-input-datepicker-reactive',\n  standalone: true,\n  imports: [ReactiveFormsModule, ShipDatepickerInput, DatePipe],\n  templateUrl: './input-datepicker-reactive.html',\n  styleUrl: './input-datepicker-reactive.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InputDatepickerReactive {\n  dateControl = new FormControl(new Date());\n}\n"
      },
      {
        name: "range-datepicker-sandbox",
        html: `<div class="controls">
  <sh-toggle [(checked)]="disabled">Disabled</sh-toggle>

  <sh-button-group [(value)]="colors">
    <button value="">Default</button>
    <button value="primary">Primary</button>
    <button value="accent">Accent</button>
    <button value="warn">Warn</button>
    <button value="error">Error</button>
    <button value="success">Success</button>
  </sh-button-group>

  <sh-range-slider min="1" max="3">
    <label>Months to show</label>
    <input type="range" [(ngModel)]="monthsToShow" min="1" max="12" />
  </sh-range-slider>
</div>

<div class="content">
  <sh-datepicker
    [class]="colors()"
    [(date)]="startDate"
    [(endDate)]="endDate"
    [asRange]="true"
    [monthsToShow]="monthsToShow()"></sh-datepicker>
  <p>Start: {{ startDate() | date: 'mediumDate' }}</p>
  <p>End: {{ endDate() | date: 'mediumDate' }}</p>
</div>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButtonGroup, ShipDatepicker, ShipRangeSlider, ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-range-datepicker-sandbox',\n  standalone: true,\n  imports: [FormsModule, ShipDatepicker, ShipToggle, ShipRangeSlider, ShipButtonGroup, DatePipe],\n  templateUrl: './range-datepicker-sandbox.html',\n  styleUrl: './range-datepicker-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RangeDatepickerSandbox {\n  colors = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');\n  startDate = signal<Date | null>(new Date());\n  endDate = signal<Date | null>(new Date(Date.now() + 86400000));\n  disabled = signal(false);\n  monthsToShow = signal(2);\n}\n"
      }
    ]
  },
  {
    name: "ShipDatepicker",
    selector: "sh-datepicker",
    path: "projects/ship-ui/src/lib/ship-datepicker/ship-datepicker.ts",
    description: "### Selection\n\nSelected values are available via\n`date`\nand\n`endDate`\n. Use\n`[(date)]`\nand\n`[(endDate)]`\nfor two-way binding.\n\n### Configuration\n\nCustomize the picker behavior:\n\n<li>\n`asRange`\n: Enable range selection mode.\n</li>\n<li>\n`monthsToShow`\n: Set the number of months displayed (default: 1).\n</li>\n<li>\n`startOfWeek`\n: Specify the first day of the week (0-6).\n</li>\n<li>\n`weekdayLabels`\n: Provide custom labels for week days.\n</li>\n\n### Input Display\n\nCustomize how dates appear in inputs:\n\n<li>\n`masking`\n: Set the date format mask (e.g.,\n`'mediumDate'`\n).\n</li>\n<li>\n`size`\n: Use the\n`small`\nattribute/class for a compact input.\n</li>\n\n### Interaction\n\n<li>\n`closed`\n: Event emitted when the picker is dismissed.\n</li>\n<li>\n`disabled`\n: Standard attribute to disable interaction.\n</li>\n\n### Local Time & Timezones\n\nThe datepicker operates using standard native JavaScript\n`Date`\nobjects, so it automatically adapts to the user's operating system timezone.\n\n<strong>Testing different timezones:</strong>\nBecause it relies on the browser's native timezone API, you cannot spoof the timezone programmatically within the\ncomponent. To test how the datepicker looks and behaves in other regions, use your browser's Developer Tools. In\nChrome or Edge, open DevTools, press\n`Esc`\nto bring up the bottom drawer, find the\n<strong>Sensors</strong>\ntab, and change the Location override to a different city (e.g., Tokyo or London).",
    keywords: [
      "date",
      "picker",
      "calendar",
      "day",
      "month",
      "year",
      "time",
      "scheduling",
      "range"
    ],
    inputs: [
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
        defaultValue: "null"
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
        type: "string[]",
        description: "",
        defaultValue: "['Su'"
      },
      {
        name: "date",
        type: "Date | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "endDate",
        type: "Date | null",
        description: "",
        defaultValue: "null"
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
        name: "getLastVisibleMonth",
        parameters: "",
        returnType: "Date",
        description: ""
      },
      {
        name: "getOffsetDate",
        parameters: "monthOffset: number",
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
        name: "while",
        parameters: "dates.length % 7 !== 0",
        returnType: "any",
        description: ""
      },
      {
        name: "nextMonth",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "previousMonth",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "setDate",
        parameters: "newDate: Date, selectedElement: HTMLElement",
        returnType: "any",
        description: ""
      },
      {
        name: "setSelectedDateStylePosition",
        parameters: "selectedElement: HTMLElement",
        returnType: "any",
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
        name: "getTabIndex",
        parameters: "date: Date",
        returnType: "number",
        description: ""
      },
      {
        name: "isDateSelectedBool",
        parameters: "date: Date",
        returnType: "boolean",
        description: ""
      },
      {
        name: "onKeydown",
        parameters: "event: KeyboardEvent, date: Date",
        returnType: "any",
        description: ""
      },
      {
        name: "ensureDateVisible",
        parameters: "date: Date",
        returnType: "any",
        description: ""
      },
      {
        name: "focusActiveDate",
        parameters: "",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [
      {
        name: "--dp-width",
        defaultValue: "#{p2r(240)}"
      },
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
        defaultValue: "#fff"
      },
      {
        name: "--dp-day-c",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--dp-day-f",
        defaultValue: "var(--paragraph-20)"
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
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipDatepickerInput, ShipFormField, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-input-datepicker-ngmodel',\n  standalone: true,\n  imports: [FormsModule, ShipDatepickerInput, ShipFormField, ShipIcon, DatePipe],\n  templateUrl: './input-datepicker-ngmodel.html',\n  styleUrl: './input-datepicker-ngmodel.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InputDatepickerNgModelComponent {\n  date = signal<Date | null>(new Date());\n  time = signal<`${string}:${string}` | null>(\n    `${this.date()?.getHours() ?? '00'}:${this.date()?.getMinutes() ?? '00'}`\n  );\n\n  timeEffect = effect(() => {\n    const time = this.time();\n\n    if (time === null) return;\n\n    const [hours, minutes, seconds] = time.split(':');\n\n    this.date.update((x) => {\n      if (!x) return x;\n\n      const newDate = new Date(x);\n      newDate.setHours(parseInt(hours ?? '0'), parseInt(minutes ?? '0'), parseInt(seconds ?? '0'));\n\n      return newDate;\n    });\n  });\n}\n"
      },
      {
        name: "datepicker-sandbox",
        html: `<div class="controls">
  <sh-toggle class="raised primary" [(checked)]="disabled">Disabled</sh-toggle>
  <sh-toggle class="raised primary" [(checked)]="sharp">Sharp</sh-toggle>

  <sh-button-group class="type-b" [(value)]="colors">
    <button value="">Default</button>
    <button value="primary">Primary</button>
    <button value="accent">Accent</button>
    <button value="warn">Warn</button>
    <button value="error">Error</button>
    <button value="success">Success</button>
  </sh-button-group>

  <sh-button-group class="type-b" [(value)]="startOfWeek">
    <button value="1">Monday</button>
    <button value="2">Tuesday</button>
    <button value="3">Wednesday</button>
    <button value="4">Thursday</button>
    <button value="5">Friday</button>
    <button value="6">Saturday</button>
    <button value="0">Sunday</button>
  </sh-button-group>
</div>

<div class="content">
  <sh-datepicker
    class="raised"
    [class]="exampleClass()"
    [(date)]="date"
    [disabled]="disabled()"
    [startOfWeek]="startOfWeekComputed()" />

  <p>Selected date: {{ date() | date: 'mediumDate' }}</p>
</div>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButtonGroup, ShipDatepicker, ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-datepicker-sandbox',\n  standalone: true,\n  imports: [FormsModule, ShipDatepicker, ShipToggle, ShipButtonGroup, DatePipe],\n  templateUrl: './datepicker-sandbox.html',\n  styleUrl: './datepicker-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DatepickerSandbox {\n  date = signal<Date | null>(new Date());\n  disabled = signal(false);\n  sharp = signal(false);\n  startOfWeek = signal('1');\n  colors = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');\n\n  exampleClass = computed(() => this.colors() + ' ' + (this.sharp() ? 'sharp' : ''));\n\n  startOfWeekComputed = computed(() => parseInt(this.startOfWeek()));\n}\n"
      },
      {
        name: "range-datepicker",
        html: `<label for="range-datepicker">Select a date range:</label>
<sh-datepicker [(date)]="startDate" [(endDate)]="endDate" [asRange]="true"></sh-datepicker>
<p>Start: {{ startDate() ? (startDate() | date: 'mediumDate') : 'None' }}</p>
<p>End: {{ endDate() ? (endDate() | date: 'mediumDate') : 'None' }}</p>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipDatepicker } from 'ship-ui';\n\n@Component({\n  selector: 'app-range-datepicker',\n  standalone: true,\n  imports: [FormsModule, ShipDatepicker, DatePipe],\n  templateUrl: './range-datepicker.html',\n  styleUrl: './range-datepicker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RangeDatepicker {\n  startDate = signal<Date | null>(null);\n  endDate = signal<Date | null>(null);\n}\n"
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
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, ReactiveFormsModule } from '@angular/forms';\nimport { ShipDaterangeInput, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-range-input-datepicker',\n  standalone: true,\n  imports: [ReactiveFormsModule, ShipDaterangeInput, ShipIcon, DatePipe],\n  templateUrl: './range-input-datepicker.html',\n  styleUrl: './range-input-datepicker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RangeInputDatepicker {\n  startDate = new FormControl(new Date());\n  endDate = new FormControl(new Date(Date.now() + 86400000)); // Tomorrow\n}\n"
      },
      {
        name: "base-datepicker",
        html: `<label for="datepicker">Select a date:</label>
<sh-datepicker [(date)]="selectedDate"></sh-datepicker>
<p>Selected: {{ selectedDate() | date: 'mediumDate' }}</p>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipDatepicker } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-datepicker',\n  standalone: true,\n  imports: [FormsModule, ShipDatepicker, DatePipe],\n  templateUrl: './base-datepicker.html',\n  styleUrl: './base-datepicker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseDatepicker {\n  selectedDate = signal(new Date());\n}\n"
      },
      {
        name: "input-datepicker-reactive",
        html: `<sh-datepicker-input>
  <label>Date (Reactive Form)</label>
  <input type="text" [formControl]="dateControl" />
</sh-datepicker-input>
<p>Selected: {{ dateControl.value | date: 'mediumDate' }}</p>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, ReactiveFormsModule } from '@angular/forms';\nimport { ShipDatepickerInput } from 'ship-ui';\n\n@Component({\n  selector: 'app-input-datepicker-reactive',\n  standalone: true,\n  imports: [ReactiveFormsModule, ShipDatepickerInput, DatePipe],\n  templateUrl: './input-datepicker-reactive.html',\n  styleUrl: './input-datepicker-reactive.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InputDatepickerReactive {\n  dateControl = new FormControl(new Date());\n}\n"
      },
      {
        name: "range-datepicker-sandbox",
        html: `<div class="controls">
  <sh-toggle [(checked)]="disabled">Disabled</sh-toggle>

  <sh-button-group [(value)]="colors">
    <button value="">Default</button>
    <button value="primary">Primary</button>
    <button value="accent">Accent</button>
    <button value="warn">Warn</button>
    <button value="error">Error</button>
    <button value="success">Success</button>
  </sh-button-group>

  <sh-range-slider min="1" max="3">
    <label>Months to show</label>
    <input type="range" [(ngModel)]="monthsToShow" min="1" max="12" />
  </sh-range-slider>
</div>

<div class="content">
  <sh-datepicker
    [class]="colors()"
    [(date)]="startDate"
    [(endDate)]="endDate"
    [asRange]="true"
    [monthsToShow]="monthsToShow()"></sh-datepicker>
  <p>Start: {{ startDate() | date: 'mediumDate' }}</p>
  <p>End: {{ endDate() | date: 'mediumDate' }}</p>
</div>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButtonGroup, ShipDatepicker, ShipRangeSlider, ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-range-datepicker-sandbox',\n  standalone: true,\n  imports: [FormsModule, ShipDatepicker, ShipToggle, ShipRangeSlider, ShipButtonGroup, DatePipe],\n  templateUrl: './range-datepicker-sandbox.html',\n  styleUrl: './range-datepicker-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RangeDatepickerSandbox {\n  colors = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');\n  startDate = signal<Date | null>(new Date());\n  endDate = signal<Date | null>(new Date(Date.now() + 86400000));\n  disabled = signal(false);\n  monthsToShow = signal(2);\n}\n"
      }
    ]
  },
  {
    name: "ShipDaterangeInput",
    selector: "sh-daterange-input",
    path: "projects/ship-ui/src/lib/ship-datepicker/ship-daterange-input.ts",
    description: "### Selection\n\nSelected values are available via\n`date`\nand\n`endDate`\n. Use\n`[(date)]`\nand\n`[(endDate)]`\nfor two-way binding.\n\n### Configuration\n\nCustomize the picker behavior:\n\n<li>\n`asRange`\n: Enable range selection mode.\n</li>\n<li>\n`monthsToShow`\n: Set the number of months displayed (default: 1).\n</li>\n<li>\n`startOfWeek`\n: Specify the first day of the week (0-6).\n</li>\n<li>\n`weekdayLabels`\n: Provide custom labels for week days.\n</li>\n\n### Input Display\n\nCustomize how dates appear in inputs:\n\n<li>\n`masking`\n: Set the date format mask (e.g.,\n`'mediumDate'`\n).\n</li>\n<li>\n`size`\n: Use the\n`small`\nattribute/class for a compact input.\n</li>\n\n### Interaction\n\n<li>\n`closed`\n: Event emitted when the picker is dismissed.\n</li>\n<li>\n`disabled`\n: Standard attribute to disable interaction.\n</li>\n\n### Local Time & Timezones\n\nThe datepicker operates using standard native JavaScript\n`Date`\nobjects, so it automatically adapts to the user's operating system timezone.\n\n<strong>Testing different timezones:</strong>\nBecause it relies on the browser's native timezone API, you cannot spoof the timezone programmatically within the\ncomponent. To test how the datepicker looks and behaves in other regions, use your browser's Developer Tools. In\nChrome or Edge, open DevTools, press\n`Esc`\nto bring up the bottom drawer, find the\n<strong>Sensors</strong>\ntab, and change the Location override to a different city (e.g., Tokyo or London).",
    keywords: [
      "date",
      "picker",
      "calendar",
      "day",
      "month",
      "year",
      "time",
      "scheduling",
      "range"
    ],
    inputs: [
      {
        name: "monthsToShow",
        type: "number",
        description: "",
        defaultValue: "1"
      },
      {
        name: "masking",
        type: "any",
        description: "",
        defaultValue: "'mediumDate'"
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "",
        defaultValue: "false"
      }
    ],
    outputs: [
      {
        name: "closed",
        type: "{ start: Date | null; end: Date | null }",
        description: ""
      }
    ],
    methods: [
      {
        name: "effect",
        parameters: "() => {\n      const inputs = this.#inputObserver() as HTMLInputElement[];\n      if (inputs.length === 0) return;\n\n      if (inputs[0]) this.setupInput(inputs[0], true);\n      if (inputs[1]) this.setupInput(inputs[1], false);\n    });\n  }\n\n  private setupInput(element: HTMLInputElement, isStart: boolean",
        returnType: "any",
        description: ""
      },
      {
        name: "onFocusOut",
        parameters: "event: FocusEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "onStartDateChange",
        parameters: "date: Date | null",
        returnType: "any",
        description: ""
      },
      {
        name: "close",
        parameters: "",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: [
      {
        name: "input-datepicker-ngmodel",
        html: `<div class="row">
  <sh-datepicker-input class="primary sharp">
    <label>Date (ngModel)</label>
    <input type="text" [(ngModel)]="date" />
  </sh-datepicker-input>

  <sh-form-field class="autosize">
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
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipDatepickerInput, ShipFormField, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-input-datepicker-ngmodel',\n  standalone: true,\n  imports: [FormsModule, ShipDatepickerInput, ShipFormField, ShipIcon, DatePipe],\n  templateUrl: './input-datepicker-ngmodel.html',\n  styleUrl: './input-datepicker-ngmodel.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InputDatepickerNgModelComponent {\n  date = signal<Date | null>(new Date());\n  time = signal<`${string}:${string}` | null>(\n    `${this.date()?.getHours() ?? '00'}:${this.date()?.getMinutes() ?? '00'}`\n  );\n\n  timeEffect = effect(() => {\n    const time = this.time();\n\n    if (time === null) return;\n\n    const [hours, minutes, seconds] = time.split(':');\n\n    this.date.update((x) => {\n      if (!x) return x;\n\n      const newDate = new Date(x);\n      newDate.setHours(parseInt(hours ?? '0'), parseInt(minutes ?? '0'), parseInt(seconds ?? '0'));\n\n      return newDate;\n    });\n  });\n}\n"
      },
      {
        name: "datepicker-sandbox",
        html: `<div class="controls">
  <sh-toggle class="raised primary" [(checked)]="disabled">Disabled</sh-toggle>
  <sh-toggle class="raised primary" [(checked)]="sharp">Sharp</sh-toggle>

  <sh-button-group class="type-b" [(value)]="colors">
    <button value="">Default</button>
    <button value="primary">Primary</button>
    <button value="accent">Accent</button>
    <button value="warn">Warn</button>
    <button value="error">Error</button>
    <button value="success">Success</button>
  </sh-button-group>

  <sh-button-group class="type-b" [(value)]="startOfWeek">
    <button value="1">Monday</button>
    <button value="2">Tuesday</button>
    <button value="3">Wednesday</button>
    <button value="4">Thursday</button>
    <button value="5">Friday</button>
    <button value="6">Saturday</button>
    <button value="0">Sunday</button>
  </sh-button-group>
</div>

<div class="content">
  <sh-datepicker
    class="raised"
    [class]="exampleClass()"
    [(date)]="date"
    [disabled]="disabled()"
    [startOfWeek]="startOfWeekComputed()" />

  <p>Selected date: {{ date() | date: 'mediumDate' }}</p>
</div>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButtonGroup, ShipDatepicker, ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-datepicker-sandbox',\n  standalone: true,\n  imports: [FormsModule, ShipDatepicker, ShipToggle, ShipButtonGroup, DatePipe],\n  templateUrl: './datepicker-sandbox.html',\n  styleUrl: './datepicker-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DatepickerSandbox {\n  date = signal<Date | null>(new Date());\n  disabled = signal(false);\n  sharp = signal(false);\n  startOfWeek = signal('1');\n  colors = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');\n\n  exampleClass = computed(() => this.colors() + ' ' + (this.sharp() ? 'sharp' : ''));\n\n  startOfWeekComputed = computed(() => parseInt(this.startOfWeek()));\n}\n"
      },
      {
        name: "range-datepicker",
        html: `<label for="range-datepicker">Select a date range:</label>
<sh-datepicker [(date)]="startDate" [(endDate)]="endDate" [asRange]="true"></sh-datepicker>
<p>Start: {{ startDate() ? (startDate() | date: 'mediumDate') : 'None' }}</p>
<p>End: {{ endDate() ? (endDate() | date: 'mediumDate') : 'None' }}</p>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipDatepicker } from 'ship-ui';\n\n@Component({\n  selector: 'app-range-datepicker',\n  standalone: true,\n  imports: [FormsModule, ShipDatepicker, DatePipe],\n  templateUrl: './range-datepicker.html',\n  styleUrl: './range-datepicker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RangeDatepicker {\n  startDate = signal<Date | null>(null);\n  endDate = signal<Date | null>(null);\n}\n"
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
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, ReactiveFormsModule } from '@angular/forms';\nimport { ShipDaterangeInput, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-range-input-datepicker',\n  standalone: true,\n  imports: [ReactiveFormsModule, ShipDaterangeInput, ShipIcon, DatePipe],\n  templateUrl: './range-input-datepicker.html',\n  styleUrl: './range-input-datepicker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RangeInputDatepicker {\n  startDate = new FormControl(new Date());\n  endDate = new FormControl(new Date(Date.now() + 86400000)); // Tomorrow\n}\n"
      },
      {
        name: "base-datepicker",
        html: `<label for="datepicker">Select a date:</label>
<sh-datepicker [(date)]="selectedDate"></sh-datepicker>
<p>Selected: {{ selectedDate() | date: 'mediumDate' }}</p>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipDatepicker } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-datepicker',\n  standalone: true,\n  imports: [FormsModule, ShipDatepicker, DatePipe],\n  templateUrl: './base-datepicker.html',\n  styleUrl: './base-datepicker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseDatepicker {\n  selectedDate = signal(new Date());\n}\n"
      },
      {
        name: "input-datepicker-reactive",
        html: `<sh-datepicker-input>
  <label>Date (Reactive Form)</label>
  <input type="text" [formControl]="dateControl" />
</sh-datepicker-input>
<p>Selected: {{ dateControl.value | date: 'mediumDate' }}</p>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { FormControl, ReactiveFormsModule } from '@angular/forms';\nimport { ShipDatepickerInput } from 'ship-ui';\n\n@Component({\n  selector: 'app-input-datepicker-reactive',\n  standalone: true,\n  imports: [ReactiveFormsModule, ShipDatepickerInput, DatePipe],\n  templateUrl: './input-datepicker-reactive.html',\n  styleUrl: './input-datepicker-reactive.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InputDatepickerReactive {\n  dateControl = new FormControl(new Date());\n}\n"
      },
      {
        name: "range-datepicker-sandbox",
        html: `<div class="controls">
  <sh-toggle [(checked)]="disabled">Disabled</sh-toggle>

  <sh-button-group [(value)]="colors">
    <button value="">Default</button>
    <button value="primary">Primary</button>
    <button value="accent">Accent</button>
    <button value="warn">Warn</button>
    <button value="error">Error</button>
    <button value="success">Success</button>
  </sh-button-group>

  <sh-range-slider min="1" max="3">
    <label>Months to show</label>
    <input type="range" [(ngModel)]="monthsToShow" min="1" max="12" />
  </sh-range-slider>
</div>

<div class="content">
  <sh-datepicker
    [class]="colors()"
    [(date)]="startDate"
    [(endDate)]="endDate"
    [asRange]="true"
    [monthsToShow]="monthsToShow()"></sh-datepicker>
  <p>Start: {{ startDate() | date: 'mediumDate' }}</p>
  <p>End: {{ endDate() | date: 'mediumDate' }}</p>
</div>
`,
        ts: "import { DatePipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButtonGroup, ShipDatepicker, ShipRangeSlider, ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-range-datepicker-sandbox',\n  standalone: true,\n  imports: [FormsModule, ShipDatepicker, ShipToggle, ShipRangeSlider, ShipButtonGroup, DatePipe],\n  templateUrl: './range-datepicker-sandbox.html',\n  styleUrl: './range-datepicker-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RangeDatepickerSandbox {\n  colors = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');\n  startDate = signal<Date | null>(new Date());\n  endDate = signal<Date | null>(new Date(Date.now() + 86400000));\n  disabled = signal(false);\n  monthsToShow = signal(2);\n}\n"
      }
    ]
  },
  {
    name: "ShipButtonGroup",
    selector: "sh-button-group",
    path: "projects/ship-ui/src/lib/ship-button-group/ship-button-group.ts",
    description: '### Variants\n\nButton groups support different layouts via the\n`variant`\nattribute. Valid options:\n**default**\nand\n**type-b**\n.\n\n### Sizes\n\nUse the\n`size`\nattribute to change the scale of the group, e.g.,\n`size="small"`\n.\n\n### Active State\n\nApply the\n`active`\nattribute or class to a button within the group to highlight it as the current selection.',
    keywords: [
      "button",
      "group",
      "joined",
      "grouped",
      "cluster",
      "segment"
    ],
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipButtonGroupVariant | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "",
        defaultValue: "null"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--btng-bg",
        defaultValue: "var(--base-1)"
      },
      {
        name: "--btng-item-bg",
        defaultValue: "var(--base-3)"
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
        name: "--btng-p",
        defaultValue: "#{p2r(0 12)}"
      },
      {
        name: "--btng-s",
        defaultValue: "var(--shape-2)"
      },
      {
        name: "--btng-f",
        defaultValue: "var(--paragraph-30)"
      },
      {
        name: "--btng-s-a",
        defaultValue: "var(--shape-2)"
      }
    ],
    examples: [
      {
        name: "base-button-group",
        html: '<sh-button-group [class.small]="small()" [class]="type()">\n  @for (item of items(); track $index; let idx = $index) {\n    <button [class.active]="activeIndex() === idx" (click)="updateActiveIndex(idx)">\n      <sh-icon>circle</sh-icon>\n      Hello\n    </button>\n  }\n</sh-button-group>\n\n<sh-button-group [class.small]="small()" [class]="type()" [(value)]="selected">\n  <button value="one">One</button>\n  <button value="two">Two</button>\n  <button value="three">Three</button>\n  <button value="four">Four</button>\n  <button value="five">Five</button>\n</sh-button-group>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipButtonGroup, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-button-group',\n  imports: [ShipButtonGroup, ShipIcon],\n  templateUrl: './base-button-group.html',\n  styleUrl: './base-button-group.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseButtonGroup {\n  small = input<boolean>(false);\n  type = input<'' | 'type-b'>('');\n  activeIndex = signal<number | null>(0);\n  selected = signal<string | null>('one');\n\n  items = signal(new Array(5).fill(0));\n\n  updateActiveIndex(newIndex: number) {\n    this.activeIndex.set(newIndex === this.activeIndex() ? null : newIndex);\n  }\n}\n"
      }
    ]
  },
  {
    name: "ShipPopover",
    selector: "sh-popover",
    path: "projects/ship-ui/src/lib/ship-popover/ship-popover.ts",
    description: "### Hover Trigger\n\nUse the\n`onHover`\nattribute or binding to open the popover on hover instead of click.\n\n### Nesting\n\nUse the\n`asMultiLayer`\nattribute to enable nested popover support.\n\n### Customization\n\nThe\n`options`\nattribute accepts a configuration object with:\n`width`\n,\n`height`\n,\n`closeOnButton`\n, and\n`closeOnEsc`\n.",
    keywords: [
      "popover",
      "tooltip",
      "dropdown",
      "flyout",
      "overlay",
      "popup"
    ],
    inputs: [
      {
        name: "asMultiLayer",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "asSheetOnMobile",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "disableOpenByClick",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "options",
        type: "Partial<ShipPopoverOptions>",
        description: ""
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "",
        defaultValue: "false"
      }
    ],
    outputs: [
      {
        name: "closed",
        type: "void",
        description: ""
      }
    ],
    methods: [
      {
        name: "toggleIsOpen",
        parameters: "event: MouseEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "eventClose",
        parameters: "$event: MouseEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "while",
        parameters: "parent",
        returnType: "any",
        description: ""
      },
      {
        name: "return",
        parameters: "pos.left >= 0 &&\n      pos.top >= 0 &&\n      pos.left + m.width <= window.innerWidth &&\n      pos.top + m.height <= window.innerHeight\n    );\n  }\n\n  /** Clamp a position so the popover stays within the viewport */\n  #clampToViewport(pos: { left: number; top: number }, m: DOMRect",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [
      {
        name: "--po-d",
        defaultValue: "block"
      }
    ],
    examples: [
      {
        name: "sh-button-popover",
        html: "<sh-popover>\n  <a shButton>hello im a shButton trigger</a>\n  hello im content\n</sh-popover>\n",
        ts: "import { Component } from '@angular/core';\nimport { ShipButton, ShipPopover } from 'ship-ui';\n\n@Component({\n  selector: 'sh-button-popover',\n  standalone: true,\n  imports: [ShipPopover, ShipButton],\n  templateUrl: './sh-button-popover.html',\n  styleUrl: './sh-button-popover.scss',\n})\nexport class ShButtonPopover {}\n"
      },
      {
        name: "trigger-attribute-popover",
        html: "<sh-popover>\n  <div trigger>hello im a div trigger</div>\n  hello im content\n</sh-popover>\n",
        ts: "import { Component } from '@angular/core';\nimport { ShipPopover } from 'ship-ui';\n\n@Component({\n  selector: 'trigger-attribute-popover',\n  standalone: true,\n  imports: [ShipPopover],\n  templateUrl: './trigger-attribute-popover.html',\n  styleUrl: './trigger-attribute-popover.scss',\n})\nexport class TriggerAttributePopover {}\n"
      },
      {
        name: "button-popover",
        html: "<sh-popover>\n  <button>hello im a trigger plain button trigger</button>\n  hello im content\n</sh-popover>\n",
        ts: "import { Component } from '@angular/core';\nimport { ShipPopover } from 'ship-ui';\n\n@Component({\n  selector: 'button-popover',\n  standalone: true,\n  imports: [ShipPopover],\n  templateUrl: './button-popover.html',\n  styleUrl: './button-popover.scss',\n})\nexport class ButtonPopover {}\n"
      }
    ]
  },
  {
    name: "ShipButton",
    selector: "[shButton]",
    path: "projects/ship-ui/src/lib/ship-button/ship-button.ts",
    description: '### Variants\n\nButton variants can be set using the\n`variant`\nattribute. Valid options are:\n**simple**\n,\n**outlined**\n,\n**flat**\n, and\n**raised**\n.\n\n### Sizes\n\nButton sizes can be set using the\n`size`\nattribute. For example:\n`size="small"`\n.\n\n### Colors\n\nButton colors can be set using the\n`color`\nattribute. Valid options are:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**error**\n, and\n**success**\n.\n\n### Loading\n\nThe button can be set to loading state by adding the\n`loading`\nclass.\n\n### Readonly\n\nThe button can be set to readonly through the\n`readonly`\ninput (adds the\n`readonly`\nclass) or the standard\n`readonly`\nattribute.\n\n### Rotate icon\n\nIcons within the button can be rotated by adding the\n`rotated-icon`\nclass.\n\n### Disabled\n\nThe button can be disabled using the standard\n`disabled`\nattribute or\n`[disabled]`\nbinding.\n\n:::info\nThis component utilizes the **Ship Sheet** utility for its visual structure. It supports standard sheet variations and is affected by global sheet variables.\n:::',
    keywords: [],
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "size",
        type: "ShipButtonSize | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "readonly",
        type: "boolean",
        description: "",
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
        name: "--btn-a-opacity",
        defaultValue: "0.05"
      },
      {
        name: "--btn-bs",
        defaultValue: "var(--box-shadow-10)"
      },
      {
        name: "--btn-ir",
        defaultValue: "180deg"
      }
    ],
    examples: [
      {
        name: "flat-button",
        html: '<button shButton variant="flat">\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="flat">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="flat" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="flat" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="flat" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="flat" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="flat" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="flat" disabled>\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon>circle</sh-icon>\n</button>\n\n<a shButton variant="flat" href="https://www.google.com/" target="_blank">Link</a>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-flat-button',\n  imports: [ShipIcon, ShipButton],\n  templateUrl: './flat-button.html',\n  styleUrl: './flat-button.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FlatButton {}\n"
      },
      {
        name: "raised-button",
        html: '<button shButton variant="raised">\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="raised">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="raised" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="raised" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="raised" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="raised" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="raised" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="raised" disabled>\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon>circle</sh-icon>\n</button>\n<a shButton variant="raised" href="https://www.google.com/" target="_blank">Link</a>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-raised-button',\n  imports: [ShipIcon, ShipButton],\n  templateUrl: './raised-button.html',\n  styleUrl: './raised-button.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RaisedButton {}\n"
      },
      {
        name: "simple-button",
        html: '<button shButton variant="simple">\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="simple">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="simple" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="simple" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="simple" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="simple" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="simple" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="simple" disabled>\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon>circle</sh-icon>\n</button>\n\n<a shButton variant="simple" href="https://www.google.com/" target="_blank">Link</a>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-simple-button',\n  imports: [ShipIcon, ShipButton],\n  templateUrl: './simple-button.html',\n  styleUrl: './simple-button.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SimpleButton {}\n"
      },
      {
        name: "outlined-button",
        html: '<button shButton variant="outlined">\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="outlined">\n  <sh-icon>circle</sh-icon>\n  Basic\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="outlined" color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="outlined" color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="outlined" color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="outlined" color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="outlined" color="success">\n  <sh-icon>circle</sh-icon>\n  Success\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton variant="outlined" disabled>\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon>circle</sh-icon>\n</button>\n\n<a shButton variant="outlined" href="https://www.google.com/" target="_blank">Link</a>\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-outlined-button',\n  imports: [ShipIcon, ShipButton],\n  templateUrl: './outlined-button.html',\n  styleUrl: './outlined-button.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OutlinedButton {}\n"
      },
      {
        name: "base-button",
        html: '<!-- Using attribute inputs -->\n<button shButton>\n  <sh-icon>caret-down</sh-icon>\n</button>\n\n<button shButton>\n  <sh-icon>caret-down</sh-icon>\n</button>\n\n<button shButton>\n  <sh-icon>circle</sh-icon>\n  Default\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton color="primary">\n  <sh-icon>circle</sh-icon>\n  Primary\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton color="accent">\n  <sh-icon>circle</sh-icon>\n  Accent\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton color="warn">\n  <sh-icon>circle</sh-icon>\n  Warn\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton color="error">\n  <sh-icon>circle</sh-icon>\n  Error\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton color="success">\n  <sh-icon>circle</sh-icon>\n  success\n  <sh-icon>circle</sh-icon>\n</button>\n\n<button shButton disabled>\n  <sh-icon>circle</sh-icon>\n  Disabled\n  <sh-icon>circle</sh-icon>\n</button>\n\n<a shButton href="https://www.google.com/" target="_blank">Link</a>\n\n<!-- Alternative: Using CSS classes -->\n<!--\n<button shButton class="primary">Primary</button>\n<button shButton class="raised primary">Raised Primary</button>\n-->\n',
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipButton, ShipIcon } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-button',\n  imports: [ShipIcon, ShipButton],\n  templateUrl: './base-button.html',\n  styleUrl: './base-button.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseButton {}\n"
      },
      {
        name: "button-sandbox",
        html: '<div class="controls">\n  <p>Controls</p>\n  <header>\n    <div class="row">\n      <!-- <sh-toggle [(checked)]="isSmall" class="primary raised">Small</sh-toggle> -->\n\n      <sh-button-group class="small type-b" [(value)]="sizeClass">\n        <button value="">Normal</button>\n        <button value="small">Small</button>\n        <button value="xsmall">XSmall</button>\n      </sh-button-group>\n\n      <sh-toggle [(checked)]="isRotated" color="primary" variant="raised">Rotated</sh-toggle>\n      <sh-toggle [(checked)]="isLoading" color="primary" variant="raised">Loading</sh-toggle>\n      <sh-toggle [(checked)]="isDisabled" color="primary" variant="raised">Disabled</sh-toggle>\n      <sh-toggle [(checked)]="isReadonly" color="primary" variant="raised">Readonly</sh-toggle>\n    </div>\n\n    <div class="row">\n      <sh-button-group class="small type-b" [(value)]="colorClass">\n        <button value="">Default</button>\n        <button value="primary">Primary</button>\n        <button value="accent">Accent</button>\n        <button value="warn">Warn</button>\n        <button value="error">Error</button>\n        <button value="success">Success</button>\n      </sh-button-group>\n\n      <sh-button-group class="small type-b" [(value)]="variationClass">\n        <button value="">Default</button>\n        <button value="simple">Simple</button>\n        <button value="outlined">Outlined</button>\n        <button value="flat">Flat</button>\n        <button value="raised">Raised</button>\n      </sh-button-group>\n    </div>\n  </header>\n</div>\n\n<div class="sandbox">\n  <button\n    shButton\n    [color]="colorClass()"\n    [variant]="variationClass()"\n    [size]="sizeClass()"\n    [class.loading]="isLoading()"\n    [class.rotated-icon]="isRotated()"\n    [disabled]="isDisabled()"\n    [attr.readonly]="isReadonly() ? true : null">\n    <sh-icon>caret-down</sh-icon>\n  </button>\n\n  <button\n    shButton\n    [color]="colorClass()"\n    [variant]="variationClass()"\n    [size]="sizeClass()"\n    [class.loading]="isLoading()"\n    [class.rotated-icon]="isRotated()"\n    [disabled]="isDisabled()"\n    [attr.readonly]="isReadonly() ? true : null">\n    <sh-icon>caret-down</sh-icon>\n    Default\n    <sh-icon>caret-down</sh-icon>\n  </button>\n\n  <button\n    shButton\n    [color]="colorClass()"\n    [variant]="variationClass()"\n    [size]="sizeClass()"\n    [class.loading]="isLoading()"\n    [class.rotated-icon]="isRotated()"\n    [disabled]="isDisabled()"\n    [attr.readonly]="isReadonly() ? true : null">\n    <sh-icon>caret-down</sh-icon>\n    Primary\n  </button>\n\n  <button\n    shButton\n    [color]="colorClass()"\n    [variant]="variationClass()"\n    [size]="sizeClass()"\n    [class.loading]="isLoading()"\n    [class.rotated-icon]="isRotated()"\n    [disabled]="isDisabled()"\n    [attr.readonly]="isReadonly() ? true : null">\n    Primary\n    <sh-icon>caret-down</sh-icon>\n  </button>\n</div>\n',
        ts: "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { ShipButton, ShipButtonGroup, ShipIcon, ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-button-sandbox',\n  imports: [ShipButton, ShipButtonGroup, ShipIcon, ShipToggle],\n  templateUrl: './button-sandbox.html',\n  styleUrl: './button-sandbox.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ButtonSandbox {\n  isSmall = signal<boolean>(false);\n  isRotated = signal<boolean>(false);\n  isLoading = signal<boolean>(false);\n  isDisabled = signal<boolean>(false);\n  isReadonly = signal<boolean>(false);\n\n  sizeClass = signal<'' | 'small' | 'xsmall'>('');\n  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');\n  variationClass = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');\n  exampleClass = computed(() => this.colorClass() + ' ' + this.variationClass() + ' ' + this.sizeClass());\n}\n"
      }
    ]
  },
  {
    name: "ShipDivider",
    selector: "sh-divider",
    path: "projects/ship-ui/src/lib/ship-divider/ship-divider.ts",
    description: "### Orientation\n\nUse the\n`&lt;sh-divider&gt;`\nelement to visually separate sections. By default, it is horizontal.\n\n### Content\n\nYou can place text or icons inside the divider tags to create a divider with integrated content:\n`&lt;sh-divider&gt;OR&lt;/sh-divider&gt;`\n.",
    keywords: [
      "divider",
      "separator",
      "line",
      "hr",
      "rule"
    ],
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
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipDivider } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-divider',\n  standalone: true,\n  imports: [ShipDivider],\n  templateUrl: './base-divider.html',\n  styleUrl: './base-divider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseDivider {}\n"
      },
      {
        name: "text-divider",
        html: "<div>Above the divider</div>\n<sh-divider>Text in divider</sh-divider>\n<div>Below the divider</div>\n",
        ts: "import { ChangeDetectionStrategy, Component } from '@angular/core';\nimport { ShipDivider } from 'ship-ui';\n\n@Component({\n  selector: 'app-text-divider',\n  standalone: true,\n  imports: [ShipDivider],\n  templateUrl: './text-divider.html',\n  styleUrl: './text-divider.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class TextDividerComponent {}\n"
      }
    ]
  },
  {
    name: "ShipColorPicker",
    selector: "sh-color-picker",
    path: "projects/ship-ui/src/lib/ship-color-picker/ship-color-picker.ts",
    description: '### Rendering Type\n\nThe visual layout of the color picker can be controlled using the\n`renderingType`\ninput. Valid options are:\n**hsl**\n,\n**grid**\n,\n**hue**\n,\n**rgb**\n,\n**saturation**\n, and\n**alpha**\n.\n\n### Format\n\nFor the\n`sh-color-picker-input`\ncomponent, the string format of the selected color can be controlled using the\n`format`\ninput. Valid options are:\n**rgb**\n,\n**rgba**\n,\n**hex**\n,\n**hex8**\n,\n**hsl**\n, and\n**hsla**\n.\n\n### Direction\n\nThe\n`direction`\ninput controls the layout axis for linear renderers like\n**hue**\n,\n**alpha**\n, and\n**saturation**\ngrids. Valid options are:\n**horizontal**\nand\n**vertical**\n.\n\n<h4>\nEye Dropper\n<sh-chip size="xsmall">Only in natively supporting browsers</sh-chip>\n</h4>\n\nThe\n`sh-color-picker-input`\ncomponent includes an eye dropper button to pick a color from the screen natively. It can be toggled using the\n`showEyeDropper`\ninput.',
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
    ],
    inputs: [
      {
        name: "showDarkColors",
        type: "any",
        description: "",
        defaultValue: "false"
      },
      {
        name: "renderingType",
        type: "'hsl' | 'grid' | 'hue' | 'rgb' | 'saturation' | 'alpha'",
        description: "",
        defaultValue: "'hsl'"
      },
      {
        name: "gridSize",
        type: "any",
        description: "",
        defaultValue: "20"
      },
      {
        name: "direction",
        type: "'horizontal' | 'vertical'",
        description: "",
        defaultValue: "'horizontal'"
      },
      {
        name: "hue",
        type: "any",
        description: "",
        defaultValue: "0"
      },
      {
        name: "selectedColor",
        type: "[R, G, B, A?]",
        description: "",
        defaultValue: "[255"
      },
      {
        name: "alpha",
        type: "any",
        description: "",
        defaultValue: "1"
      }
    ],
    outputs: [],
    methods: [
      {
        name: "untracked",
        parameters: "() => this.drawColorPicker());\n\n      if (this.previousLayoutHash !== layoutHash",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: [
      {
        name: "base-color-picker",
        html: `<sh-button-group [(value)]="renderingType" class="type-b">
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
  <sh-button-group [(value)]="inputRenderType" class="type-b">
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
        ts: "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButtonGroup, ShipColorPicker, ShipColorPickerInput, ShipIcon, ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-color-picker',\n  imports: [FormsModule, ShipColorPicker, ShipButtonGroup, ShipIcon, ShipToggle, ShipColorPickerInput],\n  templateUrl: './base-color-picker.html',\n  styleUrl: './base-color-picker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseColorPicker {\n  renderingType = signal<'hsl' | 'rgb' | 'grid' | 'hue' | 'saturation' | 'alpha'>('hsl');\n  aColor = signal<[number, number, number, number?]>([255, 255, 255]);\n  currentColor = signal<{\n    rgb: string;\n    rgba: string;\n    hex: string;\n    hex8: string;\n    hsl: string;\n    hsla: string;\n    hue: number;\n    saturation: number;\n    alpha: number;\n  } | null>(null);\n  showDarkColors = signal(false);\n  direction = signal(false);\n  selectedHue = signal(0);\n  inputValue = signal('rgba(255, 0, 0, 0.5)');\n\n  inputRenderType = signal<'hsl' | 'rgb' | 'hex'>('rgb');\n  showAlpha = signal(true);\n  computedRenderType = computed(() => {\n    const inputRenderType = this.inputRenderType();\n    const showAlpha = this.showAlpha();\n    if (inputRenderType === 'hsl') {\n      return showAlpha ? 'hsla' : 'hsl';\n    }\n    if (inputRenderType === 'rgb') {\n      return showAlpha ? 'rgba' : 'rgb';\n    }\n    if (inputRenderType === 'hex') {\n      return showAlpha ? 'hex8' : 'hex';\n    }\n\n    return 'hsl';\n  });\n}\n"
      }
    ]
  },
  {
    name: "ShipColorPickerInput",
    selector: "sh-color-picker-input",
    path: "projects/ship-ui/src/lib/ship-color-picker/ship-color-picker-input.ts",
    description: '### Rendering Type\n\nThe visual layout of the color picker can be controlled using the\n`renderingType`\ninput. Valid options are:\n**hsl**\n,\n**grid**\n,\n**hue**\n,\n**rgb**\n,\n**saturation**\n, and\n**alpha**\n.\n\n### Format\n\nFor the\n`sh-color-picker-input`\ncomponent, the string format of the selected color can be controlled using the\n`format`\ninput. Valid options are:\n**rgb**\n,\n**rgba**\n,\n**hex**\n,\n**hex8**\n,\n**hsl**\n, and\n**hsla**\n.\n\n### Direction\n\nThe\n`direction`\ninput controls the layout axis for linear renderers like\n**hue**\n,\n**alpha**\n, and\n**saturation**\ngrids. Valid options are:\n**horizontal**\nand\n**vertical**\n.\n\n<h4>\nEye Dropper\n<sh-chip size="xsmall">Only in natively supporting browsers</sh-chip>\n</h4>\n\nThe\n`sh-color-picker-input`\ncomponent includes an eye dropper button to pick a color from the screen natively. It can be toggled using the\n`showEyeDropper`\ninput.',
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
    ],
    inputs: [
      {
        name: "renderingType",
        type: "'hsl' | 'grid' | 'hue' | 'rgb' | 'saturation' | 'alpha'",
        description: "",
        defaultValue: "'hsl'"
      },
      {
        name: "format",
        type: "'rgb' | 'rgba' | 'hex' | 'hex8' | 'hsl' | 'hsla'",
        description: "",
        defaultValue: "'rgb'"
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipFormFieldVariant | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "readonly",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "showEyeDropper",
        type: "boolean",
        description: "",
        defaultValue: "true"
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "",
        defaultValue: "false"
      }
    ],
    outputs: [
      {
        name: "closed",
        type: "string",
        description: ""
      }
    ],
    methods: [
      {
        name: "onMainColorChange",
        parameters: "colorObj: any",
        returnType: "any",
        description: ""
      },
      {
        name: "onHuePickerChange",
        parameters: "colorObj: any",
        returnType: "any",
        description: ""
      },
      {
        name: "close",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "get",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "set",
        parameters: "newVal",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: [
      {
        name: "base-color-picker",
        html: `<sh-button-group [(value)]="renderingType" class="type-b">
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
  <sh-button-group [(value)]="inputRenderType" class="type-b">
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
        ts: "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButtonGroup, ShipColorPicker, ShipColorPickerInput, ShipIcon, ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-color-picker',\n  imports: [FormsModule, ShipColorPicker, ShipButtonGroup, ShipIcon, ShipToggle, ShipColorPickerInput],\n  templateUrl: './base-color-picker.html',\n  styleUrl: './base-color-picker.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseColorPicker {\n  renderingType = signal<'hsl' | 'rgb' | 'grid' | 'hue' | 'saturation' | 'alpha'>('hsl');\n  aColor = signal<[number, number, number, number?]>([255, 255, 255]);\n  currentColor = signal<{\n    rgb: string;\n    rgba: string;\n    hex: string;\n    hex8: string;\n    hsl: string;\n    hsla: string;\n    hue: number;\n    saturation: number;\n    alpha: number;\n  } | null>(null);\n  showDarkColors = signal(false);\n  direction = signal(false);\n  selectedHue = signal(0);\n  inputValue = signal('rgba(255, 0, 0, 0.5)');\n\n  inputRenderType = signal<'hsl' | 'rgb' | 'hex'>('rgb');\n  showAlpha = signal(true);\n  computedRenderType = computed(() => {\n    const inputRenderType = this.inputRenderType();\n    const showAlpha = this.showAlpha();\n    if (inputRenderType === 'hsl') {\n      return showAlpha ? 'hsla' : 'hsl';\n    }\n    if (inputRenderType === 'rgb') {\n      return showAlpha ? 'rgba' : 'rgb';\n    }\n    if (inputRenderType === 'hex') {\n      return showAlpha ? 'hex8' : 'hex';\n    }\n\n    return 'hsl';\n  });\n}\n"
      }
    ]
  },
  {
    name: "ShipDialogService",
    selector: "ship-dialog-service",
    path: "projects/ship-ui/src/lib/ship-dialog/ship-dialog.service.ts",
    description: "### Customization\n\nThe\n`options`\nattribute accepts a configuration object for:\n`width`\n,\n`height`\n,\n`maxWidth`\n,\n`maxHeight`\n,\n`closeOnButton`\n,\n`closeOnEsc`\n, and\n`closeOnOutsideClick`\n.\n\n### Variants\n\nDialogs support multiple layouts via the\n`variant`\nattribute. Valid options:\n**default**\nand\n**type-b**\n.\n\n### Slots\n\nStructure your dialog content using the\n`header`\n,\n`content`\n, and\n`footer`\nattributes on container elements.",
    keywords: [
      "dialog",
      "modal",
      "popup",
      "overlay",
      "alert",
      "confirm",
      "window"
    ],
    inputs: [],
    outputs: [],
    methods: [
      {
        name: "open",
        parameters: "componentOrTemplate: Type<I> | (I extends TemplateRef<any> ? I : never),\n    options?: _Options",
        returnType: "I extends TemplateRef<any> ? ShipDialogTemplateInstance<I> : ShipDialogInstance<I>;\n  open<T = any, K = ComponentDataType<T>, U = ComponentClosedType<T>>(\n    componentOrTemplate: Type<T> | TemplateRef<any>,\n    options?: any\n  ): ShipDialogInstance<any>",
        description: ""
      }
    ],
    cssVariables: [],
    examples: [
      {
        name: "basic-dynamic-dialog",
        html: '<button shButton (click)="openDialog()">Open Basic Dialog</button>\n',
        ts: "import { Component, inject, input, signal } from '@angular/core';\nimport { ShipButton, ShipDialogService } from 'ship-ui';\n\n@Component({\n  selector: 'basic-dynamic-dialog',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './basic-dynamic-dialog.html',\n  styleUrl: './basic-dynamic-dialog.scss',\n})\nexport class BasicDynamicDialog {\n  #dialog = inject(ShipDialogService);\n\n  type = input<string>();\n\n  openDialog() {\n    const dialogRef = this.#dialog.open(SimpleDialogContentComponent, {\n      data: { message: 'hllo', yellow: true, hello: true },\n      class: this.type() ?? '',\n    });\n  }\n}\n\n@Component({\n  selector: 'simple-dialog-content',\n  standalone: true,\n  template: `\n    <div style=\"padding: 2rem;\">Hello from a basic dialog!</div>\n  `,\n})\nclass SimpleDialogContentComponent {\n  hello = signal<string>('hello');\n  data = input<{ message: string; yellow: boolean; hello: boolean }>();\n  // closed = output<string>();\n}\n"
      },
      {
        name: "dialog-as-component",
        html: '<button shButton (click)="openDialog()" [class.type]="type()">Open dialog as component</button>\n\n<sh-dialog [(isOpen)]="isOpen" (closed)="close()">hello im dialog content</sh-dialog>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipButton, ShipDialog } from 'ship-ui';\n\n@Component({\n  selector: 'app-dialog-as-component',\n  imports: [ShipDialog, ShipButton],\n  templateUrl: './dialog-as-component.html',\n  styleUrl: './dialog-as-component.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DialogAsComponent {\n  type = input<string>();\n\n  isOpen = signal(false);\n\n  openDialog() {\n    this.isOpen.set(true);\n  }\n\n  close() {\n    this.isOpen.set(false);\n  }\n}\n"
      },
      {
        name: "template-dialog",
        html: '<button shButton (click)="openTemplateDialog(myDialog)">Open Template Dialog</button>\n\n<ng-template #myDialog let-data let-close="close">\n  <div content>\n    <h2>{{ data.message }}</h2>\n    <p>This dialog is rendered entirely from a TemplateRef.</p>\n    <div>\n      <button shButton (click)="close()">Close Dialog</button>\n    </div>\n  </div>\n</ng-template>\n',
        ts: "import { Component, inject, input, TemplateRef } from '@angular/core';\nimport { ShipButton, ShipDialogService } from 'ship-ui';\n\n@Component({\n  selector: 'template-dialog',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './template-dialog.html',\n  styleUrl: './template-dialog.scss',\n})\nexport class TemplateDialog {\n  #dialog = inject(ShipDialogService);\n  type = input<string>();\n\n  openTemplateDialog(template: TemplateRef<any>) {\n    this.#dialog.open(template, {\n      data: { message: 'Hello from Template!' },\n      class: this.type() || '',\n    });\n  }\n}\n"
      },
      {
        name: "data-passing-dialog",
        html: '<button shButton (click)="openDialog()">Open Data Passing hi Dialog</button>\n',
        ts: "import { Component, inject, input, output } from '@angular/core';\nimport { ShipButton, ShipDialogService } from 'ship-ui';\n\n@Component({\n  selector: 'data-passing-dialog',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './data-passing-dialog.html',\n  styleUrl: './data-passing-dialog.scss',\n})\nexport class DataPassingDialog {\n  #dialog = inject(ShipDialogService);\n\n  type = input<string>();\n\n  openDialog() {\n    const dialogRef = this.#dialog.open(DataDialogContent, {\n      class: this.type() ?? '',\n      data: { message: 'Hello from parent!', hello: true },\n      closed: (result) => {\n        // Keep so we can easily see if the types break\n        const someString: string = result;\n        console.log('Dialog function closed with: \\t' + someString);\n      },\n    });\n\n    dialogRef.component.closed.subscribe((res) => {\n      console.log('Dialog component closed: \\t', res);\n    });\n\n    dialogRef.closed.subscribe((res) => {\n      console.log('Dialog ref closed: \\t', res);\n    });\n  }\n}\n\n@Component({\n  selector: 'data-dialog-content',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './data-dialog-content.html',\n  styleUrl: './data-dialog-content.scss',\n})\nclass DataDialogContent {\n  data = input<{ message: string; hello: boolean }>();\n  closed = output<string>();\n\n  closeWithValue() {\n    console.log('closeWithValue');\n    this.closed.emit('Some value from dialog');\n  }\n}\n"
      },
      {
        name: "header-footer-dialog",
        html: '<button shButton (click)="openDialog()">Open Header/Footer Dialog</button>\n',
        ts: "import { Component, inject, input, output, signal } from '@angular/core';\nimport { ShipButton, ShipDialogService } from 'ship-ui';\n\n@Component({\n  selector: 'header-footer-dialog',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './header-footer-dialog.html',\n  styleUrl: './header-footer-dialog.scss',\n})\nexport class HeaderFooterDialog {\n  #dialog = inject(ShipDialogService);\n\n  type = input<string>();\n\n  openDialog() {\n    this.#dialog.open(HeaderFooterDialogContent, {\n      class: this.type() ?? '',\n    });\n  }\n}\n\n@Component({\n  selector: 'header-footer-dialog-content',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './header-footer-dialog-content.html',\n  styleUrl: './header-footer-dialog-content.scss',\n})\nclass HeaderFooterDialogContent {\n  closed = output<boolean>();\n\n  stickyHeader = signal(false);\n  stickyFooter = signal(false);\n}\n"
      }
    ]
  },
  {
    name: "ShipDialog",
    selector: "sh-dialog",
    path: "projects/ship-ui/src/lib/ship-dialog/ship-dialog.ts",
    description: "### Customization\n\nThe\n`options`\nattribute accepts a configuration object for:\n`width`\n,\n`height`\n,\n`maxWidth`\n,\n`maxHeight`\n,\n`closeOnButton`\n,\n`closeOnEsc`\n, and\n`closeOnOutsideClick`\n.\n\n### Variants\n\nDialogs support multiple layouts via the\n`variant`\nattribute. Valid options:\n**default**\nand\n**type-b**\n.\n\n### Slots\n\nStructure your dialog content using the\n`header`\n,\n`content`\n, and\n`footer`\nattributes on container elements.",
    keywords: [
      "dialog",
      "modal",
      "popup",
      "overlay",
      "alert",
      "confirm",
      "window"
    ],
    inputs: [
      {
        name: "options",
        type: "Partial<ShipDialogOptions>",
        description: ""
      },
      {
        name: "isOpen",
        type: "boolean",
        description: "",
        defaultValue: "false"
      }
    ],
    outputs: [
      {
        name: "closed",
        type: "void",
        description: ""
      }
    ],
    methods: [],
    cssVariables: [
      {
        name: "--dialog-p",
        defaultValue: "#{p2r(16)}"
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
      }
    ],
    examples: [
      {
        name: "basic-dynamic-dialog",
        html: '<button shButton (click)="openDialog()">Open Basic Dialog</button>\n',
        ts: "import { Component, inject, input, signal } from '@angular/core';\nimport { ShipButton, ShipDialogService } from 'ship-ui';\n\n@Component({\n  selector: 'basic-dynamic-dialog',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './basic-dynamic-dialog.html',\n  styleUrl: './basic-dynamic-dialog.scss',\n})\nexport class BasicDynamicDialog {\n  #dialog = inject(ShipDialogService);\n\n  type = input<string>();\n\n  openDialog() {\n    const dialogRef = this.#dialog.open(SimpleDialogContentComponent, {\n      data: { message: 'hllo', yellow: true, hello: true },\n      class: this.type() ?? '',\n    });\n  }\n}\n\n@Component({\n  selector: 'simple-dialog-content',\n  standalone: true,\n  template: `\n    <div style=\"padding: 2rem;\">Hello from a basic dialog!</div>\n  `,\n})\nclass SimpleDialogContentComponent {\n  hello = signal<string>('hello');\n  data = input<{ message: string; yellow: boolean; hello: boolean }>();\n  // closed = output<string>();\n}\n"
      },
      {
        name: "dialog-as-component",
        html: '<button shButton (click)="openDialog()" [class.type]="type()">Open dialog as component</button>\n\n<sh-dialog [(isOpen)]="isOpen" (closed)="close()">hello im dialog content</sh-dialog>\n',
        ts: "import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';\nimport { ShipButton, ShipDialog } from 'ship-ui';\n\n@Component({\n  selector: 'app-dialog-as-component',\n  imports: [ShipDialog, ShipButton],\n  templateUrl: './dialog-as-component.html',\n  styleUrl: './dialog-as-component.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DialogAsComponent {\n  type = input<string>();\n\n  isOpen = signal(false);\n\n  openDialog() {\n    this.isOpen.set(true);\n  }\n\n  close() {\n    this.isOpen.set(false);\n  }\n}\n"
      },
      {
        name: "template-dialog",
        html: '<button shButton (click)="openTemplateDialog(myDialog)">Open Template Dialog</button>\n\n<ng-template #myDialog let-data let-close="close">\n  <div content>\n    <h2>{{ data.message }}</h2>\n    <p>This dialog is rendered entirely from a TemplateRef.</p>\n    <div>\n      <button shButton (click)="close()">Close Dialog</button>\n    </div>\n  </div>\n</ng-template>\n',
        ts: "import { Component, inject, input, TemplateRef } from '@angular/core';\nimport { ShipButton, ShipDialogService } from 'ship-ui';\n\n@Component({\n  selector: 'template-dialog',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './template-dialog.html',\n  styleUrl: './template-dialog.scss',\n})\nexport class TemplateDialog {\n  #dialog = inject(ShipDialogService);\n  type = input<string>();\n\n  openTemplateDialog(template: TemplateRef<any>) {\n    this.#dialog.open(template, {\n      data: { message: 'Hello from Template!' },\n      class: this.type() || '',\n    });\n  }\n}\n"
      },
      {
        name: "data-passing-dialog",
        html: '<button shButton (click)="openDialog()">Open Data Passing hi Dialog</button>\n',
        ts: "import { Component, inject, input, output } from '@angular/core';\nimport { ShipButton, ShipDialogService } from 'ship-ui';\n\n@Component({\n  selector: 'data-passing-dialog',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './data-passing-dialog.html',\n  styleUrl: './data-passing-dialog.scss',\n})\nexport class DataPassingDialog {\n  #dialog = inject(ShipDialogService);\n\n  type = input<string>();\n\n  openDialog() {\n    const dialogRef = this.#dialog.open(DataDialogContent, {\n      class: this.type() ?? '',\n      data: { message: 'Hello from parent!', hello: true },\n      closed: (result) => {\n        // Keep so we can easily see if the types break\n        const someString: string = result;\n        console.log('Dialog function closed with: \\t' + someString);\n      },\n    });\n\n    dialogRef.component.closed.subscribe((res) => {\n      console.log('Dialog component closed: \\t', res);\n    });\n\n    dialogRef.closed.subscribe((res) => {\n      console.log('Dialog ref closed: \\t', res);\n    });\n  }\n}\n\n@Component({\n  selector: 'data-dialog-content',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './data-dialog-content.html',\n  styleUrl: './data-dialog-content.scss',\n})\nclass DataDialogContent {\n  data = input<{ message: string; hello: boolean }>();\n  closed = output<string>();\n\n  closeWithValue() {\n    console.log('closeWithValue');\n    this.closed.emit('Some value from dialog');\n  }\n}\n"
      },
      {
        name: "header-footer-dialog",
        html: '<button shButton (click)="openDialog()">Open Header/Footer Dialog</button>\n',
        ts: "import { Component, inject, input, output, signal } from '@angular/core';\nimport { ShipButton, ShipDialogService } from 'ship-ui';\n\n@Component({\n  selector: 'header-footer-dialog',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './header-footer-dialog.html',\n  styleUrl: './header-footer-dialog.scss',\n})\nexport class HeaderFooterDialog {\n  #dialog = inject(ShipDialogService);\n\n  type = input<string>();\n\n  openDialog() {\n    this.#dialog.open(HeaderFooterDialogContent, {\n      class: this.type() ?? '',\n    });\n  }\n}\n\n@Component({\n  selector: 'header-footer-dialog-content',\n  standalone: true,\n  imports: [ShipButton],\n  templateUrl: './header-footer-dialog-content.html',\n  styleUrl: './header-footer-dialog-content.scss',\n})\nclass HeaderFooterDialogContent {\n  closed = output<boolean>();\n\n  stickyHeader = signal(false);\n  stickyFooter = signal(false);\n}\n"
      }
    ]
  },
  {
    name: "ShipToggle",
    selector: "sh-toggle",
    path: "projects/ship-ui/src/lib/ship-toggle/ship-toggle.ts",
    description: "### Variants\n\nToggle variants can be set using the\n`variant`\nattribute. Valid options are:\n**simple**\n,\n**outlined**\n,\n**flat**\n, and\n**raised**\n.\n\n### Colors\n\nToggle colors can be set using the\n`color`\nattribute. Valid options are:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**error**\n, and\n**success**\n.\n\n### Readonly\n\nThe toggle can be set to readonly through the\n`readonly`\ninput (adds the\n`readonly`\nclass).\n\n### Disabled\n\nThe toggle can be disabled using the standard\n`disabled`\nattribute or\n`[disabled]`\nbinding.",
    keywords: [
      "toggle",
      "switch",
      "boolean",
      "on off",
      "checkbox"
    ],
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "readonly",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "disabled",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "noInternalInput",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "checked",
        type: "boolean",
        description: "",
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
        html: '<sh-toggle [(checked)]="active" variant="simple" />\n<sh-toggle [(checked)]="active" variant="simple" color="primary" />\n<sh-toggle [(checked)]="active" variant="simple" color="accent" />\n<sh-toggle [(checked)]="active" variant="simple" color="warn" />\n<sh-toggle [(checked)]="active" variant="simple" color="error" />\n<sh-toggle [(checked)]="active" variant="simple" color="success" />\n<sh-toggle [(checked)]="active" variant="simple" [disabled]="true" />\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-simple-toggle',\n  standalone: true,\n  imports: [ShipToggle],\n  templateUrl: './simple-toggle.html',\n  styleUrl: './simple-toggle.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SimpleToggle {\n  active = signal(false);\n}\n"
      },
      {
        name: "raised-toggle",
        html: '<sh-toggle [(checked)]="active" variant="raised" />\n<sh-toggle [(checked)]="active" variant="raised" color="primary" />\n<sh-toggle [(checked)]="active" variant="raised" color="accent" />\n<sh-toggle [(checked)]="active" variant="raised" color="warn" />\n<sh-toggle [(checked)]="active" variant="raised" color="error" />\n<sh-toggle [(checked)]="active" variant="raised" color="success" />\n<sh-toggle [(checked)]="active" variant="raised" [disabled]="true" />\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-raised-toggle',\n  standalone: true,\n  imports: [ShipToggle],\n  templateUrl: './raised-toggle.html',\n  styleUrl: './raised-toggle.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class RaisedToggle {\n  active = signal(false);\n}\n"
      },
      {
        name: "flat-toggle",
        html: '<sh-toggle [(checked)]="active" variant="flat" />\n<sh-toggle [(checked)]="active" variant="flat" color="primary" />\n<sh-toggle [(checked)]="active" variant="flat" color="accent" />\n<sh-toggle [(checked)]="active" variant="flat" color="warn" />\n<sh-toggle [(checked)]="active" variant="flat" color="error" />\n<sh-toggle [(checked)]="active" variant="flat" color="success" />\n<sh-toggle [(checked)]="active" variant="flat" [disabled]="true" />\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-flat-toggle',\n  standalone: true,\n  imports: [ShipToggle],\n  templateUrl: './flat-toggle.html',\n  styleUrl: './flat-toggle.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class FlatToggle {\n  active = signal(false);\n}\n"
      },
      {
        name: "outlined-toggle",
        html: '<sh-toggle [(checked)]="active" variant="outlined" />\n<sh-toggle [(checked)]="active" variant="outlined" color="primary" />\n<sh-toggle [(checked)]="active" variant="outlined" color="accent" />\n<sh-toggle [(checked)]="active" variant="outlined" color="warn" />\n<sh-toggle [(checked)]="active" variant="outlined" color="error" />\n<sh-toggle [(checked)]="active" variant="outlined" color="success" />\n<sh-toggle [(checked)]="active" variant="outlined" [disabled]="true" />\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-outlined-toggle',\n  standalone: true,\n  imports: [ShipToggle],\n  templateUrl: './outlined-toggle.html',\n  styleUrl: './outlined-toggle.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OutlinedToggle {\n  active = signal(false);\n}\n"
      },
      {
        name: "base-toggle",
        html: '<sh-toggle [(checked)]="active" />\n<sh-toggle [(checked)]="active" color="primary" />\n<sh-toggle [(checked)]="active" color="accent" />\n<sh-toggle [(checked)]="active" color="warn" />\n<sh-toggle [(checked)]="active" color="error" />\n<sh-toggle [(checked)]="active" color="success" />\n<sh-toggle [(checked)]="active" [disabled]="true" />\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { ShipToggle } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-toggle',\n  standalone: true,\n  imports: [ShipToggle],\n  templateUrl: './base-toggle.html',\n  styleUrl: './base-toggle.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseToggle {\n  active = signal(false);\n}\n"
      }
    ]
  },
  {
    name: "ShipToggleCard",
    selector: "sh-toggle-card",
    path: "projects/ship-ui/src/lib/ship-toggle-card/ship-toggle-card.ts",
    description: "",
    keywords: [],
    inputs: [
      {
        name: "disableToggle",
        type: "any",
        description: "",
        defaultValue: "false"
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipCardVariant | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "isActive",
        type: "boolean",
        description: "",
        defaultValue: ""
      }
    ],
    outputs: [],
    methods: [
      {
        name: "toggle",
        parameters: "",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [],
    examples: []
  },
  {
    name: "ShipCheckbox",
    selector: "sh-checkbox",
    path: "projects/ship-ui/src/lib/ship-checkbox/ship-checkbox.ts",
    description: ":::info\nThis component utilizes the **Ship Sheet** utility for its visual structure. It supports standard sheet variations and is affected by global sheet variables.\n:::",
    keywords: [],
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "readonly",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "disabled",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "noInternalInput",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "checked",
        type: "boolean",
        description: "",
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--box-bw",
        defaultValue: "#{p2r(1)}"
      },
      {
        name: "--box-bc",
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
    name: "ShipRadio",
    selector: "sh-radio",
    path: "projects/ship-ui/src/lib/ship-radio/ship-radio.ts",
    description: ":::info\nThis component utilizes the **Ship Sheet** utility for its visual structure. It supports standard sheet variations and is affected by global sheet variables.\n:::",
    keywords: [],
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipSheetVariant | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "readonly",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "disabled",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "noInternalInput",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "checked",
        type: "boolean",
        description: "",
        defaultValue: "false"
      }
    ],
    outputs: [],
    methods: [],
    cssVariables: [
      {
        name: "--radiod-c",
        defaultValue: "var(--base-8)"
      },
      {
        name: "--radiod-o",
        defaultValue: "0"
      },
      {
        name: "--radio-bc",
        defaultValue: "var(--base-4)"
      }
    ],
    examples: []
  },
  {
    name: "ShipIcon",
    selector: "sh-icon",
    path: "projects/ship-ui/src/lib/ship-icon/ship-icon.ts",
    description: "### Sizes\n\nIcons can be set to different sizes using the\n`size`\nattribute. Valid options are:\n**small**\n,\n**large**\n, or\n**inherit**\n.\n\n### Colors\n\nIcon colors can be set using the\n`color`\nattribute. Valid options are:\n**primary**\n,\n**accent**\n,\n**warn**\n,\n**error**\n, and\n**success**\n.\n\nColor can also be overridden with CSS color variables:\n`{{ `\\<sh-icon [style.--icon-c]=\"'blue'\">cloud-warning\\</sh-icon>` }}`\n\n### Icon Packs\n\nCurrently we support Phosphor Icons. Search for icons here:\n\n<a shButton variant=\"raised\" color=\"primary\" size=\"small\" href=\"https://phosphoricons.com/#toolbar\" target=\"_blank\">\nSearch Phosphor Icons\n<sh-icon>arrow-square-out</sh-icon>\n</a>\nWe support multiple weight variations using ligatures:\n\n<li>\n`cloud-warning`\n(Regular - default)\n</li>\n- `cloud-warning-thin`\n- `cloud-warning-light`\n- `cloud-warning-fill`\n- `cloud-warning-bold`\n\n### Icon CLI\n\nUse our CLI tool to generate optimized icon fonts containing only the icons you use.\n\nGenerate once:\n`ship-fg --src='./src' --out='./src/assets' --rootPath='./'`\n\nWatch mode:\n`ship-fg --src='./src' --out='./src/assets' --rootPath='./' --watch`",
    keywords: [
      "icon",
      "phosphor",
      "vector",
      "graphic",
      "symbol",
      "svg"
    ],
    inputs: [
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "size",
        type: "ShipIconSize | null",
        description: "",
        defaultValue: "null"
      }
    ],
    outputs: [],
    methods: [
      {
        name: "ngAfterContentInit",
        parameters: "",
        returnType: "void",
        description: ""
      }
    ],
    cssVariables: [
      {
        name: "--icon-c",
        defaultValue: "inherit"
      }
    ],
    examples: [
      {
        name: "sandbox-icon",
        html: `<div class="controls">
  <p>Controls</p>
  <header>
    <div class="row">
      <sh-button-group class="small" [(value)]="size">
        <button value="">Default</button>
        <button value="large">Large</button>
        <button value="small">Small</button>
        <button value="inherit">Inherit</button>
      </sh-button-group>

      <sh-button-group class="small" [(value)]="colorClass">
        <button value="">Default</button>
        <button value="primary">Primary</button>
        <button value="accent">Accent</button>
        <button value="warn">Warn</button>
        <button value="error">Error</button>
        <button value="success">Success</button>
      </sh-button-group>
    </div>

    @if (size() === '') {
      <div class="row">
        <sh-range-slider>
          <input type="range" [min]="10" [max]="64" [step]="2" [(ngModel)]="sizeValue" />
        </sh-range-slider>
      </div>
    }
  </header>
</div>

<div class="sandbox" [style.font-size]="sizeValue() + 'px'">
  <section>
    <h4>Cloud-warning</h4>
    <sh-icon [size]="size()" [color]="colorClass()">cloud-warning</sh-icon>
    <sh-icon [size]="size()" [color]="colorClass()">cloud-warning-thin</sh-icon>
    <sh-icon [size]="size()" [color]="colorClass()">cloud-warning-light</sh-icon>
    <sh-icon [size]="size()" [color]="colorClass()">cloud-warning-fill</sh-icon>
    <sh-icon [size]="size()" [color]="colorClass()">cloud-warning-bold</sh-icon>
  </section>

  <section>
    <h4>Warning</h4>
    <sh-icon [size]="size()" [color]="colorClass()">warning</sh-icon>
    <sh-icon [size]="size()" [color]="colorClass()">warning-thin</sh-icon>
    <sh-icon [size]="size()" [color]="colorClass()">warning-light</sh-icon>
    <sh-icon [size]="size()" [color]="colorClass()">warning-fill</sh-icon>
    <sh-icon [size]="size()" [color]="colorClass()">warning-bold</sh-icon>
  </section>

  <section>
    <h4>Warning warning-octagon</h4>
    <sh-icon [size]="size()" [color]="colorClass()">warning-octagon</sh-icon>
    <sh-icon [size]="size()" [color]="colorClass()">warning-octagon-thin</sh-icon>
    <sh-icon [size]="size()" [color]="colorClass()">warning-octagon-light</sh-icon>
    <sh-icon [size]="size()" [color]="colorClass()">warning-octagon-fill</sh-icon>
    <sh-icon [size]="size()" [color]="colorClass()">warning-octagon-bold</sh-icon>
  </section>
</div>
`,
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipButtonGroup, ShipColor, ShipIcon, ShipIconSize, ShipRangeSlider } from 'ship-ui';\n\n@Component({\n  selector: 'app-sandbox-icon',\n  imports: [FormsModule, ShipIcon, ShipButtonGroup, ShipRangeSlider],\n  templateUrl: './sandbox-icon.html',\n  styleUrl: './sandbox-icon.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class SandboxIcon {\n  size = signal<ShipIconSize>('');\n  sizeValue = signal<number>(10);\n  colorClass = signal<ShipColor>('');\n}\n"
      }
    ]
  },
  {
    name: "ShipBlueprint",
    selector: "sh-blueprint",
    path: "projects/ship-ui/src/lib/ship-blueprint/ship-blueprint.ts",
    description: "",
    keywords: [],
    inputs: [
      {
        name: "forceUnique",
        type: "boolean",
        description: "",
        defaultValue: "true"
      },
      {
        name: "autoLayout",
        type: "boolean",
        description: "",
        defaultValue: "false"
      },
      {
        name: "gridSize",
        type: "any",
        description: "",
        defaultValue: "20"
      },
      {
        name: "snapToGrid",
        type: "boolean",
        description: "",
        defaultValue: "true"
      },
      {
        name: "gridColor",
        type: "[string, string]",
        description: "",
        defaultValue: "['#d8d8d8'"
      },
      {
        name: "nodes",
        type: "BlueprintNode[]",
        description: "",
        defaultValue: "[]"
      }
    ],
    outputs: [],
    methods: [
      {
        name: "Autolayout",
        parameters: "true);\n  autoLayout = input<boolean>(false);\n  gridSize = input(20);\n  snapToGrid = input<boolean>(true);\n  gridColor = input<[string, string]>(['#d8d8d8', '#2c2c2c']);\n\n  nodes = model<BlueprintNode[]>([]);\n\n  #currentGridColor = computed(() => this.gridColor()[this.lightMode() ? 0 : 1]);\n\n  panX = signal(0);\n  panY = signal(0);\n  zoomLevel = signal(1);\n  gridSnapSize = signal(20);\n\n  isHoveringNode = signal(false);\n  midpointDivPosition = signal<{ x: number; y: number } | null>(null);\n  showMidpointDiv = signal(false);\n  isLocked = signal(false);\n  draggingConnection = signal<DragState | null>(null);\n  validationErrors = signal<ValidationErrors | null>(null);\n  highlightedConnection = signal<Connection | null>(null);\n\n  #draggingNodeCoordinates = signal<Coordinates | null>(null);\n  #isDragging = signal(false);\n  #lastMouseX = signal(0);\n  #lastMouseY = signal(0);\n  #initialPinchDistance = signal(0);\n  #isNodeDragging = signal(false);\n  #draggedNodeId = signal<string | null>(null);\n  #dragOffset = signal<Coordinates | null>(null);\n  #connections = signal<Connection[]>([]);\n  #canvasWidth = signal(0);\n  #canvasHeight = signal(0);\n\n  @ViewChild('blueprintCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;\n  #ctx!: CanvasRenderingContext2D;\n  #resizeObserver!: ResizeObserver;\n\n  visibleNodes = computed(() => {\n    const nodes = this.nodes();\n    const panX = this.panX();\n    const panY = this.panY();\n    const zoom = this.zoomLevel();\n    const width = this.#canvasWidth();\n    const height = this.#canvasHeight();\n\n    if (width === 0 || height === 0",
        returnType: "any",
        description: ""
      },
      {
        name: "effect",
        parameters: "() => {\n        this.asDots();\n        this.panX();\n        this.panY();\n        this.zoomLevel();\n        this.nodes();\n        this.#connections();\n        this.draggingConnection();\n        this.#currentGridColor();\n        this.highlightedConnection();\n        this.#draggingNodeCoordinates();\n\n        requestAnimationFrame(() => this.drawCanvas());\n      });\n\n      effect(() => {\n        const nodes = this.nodes();\n        const connectionsFromNodes = nodes.flatMap((node) => node.connections);\n        const uniqueConnections = connectionsFromNodes.filter(\n          (conn, index, self) =>\n            index ===\n            self.findIndex(\n              (c) =>\n                c.fromNode === conn.fromNode &&\n                c.fromPort === conn.fromPort &&\n                c.toNode === conn.toNode &&\n                c.toPort === conn.toPort\n            )\n        );\n\n        this.#connections.set(uniqueConnections);\n      });\n    }\n  }\n\n  ngAfterViewInit(",
        returnType: "any",
        description: ""
      },
      {
        name: "updateCanvasSize",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "drawCanvas",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "drawGrid",
        parameters: "ctx: CanvasRenderingContext2D",
        returnType: "any",
        description: ""
      },
      {
        name: "drawConnections",
        parameters: "ctx: CanvasRenderingContext2D",
        returnType: "any",
        description: ""
      },
      {
        name: "drawDraggingPath",
        parameters: "ctx: CanvasRenderingContext2D",
        returnType: "any",
        description: ""
      },
      {
        name: "drawCurvedPath",
        parameters: "ctx: CanvasRenderingContext2D, start: Coordinates, end: Coordinates",
        returnType: "any",
        description: ""
      },
      {
        name: "startNodeDrag",
        parameters: "event: MouseEvent | TouchEvent, nodeId: string",
        returnType: "any",
        description: ""
      },
      {
        name: "endNodeDrag",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "nodeDrag",
        parameters: "event: MouseEvent | Touch",
        returnType: "any",
        description: ""
      },
      {
        name: "startPortDrag",
        parameters: "event: MouseEvent, nodeId: string, portId: string",
        returnType: "any",
        description: ""
      },
      {
        name: "endPortDrag",
        parameters: "_: MouseEvent, toNodeId: string, toPortId: string",
        returnType: "any",
        description: ""
      },
      {
        name: "cancelPortDrag",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "updatePathOnMove",
        parameters: "event: MouseEvent | Touch",
        returnType: "any",
        description: ""
      },
      {
        name: "pan",
        parameters: "event: MouseEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "handleTouchStart",
        parameters: "event: TouchEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "handleTouchMove",
        parameters: "event: TouchEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "handleTouchEnd",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "closeMidpointDiv",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "getDisplayCoordinates",
        parameters: "node: BlueprintNode",
        returnType: "any",
        description: ""
      },
      {
        name: "removeConnection",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "getNewNodeCoordinates",
        parameters: "panToCoordinates = false",
        returnType: "Coordinates",
        description: ""
      }
    ],
    cssVariables: [
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
    name: "ShipSelect",
    selector: "sh-select",
    path: "projects/ship-ui/src/lib/ship-select/ship-select.ts",
    description: '### Options\n\nProvide the data source using the\n`options`\nattribute. This can be an array of strings or objects.\n\n### Labels & Values\n\nIf your options are objects, specify which properties to use for display and selection:\n\n<li>\n`label`\n: Property path to the display text (e.g.,\n`"user.name"`\n).\n</li>\n<li>\n`value`\n: Property path to the selection value (e.g.,\n`"user.id"`\n).\n</li>\n\n### Selection Modes\n\nToggle selection behavior:\n\n<li>\n`selectMultiple`\n: Enables picking multiple options.\n</li>\n<li>\n`isClearable`\n: Adds a clear button to remove the selection (default: true).\n</li>\n\n### Interaction\n\n<li>\n`inlineSearch`\n: Adds a search field within the dropdown to filter options.\n</li>\n<li>\n`readonly`\n: Prevents selection changes while maintaining focusability.\n</li>\n<li>\n`disabled`\n: Standard attribute to disable the component.\n</li>\n\n### Templates\n\nCustomize rendering using\n`ng-template`\n:\n\n<li>\n`optionTemplate`\n: Custom rendering for items in the dropdown.\n</li>\n<li>\n`placeholderTemplate`\n: Custom rendering for the selected state/placeholder.\n</li>',
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
    ],
    inputs: [
      {
        name: "value",
        type: "string",
        description: ""
      },
      {
        name: "label",
        type: "string",
        description: ""
      },
      {
        name: "asFreeText",
        type: "any",
        description: "",
        defaultValue: "false"
      },
      {
        name: "color",
        type: "ShipColor | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "variant",
        type: "ShipFormFieldVariant | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "size",
        type: "ShipSize | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "optionTitle",
        type: "string | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "freeTextTitle",
        type: "string | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "freeTextPlaceholder",
        type: "string | null",
        description: "",
        defaultValue: "'Type to create a new option'"
      },
      {
        name: "validateFreeText",
        type: "ValidateFreeText",
        description: ""
      },
      {
        name: "placeholder",
        type: "string",
        description: ""
      },
      {
        name: "lazySearch",
        type: "any",
        description: "",
        defaultValue: "false"
      },
      {
        name: "inlineSearch",
        type: "any",
        description: "",
        defaultValue: "false"
      },
      {
        name: "asText",
        type: "any",
        description: "",
        defaultValue: "false"
      },
      {
        name: "isClearable",
        type: "any",
        description: "",
        defaultValue: "true"
      },
      {
        name: "selectMultiple",
        type: "any",
        description: "",
        defaultValue: "false"
      },
      {
        name: "optionTemplate",
        type: "TemplateRef<unknown> | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "selectedOptionTemplate",
        type: "TemplateRef<unknown> | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "placeholderTemplate",
        type: "TemplateRef<unknown> | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "freeTextOptionTemplate",
        type: "TemplateRef<unknown> | null",
        description: "",
        defaultValue: "null"
      },
      {
        name: "readonly",
        type: "any",
        description: "",
        defaultValue: "false"
      },
      {
        name: "disabled",
        type: "any",
        description: "",
        defaultValue: "false"
      },
      {
        name: "isOpen",
        type: "any",
        description: "",
        defaultValue: "false"
      },
      {
        name: "isLoading",
        type: "any",
        description: "",
        defaultValue: "false"
      },
      {
        name: "options",
        type: "unknown[]",
        description: "",
        defaultValue: "[]"
      },
      {
        name: "selectedOptions",
        type: "unknown[]",
        description: "",
        defaultValue: "[]"
      }
    ],
    outputs: [
      {
        name: "cleared",
        type: "void",
        description: ""
      },
      {
        name: "onAddNewFreeTextOption",
        type: "string",
        description: ""
      }
    ],
    methods: [
      {
        name: "trigger",
        parameters: `click)="open()"
        [color]="color()"
        [variant]="variant()"
        [size]="size()"
        [class.stretch]="stretch()"
        [class.small]="small()"
        [class.readonly]="readonly() || disabled()">
        <ng-content select="label" ngProjectAs="label" />
        <ng-content select="[prefix]" ngProjectAs="[prefix]" />
        <ng-content select="[boxPrefix]" ngProjectAs="[boxPrefix]" />

        <div class="input" [class.show-search-text]="_showSearchText" ngProjectAs="input">
          <div class="selected-value" [class.is-selected]="_inputState === 'selected'">
            @if (asFreeText() && inputValue().length > 0 && !isOpen()`,
        returnType: "any",
        description: ""
      },
      {
        name: "setInitInput",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "setSelectedOptionsFromValue",
        parameters: "value: string",
        returnType: "any",
        description: ""
      },
      {
        name: "setInputValueFromOptions",
        parameters: "options: unknown[]",
        returnType: "any",
        description: ""
      },
      {
        name: "toggleOptionByIndex",
        parameters: "optionIndex: number, event?: MouseEvent, enterKey = false",
        returnType: "any",
        description: ""
      },
      {
        name: "removeSelectedOptionByIndex",
        parameters: "$event: MouseEvent, optionRemoveIndex: number",
        returnType: "any",
        description: ""
      },
      {
        name: "isSelected",
        parameters: "optionIndex: number",
        returnType: "boolean",
        description: ""
      },
      {
        name: "open",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "close",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "clear",
        parameters: "$event?: MouseEvent",
        returnType: "any",
        description: ""
      },
      {
        name: "updateInputElValue",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "get",
        parameters: "",
        returnType: "any",
        description: ""
      },
      {
        name: "set",
        parameters: "newVal",
        returnType: "any",
        description: ""
      }
    ],
    cssVariables: [
      {
        name: "--miw",
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
        defaultValue: "var(--miw)"
      },
      {
        name: "--ff-space",
        defaultValue: "#{p2r(7 10)}"
      },
      {
        name: "--chip-h",
        defaultValue: "#{p2r(20)}"
      }
    ],
    examples: [
      {
        name: "inline-search-select",
        html: '<sh-select [options]="options()" label="label" value="value" [inlineSearch]="true">\n  <label>Favorite food (inline search)</label>\n  <input type="text" [(ngModel)]="selected" />\n</sh-select>\n\n<p>Selected: {{ selected() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from 'ship-ui';\n\n@Component({\n  selector: 'app-inline-search-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect],\n  templateUrl: './inline-search-select.html',\n  styleUrl: './inline-search-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InlineSearchSelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n    { value: 'pasta', label: 'Pasta' },\n    { value: 'salad', label: 'Salad' },\n    { value: 'sandwich', label: 'Sandwich' },\n  ]);\n  selected = signal('pizza');\n\n  ngOnInit(): void {\n    setTimeout(() => {\n      this.selected.set('burger');\n    }, 1000);\n  }\n}\n"
      },
      {
        name: "disabled-select",
        html: '<sh-select [options]="options()" label="label" value="value">\n  <label>Favorite food (disabled)</label>\n  <input type="text" [(ngModel)]="selected" [disabled]="true" />\n</sh-select>\n\n<p>Selected: {{ selected() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from 'ship-ui';\n\n@Component({\n  selector: 'app-disabled-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect],\n  templateUrl: './disabled-select.html',\n  styleUrl: './disabled-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class DisabledSelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n  ]);\n  selected = signal('pizza');\n}\n"
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
        ts: "import { JsonPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipIcon, ShipSelect, ShipTooltip } from 'ship-ui';\n\n@Component({\n  selector: 'app-multiple-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect, JsonPipe, ShipIcon, ShipTooltip],\n  templateUrl: './multiple-select.html',\n  styleUrl: './multiple-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class MultipleSelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n  ]);\n  selected = signal<string[]>(['pizza,burger']);\n}\n"
      },
      {
        name: "option-template-select",
        html: '<sh-select [options]="options()" label="label" value="value">\n  <label>Favorite food (custom option template)</label>\n  <input type="text" [(ngModel)]="selected" />\n  <ng-template let-option>\n    <span>{{ option.emoji }} {{ option.label }}</span>\n  </ng-template>\n</sh-select>\n\n<p>Selected: {{ selected() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from 'ship-ui';\n\n@Component({\n  selector: 'app-option-template-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect],\n  templateUrl: './option-template-select.html',\n  styleUrl: './option-template-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class OptionTemplateSelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza', emoji: '\u{1F355}' },\n    { value: 'burger', label: 'Burger', emoji: '\u{1F354}' },\n    { value: 'sushi', label: 'Sushi', emoji: '\u{1F363}' },\n  ]);\n  selected = signal('pizza');\n}\n"
      },
      {
        name: "placeholder-template-select",
        html: '<sh-select\n  [options]="options()"\n  label="label"\n  value="value"\n  [optionTemplate]="optionTemplate"\n  [placeholderTemplate]="placeholderTemplate">\n  <label>Favorite food (custom option template)</label>\n  <input type="text" [(ngModel)]="selected" />\n</sh-select>\n\n<ng-template let-option #optionTemplate>\n  <span>{{ option.emoji }} {{ option.label }}</span>\n</ng-template>\n\n<ng-template let-option #placeholderTemplate>\n  <div class="custom-option">Hell im a custom placeholder template \u{1F642}\u200D\u2194\uFE0F\u{1F642}\u200D\u2194\uFE0F</div>\n</ng-template>\n\n<p>Selected: {{ selected() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from 'ship-ui';\n\n@Component({\n  selector: 'app-placeholder-template-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect],\n  templateUrl: './placeholder-template-select.html',\n  styleUrl: './placeholder-template-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class PlaceholderTemplateSelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza', emoji: '\u{1F355}' },\n    { value: 'burger', label: 'Burger', emoji: '\u{1F354}' },\n    { value: 'sushi', label: 'Sushi', emoji: '\u{1F363}' },\n  ]);\n  selected = signal('');\n}\n"
      },
      {
        name: "reactive-select-disabled",
        html: '<sh-select [options]="options()" label="label" value="value">\n  <label>Favorite food (reactive form)</label>\n\n  <input type="text" [formControl]="control" />\n</sh-select>\n\n<p>Selected: {{ control.value }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormControl, ReactiveFormsModule } from '@angular/forms';\nimport { ShipSelect } from 'ship-ui';\n\n@Component({\n  selector: 'app-reactive-select-disabled',\n  standalone: true,\n  imports: [ReactiveFormsModule, ShipSelect],\n  templateUrl: './reactive-select-disabled.html',\n  styleUrl: './reactive-select-disabled.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ReactiveSelectDisabled {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n  ]);\n  control = new FormControl({\n    value: 'pizza',\n    disabled: true,\n  });\n}\n"
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
        ts: "import { JsonPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from 'ship-ui';\n\n@Component({\n  selector: 'app-multiple-select-as-text',\n  standalone: true,\n  imports: [FormsModule, ShipSelect, JsonPipe],\n  templateUrl: './multiple-select-as-text.html',\n  styleUrl: './multiple-select-as-text.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class MultipleSelectAsText {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n  ]);\n  selected = signal<string[]>(['pizza,burger']);\n}\n"
      },
      {
        name: "lazy-search-multiple-select",
        html: '<sh-select\n  [options]="options()"\n  label="label"\n  value="value"\n  [lazySearch]="true"\n  [selectMultiple]="true"\n  [isLoading]="resource.isLoading()">\n  <label>Favorite foods (lazy search, multiple)</label>\n  <input type="text" [(ngModel)]="lazySearchOption" />\n</sh-select>\n\n@if (resource.isLoading()) {\n  <p>Searching: {{ lazySearchOption() }}</p>\n} @else {\n  <p>Selected: {{ lazySearchOption() | json }}</p>\n}\n',
        ts: "import { JsonPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { rxResource } from '@angular/core/rxjs-interop';\nimport { FormsModule } from '@angular/forms';\nimport { delay, map, of } from 'rxjs';\nimport { ShipSelect } from 'ship-ui';\n\nconst DEFAULT_OPTIONS = [\n  { value: 'pizza', label: 'Pizza' },\n  { value: 'burger', label: 'Burger' },\n  { value: 'sushi', label: 'Sushi' },\n  { value: 'pasta', label: 'Pasta' },\n  { value: 'salad', label: 'Salad' },\n  { value: 'sandwich', label: 'Sandwich' },\n];\n@Component({\n  selector: 'app-lazy-search-multiple-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect, JsonPipe],\n  templateUrl: './lazy-search-multiple-select.html',\n  styleUrl: './lazy-search-multiple-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class LazySearchMultipleSelect {\n  lazySearchOption = signal('');\n\n  options = computed(() => this.resource.value() ?? DEFAULT_OPTIONS);\n  resource = rxResource({\n    params: () => ({\n      query: this.lazySearchOption(),\n    }),\n    stream: ({ params }) => {\n      const search = params.query.toLowerCase();\n\n      return of(DEFAULT_OPTIONS).pipe(\n        delay(200),\n        map((res) => res.filter((opt) => opt.label.toLowerCase().includes(search)))\n      );\n    },\n  });\n}\n"
      },
      {
        name: "readonly-select",
        html: '<sh-select [options]="options()" label="label" value="value" [readonly]="true">\n  <label>Favorite food (readonly)</label>\n  <input type="text" [(ngModel)]="selected" />\n</sh-select>\n\n<p>Selected: {{ selected() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from 'ship-ui';\n\n@Component({\n  selector: 'app-readonly-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect],\n  templateUrl: './readonly-select.html',\n  styleUrl: './readonly-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ReadonlySelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n  ]);\n  selected = signal('pizza');\n}\n"
      },
      {
        name: "inline-search-multiple-select",
        html: '<sh-select [options]="options()" label="label" value="value" [inlineSearch]="true" [selectMultiple]="true">\n  <label>Favorite foods (inline search, multiple)</label>\n  <input type="text" [(ngModel)]="selected" />\n</sh-select>\n\n<p>Selected: {{ selected() | json }}</p>\n',
        ts: "import { JsonPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from 'ship-ui';\n\n@Component({\n  selector: 'app-inline-search-multiple-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect, JsonPipe],\n  templateUrl: './inline-search-multiple-select.html',\n  styleUrl: './inline-search-multiple-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class InlineSearchMultipleSelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n    { value: 'pasta', label: 'Pasta' },\n    { value: 'salad', label: 'Salad' },\n    { value: 'sandwich', label: 'Sandwich' },\n  ]);\n  selected = signal<string[]>(['pizza']);\n}\n"
      },
      {
        name: "reactive-select",
        html: '<sh-select [options]="options()" label="label" value="value">\n  <label>Favorite food (reactive form)</label>\n\n  <input type="text" [formControl]="control" />\n</sh-select>\n\n<p>Selected: {{ control.value }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormControl, ReactiveFormsModule } from '@angular/forms';\nimport { ShipSelect } from 'ship-ui';\n\n@Component({\n  selector: 'app-reactive-select',\n  standalone: true,\n  imports: [ReactiveFormsModule, ShipSelect],\n  templateUrl: './reactive-select-example.html',\n  styleUrl: './reactive-select-example.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ReactiveSelectComponent {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n  ]);\n  control = new FormControl('pizza');\n}\n"
      },
      {
        name: "base-select",
        html: '<sh-select [options]="options()" label="label" value="value">\n  <label>Favorite food</label>\n  <sh-icon prefix>desktop-tower</sh-icon>\n\n  <input type="text" [(ngModel)]="selected" (ngModelChange)="hello($event)" />\n</sh-select>\n\n<p>Selected: {{ selected() }}</p>\n',
        ts: "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipIcon, ShipSelect } from 'ship-ui';\n\n@Component({\n  selector: 'app-base-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect, ShipIcon],\n  templateUrl: './base-select.html',\n  styleUrl: './base-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class BaseSelect {\n  options = signal([\n    { value: 'pizza', label: 'Pizza' },\n    { value: 'burger', label: 'Burger' },\n    { value: 'sushi', label: 'Sushi' },\n  ]);\n  selected = signal('pizza');\n\n  hello(val: any) {\n    console.log('updated', val);\n  }\n}\n"
      },
      {
        name: "object-select",
        html: '<sh-select\n  [options]="options()"\n  label="name"\n  value="id"\n  [isClearable]="false"\n  (selectedOptionsChange)="newSelectedOptions($event)">\n  <label>Favorite food (object options, not clearable)</label>\n  <input type="text" [(ngModel)]="selected" />\n</sh-select>\n\n<p>Selected: {{ selected() }}</p>\n<pre>{{ selectedObject() | json }}</pre>\n',
        ts: "import { JsonPipe } from '@angular/common';\nimport { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\nimport { ShipSelect } from 'ship-ui';\n\n@Component({\n  selector: 'app-object-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect, JsonPipe],\n  templateUrl: './object-select.html',\n  styleUrl: './object-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ObjectSelect {\n  options = signal([\n    { id: '1', name: 'Pizza' },\n    { id: '2', name: 'Burger' },\n    { id: '3', name: 'Sushi' },\n  ]);\n\n  selected = signal<string>('1');\n  selectedObject = computed(() => {\n    return this.options().find((opt) => opt.id === this.selected());\n  });\n\n  newSelectedOptions($event?: any) {\n    console.log('new selected options', $event);\n  }\n}\n"
      },
      {
        name: "lazy-search-select",
        html: '<sh-select [options]="options()" label="label" value="value" [lazySearch]="true" [isLoading]="resource.isLoading()">\n  <label>Favorite food (lazy search)</label>\n  <input type="text" [(ngModel)]="lazySearchOption" />\n</sh-select>\n\n@if (resource.isLoading()) {\n  <p>Searching: {{ lazySearchOption() }}</p>\n} @else {\n  <p>Selected: {{ lazySearchOption() }}</p>\n}\n',
        ts: "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';\nimport { rxResource } from '@angular/core/rxjs-interop';\nimport { FormsModule } from '@angular/forms';\nimport { delay, map, of } from 'rxjs';\nimport { ShipSelect } from 'ship-ui';\n\nconst DEFAULT_OPTIONS = [\n  { value: 'pizza', label: 'Pizza' },\n  { value: 'burger', label: 'Burger' },\n  { value: 'sushi', label: 'Sushi' },\n  { value: 'pasta', label: 'Pasta' },\n  { value: 'salad', label: 'Salad' },\n  { value: 'sandwich', label: 'Sandwich' },\n];\n@Component({\n  selector: 'app-lazy-search-select',\n  standalone: true,\n  imports: [FormsModule, ShipSelect],\n  templateUrl: './lazy-search-select.html',\n  styleUrl: './lazy-search-select.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class LazySearchSelect {\n  lazySearchOption = signal('pizza');\n\n  options = computed(() => this.resource.value() ?? DEFAULT_OPTIONS);\n  resource = rxResource({\n    params: () => ({\n      query: this.lazySearchOption(),\n    }),\n    stream: ({ params }) => {\n      const search = params.query.toLowerCase();\n\n      return of(DEFAULT_OPTIONS).pipe(\n        delay(200),\n        map((res) => res.filter((opt) => opt.label.toLowerCase().includes(search)))\n      );\n    },\n  });\n}\n"
      }
    ]
  },
  {
    name: "GlobalVariables",
    selector: "global-variables",
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
        name: "--border-10",
        defaultValue: "var(--border-width) solid var(--base-4)"
      },
      {
        name: "--border-20",
        defaultValue: "var(--border-width) solid var(--base-8)"
      },
      {
        name: "--primary-1",
        defaultValue: "light-dark(hsl(217, 91%, 95%), hsl(217, 91%, 9.5%))"
      },
      {
        name: "--primary-2",
        defaultValue: "light-dark(hsl(217, 91%, 90%), hsl(217, 91%, 15%))"
      },
      {
        name: "--primary-3",
        defaultValue: "light-dark(hsl(217, 91%, 85%), hsl(217, 91%, 22.5%))"
      },
      {
        name: "--primary-4",
        defaultValue: "light-dark(hsl(217, 91%, 80%), hsl(217, 91%, 30%))"
      },
      {
        name: "--primary-5",
        defaultValue: "light-dark(hsl(217, 91%, 75%), hsl(217, 91%, 37.5%))"
      },
      {
        name: "--primary-6",
        defaultValue: "light-dark(hsl(217, 91%, 70%), hsl(217, 91%, 45%))"
      },
      {
        name: "--primary-7",
        defaultValue: "light-dark(hsl(217, 91%, 65%), hsl(217, 91%, 52.5%))"
      },
      {
        name: "--primary-8",
        defaultValue: "light-dark(hsl(217, 91%, 60%), hsl(217, 91%, 60%))"
      },
      {
        name: "--primary-9",
        defaultValue: "light-dark(hsl(217, 91%, 46.5%), hsl(217, 91%, 70%))"
      },
      {
        name: "--primary-10",
        defaultValue: "light-dark(hsl(217, 91%, 33%), hsl(217, 91%, 80%))"
      },
      {
        name: "--primary-11",
        defaultValue: "light-dark(hsl(217, 91%, 19.5%), hsl(217, 91%, 90%))"
      },
      {
        name: "--primary-12",
        defaultValue: "light-dark(hsl(217, 91%, 6%), hsl(217, 91%, 100%))"
      },
      {
        name: "--primary-g2",
        defaultValue: "linear-gradient(180deg, hsl(217, 91%, 70%) 0%, hsl(217, 91%, 60%) 50%)"
      },
      {
        name: "--primary-g3",
        defaultValue: "linear-gradient(180deg, hsl(217, 91%, 80%) 0%, hsl(217, 91%, 60%) 50%)"
      },
      {
        name: "--accent-1",
        defaultValue: "light-dark(hsl(258, 90%, 95.75%), hsl(258, 90%, 9.25%))"
      },
      {
        name: "--accent-2",
        defaultValue: "light-dark(hsl(258, 90%, 91.5%), hsl(258, 90%, 16.5%))"
      },
      {
        name: "--accent-3",
        defaultValue: "light-dark(hsl(258, 90%, 87.25%), hsl(258, 90%, 24.75%))"
      },
      {
        name: "--accent-4",
        defaultValue: "light-dark(hsl(258, 90%, 83%), hsl(258, 90%, 33%))"
      },
      {
        name: "--accent-5",
        defaultValue: "light-dark(hsl(258, 89%, 78%), hsl(258, 90%, 41.25%))"
      },
      {
        name: "--accent-6",
        defaultValue: "light-dark(hsl(258, 90%, 74.5%), hsl(258, 90%, 49.5%))"
      },
      {
        name: "--accent-7",
        defaultValue: "light-dark(hsl(258, 90%, 70.25%), hsl(258, 90%, 57.75%))"
      },
      {
        name: "--accent-8",
        defaultValue: "light-dark(hsl(258, 90%, 66%), hsl(258, 90%, 66%))"
      },
      {
        name: "--accent-9",
        defaultValue: "light-dark(hsl(258, 90%, 51.15%), hsl(258, 90%, 74.5%))"
      },
      {
        name: "--accent-10",
        defaultValue: "light-dark(hsl(258, 90%, 36.3%), hsl(258, 90%, 83%))"
      },
      {
        name: "--accent-11",
        defaultValue: "light-dark(hsl(258, 90%, 21.45%), hsl(258, 90%, 91.5%))"
      },
      {
        name: "--accent-12",
        defaultValue: "light-dark(hsl(258, 90%, 6.6%), hsl(258, 90%, 100%))"
      },
      {
        name: "--accent-g2",
        defaultValue: "linear-gradient(180deg, hsl(258, 90%, 74.5%) 0%, hsl(258, 90%, 66%) 50%)"
      },
      {
        name: "--accent-g3",
        defaultValue: "linear-gradient(180deg, hsl(258, 90%, 83%) 0%, hsl(258, 90%, 66%) 50%)"
      },
      {
        name: "--warn-1",
        defaultValue: "light-dark(hsl(37, 92%, 93.75%), hsl(37, 92%, 9.25%))"
      },
      {
        name: "--warn-2",
        defaultValue: "light-dark(hsl(37, 92%, 87.5%), hsl(37, 92%, 12.5%))"
      },
      {
        name: "--warn-3",
        defaultValue: "light-dark(hsl(37, 92%, 81.25%), hsl(37, 92%, 18.75%))"
      },
      {
        name: "--warn-4",
        defaultValue: "light-dark(hsl(37, 92%, 75%), hsl(37, 92%, 25%))"
      },
      {
        name: "--warn-5",
        defaultValue: "light-dark(hsl(37, 92%, 68.75%), hsl(37, 92%, 31.25%))"
      },
      {
        name: "--warn-6",
        defaultValue: "light-dark(hsl(37, 92%, 62.5%), hsl(37, 92%, 37.5%))"
      },
      {
        name: "--warn-7",
        defaultValue: "light-dark(hsl(37, 92%, 56.25%), hsl(37, 92%, 43.75%))"
      },
      {
        name: "--warn-8",
        defaultValue: "light-dark(hsl(37, 92%, 50%), hsl(37, 92%, 50%))"
      },
      {
        name: "--warn-9",
        defaultValue: "light-dark(hsl(37, 92%, 38.75%), hsl(37, 92%, 62.5%))"
      },
      {
        name: "--warn-10",
        defaultValue: "light-dark(hsl(37, 92%, 27.5%), hsl(37, 92%, 75%))"
      },
      {
        name: "--warn-11",
        defaultValue: "light-dark(hsl(37, 92%, 16.25%), hsl(37, 92%, 87.5%))"
      },
      {
        name: "--warn-12",
        defaultValue: "light-dark(hsl(37, 92%, 5%), hsl(37, 92%, 100%))"
      },
      {
        name: "--warn-g2",
        defaultValue: "linear-gradient(180deg, hsl(37, 92%, 62.5%) 0%, hsl(37, 92%, 50%) 50%)"
      },
      {
        name: "--warn-g3",
        defaultValue: "linear-gradient(180deg, hsl(37, 92%, 75%) 0%, hsl(37, 92%, 50%) 50%)"
      },
      {
        name: "--error-1",
        defaultValue: "light-dark(hsl(0, 84%, 95%), hsl(0, 84%, 7.5%))"
      },
      {
        name: "--error-2",
        defaultValue: "light-dark(hsl(0, 84%, 90%), hsl(0, 84%, 15%))"
      },
      {
        name: "--error-3",
        defaultValue: "light-dark(hsl(0, 84%, 85%), hsl(0, 84%, 22.5%))"
      },
      {
        name: "--error-4",
        defaultValue: "light-dark(hsl(0, 84%, 80%), hsl(0, 84%, 30%))"
      },
      {
        name: "--error-5",
        defaultValue: "light-dark(hsl(0, 84%, 75%), hsl(0, 27%, 10%))"
      },
      {
        name: "--error-6",
        defaultValue: "light-dark(hsl(0, 84%, 70%), hsl(0, 84%, 45%))"
      },
      {
        name: "--error-7",
        defaultValue: "light-dark(hsl(0, 84%, 65%), hsl(0, 84%, 52.5%))"
      },
      {
        name: "--error-8",
        defaultValue: "light-dark(hsl(0, 84%, 60%), hsl(0, 84%, 60%))"
      },
      {
        name: "--error-9",
        defaultValue: "light-dark(hsl(0, 84%, 46.5%), hsl(0, 84%, 70%))"
      },
      {
        name: "--error-10",
        defaultValue: "light-dark(hsl(0, 84%, 33%), hsl(0, 84%, 80%))"
      },
      {
        name: "--error-11",
        defaultValue: "light-dark(hsl(0, 84%, 19.5%), hsl(0, 84%, 90%))"
      },
      {
        name: "--error-12",
        defaultValue: "light-dark(hsl(0, 84%, 6%), hsl(0, 84%, 100%))"
      },
      {
        name: "--error-g2",
        defaultValue: "linear-gradient(180deg, hsl(0, 84%, 70%) 0%, hsl(0, 84%, 60%) 50%)"
      },
      {
        name: "--error-g3",
        defaultValue: "linear-gradient(180deg, hsl(0, 84%, 80%) 0%, hsl(0, 84%, 60%) 50%)"
      },
      {
        name: "--success-1",
        defaultValue: "light-dark(hsl(160, 84%, 92.38%), hsl(160, 84%, 7.88%))"
      },
      {
        name: "--success-2",
        defaultValue: "light-dark(hsl(160, 84%, 84.75%), hsl(160, 3%, 17%))"
      },
      {
        name: "--success-3",
        defaultValue: "light-dark(hsl(160, 84%, 77.13%), hsl(160, 84%, 14.63%))"
      },
      {
        name: "--success-4",
        defaultValue: "light-dark(hsl(160, 84%, 69.5%), hsl(160, 84%, 19.5%))"
      },
      {
        name: "--success-5",
        defaultValue: "light-dark(hsl(160, 84%, 61.88%), hsl(160, 84%, 24.38%))"
      },
      {
        name: "--success-6",
        defaultValue: "light-dark(hsl(160, 84%, 54.25%), hsl(160, 84%, 29.25%))"
      },
      {
        name: "--success-7",
        defaultValue: "light-dark(hsl(160, 84%, 46.63%), hsl(160, 84%, 34.13%))"
      },
      {
        name: "--success-8",
        defaultValue: "light-dark(hsl(160, 84%, 39%), hsl(160, 84%, 39%))"
      },
      {
        name: "--success-9",
        defaultValue: "light-dark(hsl(160, 84%, 30.23%), hsl(160, 84%, 54.25%))"
      },
      {
        name: "--success-10",
        defaultValue: "light-dark(hsl(160, 84%, 21.45%), hsl(160, 84%, 69.5%))"
      },
      {
        name: "--success-11",
        defaultValue: "light-dark(hsl(160, 84%, 12.67%), hsl(160, 84%, 84.75%))"
      },
      {
        name: "--success-12",
        defaultValue: "light-dark(hsl(160, 84%, 3.9%), hsl(160, 84%, 100%))"
      },
      {
        name: "--success-g2",
        defaultValue: "linear-gradient(180deg, hsl(160, 84%, 54.25%) 0%, hsl(160, 84%, 39%) 50%)"
      },
      {
        name: "--success-g3",
        defaultValue: "linear-gradient(180deg, hsl(160, 84%, 69.5%) 0%, hsl(160, 84%, 39%) 50%)"
      },
      {
        name: "--base-1",
        defaultValue: "light-dark(#fff, hsl(0, 0%, 5.75%))"
      },
      {
        name: "--base-2",
        defaultValue: "light-dark(hsl(0, 0%, 98.05%), hsl(0, 0%, 8.75%))"
      },
      {
        name: "--base-3",
        defaultValue: "light-dark(hsl(0, 0%, 94.5%), hsl(0, 0%, 11.5%))"
      },
      {
        name: "--base-4",
        defaultValue: "light-dark(hsl(0, 0%, 84.75%), hsl(0, 0%, 17.25%))"
      },
      {
        name: "--base-5",
        defaultValue: "light-dark(hsl(0, 0%, 79.75%), hsl(0, 0%, 21%))"
      },
      {
        name: "--base-6",
        defaultValue: "light-dark(hsl(0, 0%, 66.25%), hsl(0, 0%, 28.75%))"
      },
      {
        name: "--base-7",
        defaultValue: "light-dark(hsl(0, 0%, 54.5%), hsl(0, 0%, 34.5%))"
      },
      {
        name: "--base-8",
        defaultValue: "light-dark(hsl(0, 0%, 46%), hsl(0, 0%, 54%))"
      },
      {
        name: "--base-9",
        defaultValue: "light-dark(hsl(0, 0%, 35.65%), hsl(0, 0%, 64.5%))"
      },
      {
        name: "--base-10",
        defaultValue: "light-dark(hsl(0, 0%, 25.3%), hsl(0, 0%, 73%))"
      },
      {
        name: "--base-11",
        defaultValue: "light-dark(hsl(0, 0%, 14.95%), hsl(0, 0%, 86.5%))"
      },
      {
        name: "--base-12",
        defaultValue: "light-dark(hsl(0, 0%, 4.6%), hsl(0, 0%, 100%))"
      },
      {
        name: "--base-g2",
        defaultValue: "linear-gradient(180deg, hsl(0, 0%, 66.25%) 0%, hsl(0, 0%, 46%) 50%)"
      },
      {
        name: "--base-g3",
        defaultValue: "linear-gradient(180deg, hsl(0, 0%, 73%) 0%, hsl(0, 0%, 46%) 50%)"
      },
      {
        name: "--base-g6",
        defaultValue: "linear-gradient(180deg, hsl(0, 0%, 25.3%) 0%, hsl(0, 0%, 14.95%) 50%)"
      },
      {
        name: "--base-g7",
        defaultValue: "linear-gradient(180deg, hsl(0, 0%, 35.65%) 0%, hsl(0, 0%, 14.95%) 50%)"
      },
      {
        name: "--primary-c8",
        defaultValue: "var(--light-text)"
      },
      {
        name: "--accent-c8",
        defaultValue: "var(--light-text)"
      },
      {
        name: "--warn-c8",
        defaultValue: "var(--light-text)"
      },
      {
        name: "--error-c8",
        defaultValue: "var(--light-text)"
      },
      {
        name: "--success-c8",
        defaultValue: "var(--light-text)"
      },
      {
        name: "--display-10",
        defaultValue: "600 #{p2r(80)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--display-20",
        defaultValue: "600 #{p2r(72)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--display-30",
        defaultValue: "600 #{p2r(64)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--display-40",
        defaultValue: "600 #{p2r(56)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--display-50",
        defaultValue: "600 #{p2r(48)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--title-10",
        defaultValue: "500 #{p2r(40)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--title-20",
        defaultValue: "500 #{p2r(32)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--title-30",
        defaultValue: "500 #{p2r(24)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--title-10B",
        defaultValue: "600 #{p2r(40)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--title-20B",
        defaultValue: "600 #{p2r(32)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--title-30B",
        defaultValue: "600 #{p2r(24)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--paragraph-10",
        defaultValue: "500 #{p2r(18)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--paragraph-20",
        defaultValue: "500 #{p2r(16)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--paragraph-30",
        defaultValue: "500 #{p2r(14)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--paragraph-40",
        defaultValue: "500 #{p2r(12)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--paragraph-10B",
        defaultValue: "600 #{p2r(18)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--paragraph-20B",
        defaultValue: "600 #{p2r(16)} / normal Inter Tight, sans-serif"
      },
      {
        name: "--paragraph-30B",
        defaultValue: "600 #{p2r(14)} / #{p2r(18)} Inter Tight, sans-serif"
      },
      {
        name: "--paragraph-40B",
        defaultValue: "600 #{p2r(12)} / normal Inter Tight, sans-serif"
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
    path: "projects/ship-ui/styles/components/ship-sheet.utility.scss",
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

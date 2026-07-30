import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BaseComponentBlockBehavior, SHIP_EDITOR_BLOCK_CONTEXT, SlashCommand, SlashCommandCtx } from '@ship-ui/core/ship-editor';

/**
 * Interactive widget block: clicks pass straight through to the component,
 * the count persists in the block's attrs (so it survives undo/redo and
 * serialization), and the context's select()/remove() drive the editor.
 */
@Component({
  selector: 'app-demo-counter-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'demo-counter-block' },
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 12px 0;
      padding: 12px;
      border: 1px dashed var(--base-8);
      border-radius: var(--shape-2);
      background: var(--base-3);
    }
    .demo-block-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--base-10);
      user-select: none;
    }
    .demo-counter-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    strong {
      min-width: 32px;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    .demo-spacer {
      flex: 1;
    }
    button {
      padding: 4px 10px;
      border: 1px solid var(--base-8);
      border-radius: var(--shape-1);
      background: var(--base-1);
      color: inherit;
      cursor: pointer;
    }
    button:hover:not(:disabled) {
      background: var(--base-4);
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
  `,
  template: `
    <span class="demo-block-label">Counter widget · stored in attrs</span>
    <div class="demo-counter-row">
      <button type="button" (click)="ctx.updateAttrs({ count: count() - 1 })" [disabled]="ctx.readonly()">−</button>
      <strong>{{ count() }}</strong>
      <button type="button" (click)="ctx.updateAttrs({ count: count() + 1 })" [disabled]="ctx.readonly()">+</button>
      <span class="demo-spacer"></span>
      <button type="button" (click)="ctx.select()">Select block</button>
      <button type="button" (click)="ctx.remove()" [disabled]="ctx.readonly()">Remove</button>
    </div>
  `,
})
export class DemoCounterBlock {
  ctx = inject(SHIP_EDITOR_BLOCK_CONTEXT);
  count = computed(() => Number(this.ctx.attrs()['count'] ?? 0));
}

export class CounterBlockBehavior extends BaseComponentBlockBehavior {
  readonly type = 'demo-counter';
  readonly component = DemoCounterBlock;

  override slashCommands(): SlashCommand[] {
    return [
      {
        id: 'demo-counter',
        label: 'Counter widget',
        icon: 'plus-minus',
        keywords: ['counter', 'widget', 'component'],
        group: 'Widgets',
        run: (c: SlashCommandCtx) => c.engine.insertVoidBlock('demo-counter', { count: 0 }),
      },
    ];
  }
}

/**
 * Embedded-editor stand-in: while focus is inside the textarea the ship
 * editor intercepts nothing — arrows, shortcuts, clipboard all belong to the
 * component, the way an embedded ProseMirror or Monaco needs its full keymap.
 * Escape hands control back by selecting the block.
 */
@Component({
  selector: 'app-demo-code-pad-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'demo-code-pad-block' },
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 12px 0;
      padding: 12px;
      border: 1px dashed var(--base-8);
      border-radius: var(--shape-2);
      background: var(--base-3);
    }
    .demo-block-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--base-10);
      user-select: none;
    }
    textarea {
      width: 100%;
      resize: vertical;
      font: var(--code-20, monospace);
      padding: 8px;
      border: 1px solid var(--base-8);
      border-radius: var(--shape-1);
      background: var(--base-1);
      color: var(--base-12);
    }
  `,
  template: `
    <span class="demo-block-label">Code pad · every key stays in here — Escape selects the block</span>
    <textarea
      spellcheck="false"
      rows="4"
      [value]="code()"
      [readonly]="ctx.readonly()"
      (input)="onInput($event)"
      (keydown.escape)="ctx.select()"></textarea>
  `,
})
export class DemoCodePadBlock {
  ctx = inject(SHIP_EDITOR_BLOCK_CONTEXT);
  code = computed(() => String(this.ctx.attrs()['code'] ?? ''));

  onInput(event: Event) {
    this.ctx.updateAttrs({ code: (event.target as HTMLTextAreaElement).value });
  }
}

export class CodePadBlockBehavior extends BaseComponentBlockBehavior {
  readonly type = 'demo-code-pad';
  readonly component = DemoCodePadBlock;

  override slashCommands(): SlashCommand[] {
    return [
      {
        id: 'demo-code-pad',
        label: 'Code pad',
        icon: 'code',
        keywords: ['code', 'pad', 'component', 'widget'],
        group: 'Widgets',
        run: (c: SlashCommandCtx) => c.engine.insertVoidBlock('demo-code-pad', { code: 'const answer = 42;' }),
      },
    ];
  }
}

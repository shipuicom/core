import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';
import { ShipCode } from '@ship-ui/core/ship-code';
import { ShipSelect } from '@ship-ui/core/ship-select';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';

const SAMPLE = `// ShipCode — a columnar, virtualized code surface
//
// The document is a line column with a prefix-sum index; the
// selection is a flat {anchor, head} pair, and the viewport
// renders only the visible window of lines.

export function greet(name: string): string {
  const message = \`Hello, \${name}!\`;
  return message;
}

for (let i = 0; i < 3; i++) {
  console.log(greet('ship-' + i));
}
`;

function bigDocument(lines: number): string {
  const out: string[] = [];
  for (let i = 0; i < lines; i++) {
    if (i % 20 === 0) out.push(`// ---- section ${i / 20} ----`);
    else if (i % 5 === 0) out.push(`function fn_${i}(x: number): number { return x * ${i}; }`);
    else out.push(`const value_${i} = fn_${Math.max(0, i - (i % 5))}(${i});`);
  }
  return out.join('\n');
}

@Component({
  selector: 'app-code',
  standalone: true,
  imports: [FormsModule, ShipCode, ShipCheckbox, ShipSelect, Previewer, Highlight],
  templateUrl: './code.html',
  styleUrl: './code.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Code {
  usageExample = `import { ShipCode } from '@ship-ui/core/ship-code';

@Component({
  imports: [ShipCode],
  template: \`<sh-code [(value)]="source" keymap="vscode" />\`,
})
export class MyComponent {
  source = signal('const x = 42;');
}`;

  readonly = signal(false);
  lineNumbers = signal(true);
  keymap = signal<'sublime' | 'vscode'>('sublime');
  keymapOptions = [
    { value: 'sublime', label: 'Sublime' },
    { value: 'vscode', label: 'VS Code' },
  ];

  source = signal(SAMPLE);

  /** 20,000 generated lines — well past the virtualization threshold. */
  bigSource = signal(bigDocument(20000));
  readonly bigLineCount = computed(() => this.bigSource().split('\n').length);
}

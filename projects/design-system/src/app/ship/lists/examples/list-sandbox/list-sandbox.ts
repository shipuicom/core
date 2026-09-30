import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipList } from '@ship-ui/core/ship-list';

export type ListSandboxVariant = '' | 'base-1' | 'outlined' | 'type-b' | 'type-c';
export type ListSandboxColor = '' | 'primary' | 'accent' | 'warn' | 'error' | 'success';

@Component({
  selector: 'app-list-sandbox',
  imports: [ShipList, ShipIcon],
  templateUrl: './list-sandbox.html',
  styleUrl: './list-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListSandbox {
  variant = input<ListSandboxVariant>('');
  color = input<ListSandboxColor>('');
  collapsed = input(false);

  active = signal<string | null>('projects');
}

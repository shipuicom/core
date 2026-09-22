import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';

const PRIORITIES = ['urgent', 'high', 'medium', 'low'] as const;
const LABELS = [
  { name: 'bug', color: '#dc2626' },
  { name: 'feature', color: '#2563eb' },
  { name: 'docs', color: '#16a34a' },
];

@Component({
  selector: 'app-selected-chip',
  imports: [ShipChip, ShipIcon],
  templateUrl: './selected-chip.html',
  styleUrl: './selected-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectedChip {
  priorities = PRIORITIES;
  labels = LABELS;
  selectedPriorities = signal<string[]>(['high']);
  selectedLabels = signal<string[]>(['bug']);
  mine = signal(false);

  togglePriority(priority: string, on: boolean) {
    this.selectedPriorities.update((list) => (on ? [...list, priority] : list.filter((p) => p !== priority)));
  }

  toggleLabel(label: string, on: boolean) {
    this.selectedLabels.update((list) => (on ? [...list, label] : list.filter((l) => l !== label)));
  }
}

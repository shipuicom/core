import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipLayoutStatGoalVariant } from '@ship-ui/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipLayoutStatGoal } from '@ship-ui/core/ship-layout';

@Component({
  selector: 'app-stat-goal-sandbox',
  imports: [ShipLayoutStatGoal, ShipIcon],
  templateUrl: './stat-goal-sandbox.html',
  styleUrl: '../sandbox.scss',
  host: { class: 'stats' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatGoalSandbox {
  variant = input<ShipLayoutStatGoalVariant>('');
}

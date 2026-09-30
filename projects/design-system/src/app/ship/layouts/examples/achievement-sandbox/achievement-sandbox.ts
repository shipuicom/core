import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipColor, ShipLayoutAchievementVariant } from '@ship-ui/core';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipLayoutAchievement } from '@ship-ui/core/ship-layout';

@Component({
  selector: 'app-achievement-sandbox',
  imports: [ShipLayoutAchievement, ShipChip, ShipIcon],
  templateUrl: './achievement-sandbox.html',
  styleUrl: '../sandbox.scss',
  host: { class: 'stats' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementSandbox {
  variant = input<ShipLayoutAchievementVariant>('');
  color = input<ShipColor>('primary');
  media = input<'icon' | 'image'>('icon');
  locked = input(true);
  /** Any CSS color; when set it overrides `color` through the dynamic mode. */
  dynamicColor = input<string | null | undefined>(null);
}

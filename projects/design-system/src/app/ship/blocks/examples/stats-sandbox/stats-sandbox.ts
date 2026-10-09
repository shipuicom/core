import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipBlockStatsVariant, ShipColor } from '@ship-ui/core';
import { ShipBlockStat, ShipBlockStats } from '@ship-ui/core/ship-block';
import { ShipIcon } from '@ship-ui/core/ship-icon';

// subset: 'shicon:cloud-check' 'shicon:cube' 'shicon:lightning' 'shicon:users-three'
@Component({
  selector: 'app-stats-sandbox',
  imports: [ShipBlockStats, ShipBlockStat, ShipIcon],
  templateUrl: './stats-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsSandbox {
  variant = input<ShipBlockStatsVariant>('');
  color = input<ShipColor>('primary');

  stats = [
    { icon: 'users-three', value: '10k+', label: 'Teams building with ShipUI', note: 'Up 3× since last year' },
    { icon: 'cube', value: '80+', label: 'Components and blocks', note: 'All themed by the same tokens' },
    { icon: 'cloud-check', value: '99.99%', label: 'Docs and CDN uptime', note: 'Over the last 12 months' },
    { icon: 'lightning', value: '< 5 kB', label: 'CSS per component, gzipped', note: 'Loaded with the component' },
  ];
}

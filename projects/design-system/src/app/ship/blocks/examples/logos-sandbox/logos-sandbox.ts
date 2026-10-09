import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipBlockLogosVariant } from '@ship-ui/core';
import { ShipBlockLogos } from '@ship-ui/core/ship-block';
import { ShipIcon } from '@ship-ui/core/ship-icon';

// subset: 'shicon:circles-three' 'shicon:compass' 'shicon:hexagon' 'shicon:lightning' 'shicon:planet' 'shicon:triangle'
@Component({
  selector: 'app-logos-sandbox',
  imports: [ShipBlockLogos, ShipIcon],
  templateUrl: './logos-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogosSandbox {
  variant = input<ShipBlockLogosVariant>('');

  brands = [
    { icon: 'hexagon', name: 'Hexacorp' },
    { icon: 'compass', name: 'Northvale' },
    { icon: 'triangle', name: 'Peakform' },
    { icon: 'circles-three', name: 'Triad' },
    { icon: 'lightning', name: 'Voltwave' },
    { icon: 'planet', name: 'Orbitly' },
  ];
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipList } from '@ship-ui/core/ship-list';

@Component({
  selector: 'app-basic-list',
  standalone: true,
  imports: [ShipList],
  templateUrl: './basic-list.html',
  styleUrl: './basic-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicList {}

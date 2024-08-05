import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-spk-button-group',
  standalone: true,
  imports: [],
  templateUrl: './spk-button-group.component.html',
  styleUrl: './spk-button-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkButtonGroupComponent {}

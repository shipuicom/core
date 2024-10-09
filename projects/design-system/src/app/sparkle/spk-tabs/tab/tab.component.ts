import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-tab',
  standalone: true,
  imports: [],
  templateUrl: './tab.component.html',
  styleUrl: './tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TabComponent {
  id = input.required();
}

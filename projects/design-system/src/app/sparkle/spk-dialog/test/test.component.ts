import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-test',
  imports: [],
  templateUrl: './test.component.html',
  styleUrl: './test.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TestComponent {
  stickyHeader = signal(false);
  stickyFooter = signal(false);
}

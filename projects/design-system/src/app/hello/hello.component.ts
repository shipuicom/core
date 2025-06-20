import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hello',
  imports: [],
  templateUrl: './hello.component.html',
  styleUrl: './hello.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HelloComponent {}

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hello',
  imports: [],
  templateUrl: './hello.html',
  styleUrl: './hello.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Hello {}

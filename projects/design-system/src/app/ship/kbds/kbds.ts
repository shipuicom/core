import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BasicKbd } from './examples/basic-kbd/basic-kbd';

@Component({
  selector: 'app-kbds',
  imports: [Previewer, BasicKbd],
  templateUrl: './kbds.html',
  styleUrl: './kbds.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Kbds {
  view = signal<'example' | 'code'>('example');
}

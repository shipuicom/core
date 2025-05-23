import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-spk-typography',
  imports: [JsonPipe],
  templateUrl: './spk-typography.component.html',
  styleUrl: './spk-typography.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkTypographyComponent {
  someJson = {
    foo: 'bar',
    baz: 'qux',
    quux: 'quuux',
    corge: {
      grault: 1,
      garply: true,
      waldo: 'fred',
    },
  };
}

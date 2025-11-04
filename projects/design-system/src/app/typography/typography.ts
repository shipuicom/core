import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-typography',
  imports: [JsonPipe, ShipIcon],
  templateUrl: './typography.html',
  styleUrl: './typography.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Typography {
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

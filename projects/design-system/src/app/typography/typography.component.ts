import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipIconComponent } from 'ship-ui';

@Component({
  selector: 'app-typography',
  imports: [JsonPipe, ShipIconComponent],
  templateUrl: './typography.component.html',
  styleUrl: './typography.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TypographyComponent {
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

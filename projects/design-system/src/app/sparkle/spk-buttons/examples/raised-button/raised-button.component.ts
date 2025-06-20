import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleButtonComponent, SparkleIconComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-raised-button',
  imports: [SparkleIconComponent, SparkleButtonComponent],
  templateUrl: './raised-button.component.html',
  styleUrl: './raised-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedButtonComponent {}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleButtonComponent, SparkleIconComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-simple-button',
  imports: [SparkleIconComponent, SparkleButtonComponent],
  templateUrl: './simple-button.component.html',
  styleUrl: './simple-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleButtonComponent {}

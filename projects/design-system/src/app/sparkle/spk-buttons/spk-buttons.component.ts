import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SparkleButtonGroupComponent,
  SparkleCardComponent,
  SparkleIconComponent,
  SparkleTabsComponent,
} from '../../../../../sparkle-ui/src/public-api';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { BaseButtonComponent } from './examples/base-button/base-button.component';
import { FlatButtonComponent } from './examples/flat-button/flat-button.component';
import { IconButtonComponent } from './examples/icon-button/icon-button.component';
import { OutlinedButtonComponent } from './examples/outlined-button/outlined-button.component';
import { RaisedButtonComponent } from './examples/raised-button/raised-button.component';
import { SimpleButtonComponent } from './examples/simple-button/simple-button.component';

@Component({
  selector: 'app-spk-buttons',
  imports: [
    SparkleButtonGroupComponent,
    SparkleCardComponent,
    SparkleTabsComponent,
    SparkleIconComponent,

    PreviewerComponent,

    BaseButtonComponent,
    OutlinedButtonComponent,
    SimpleButtonComponent,
    IconButtonComponent,
    FlatButtonComponent,
    RaisedButtonComponent,
  ],
  templateUrl: './spk-buttons.component.html',
  styleUrl: './spk-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkButtonsComponent {
  isSmall = signal<boolean>(false);
  view = signal<'example' | 'code'>('example');
}

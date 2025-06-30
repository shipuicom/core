import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleButtonGroupComponent } from '../../../../../sparkle-ui/src/public-api';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseButtonGroupComponent } from './examples/base-button-group/base-button-group.component';

@Component({
  selector: 'app-spk-button-group',
  imports: [PreviewerComponent, PropertyViewerComponent, BaseButtonGroupComponent, SparkleButtonGroupComponent],
  templateUrl: './spk-button-group.component.html',
  styleUrl: './spk-button-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkButtonGroupComponent {
  small = signal(false);
}

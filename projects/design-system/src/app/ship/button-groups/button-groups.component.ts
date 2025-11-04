import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from 'ship-ui';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseButtonGroupComponent } from './examples/base-button-group/base-button-group.component';

@Component({
  selector: 'app-button-groups',
  imports: [PreviewerComponent, PropertyViewerComponent, BaseButtonGroupComponent, ShipButtonGroup],
  templateUrl: './button-groups.component.html',
  styleUrl: './button-groups.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonGroupComponent {
  small = signal(false);
  type = signal<'' | 'type-b'>('');
}

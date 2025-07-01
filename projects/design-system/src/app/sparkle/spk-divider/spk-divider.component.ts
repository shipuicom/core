import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseDividerComponent } from './examples/base-divider/base-divider.component';
import { TextDividerComponent } from './examples/text-divider/text-divider.component';

@Component({
  selector: 'app-spk-divider',
  imports: [BaseDividerComponent, TextDividerComponent, PropertyViewerComponent, PreviewerComponent],
  templateUrl: './spk-divider.component.html',
  styleUrl: './spk-divider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkDividerComponent {}

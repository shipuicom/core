import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseDividerComponent } from './examples/base-divider/base-divider.component';
import { TextDividerComponent } from './examples/text-divider/text-divider.component';

@Component({
  selector: 'app-dividers',
  imports: [BaseDividerComponent, TextDividerComponent, PropertyViewerComponent, PreviewerComponent],
  templateUrl: './dividers.component.html',
  styleUrl: './dividers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DividersComponent {}

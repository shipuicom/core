import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseDivider } from './examples/base-divider/base-divider';
import { TextDivider } from './examples/text-divider/text-divider';

@Component({
  selector: 'app-dividers',
  imports: [BaseDivider, TextDivider, PropertyViewer, Previewer],
  templateUrl: './dividers.html',
  styleUrl: './dividers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Dividers {}

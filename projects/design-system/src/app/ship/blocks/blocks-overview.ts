import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { CompanyPageExample } from './examples/company-page/company-page';
import { LandingPageExample } from './examples/landing-page/landing-page';

@Component({
  selector: 'app-blocks-overview',
  imports: [Previewer, PropertyViewer, LandingPageExample, CompanyPageExample],
  templateUrl: './blocks-overview.html',
  styleUrl: './blocks-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BlocksOverview {}

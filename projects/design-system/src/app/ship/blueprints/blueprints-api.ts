import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-blueprints-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipBlueprint" />`,
  styleUrl: './blueprints-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BlueprintsApi {}

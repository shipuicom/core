import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-a11y-keybindings-api',
  imports: [ApiReference],
  template: `<app-api-reference name="ShipA11yKeybindingsDirective" />`,
  styleUrl: './a11y-keybindings-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class A11yKeybindingsApi {}

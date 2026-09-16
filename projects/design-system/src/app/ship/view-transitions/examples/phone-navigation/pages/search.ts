import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipFormField } from '@ship-ui/core/ship-form-field';

@Component({
  selector: 'app-demo-search',
  imports: [ShipFormField],
  template: `
    <h3>Search</h3>
    <sh-form-field>
      <label>Query</label>
      <input placeholder="Search anything" />
    </sh-form-field>
    <p>Switching tabs slides sideways because the tab routes are siblings.</p>
    <div class="hero"></div>
  `,
  styleUrl: './demo-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoSearch {}

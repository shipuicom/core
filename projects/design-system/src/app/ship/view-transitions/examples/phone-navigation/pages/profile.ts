import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-demo-profile',
  template: `
    <div class="hero"></div>
    <h3>Profile</h3>
    <p>Rightmost tab, so every other tab is "back" from here.</p>
  `,
  styleUrl: './demo-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoProfile {}

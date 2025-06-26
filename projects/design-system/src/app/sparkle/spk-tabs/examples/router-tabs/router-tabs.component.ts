import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SparkleIconComponent, SparkleTabsComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-router-tabs',
  imports: [SparkleTabsComponent, SparkleIconComponent, RouterLinkActive, RouterLink],
  templateUrl: './router-tabs.component.html',
  styleUrl: './router-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouterTabsComponent {}

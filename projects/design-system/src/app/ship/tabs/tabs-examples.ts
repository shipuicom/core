import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Previewer } from '../../previewer/previewer';
import { CustomTabsComponent } from './examples/custom-tabs/custom-tabs';
import { DefaultTabsComponent } from './examples/default-tabs/default-tabs';
import { RouterTabsComponent } from './examples/router-tabs/router-tabs';
import { TabsSandbox } from './examples/tabs-sandbox/tabs-sandbox';

@Component({
  selector: 'app-tabs-examples',
  imports: [Previewer, RouterOutlet, TabsSandbox, DefaultTabsComponent, CustomTabsComponent, RouterTabsComponent],
  templateUrl: './tabs-examples.html',
  styleUrl: './tabs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TabsExamples {}

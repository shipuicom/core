import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { DaterangeMenuExample } from './examples/daterange-menu-example/daterange-menu-example';
import { BaseMenuExample } from './examples/base-menu-example/base-menu-example';
import { IconSuffixMenu } from './examples/icon-suffix-menu/icon-suffix-menu';
import { MultiLayerMenuExample } from './examples/multi-layer-menu-example/multi-layer-menu-example';
import { SearchMenuExample } from './examples/search-menu-example/search-menu-example';
import { TitlesSearchMenuExample } from './examples/titles-search-menu-example/titles-search-menu-example';
import { ToggleSelectMenuExample } from './examples/toggle-select-menu-example/toggle-select-menu-example';

@Component({
  selector: 'app-menus-examples',
  imports: [
    Previewer,
    BaseMenuExample,
    MultiLayerMenuExample,
    IconSuffixMenu,
    SearchMenuExample,
    TitlesSearchMenuExample,
    ToggleSelectMenuExample,
    DaterangeMenuExample,
  ],
  templateUrl: './menus-examples.html',
  styleUrl: './menus-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MenusExamples {}

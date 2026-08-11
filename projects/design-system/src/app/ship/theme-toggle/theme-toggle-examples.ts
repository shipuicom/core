import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BasicThemeToggle } from './examples/basic-theme-toggle/basic-theme-toggle';
import { StyledThemeToggle } from './examples/styled-theme-toggle/styled-theme-toggle';

@Component({
  selector: 'app-theme-toggle-examples',
  imports: [Previewer, BasicThemeToggle, StyledThemeToggle],
  templateUrl: './theme-toggle-examples.html',
  styleUrl: './theme-toggle-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ThemeToggleExamples {}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PhoneNavigation } from './examples/phone-navigation/phone-navigation';

@Component({
  selector: 'app-view-transitions-examples',
  imports: [Previewer, PhoneNavigation],
  templateUrl: './view-transitions-examples.html',
  styleUrl: './view-transitions-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ViewTransitionsExamples {}

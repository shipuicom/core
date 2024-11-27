import { ChangeDetectionStrategy, Component, input, TemplateRef, viewChild } from '@angular/core';
import { SparkleButtonComponent } from '../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-tab',
  imports: [SparkleButtonComponent],
  templateUrl: './tab.component.html',
  styleUrl: './tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TabComponent {
  id = input.required();

  myDialog = viewChild.required<TemplateRef<any>>('myDialog');

  openDialog() {}
}

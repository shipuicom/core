import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseListExampleComponent } from './examples/base-list-example/base-list-example.component';

@Component({
  selector: 'app-lists',
  imports: [ReactiveFormsModule, PreviewerComponent, BaseListExampleComponent, PropertyViewerComponent],
  templateUrl: './lists.component.html',
  styleUrl: './lists.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListsComponent {
  active = signal(false);
  checkbox1 = new FormControl(false);
  checkbox2 = new FormControl(false);
}

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseListExample } from './examples/base-list-example/base-list-example';

@Component({
  selector: 'app-lists',
  imports: [ReactiveFormsModule, Previewer, BaseListExample, PropertyViewer],
  templateUrl: './lists.html',
  styleUrl: './lists.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListsComponent {
  active = signal(false);
  checkbox1 = new FormControl(false);
  checkbox2 = new FormControl(false);
}

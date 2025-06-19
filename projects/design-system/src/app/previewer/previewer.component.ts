import { HttpClient, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import {
  SparkleCardComponent,
  SparkleIconComponent,
  SparkleTabsComponent,
} from '../../../../sparkle-ui/src/public-api';
import { HighlightComponent } from './highlight/highlight.component';

@Component({
  selector: 'app-previewer',
  imports: [HighlightComponent, SparkleTabsComponent, SparkleIconComponent, SparkleCardComponent],
  templateUrl: './previewer.component.html',
  styleUrl: './previewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewerComponent {
  #http = inject(HttpClient);

  path = input<string>();

  view = signal('example');

  ngOnInit() {
    // console.log('path', this.path());
    console.log('Complete path');
    console.log(`/examples${this.path()}.ts`);
  }

  // tsResource = rxResource({
  //   params: {
  //     path: this.path(),
  //   },
  //   loader: (params) => {
  //     return this.#http.get(`/examples${params.path}.ts`, { responseType: 'text' });
  //   },
  // });
  // tsResource = httpResource.text(`/examples${this.path()}.ts`);
  htmlResource = httpResource.text(`/examples${this.path()}.html`);
  scssResource = httpResource.text(`/examples${this.path()}.scss`);
}

// this.http.get(this.examplePath, { responseType: 'text' }).subscribe(
//   (data) => {
//     this.exampleCode = data;
//   },
//   (error) => {
//     console.error('Error loading example code:', error);
//   }
// );

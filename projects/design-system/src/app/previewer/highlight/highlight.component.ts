import { ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';
import hljs from 'highlight.js';
import scss from 'highlight.js/lib/languages/scss';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';

@Component({
  selector: 'app-highlight',
  imports: [],
  templateUrl: './highlight.component.html',
  styleUrl: './highlight.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightComponent {
  #selfRef = inject(ElementRef);

  // code = input.required<string>();
  language = input.required<string>();

  ngOnInit() {
    hljs.registerLanguage('typescript', typescript);
    hljs.registerLanguage('xml', xml);
    hljs.registerLanguage('scss', scss);
  }

  ngOnAfterContentInit() {
    hljs.highlightElement(this.#selfRef.nativeElement);
  }
}

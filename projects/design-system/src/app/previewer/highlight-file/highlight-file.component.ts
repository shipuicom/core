import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import hljs from 'highlight.js';
import scss from 'highlight.js/lib/languages/scss';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { ShipButton, ShipIcon } from 'ship-ui';

const langMap = {
  ts: 'typescript',
  html: 'xml',
  scss: 'scss',
};
@Component({
  selector: 'app-highlight-file',
  imports: [ShipButton, ShipIcon],
  templateUrl: './highlight-file.component.html',
  styleUrl: './highlight-file.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightFileComponent {
  lang = input.required<'ts' | 'html' | 'scss'>();
  langClass = computed(() => `language-${langMap[this.lang()]}`);
  path = input.required<string>();

  fileResource = httpResource.text(() => `/assets/examples${this.path()}.${this.lang()}`);
  codeRef = viewChild.required<ElementRef<HTMLElement>>('codeRef');

  resourceEffect = effect(() => {
    const fileContent = this.fileResource.value();

    const codeElement = this.codeRef().nativeElement;

    if (fileContent && codeElement) {
      queueMicrotask(() => {
        hljs.highlightElement(codeElement);
      });
    } else {
      console.warn('Could not find <code> element within app-highlight-file for highlighting.');
    }
  });

  ngOnInit() {
    hljs.registerLanguage('typescript', typescript);
    hljs.registerLanguage('xml', xml);
    hljs.registerLanguage('scss', scss);
  }

  copied = signal(false);
  copyToClipboard() {
    const fileContent = this.fileResource.value();

    if (fileContent) {
      navigator.clipboard.writeText(fileContent);

      this.copied.set(true);

      setTimeout(() => {
        this.copied.set(false);
      }, 3000);
    }
  }
}

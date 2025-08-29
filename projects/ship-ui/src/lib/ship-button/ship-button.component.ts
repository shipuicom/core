import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: '[shButton]',
  imports: [],
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sh-sheet-h',
  },
})
export class ShipButtonComponent {
  // #selfRef = inject(ElementRef);
  //   '[class.not-first-node-text]': 'notFirstNodeText()',
  //   '[class.not-last-node-text]': 'notLastNodeText()',
  // notFirstNodeText = signal<boolean>(false);
  // notLastNodeText = signal<boolean>(false);
  // ngOnInit() {
  //   const childNodes = this.#selfRef.nativeElement.childNodes;
  //   this.notFirstNodeText.set(childNodes[0].nodeType !== Node.TEXT_NODE);
  //   this.notLastNodeText.set(childNodes[childNodes.length - 1].nodeType !== Node.TEXT_NODE);
  // }
}

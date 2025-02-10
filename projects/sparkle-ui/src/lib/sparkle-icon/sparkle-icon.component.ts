import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';

const iconTypes = ['bold', 'thin', 'light', 'fill']; // Ignore 'regular' for now
@Component({
  selector: 'spk-icon',
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'currentClass',
  },
})
export class SparkleIconComponent {
  #selfRef = inject(ElementRef);

  get currentClass() {
    const text = this.#selfRef.nativeElement.innerText;

    for (let index = 0; index < iconTypes.length; index++) {
      if (text.endsWith(iconTypes[index])) return iconTypes[index];
    }

    return '';
  }
}

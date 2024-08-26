import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  ElementRef,
  model,
  TemplateRef,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'spk-sortable',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div class="placeholder" #placeholderRef></div>

    @for (item of items(); track $index) {
      @if ($index === 0) {
        <ng-container *ngTemplateOutlet="templateOne(); context: { $implicit: item }"></ng-container>
      } @else {
        <ng-container *ngTemplateOutlet="templateTwo(); context: { $implicit: item }"></ng-container>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleSortableComponent<T> {
  templateOne = contentChild.required<TemplateRef<any>>('templateOne');
  templateTwo = contentChild.required<TemplateRef<any>>('templateTwo');
  placeholderRef = viewChild.required<ElementRef<HTMLDivElement>>('placeholderRef');

  items = model<T[]>([]);
}

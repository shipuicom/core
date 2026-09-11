import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Marks an `<ng-template>` inside `sh-code-input` as the divider rendered
 * between groups of boxes (or between every box when there is no `groupSize`).
 *
 * ```html
 * <sh-code-input [length]="6" [groupSize]="3">
 *   <ng-template shCodeInputDivider><sh-icon>minus</sh-icon></ng-template>
 * </sh-code-input>
 * ```
 */
@Directive({
  selector: 'ng-template[shCodeInputDivider]',
  standalone: true,
})
export class ShipCodeInputDivider {
  templateRef = inject(TemplateRef<unknown>);
}

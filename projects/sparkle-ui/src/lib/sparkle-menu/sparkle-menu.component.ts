import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  HostListener,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { SparklePopoverComponent } from '../sparkle-popover/sparkle-popover.component';

@Component({
  selector: 'spk-menu',
  standalone: true,
  imports: [SparklePopoverComponent],
  template: `
    <spk-popover
      #formFieldWrapper
      [(isOpen)]="isOpen"
      [disableOpenByClick]="true"
      (closed)="close('fromPopover')"
      [above]="above()"
      [right]="right()"
      [options]="{
        closeOnButton: false,
        closeOnEsc: true,
      }">
      <div trigger (click)="isOpen.set(true)">
        <ng-content />
      </div>

      <div class="options" (click)="close('active')">
        <ng-content select="[menu]" />
      </div>
    </spk-popover>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleMenuComponent {
  above = input<boolean>(false);
  right = input<boolean>(false);
  keepClickedOptionActive = input<boolean>(false);
  isOpen = model<boolean>(false);
  closed = output<boolean>();

  activeOptionIndex = signal<number>(-1);
  options = contentChildren<ElementRef<HTMLButtonElement>>('option');
  optionsEl = computed(() =>
    Array.from(this.options())
      .map((x) => x.nativeElement)
      .filter((x) => x.disabled !== true)
  );

  optionsEffect = effect(() => {
    if (!this.isOpen()) return;

    const activeOptionIndex = this.activeOptionIndex();
    const optionElements = this.optionsEl();

    // Add class to active option
    if (activeOptionIndex > -1) {
      for (let index = 0; index < optionElements.length; index++) {
        if (index === activeOptionIndex) {
          optionElements[index].scrollIntoView({ block: 'center' });
          optionElements[index].classList.add('active');
          continue;
        }

        optionElements[index].classList.remove('active');
      }
    }
  });

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.isOpen()) return;

    event.preventDefault();

    const optionElements = this.optionsEl();
    const activeOptionIndex = this.activeOptionIndex();

    if (event.key === 'ArrowDown') {
      if (activeOptionIndex === -1 || (activeOptionIndex as number) === optionElements.length - 1) {
        this.activeOptionIndex.set(0);
      } else {
        this.activeOptionIndex.set((activeOptionIndex as number) + 1);
      }
    } else if (event.key === 'ArrowUp') {
      if (activeOptionIndex === -1 || (activeOptionIndex as number) === 0) {
        this.activeOptionIndex.set(optionElements.length - 1);
      } else {
        this.activeOptionIndex.set((activeOptionIndex as number) - 1);
      }
    } else if (event.key === 'Enter') {
      if (activeOptionIndex > -1) {
        optionElements[activeOptionIndex as number].click();

        setTimeout(() => this.close('active'));
      }
    } else if (event.key === 'Tab') {
      this.close('closed');
    } else {
      this.activeOptionIndex.set(-1);
    }
  }

  close(action: 'fromPopover' | 'closed' | 'active' = 'closed', event?: MouseEvent) {
    // event?.stopPropagation();
    // event?.preventDefault();

    (!this.keepClickedOptionActive() || action === 'closed') && this.#resetActiveOption();

    this.isOpen.set(false);
    this.closed.emit(action === 'active');
  }

  #resetActiveOption() {
    this.activeOptionIndex.set(-1);

    const optionElements = this.optionsEl();

    for (let index = 0; index < optionElements.length; index++) {
      optionElements[index].classList.remove('active');
    }
  }
}

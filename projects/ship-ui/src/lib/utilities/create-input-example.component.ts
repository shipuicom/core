import { Component, computed, contentChild, ElementRef, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { createInputSignal } from './create-input-signal';

@Component({
  selector: 'app-child',
  template: `
    <ng-content />
  `,
})
class ChildComponentExample {
  myTextInput = contentChild<ElementRef<HTMLInputElement>>('myTextInput');
  textInputValue = createInputSignal<string>(this.myTextInput);

  ngOnInit() {
    setTimeout(() => {
      this.textInputValue.set('123123123');
    }, 500);
  }
}

@Component({
  selector: 'app-parent',
  imports: [FormsModule, ChildComponentExample],
  template: `
    <app-child>
      <input type="text" #myTextInput [(ngModel)]="exampleModel" />
    </app-child>
  `,
})
class ParentComponentExample {
  exampleModel = signal<string | undefined>(undefined);

  ngOnInit() {
    setTimeout(() => {
      this.exampleModel.set('123123123');
    }, 1000);
  }
}

@Component({
  selector: 'app-child',
  template: `
    <div class="card">
      <h3>Text input</h3>
      <ng-content select="div[text-wrap]" />
      <p>Text Input Value: {{ textInputValue() }}</p>
      <p>typeof text input value: {{ typeof textInputValue() }}</p>
      <ng-content />
    </div>

    <div class="card">
      <h3>Number input with debounce</h3>
      <ng-content select="div[number-wrap]" />
      <p>Number Input Value: {{ numberInputSignal() }}</p>
      <p>Double Value: {{ doubleValue() }}</p>
      <p>Computed Value + 5: {{ someInputComputed() }}</p>
      <p>typeof number input value: {{ typeof numberInputSignal() }}</p>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 4rem;
      }
      .card {
        padding: 1rem;
        border: 1px solid #ccc;
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class ChildComponent {
  myNumberInput = contentChild<ElementRef<HTMLInputElement>>('myNumberInput');
  myTextInput = contentChild<ElementRef<HTMLInputElement>>('myTextInput');

  textInputValue = createInputSignal<string>(this.myTextInput);
  numberInputSignal = createInputSignal<number>(this.myNumberInput, {
    forceType: 'number',
    debounce: 300,
  });

  doubleValue = computed(() => {
    const val = this.numberInputSignal();
    return val === undefined || val === null ? 0 : val * 2;
  });

  someInputComputed = computed(() => {
    const val = this.numberInputSignal();
    return val === undefined || val === null ? 5 : val + 5;
  });

  ngOnInit() {
    setTimeout(() => {
      this.textInputValue.set('123123123');
    }, 1000);

    setTimeout(() => {
      this.textInputValue.set('');
    }, 2000);
  }
}

@Component({
  selector: 'app-my-component',
  imports: [FormsModule, ChildComponent],
  template: `
    <app-child>
      <div number-wrap>
        <input type="number" #myNumberInput [(ngModel)]="someNumberModel" />
        <p>Some Number Model: {{ someNumberModel() }}</p>
        <p>typeof someNumberModel {{ typeof someNumberModel() }}</p>
      </div>

      @if (showTextInput()) {
        <div text-wrap>
          <input type="text" #myTextInput [(ngModel)]="someModel" />
          <p>typeof someModel {{ typeof someModel() }}</p>
        </div>
      }
      <p>Some Value: {{ someModel() }}</p>

      <button (click)="toggleTextInput()">Toggle Text Input</button>
    </app-child>
  `,
  styles: [
    `
      [number-wrap] {
        outline: 1px solid red;
      }

      [text-wrap] {
        outline: 1px solid yellow;
      }
    `,
  ],
})
export default class MyComponent {
  someNumberModel = signal<number | undefined>(undefined);
  someModel = signal<string>('123');
  showTextInput = signal(true);

  toggleTextInput() {
    this.showTextInput.set(!this.showTextInput());
  }

  ngOnInit() {
    setTimeout(() => {
      this.someNumberModel.set(123);
    }, 1000);
    setTimeout(() => {
      this.someNumberModel.set(undefined);
    }, 2000);
  }
}

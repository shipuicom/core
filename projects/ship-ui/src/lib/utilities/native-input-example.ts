import { ChangeDetectionStrategy, Component, computed, contentChild, ElementRef, signal, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { nativeInputValueSignal } from './native-input-value-signal';

@Component({
  selector: 'app-input-signal-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="card">
      <h3>Text input</h3>
      <ng-content select="div[text-wrap]" />
      <p>Text Input Value: {{ textInputValue() }}</p>
      <p>typeof text input value: {{ typeof textInputValue() }}</p>
    </div>

    <div class="card">
      <h3>Number input with debounce</h3>
      <ng-content select="div[number-wrap]" />
      <p>Number Input Value: {{ numberInputValue() }}</p>
      <p>Double Value: {{ doubleValue() }}</p>
      <p>Computed Value + 5: {{ plusFiveValue() }}</p>
      <p>typeof number input value: {{ typeof numberInputValue() }}</p>
    </div>
  `,
  styleUrl: './native-input-example-demo.scss',
})
export class InputSignalDemoComponent {
  myTextInput = contentChild<ElementRef<HTMLInputElement>>('myTextInput');
  myNumberInput = contentChild<ElementRef<HTMLInputElement>>('myNumberInput');

  textInputValue = nativeInputValueSignal<string>(this.myTextInput);
  numberInputValue = nativeInputValueSignal<number>(this.myNumberInput, {
    forceType: 'number',
    debounce: 300,
  });

  doubleValue = computed(() => {
    const val = this.numberInputValue();
    return val == null ? 0 : val * 2;
  });

  plusFiveValue = computed(() => {
    const val = this.numberInputValue();
    return val == null ? 5 : val + 5;
  });

  ngOnInit() {
    setTimeout(() => {
      this.textInputValue.set('set from the signal');
    }, 1000);

    setTimeout(() => {
      this.textInputValue.set('');
    }, 2000);
  }
}

@Component({
  selector: 'app-create-input-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [FormsModule, InputSignalDemoComponent],
  template: `
    <app-input-signal-demo>
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
    </app-input-signal-demo>
  `,
  styleUrl: './native-input-example.scss',
})
export default class CreateInputExampleComponent {
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

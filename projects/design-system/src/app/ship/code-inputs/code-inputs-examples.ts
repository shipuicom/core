import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseCodeInput } from './examples/base-code-input/base-code-input';
import { DirectiveCodeInput } from './examples/directive-code-input/directive-code-input';
import { GroupedCodeInput } from './examples/grouped-code-input/grouped-code-input';
import { SignalFormCodeInput } from './examples/signal-form-code-input/signal-form-code-input';

@Component({
  selector: 'app-code-inputs-examples',
  imports: [Previewer, BaseCodeInput, GroupedCodeInput, SignalFormCodeInput, DirectiveCodeInput],
  templateUrl: './code-inputs-examples.html',
  styleUrl: './code-inputs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CodeInputsExamples {}

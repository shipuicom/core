import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseSelect } from './examples/base-select/base-select';
import { DisabledSelect } from './examples/disabled-select/disabled-select';
import { InlineSearchMultipleSelect } from './examples/inline-search-multiple-select/inline-search-multiple-select';
import { InlineSearchSelect } from './examples/inline-search-select/inline-search-select';
import { LazySearchMultipleSelect } from './examples/lazy-search-multiple-select/lazy-search-multiple-select';
import { LazySearchSelect } from './examples/lazy-search-select/lazy-search-select';
import { MultipleSelectAsText } from './examples/multiple-select-as-text/multiple-select-as-text';
import { MultipleSelectEllipsis } from './examples/multiple-select-ellipsis/multiple-select-ellipsis';
import { MultipleSelect } from './examples/multiple-select/multiple-select';
import { ObjectSelect } from './examples/object-select/object-select';
import { OptionTemplateSelect } from './examples/option-template-select/option-template-select';
import { PlaceholderTemplateSelect } from './examples/placeholder-template-select/placeholder-template-select';
import { ReactiveSelectDisabled } from './examples/reactive-select-disabled/reactive-select-disabled';
import { ReactiveSelectComponent } from './examples/reactive-select/reactive-select-example';
import { ReadonlySelect } from './examples/readonly-select/readonly-select';
import { SignalFormSelect } from './examples/signal-form-select/signal-form-select';

@Component({
  selector: 'app-selects-examples',
  imports: [
    Previewer,
    BaseSelect,
    MultipleSelect,
    MultipleSelectAsText,
    MultipleSelectEllipsis,
    ReactiveSelectComponent,
    SignalFormSelect,
    DisabledSelect,
    ReadonlySelect,
    OptionTemplateSelect,
    PlaceholderTemplateSelect,
    InlineSearchSelect,
    ObjectSelect,
    LazySearchSelect,
    ReactiveSelectDisabled,
    InlineSearchMultipleSelect,
    LazySearchMultipleSelect,
  ],
  templateUrl: './selects-examples.html',
  styleUrl: './selects-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SelectsExamples {}

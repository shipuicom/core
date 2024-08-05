import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-spk-autocomplete',
  standalone: true,
  imports: [],
  templateUrl: './spk-autocomplete.component.html',
  styleUrl: './spk-autocomplete.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkAutocompleteComponent {}

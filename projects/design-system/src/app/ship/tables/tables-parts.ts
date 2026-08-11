import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-tables-parts',
  imports: [ApiReference],
  templateUrl: './tables-parts.html',
  styleUrl: './tables-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TablesParts {}

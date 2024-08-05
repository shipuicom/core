import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-spk-dialog',
  standalone: true,
  imports: [],
  templateUrl: './spk-dialog.component.html',
  styleUrl: './spk-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkDialogComponent {}

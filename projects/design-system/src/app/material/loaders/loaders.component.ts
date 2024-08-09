import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-spk-progress-bar',
  standalone: true,
  imports: [MatProgressBarModule, MatProgressSpinnerModule],
  templateUrl: './loaders.component.html',
  styleUrl: './loaders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoadersComponent {}

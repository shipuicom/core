import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-colors',
  standalone: true,
  imports: [NgClass, MatDividerModule],
  templateUrl: './colors.component.html',
  styleUrl: './colors.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ColorsComponent {
  colorsL = signal([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
  palettes = signal(['primary', 'accent', 'grey', 'warn', 'success']);
  baseL = signal([10, 20, 30, 40, 50, 60, 70]);
  shadows = signal([10, 20, 30, 40, 50, 60]);
  shapes = signal([1, 2, 3]);
}

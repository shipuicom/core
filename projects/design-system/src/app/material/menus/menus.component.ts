import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { SparkleIconComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [ReactiveFormsModule, SparkleIconComponent, MatButtonModule, MatMenuModule, MatDividerModule],
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MenusComponent {
  // languageMenuTrigger = viewChild<MatMenuTrigger>('languageMenuTrigger');
  // @ViewChild('languageMenuTrigger') set languageMenuTrigger(
  //   value: MatMenuTrigger
  // ) {
  //   value.openMenu();
  // }

  ngOnInit() {
    // this.menuTrigger()?.openMenu();
    // console.log(this.languageMenuTrigger());
    // this.languageMenuTrigger()?.openMenu();
  }
}

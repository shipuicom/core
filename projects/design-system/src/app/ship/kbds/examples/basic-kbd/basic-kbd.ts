import { Component } from '@angular/core';
import { ShipKbd } from '@ship-ui/core/ship-kbd';

@Component({
  selector: 'basic-kbd-example',
  standalone: true,
  imports: [ShipKbd],
  templateUrl: './basic-kbd.html',
  styleUrl: './basic-kbd.scss',
})
export class BasicKbd {}

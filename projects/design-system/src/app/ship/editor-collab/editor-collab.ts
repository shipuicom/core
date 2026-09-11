import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-editor-collab',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './editor-collab.html',
  styleUrl: './editor-collab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorCollab {}

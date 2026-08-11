import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-file-uploads',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './file-uploads.html',
  styleUrl: './file-uploads.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FileUploads {}

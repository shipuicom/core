import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BasicAvatar } from './examples/basic-avatar/basic-avatar';

@Component({
  selector: 'app-avatars-overview',
  imports: [Previewer, BasicAvatar],
  templateUrl: './avatars-overview.html',
  styleUrl: './avatars-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AvatarsOverview {}

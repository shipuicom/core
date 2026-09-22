import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BasicAvatar } from './examples/basic-avatar/basic-avatar';
import { GroupAvatar } from './examples/group-avatar/group-avatar';
import { RingAvatar } from './examples/ring-avatar/ring-avatar';

@Component({
  selector: 'app-avatars-examples',
  imports: [Previewer, BasicAvatar, GroupAvatar, RingAvatar],
  template: `
    <app-previewer path="/avatars/examples/basic-avatar/basic-avatar" title="Initials, images and sizes">
      <app-basic-avatar class="example" />
    </app-previewer>

    <app-previewer path="/avatars/examples/group-avatar/group-avatar" title="Stacked group with overflow">
      <app-group-avatar class="example" />
    </app-previewer>

    <app-previewer path="/avatars/examples/ring-avatar/ring-avatar" title="Activity ring and tooltip">
      <app-ring-avatar class="example" />
    </app-previewer>
  `,
  styleUrl: './avatars-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AvatarsExamples {}

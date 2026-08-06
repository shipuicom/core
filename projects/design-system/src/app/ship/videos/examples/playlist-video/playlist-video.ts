import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipVideo, ShipVideoPlaylist, ShipVideoPlaylistItem } from '@ship-ui/core/ship-video';

@Component({
  selector: 'app-playlist-video',
  standalone: true,
  imports: [ShipVideo, ShipVideoPlaylist],
  templateUrl: './playlist-video.html',
  styleUrl: './playlist-video.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistVideo {
  items: ShipVideoPlaylistItem[] = [
    {
      title: 'Sintel Trailer',
      subtitle: 'Blender Foundation',
      duration: '0:52',
      sources: 'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4',
    },
    {
      title: 'Big Buck Bunny',
      subtitle: 'Blender Foundation',
      duration: '0:10',
      sources: 'https://www.w3schools.com/html/mov_bbb.mp4',
      poster: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg',
    },
    {
      title: 'Tears of Steel',
      subtitle: 'Blender Foundation — full film',
      duration: '12:14',
      sources: 'https://download.blender.org/demo/movies/ToS/tears_of_steel_720p.mov',
    },
  ];
}

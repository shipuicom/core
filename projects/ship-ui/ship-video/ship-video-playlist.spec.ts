import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShipVideo } from './ship-video';
import { ShipVideoPlaylist } from './ship-video-playlist';
import { ShipVideoPlaylistItem } from './ship-video-types';

const ITEMS: ShipVideoPlaylistItem[] = [
  { title: 'First video', sources: 'one.mp4', poster: 'one.jpg', duration: '1:00' },
  { title: 'Second video', subtitle: 'A subtitle', sources: 'two.mp4' },
  { title: 'Third video', sources: 'three.mp4' },
];

@Component({
  template: `
    <sh-video #player />
    <sh-video-playlist [player]="playerRef()" [items]="items()" [(activeIndex)]="index" [autoAdvance]="true">
      <header>Up next</header>
    </sh-video-playlist>
  `,
  imports: [ShipVideo, ShipVideoPlaylist],
  standalone: true,
})
class TestHostComponent {
  playerRef = viewChild.required<ShipVideo>('player');
  items = signal(ITEMS);
  index = signal(0);
}

describe('ShipVideoPlaylist', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let playlist: ShipVideoPlaylist;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    playlist = fixture.debugElement.query(By.directive(ShipVideoPlaylist)).componentInstance;
  });

  it('renders every item with title, subtitle and duration', () => {
    const items = fixture.debugElement.queryAll(By.css('.sh-video-playlist-item'));
    expect(items.length).toBe(3);
    expect(items[0].query(By.css('.sh-video-playlist-title')).nativeElement.textContent.trim()).toBe('First video');
    expect(items[0].query(By.css('.sh-video-playlist-duration')).nativeElement.textContent.trim()).toBe('1:00');
    expect(items[1].query(By.css('.sh-video-playlist-subtitle')).nativeElement.textContent.trim()).toBe('A subtitle');
  });

  it('marks the active item and drives the bound player sources', () => {
    const player = host.playerRef();
    expect(player.parsedSources()[0].src).toBe('one.mp4');

    const active = fixture.debugElement.query(By.css('.sh-video-playlist-item.active'));
    expect(active.query(By.css('.sh-video-playlist-title')).nativeElement.textContent.trim()).toBe('First video');
  });

  it('click selects an item, emits and swaps player content', () => {
    const selected = vi.fn();
    playlist.itemSelected.subscribe(selected);

    fixture.debugElement.queryAll(By.css('.sh-video-playlist-item'))[1].nativeElement.click();
    fixture.detectChanges();

    expect(host.index()).toBe(1);
    expect(selected).toHaveBeenCalledWith({ item: ITEMS[1], index: 1 });
    expect(host.playerRef().parsedSources()[0].src).toBe('two.mp4');
  });

  it('auto-advances when the bound player ends', () => {
    const player = host.playerRef();

    player.videoEnded.emit();
    fixture.detectChanges();

    expect(host.index()).toBe(1);

    player.videoEnded.emit();
    player.videoEnded.emit();
    fixture.detectChanges();

    // clamped at the last item
    expect(host.index()).toBe(2);
  });
});

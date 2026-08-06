import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShipVideo } from './ship-video';
import { ShipVideoControls, ShipVideoPlayButton, ShipVideoPlaytimeLeft } from './ship-video-controls';
import { ShipVideoAd, ShipVideoSource, shipVideoFormatTime, shipVideoLevelsFromSources } from './ship-video-types';

@Component({
  template: `
    <sh-video
      [sources]="sources()"
      [poster]="poster()"
      [ad]="ad()"
      [preload]="preload()"
      [firstFrame]="firstFrame()"
      [(volume)]="volume"
      [(muted)]="muted" />
  `,
  imports: [ShipVideo],
  standalone: true,
})
class TestHostComponent {
  sources = signal<string | ShipVideoSource[] | null>('video.mp4');
  poster = signal<string | null>('poster.jpg');
  ad = signal<ShipVideoAd | null>(null);
  preload = signal<'auto' | 'metadata' | 'none'>('metadata');
  firstFrame = signal(true);
  volume = signal(1);
  muted = signal(false);
}

@Component({
  template: `
    <sh-video sources="video.mp4">
      <sh-video-controls>
        <sh-video-play-button />
        <sh-video-playtime-left />
      </sh-video-controls>
    </sh-video>
  `,
  imports: [ShipVideo, ShipVideoControls, ShipVideoPlayButton, ShipVideoPlaytimeLeft],
  standalone: true,
})
class ComposedHostComponent {}

describe('ShipVideo', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let video: ShipVideo;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, ComposedHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    video = fixture.debugElement.query(By.directive(ShipVideo)).componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the featured poster overlay before start', () => {
    const featured = fixture.debugElement.query(By.css('.sh-video-featured'));
    expect(featured).toBeTruthy();
    expect(featured.query(By.css('.sh-video-featured-image')).nativeElement.getAttribute('src')).toBe('poster.jpg');
  });

  it('renders the default control set when nothing is projected', () => {
    expect(fixture.debugElement.query(By.css('sh-video-controls'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('sh-video-scrubber'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('sh-video-play-button'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('sh-video-fullscreen-button'))).toBeTruthy();
  });

  it('renders only projected controls when composed', () => {
    const composed = TestBed.createComponent(ComposedHostComponent);
    composed.detectChanges();

    expect(composed.debugElement.queryAll(By.css('sh-video-controls')).length).toBe(1);
    expect(composed.debugElement.query(By.css('sh-video-play-button'))).toBeTruthy();
    expect(composed.debugElement.query(By.css('sh-video-fullscreen-button'))).toBeNull();
  });

  it('start() marks started and hides the featured overlay', () => {
    video.start();
    fixture.detectChanges();

    expect(video.state.hasStarted()).toBe(true);
    expect(fixture.debugElement.query(By.css('.sh-video-featured'))).toBeNull();
  });

  it('runs the pre-roll ad before content on first start', () => {
    host.ad.set({ src: 'ad.mp4', skipAfter: 5 });
    fixture.detectChanges();

    const adStarted = vi.fn();
    video.adStarted.subscribe(adStarted);

    video.start();
    fixture.detectChanges();

    expect(video.state.adActive()).toBe(true);
    expect(adStarted).toHaveBeenCalledOnce();
    expect(fixture.debugElement.query(By.css('.sh-video-ad-badge')).nativeElement.textContent.trim()).toBe('Ad');
  });

  it('skip countdown gates the skip button, then skipping ends the ad', () => {
    host.ad.set({ src: 'ad.mp4', skipAfter: 5, clickThroughUrl: 'https://example.com' });
    fixture.detectChanges();
    video.start();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.sh-video-ad-skip.waiting'))).toBeTruthy();

    video.state.adCurrentTime.set(6);
    fixture.detectChanges();

    const skipButton = fixture.debugElement.query(By.css('button.sh-video-ad-skip'));
    expect(skipButton).toBeTruthy();

    const adSkipped = vi.fn();
    const adEnded = vi.fn();
    video.adSkipped.subscribe(adSkipped);
    video.adEnded.subscribe(adEnded);

    skipButton.nativeElement.click();
    fixture.detectChanges();

    expect(video.state.adActive()).toBe(false);
    expect(adSkipped).toHaveBeenCalledOnce();
    expect(adEnded).toHaveBeenCalledOnce();
  });

  it('supports async ad resolvers (VAST-ready)', async () => {
    host.ad.set(() => Promise.resolve({ src: 'resolved-ad.mp4' }));
    fixture.detectChanges();

    video.start();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(video.state.adActive()).toBe(true);
    expect(video.adSources()[0].src).toBe('resolved-ad.mp4');
  });

  it('bridges volume/muted models into the store both ways', () => {
    host.volume.set(0.4);
    fixture.detectChanges();
    expect(video.state.volume()).toBe(0.4);

    video.state.muted.set(true);
    fixture.detectChanges();
    expect(host.muted()).toBe(true);
  });

  it('keyboard: m toggles mute, space toggles play state', () => {
    const hostEl = fixture.debugElement.query(By.directive(ShipVideo)).nativeElement as HTMLElement;

    hostEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
    fixture.detectChanges();
    expect(video.state.muted()).toBe(true);

    hostEl.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();
    expect(video.state.hasStarted()).toBe(true);
  });

  it('multi-source renders every <source> child', () => {
    host.sources.set([
      { src: 'video.webm', type: 'video/webm' },
      { src: 'video.mp4', type: 'video/mp4' },
    ]);
    fixture.detectChanges();

    const sources = fixture.debugElement.queryAll(By.css('source'));
    expect(sources.length).toBe(2);
    expect(sources[0].nativeElement.getAttribute('type')).toBe('video/webm');
  });

  it('height-tagged sources build a sorted quality ladder', () => {
    const levels = shipVideoLevelsFromSources([
      { src: 'v-480.mp4', height: 480 },
      { src: 'v-1080.mp4', height: 1080 },
      { src: 'v-720.mp4', height: 720 },
    ]);

    expect(levels.map((level) => level.label)).toEqual(['1080p', '720p', '480p']);
    expect(levels[0].id).toBe(0);
  });

  it('firstFrame keeps at least metadata preload when no poster is set', () => {
    host.poster.set(null);
    host.preload.set('none');
    fixture.detectChanges();

    expect(video.effectivePreload()).toBe('metadata');
  });

  it('firstFrame can be opted out (preload none stays none)', () => {
    host.poster.set(null);
    host.preload.set('none');
    host.firstFrame.set(false);
    fixture.detectChanges();

    expect(video.effectivePreload()).toBe('none');
  });

  it('a poster wins over the first-frame slate (preload untouched)', () => {
    host.preload.set('none');
    fixture.detectChanges();

    expect(video.effectivePreload()).toBe('none');
  });

  it('cast and airplay buttons render nothing when the browser lacks the APIs', () => {
    // jsdom: no Remote Playback API, no WebKit AirPlay events
    expect(video.state.castAvailable()).toBe(false);
    expect(video.state.airplayAvailable()).toBe(false);
    expect(fixture.debugElement.query(By.css('sh-video-cast-button button'))).toBeNull();
    expect(fixture.debugElement.query(By.css('sh-video-airplay-button button'))).toBeNull();
  });

  it('playtime-left counts down remaining time and follows the ad while active', () => {
    const composed = TestBed.createComponent(ComposedHostComponent);
    composed.detectChanges();
    const composedVideo = composed.debugElement.query(By.directive(ShipVideo)).componentInstance as ShipVideo;

    composedVideo.state.duration.set(90);
    composedVideo.state.currentTime.set(30);
    composed.detectChanges();
    expect(composed.debugElement.query(By.css('.sh-video-playtime-left-pill')).nativeElement.textContent.trim()).toBe('1:00');

    composedVideo.state.adActive.set(true);
    composedVideo.state.adDuration.set(10);
    composedVideo.state.adCurrentTime.set(4);
    composed.detectChanges();
    expect(composed.debugElement.query(By.css('.sh-video-playtime-left-pill')).nativeElement.textContent.trim()).toBe('0:06');

    // hidden for live streams
    composedVideo.state.adActive.set(false);
    composedVideo.state.isLive.set(true);
    composed.detectChanges();
    expect(composed.debugElement.query(By.css('.sh-video-playtime-left-pill'))).toBeNull();
  });

  it('cast and airplay buttons appear when availability is signalled', () => {
    video.state.castAvailable.set(true);
    video.state.airplayAvailable.set(true);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('sh-video-cast-button button'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('sh-video-airplay-button button'))).toBeTruthy();
  });

  it('playlist overrides take precedence over inputs', () => {
    video.playlistSources.set([{ src: 'playlist-item.mp4' }]);
    fixture.detectChanges();

    expect(video.parsedSources()[0].src).toBe('playlist-item.mp4');

    video.playlistSources.set(null);
    fixture.detectChanges();
    expect(video.parsedSources()[0].src).toBe('video.mp4');
  });
});

describe('shipVideoFormatTime', () => {
  it('formats minutes and hours', () => {
    expect(shipVideoFormatTime(0)).toBe('0:00');
    expect(shipVideoFormatTime(63)).toBe('1:03');
    expect(shipVideoFormatTime(3671)).toBe('1:01:11');
    expect(shipVideoFormatTime(NaN)).toBe('0:00');
    expect(shipVideoFormatTime(-5)).toBe('0:00');
  });
});

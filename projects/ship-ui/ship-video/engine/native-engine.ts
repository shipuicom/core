import { EngineStore } from './engine-store';
import { ShipVideoEngine, ShipVideoEngineEvent, ShipVideoEngineState } from './types';

const LIVE_EDGE_TOLERANCE = 10;

/**
 * Safari native HLS: hands the manifest straight to the media element and
 * derives live/DVR state from `seekable`. Quality is native-ABR only.
 */
export class NativeHlsEngine implements ShipVideoEngine {
  #store = new EngineStore('native-hls');
  #video: HTMLVideoElement | null = null;
  #interval: ReturnType<typeof setInterval> | null = null;

  load(video: HTMLVideoElement, src: string) {
    this.#video = video;
    video.src = src;

    this.#interval = setInterval(() => this.#sync(), 1000);
    video.addEventListener('ended', this.#onEnded);
  }

  destroy() {
    if (this.#interval) clearInterval(this.#interval);
    this.#video?.removeEventListener('ended', this.#onEnded);
    if (this.#video) this.#video.removeAttribute('src');
    this.#video = null;
    this.#store.clear();
  }

  getState(): ShipVideoEngineState {
    return this.#store.getState();
  }

  subscribe(listener: (state: ShipVideoEngineState) => void): () => void {
    return this.#store.subscribe(listener);
  }

  on(listener: (event: ShipVideoEngineEvent) => void): () => void {
    return this.#store.on(listener);
  }

  setLevel(_level: number) {}
  setAudioTrack(_id: number) {}
  setSubtitleTrack(_id: number) {}

  seekToLiveEdge() {
    const video = this.#video;
    if (video && video.seekable.length) {
      video.currentTime = video.seekable.end(video.seekable.length - 1);
    }
  }

  setVisibility(_visible: boolean) {}

  #onEnded = () => this.#store.emit({ type: 'ended' });

  #sync() {
    const video = this.#video;
    if (!video) return;

    const isLive = video.duration === Infinity;
    if (!isLive) {
      this.#store.patch({ isLive: false, liveEdge: null, dvrWindow: null, latency: null, atLiveEdge: false });
      return;
    }

    if (!video.seekable.length) return;

    const start = video.seekable.start(0);
    const end = video.seekable.end(video.seekable.length - 1);
    const latency = Math.max(0, end - video.currentTime);

    this.#store.patch({
      isLive: true,
      liveEdge: end,
      dvrWindow: { start, end },
      latency,
      atLiveEdge: latency <= LIVE_EDGE_TOLERANCE,
    });
  }
}

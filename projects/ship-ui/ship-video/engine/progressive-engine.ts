import { EngineStore } from './engine-store';
import { ShipVideoEngine, ShipVideoEngineEvent, ShipVideoEngineState } from './types';

/**
 * Passthrough for plain progressive sources (mp4/webm). The component renders
 * `<source>` children itself; this engine only keeps the interface total.
 */
export class ProgressiveEngine implements ShipVideoEngine {
  #store = new EngineStore('progressive');

  load(_video: HTMLVideoElement, _src: string) {}

  destroy() {
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
  seekToLiveEdge() {}
  setVisibility(_visible: boolean) {}
}

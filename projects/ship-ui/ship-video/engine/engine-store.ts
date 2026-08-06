import { ShipVideoEngineEvent, ShipVideoEngineKind, ShipVideoEngineState } from './types';

export function initialEngineState(kind: ShipVideoEngineKind): ShipVideoEngineState {
  return {
    kind,
    levels: [],
    currentLevel: -1,
    loadingLevel: -1,
    autoLevel: true,
    audioTracks: [],
    currentAudioTrack: -1,
    subtitleTracks: [],
    currentSubtitleTrack: -1,
    isLive: false,
    liveEdge: null,
    dvrWindow: null,
    latency: null,
    atLiveEdge: false,
    bandwidthEstimate: 0,
    forwardBufferLength: 0,
    stalled: false,
    storyboard: null,
    error: null,
  };
}

/** Immutable snapshot store + event bus shared by every engine implementation. */
export class EngineStore {
  #state: ShipVideoEngineState;
  #stateListeners = new Set<(state: ShipVideoEngineState) => void>();
  #eventListeners = new Set<(event: ShipVideoEngineEvent) => void>();

  constructor(kind: ShipVideoEngineKind) {
    this.#state = initialEngineState(kind);
  }

  getState(): ShipVideoEngineState {
    return this.#state;
  }

  patch(partial: Partial<ShipVideoEngineState>) {
    this.#state = { ...this.#state, ...partial };
    for (const listener of this.#stateListeners) listener(this.#state);
  }

  subscribe(listener: (state: ShipVideoEngineState) => void): () => void {
    this.#stateListeners.add(listener);
    return () => this.#stateListeners.delete(listener);
  }

  on(listener: (event: ShipVideoEngineEvent) => void): () => void {
    this.#eventListeners.add(listener);
    return () => this.#eventListeners.delete(listener);
  }

  emit(event: ShipVideoEngineEvent) {
    for (const listener of this.#eventListeners) listener(event);
  }

  clear() {
    this.#stateListeners.clear();
    this.#eventListeners.clear();
  }
}

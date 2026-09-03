import {
  afterNextRender,
  ApplicationRef,
  ComponentRef,
  createComponent,
  Directive,
  ElementRef,
  EnvironmentInjector,
  inject,
  Injector,
  input,
  OnDestroy,
} from '@angular/core';
import { ShipEditor } from '@ship-ui/core/ship-editor';
import { BroadcastChannelTransport } from './broadcast-channel-transport';
import { CollabTransport } from './collab-protocol';
import { ShEditorRemoteCursors } from './sh-editor-remote-cursors';
import { ShipEditorCollab } from './ship-editor-collab';
import { WebSocketTransport } from './websocket-transport';

/**
 * One-attribute collaboration for `sh-editor`.
 *
 * ```html
 * <sh-editor shCollab="my-doc" />                       <!-- same-origin windows -->
 * <sh-editor shCollab="wss://relay.example/my-doc" />   <!-- WebSocket relay -->
 * <sh-editor [shCollab]="myTransport" />                <!-- any CollabTransport -->
 * ```
 *
 * The directive provides the {@link ShipEditorCollab} session, attaches it to
 * the host editor's engine once the editor exists, mounts the
 * {@link ShEditorRemoteCursors} overlay inside the editor body, and tears
 * everything down with the editor. A string value becomes a
 * {@link WebSocketTransport} when it starts with `ws://`/`wss://`, otherwise
 * a {@link BroadcastChannelTransport} channel name; transports created here
 * are destroyed here, a transport you pass in is yours to destroy.
 *
 * Reach the session from the template with `#c="shCollab"` (peers,
 * connected) or inject `ShipEditorCollab` in a child.
 */
@Directive({
  selector: 'sh-editor[shCollab]',
  standalone: true,
  exportAs: 'shCollab',
  providers: [ShipEditorCollab],
})
export class ShEditorCollabDirective implements OnDestroy {
  readonly collab = inject(ShipEditorCollab);
  #editor = inject(ShipEditor, { host: true });
  #elementRef = inject(ElementRef<HTMLElement>);
  #injector = inject(Injector);
  #environmentInjector = inject(EnvironmentInjector);
  #appRef = inject(ApplicationRef);

  /** Channel name, `ws(s)://` relay URL, or a ready {@link CollabTransport}. */
  shCollab = input.required<string | CollabTransport>();
  /** Shown on this peer's remote cursor in other windows. */
  presence = input<{ name: string; color: string }>();
  /** Stable identity for this window; generated when omitted. */
  clientId = input<string>();
  /** Set false to skip the remote-cursor overlay. */
  remoteCursors = input(true);

  #ownedTransport: CollabTransport | null = null;
  #overlay: ComponentRef<ShEditorRemoteCursors> | null = null;

  constructor() {
    afterNextRender(() => {
      const value = this.shCollab();
      const transport = typeof value === 'string' ? (this.#ownedTransport = createTransport(value)) : value;

      this.collab.attach(this.#editor.engine, {
        transport,
        presence: this.presence(),
        clientId: this.clientId(),
      });

      if (this.remoteCursors()) this.#mountOverlay();
    });
  }

  #mountOverlay(): void {
    const host = this.#elementRef.nativeElement as HTMLElement;
    const body = host.querySelector('.sh-editor-body');
    if (!body) return;

    const overlay = createComponent(ShEditorRemoteCursors, {
      environmentInjector: this.#environmentInjector,
      elementInjector: this.#injector,
    });
    overlay.setInput('collab', this.collab);
    overlay.setInput('engine', this.#editor.engine);
    body.appendChild(overlay.location.nativeElement);
    // Created outside the view tree, so register it for change detection.
    this.#appRef.attachView(overlay.hostView);
    this.#overlay = overlay;
  }

  ngOnDestroy(): void {
    this.#overlay?.destroy();
    this.#overlay = null;
    this.collab.detach();
    this.#ownedTransport?.destroy?.();
    this.#ownedTransport = null;
  }
}

function createTransport(value: string): CollabTransport {
  return /^wss?:\/\//i.test(value) ? new WebSocketTransport(value) : new BroadcastChannelTransport(value);
}

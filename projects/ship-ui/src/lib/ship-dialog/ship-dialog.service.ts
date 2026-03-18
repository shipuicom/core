import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  DOCUMENT,
  EmbeddedViewRef,
  inject,
  Injectable,
  InputSignal,
  isSignal,
  OutputEmitterRef,
  OutputRefSubscription,
  TemplateRef,
  Type,
} from '@angular/core';
import { ShipDialog, ShipDialogOptions } from './ship-dialog';

export type Exact<T, U> = U extends T ? (keyof U extends keyof T ? U : never) : never;
export type ComponentDataType<T> = T extends TemplateRef<infer C>
  ? (C extends { $implicit: infer K } ? K : unknown) & Partial<Omit<C, 'close' | '$implicit'>> extends infer R
    ? keyof R extends never
      ? void
      : R
    : void
  : T extends { data: InputSignal<infer K> }
    ? K
    : void;
export type ComponentClosedType<T> = T extends TemplateRef<infer C>
  ? C extends { close: (res?: infer U) => void }
    ? U
    : undefined
  : T extends { closed: OutputEmitterRef<infer U> }
    ? U
    : undefined;

export interface ShipDialogServiceOptions<TData = any, TResult = undefined> extends ShipDialogOptions {
  data?: TData extends void ? void : TData & Exact<TData, TData>;
  closed?: (res: TResult) => void;
}

export type ShipDialogInstance<T> = {
  component: T;
  close: (res?: ComponentClosedType<T>) => void;
  closed: OutputEmitterRef<ComponentClosedType<T>>;
};

export type ShipDialogTemplateInstance<T> = {
  component: undefined;
  close: (res?: ComponentClosedType<T>) => void;
  closed: OutputEmitterRef<ComponentClosedType<T>>;
};

@Injectable({
  providedIn: 'root',
})
export class ShipDialogService {
  #document = inject(DOCUMENT);
  #bodyEl = this.#document.querySelector('body');
  #appRef = inject(ApplicationRef);

  compRef: ComponentRef<ShipDialog> | null = null;
  insertedCompRef: ComponentRef<unknown> | null = null;
  insertedTemplateRef: EmbeddedViewRef<unknown> | null = null;

  closedFieldSub: OutputRefSubscription | null = null;
  compClosedSub: OutputRefSubscription | null = null;

  open<
    I,
    K = ComponentDataType<I>,
    U = ComponentClosedType<I>,
    _Options extends ShipDialogServiceOptions<K, U> = ShipDialogServiceOptions<K, U>,
  >(
    componentOrTemplate: Type<I> | (I extends TemplateRef<any> ? I : never),
    options?: _Options
  ): I extends TemplateRef<any> ? ShipDialogTemplateInstance<I> : ShipDialogInstance<I>;
  open<T = any, K = ComponentDataType<T>, U = ComponentClosedType<T>>(
    componentOrTemplate: Type<T> | TemplateRef<any>,
    options?: any
  ): ShipDialogInstance<any> {
    const environmentInjector = this.#appRef.injector;
    const hostElement = this.#createEl();
    let closingCalled = false;
    let closedField: OutputEmitterRef<U | undefined> | undefined;

    const { data, closed, ...rest } = options || {};

    if (this.compRef) {
      this.#cleanupRefs(true);
    }

    const _self = this;

    function closeAction(arg: U | undefined = undefined) {
      _self.#cleanupRefs();

      if (closingCalled) return;

      closingCalled = true;

      if (closedField && closedField instanceof OutputEmitterRef) {
        closedField.emit(arg as any);
      }

      closed?.(arg as U);
    }

    let projectableNodes: any[][] = [];

    if (componentOrTemplate instanceof TemplateRef) {
      this.insertedTemplateRef = componentOrTemplate.createEmbeddedView({
        $implicit: data,
        close: (res?: any) => closeAction(res),
      });
      projectableNodes = [this.insertedTemplateRef.rootNodes];
    } else {
      this.insertedCompRef = createComponent<T>(componentOrTemplate, {
        environmentInjector,
      });
      projectableNodes = [[this.insertedCompRef.location.nativeElement]];

      const insertedInstance = this.insertedCompRef.instance as T;
      const dataField = (insertedInstance as any).data as InputSignal<K>;
      closedField = (insertedInstance as any).closed as OutputEmitterRef<U | undefined>;

      if (data) {
        if (isSignal(dataField)) {
          this.insertedCompRef.setInput('data', data);
        } else if (!isSignal(dataField)) {
          throw new Error('data is not an input signal on the passed component');
        }
      }

      if (closedField && closedField instanceof OutputEmitterRef) {
        this.closedFieldSub = closedField.subscribe((arg: U | undefined) => {
          this.#cleanupRefs();

          if (closingCalled) return;

          closingCalled = true;

          closed?.(arg as U);

          (this.compRef?.instance.closed as OutputEmitterRef<U | undefined>).emit(arg);
        });
      }
    }

    this.compRef = createComponent(ShipDialog, {
      hostElement,
      environmentInjector,
      projectableNodes,
    });

    if (this.insertedCompRef) {
      this.#appRef.attachView(this.insertedCompRef.hostView);
      this.insertedCompRef.changeDetectorRef.detectChanges();
    }

    if (this.insertedTemplateRef) {
      this.#appRef.attachView(this.insertedTemplateRef);
      this.insertedTemplateRef.detectChanges();
    }

    this.#appRef.attachView(this.compRef.hostView);

    this.compRef.changeDetectorRef.detectChanges();
    this.compRef.instance.isOpen.set(true);
    this.compRef.setInput('options', rest);

    this.compClosedSub = this.compRef.instance.closed.subscribe(() => closeAction());

    return {
      component: this.insertedCompRef?.instance as T | undefined,
      close: closeAction,
      closed: this.compRef.instance.closed as OutputEmitterRef<U | undefined>,
    } as ShipDialogInstance<T>;
  }

  #createEl(): Element {
    const wrapperEl = this.#document.createElement('sh-dialog-ref');
    wrapperEl.id = 'sh-dialog-ref';

    if (!this.#document.getElementById('sh-dialog-ref')) {
      this.#bodyEl?.append(wrapperEl);
    }

    return this.#document.getElementById('sh-dialog-ref')!;
  }

  #cleanupRefs(instant = false) {
    const _self = this;

    instant ? cleanup : queueMicrotask(() => cleanup());

    function cleanup() {
      if (_self.insertedCompRef) {
        _self.#appRef.detachView(_self.insertedCompRef.hostView);
        _self.closedFieldSub?.unsubscribe();
        _self.insertedCompRef.destroy();
        _self.insertedCompRef = null;
      }

      if (_self.insertedTemplateRef) {
        _self.#appRef.detachView(_self.insertedTemplateRef);
        _self.insertedTemplateRef.destroy();
        _self.insertedTemplateRef = null;
      }

      if (!_self.compRef) return;

      _self.#appRef.detachView(_self.compRef.hostView);
      _self.compClosedSub?.unsubscribe();
      _self.compRef.destroy();
    }
  }

  ngOnDestroy() {
    this.#cleanupRefs(true);
  }
}

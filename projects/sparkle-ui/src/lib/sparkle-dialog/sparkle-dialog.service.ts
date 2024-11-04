import { ApplicationRef, ComponentRef, createComponent, EventEmitter, inject, Injectable, Type } from '@angular/core';
import { SparkleDialogComponent, SparkleDialogOptions } from './sparkle-dialog.component';

export interface SparkleDialogServiceOptions<T = any> extends SparkleDialogOptions {
  data?: T;
  closed?: (...args: any[]) => void;
}

interface CustomSparkleDialogComponent {
  data?: any;
  close?: EventEmitter<any>;
}

@Injectable({
  providedIn: 'root',
})
export class SparkleDialogService {
  #bodyEl = document.querySelector('body')!;
  #appRef = inject(ApplicationRef);

  compRef: ComponentRef<SparkleDialogComponent> | null = null;
  insertedCompRef: ComponentRef<unknown> | null = null;

  open<T, K = any>(component: Type<T>, options?: SparkleDialogServiceOptions<K>) {
    const environmentInjector = this.#appRef.injector;
    const hostElement = this.#createEl();

    const { data, closed, ...rest } = options || {};

    if (this.compRef) {
      this.#cleanupRefs();
    }

    this.insertedCompRef = createComponent<T>(component, {
      environmentInjector,
    });

    this.compRef = createComponent(SparkleDialogComponent, {
      hostElement,
      environmentInjector,
      projectableNodes: [[this.insertedCompRef.location.nativeElement]],
    });

    if ((this.insertedCompRef.instance as any)?.data !== undefined) {
      this.insertedCompRef.setInput('data', data);
    }

    if ((this.insertedCompRef.instance as any)?.closed) {
      (this.insertedCompRef.instance as any).closed.subscribe((...args: any[]) => {
        closed?.(...args);

        setTimeout(() => this.#cleanupRefs());
      });
    }

    this.#appRef.attachView(this.insertedCompRef.hostView);
    this.#appRef.attachView(this.compRef.hostView);

    this.insertedCompRef.changeDetectorRef.detectChanges();
    this.compRef.changeDetectorRef.detectChanges();
    this.compRef.instance.isOpen.set(true);
    this.compRef.setInput('options', rest);
    this.compRef.instance.closed.subscribe(() => closeAction());

    const _self = this;

    function closeAction() {
      closed?.(undefined);

      _self.#cleanupRefs();
    }

    return this.insertedCompRef.instance as T;
  }

  #createEl(): Element {
    const wrapperEl = document.createElement('spk-dialog-ref');
    wrapperEl.id = 'spk-dialog-ref';

    if (!document.getElementById('spk-dialog-ref')) {
      this.#bodyEl.append(wrapperEl);
    }

    return document.getElementById('spk-dialog-ref')!;
  }

  #cleanupRefs() {
    if (this.insertedCompRef) {
      this.#appRef.detachView(this.insertedCompRef.hostView);
      this.insertedCompRef.destroy();
    }

    if (!this.compRef) return;

    this.#appRef.detachView(this.compRef.hostView);
    this.compRef.destroy();
  }

  ngOnDestroy() {
    this.#cleanupRefs();
  }
}

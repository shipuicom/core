import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { Component, signal, input, output, viewChild, TemplateRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ShipDialog } from './ship-dialog';
import { ShipDialogService } from './ship-dialog.service';
import { SHIP_CONFIG } from '@ship-ui/core';


if (typeof HTMLDialogElement !== 'undefined') {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
}

@Component({
  template: `
    <sh-dialog
      [isOpen]="isOpen()"
      (isOpenChange)="isOpen.set($event)"
      [options]="options()"
      (closed)="onClosed()">
      <div class="my-content">Dialog Content</div>
    </sh-dialog>
  `,
  imports: [ShipDialog],
  standalone: true,
})
class TestHostComponent {
  isOpen = signal(false);
  options = signal({});
  closedCalled = false;
  onClosed() {
    this.closedCalled = true;
  }
}

@Component({
  selector: 'test-dialog-content',
  template: '<div class="dynamic-content">{{ data() }}</div>',
  standalone: true,
})
class TestDialogContent {
  data = input<string>('');
  closed = output<string>();
}

@Component({
  template: `
    <ng-template #myTemplate let-data let-close="close">
      <div class="template-content">{{ data }}</div>
      <button class="close-btn" (click)="close('result')">Close</button>
    </ng-template>
  `,
  standalone: true,
})
class TestTemplateHostComponent {
  template = viewChild.required<TemplateRef<{ $implicit: string }>>('myTemplate');
}

describe('ShipDialog Component', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let dialogComponent: ShipDialog;
  let dialogDebugEl: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();

    dialogDebugEl = fixture.debugElement.query(By.directive(ShipDialog));
    dialogComponent = dialogDebugEl.componentInstance;
  });

  it('should create dialog', () => {
    expect(dialogComponent).toBeTruthy();
  });

  it('should open and showModal when isOpen is true', async () => {
    hostComponent.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const dialogEl = dialogDebugEl.query(By.css('dialog')).nativeElement;
    expect(dialogEl.hasAttribute('open')).toBe(true);
  });

  it('should close when isOpen becomes false', async () => {
    hostComponent.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    hostComponent.isOpen.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    const dialogEl = dialogDebugEl.query(By.css('dialog'));
    expect(dialogEl).toBeNull();
  });

  it('should trigger close on Esc key by default', async () => {
    hostComponent.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.isOpen()).toBe(false);
  });

  it('should NOT close on Esc key if closeOnEsc is false', async () => {
    hostComponent.options.set({ closeOnEsc: false });
    hostComponent.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    document.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(hostComponent.isOpen()).toBe(true);
  });

  it('should close on outside overlay click if closeOnOutsideClick is true', async () => {
    hostComponent.options.set({ closeOnOutsideClick: true });
    hostComponent.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const overlay = dialogDebugEl.query(By.css('.closeable-overlay'));
    expect(overlay).toBeTruthy();

    overlay.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.isOpen()).toBe(false);
  });
});

describe('ShipDialogService', () => {
  let service: ShipDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ShipDialogService,
        {
          provide: SHIP_CONFIG,
          useValue: { dialogType: 'default' },
        },
      ],
    });
    service = TestBed.inject(ShipDialogService);
  });

  afterEach(() => {
    const el = document.getElementById('sh-dialog-ref');
    if (el) {
      el.remove();
    }
  });

  it('should open a component dynamically', async () => {
    const closedSpy = vi.fn();
    const instance = service.open(TestDialogContent, {
      data: 'Service Data',
      closed: closedSpy,
    });

    service.compRef?.changeDetectorRef.detectChanges();
    service.insertedCompRef?.changeDetectorRef.detectChanges();

    expect(instance.component).toBeTruthy();
    expect(instance.component!.data()).toBe('Service Data');

    const dialogRef = document.getElementById('sh-dialog-ref');
    expect(dialogRef).toBeTruthy();
    expect(dialogRef!.textContent).toContain('Service Data');

    
    instance.close('done');
    
    await new Promise<void>(resolve => queueMicrotask(() => resolve()));

    expect(closedSpy).toHaveBeenCalledWith('done');
  });

  it('should open a template dynamically', async () => {
    const templateHostFixture = TestBed.createComponent(TestTemplateHostComponent);
    templateHostFixture.detectChanges();
    const template = templateHostFixture.componentInstance.template();

    const closedSpy = vi.fn();
    const instance = service.open(template, {
      data: 'Template Data',
      closed: closedSpy,
    });

    service.compRef?.changeDetectorRef.detectChanges();
    service.insertedTemplateRef?.detectChanges();

    expect(instance.component).toBeUndefined();

    
    const dialogRef = document.getElementById('sh-dialog-ref');
    expect(dialogRef).toBeTruthy();
    expect(dialogRef!.textContent).toContain('Template Data');

    
    const closeBtn = dialogRef!.querySelector('.close-btn') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    closeBtn.click();
    
    await new Promise<void>(resolve => queueMicrotask(() => resolve()));

    expect(closedSpy).toHaveBeenCalledWith('result');
  });
});

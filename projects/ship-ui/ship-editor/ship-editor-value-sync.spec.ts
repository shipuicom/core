// @vitest-environment jsdom

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ShipEditor } from './ship-editor';

@Component({
  standalone: true,
  imports: [ShipEditor],
  template: `<sh-editor [(value)]="content" format="html" />`,
})
class Host {
  content = signal<string>('<p>seed</p>');
}

/**
 * A form subscriber may normalize inside valueChanges and write straight back
 * (`control.setValue(...)` → `writeValue`) while the editor's own update is
 * still flushing. Effects coalesce, so a "skip the next run" flag would treat
 * that external write as the editor's own echo and drop it — the control and
 * the document then disagree until the next unrelated write.
 */
describe('value sync with a synchronous write-back subscriber', () => {
  let fixture: ComponentFixture<Host>;
  const editor = () => fixture.debugElement.children[0].componentInstance as ShipEditor;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('adopts a value written back synchronously from onChange', async () => {
    const ed = editor();
    let writes = 0;
    ed.registerOnChange(() => {
      if (writes++ === 0) ed.writeValue('<p>normalized</p>');
    });

    const at = ed.engine.columnar.startOf(0) + 1;
    ed.selection.live.set({ from: at, to: at });
    ed.engine.insertText('zz');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(ed.engine.serialize('html')).toBe('<p>normalized</p>');
    expect(ed.value()).toBe('<p>normalized</p>');
  });

  it('still skips its own echo without a write-back subscriber', async () => {
    const ed = editor();
    const at = ed.engine.columnar.startOf(0) + 1;
    ed.selection.live.set({ from: at, to: at });
    ed.engine.insertText('zz');
    const versionAfterEdit = ed.engine.version();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // The echoed value must not round-trip into a document reset.
    expect(ed.engine.version()).toBe(versionAfterEdit);
    expect(ed.value()).toBe('<p>zzseed</p>');
  });
});

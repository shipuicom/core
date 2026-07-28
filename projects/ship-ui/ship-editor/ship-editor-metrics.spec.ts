// @vitest-environment jsdom

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ShipEditor, ShipEditorMetric } from './ship-editor';

@Component({
  standalone: true,
  imports: [ShipEditor],
  template: `<sh-editor [(value)]="content" [showMetrics]="show()" [metrics]="which()" />`,
})
class Host {
  content = signal<string>('<p>one two three</p>');
  show = signal(true);
  which = signal<readonly ShipEditorMetric[]>(['words', 'characters', 'format']);
}

describe('editor metrics line', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const editor = () => fixture.debugElement.children[0].componentInstance as ShipEditor;
  const line = () => fixture.nativeElement.querySelector('.sh-editor-stats')?.textContent?.trim() ?? null;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('counts words, characters and blocks', () => {
    expect(editor().wordCount()).toBe(3);
    expect(editor().charCount()).toBe('one two three'.length);
    expect(editor().blockCount()).toBe(1);
  });

  it('counts across several blocks without joining them into one word', () => {
    host.content.set('<p>alpha</p><p>beta gamma</p>');
    fixture.detectChanges();
    expect(editor().blockCount()).toBe(2);
    expect(editor().wordCount()).toBe(3);
    // Spaces count; only newlines are excluded, matching the previous behaviour.
    expect(editor().charCount()).toBe('alpha'.length + 'beta gamma'.length);
  });

  it('counts list items as separate blocks are not, but their words still count', () => {
    host.content.set('<ul><li>one</li><li>two three</li></ul>');
    fixture.detectChanges();
    // A list is a single top-level block holding items.
    expect(editor().blockCount()).toBe(1);
    expect(editor().wordCount()).toBe(3);
  });

  it('shows the requested metrics, in order', () => {
    host.which.set(['blocks', 'words']);
    fixture.detectChanges();
    expect(line()).toBe('1 blocks · 3 words');
  });

  it('can show block count alongside the defaults', () => {
    host.which.set(['words', 'characters', 'blocks', 'format']);
    fixture.detectChanges();
    expect(line()).toBe('3 words · 13 characters · 1 blocks · HTML');
  });

  it('renders nothing when every metric is switched off', () => {
    host.which.set([]);
    fixture.detectChanges();
    expect(line()).toBeNull();
  });

  it('hides the line entirely when showMetrics is false', () => {
    host.show.set(false);
    fixture.detectChanges();
    expect(line()).toBeNull();
  });

  // The point of listing metrics is that an unlisted one costs nothing. Counting
  // walks the whole document, so on a large document this is the difference
  // between a full AST walk per keystroke and no work at all.
  it('does not calculate a metric that is not listed', () => {
    let counted = 0;
    const original = Object.getOwnPropertyDescriptor(editor(), 'charCount');
    expect(original).toBeDefined();

    host.which.set(['blocks']);
    fixture.detectChanges();
    expect(line()).toBe('1 blocks');

    // Reading the signal directly still works; it is simply never read by the
    // template while the metric is off.
    counted = editor().charCount();
    expect(counted).toBe(13);
  });

  it('stops calculating when the whole line is hidden', () => {
    host.show.set(false);
    fixture.detectChanges();
    // metricsText short-circuits before touching any count.
    expect(editor().metricsText()).toBe('');
  });

  it('updates as the document changes', () => {
    host.which.set(['words', 'blocks']);
    fixture.detectChanges();
    expect(line()).toBe('3 words · 1 blocks');

    host.content.set('<p>a b</p><p>c</p>');
    fixture.detectChanges();
    expect(line()).toBe('3 words · 2 blocks');
  });

  it('reports zero for an empty document', () => {
    host.content.set('<p></p>');
    fixture.detectChanges();
    expect(editor().wordCount()).toBe(0);
    expect(editor().charCount()).toBe(0);
  });
});

describe('counting on demand', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const editor = () => fixture.debugElement.children[0].componentInstance as ShipEditor;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    host.show.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('measure() returns the counts even with the line hidden', () => {
    expect(editor().measure()).toEqual({ words: 3, characters: 13, blocks: 1 });
  });

  it('measure() reflects the document at the moment it is called', () => {
    expect(editor().measure().blocks).toBe(1);

    host.content.set('<p>a b</p><p>c d</p>');
    fixture.detectChanges();

    expect(editor().measure()).toEqual({ words: 4, characters: 6, blocks: 2 });
  });

  it('measure() agrees with the live signals when the line is on', () => {
    host.show.set(true);
    fixture.detectChanges();
    const m = editor().measure();
    expect(m.words).toBe(editor().wordCount());
    expect(m.characters).toBe(editor().charCount());
    expect(m.blocks).toBe(editor().blockCount());
  });
});

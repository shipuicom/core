import { describe, beforeEach, it, expect, vi } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createTreeSortableManager } from '@ship-ui/core/ship-sortable';
import { ShipTree, ShipTreeOpenIcon, ShipTreeClosedIcon, ShipTreeItemIcon } from './ship-tree';

@Component({
  template: `
    <sh-tree
      [(items)]="items"
      [(selectedId)]="selectedId"
      (nodeClick)="onNodeClick($event)"
      (nodeToggle)="onNodeToggle($event)">
      <sh-icon openIcon>folder-open-custom</sh-icon>
      <sh-icon closedIcon>folder-closed-custom</sh-icon>
      <sh-icon itemIcon>file-custom</sh-icon>
    </sh-tree>
  `,
  standalone: true,
  imports: [ShipTree, ShipTreeOpenIcon, ShipTreeClosedIcon, ShipTreeItemIcon],
})
class TestHostComponent {
  items = signal<any[]>([
    { id: '1', name: 'Root Folder', type: 'dir', parentId: null, isOpen: false },
    { id: '2', name: 'Child File', type: 'file', parentId: '1' },
    { id: '3', name: 'Another Root File', type: 'file', parentId: null },
  ]);
  selectedId = signal<string | null>(null);
  clickedNode: any = null;
  toggledNode: any = null;
  toggledState = false;

  onNodeClick(node: any) {
    this.clickedNode = node;
  }

  onNodeToggle(event: any) {
    this.toggledNode = event.node;
    this.toggledState = event.isOpen;
  }
}

describe('ShipTree', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, ShipTree],
    }).compileComponents();
  });

  it('should create the tree component', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const tree = fixture.nativeElement.querySelector('sh-tree');
    expect(tree).toBeTruthy();
  });

  it('should initially only show top-level visible nodes', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const nodes = fixture.nativeElement.querySelectorAll('.sh-tree-node');
    
    
    expect(nodes.length).toBe(2);
    expect(nodes[0].textContent).toContain('Root Folder');
    expect(nodes[1].textContent).toContain('Another Root File');
  });

  it('should calculate node depth correctly', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const treeComponent = fixture.debugElement.children[0].componentInstance as ShipTree;
    const rootNode = treeComponent.items()[0];
    const childNode = treeComponent.items()[1];

    expect(treeComponent.getNodeDepth(rootNode)).toBe(0);
    expect(treeComponent.getNodeDepth(childNode)).toBe(1);
  });

  it('should select node when clicked', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const firstNode = fixture.nativeElement.querySelector('.sh-tree-node');
    
    firstNode.click();
    fixture.detectChanges();

    expect(host.selectedId()).toBe('1');
    expect(host.clickedNode.name).toBe('Root Folder');
    expect(firstNode.classList.contains('is-selected')).toBe(true);
  });

  it('should toggle folder open/closed state on caret click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    
    
    const caretBtn = fixture.nativeElement.querySelector('.caret-btn');
    expect(caretBtn).toBeTruthy();

    
    caretBtn.click();
    fixture.detectChanges();

    expect(host.toggledNode.id).toBe('1');
    expect(host.toggledState).toBe(true);
    expect(host.items()[0].isOpen).toBe(true);

    
    const nodesAfterOpen = fixture.nativeElement.querySelectorAll('.sh-tree-node');
    expect(nodesAfterOpen.length).toBe(3);
    expect(nodesAfterOpen[1].textContent).toContain('Child File');

    
    caretBtn.click();
    fixture.detectChanges();

    expect(host.toggledState).toBe(false);
    expect(host.items()[0].isOpen).toBe(false);

    
    const nodesAfterClose = fixture.nativeElement.querySelectorAll('.sh-tree-node');
    expect(nodesAfterClose.length).toBe(2);
  });

  it('should resolve custom projected icon names', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const treeComponent = fixture.debugElement.children[0].componentInstance as ShipTree;

    expect(treeComponent.openIconName()).toBe('folder-open-custom');
    expect(treeComponent.closedIconName()).toBe('folder-closed-custom');
    expect(treeComponent.itemIconName()).toBe('file-custom');
  });

  describe('keyboard navigation and aria', () => {
    function setup() {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector('[role="tree"]') as HTMLElement;
      const nodes = () => [...fixture.nativeElement.querySelectorAll('[role="treeitem"]')] as HTMLElement[];
      const press = (key: string) => {
        container.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
        fixture.detectChanges();
      };
      return { fixture, container, nodes, press };
    }

    it('exposes aria level, selection and set position on tree items', () => {
      const { fixture, nodes } = setup();
      const [rootFolder, rootFile] = nodes();

      expect(rootFolder.getAttribute('aria-level')).toBe('1');
      expect(rootFolder.getAttribute('aria-posinset')).toBe('1');
      expect(rootFolder.getAttribute('aria-setsize')).toBe('2');
      expect(rootFolder.getAttribute('aria-expanded')).toBe('false');
      expect(rootFile.getAttribute('aria-posinset')).toBe('2');
      expect(rootFile.getAttribute('aria-expanded')).toBeNull();

      rootFile.click();
      fixture.detectChanges();
      expect(rootFile.getAttribute('aria-selected')).toBe('true');
      expect(rootFolder.getAttribute('aria-selected')).toBe('false');
    });

    it('keeps exactly one tree item in the tab order', () => {
      const { nodes, press } = setup();

      expect(nodes().map((n) => n.tabIndex)).toEqual([0, -1]);

      press('ArrowDown');
      expect(nodes().map((n) => n.tabIndex)).toEqual([-1, 0]);
      expect(document.activeElement).toBe(nodes()[1]);
    });

    it('moves focus with arrow keys, Home and End without wrapping', () => {
      const { nodes, press } = setup();

      press('ArrowUp');
      expect(nodes()[0].tabIndex).toBe(0);

      press('End');
      expect(document.activeElement).toBe(nodes()[1]);
      press('ArrowDown');
      expect(document.activeElement).toBe(nodes()[1]);

      press('Home');
      expect(document.activeElement).toBe(nodes()[0]);
    });

    it('expands, enters and collapses folders with ArrowRight/ArrowLeft', () => {
      const { fixture, nodes, press } = setup();
      const host = fixture.componentInstance;

      press('ArrowRight');
      expect(host.items()[0].isOpen).toBe(true);
      expect(nodes().length).toBe(3);

      press('ArrowRight');
      expect(document.activeElement).toBe(nodes()[1]);
      expect(nodes()[1].textContent).toContain('Child File');

      press('ArrowLeft');
      expect(document.activeElement).toBe(nodes()[0]);

      press('ArrowLeft');
      expect(host.items()[0].isOpen).toBe(false);
      expect(nodes().length).toBe(2);
    });

    it('selects with Enter and toggles folders', () => {
      const { fixture, press } = setup();
      const host = fixture.componentInstance;

      press('Enter');
      expect(host.selectedId()).toBe('1');
      expect(host.clickedNode.name).toBe('Root Folder');
      expect(host.items()[0].isOpen).toBe(true);
    });

    it('jumps to the next match on first-character typeahead', () => {
      const { nodes, press } = setup();

      press('a');
      expect(document.activeElement).toBe(nodes()[1]);
      expect(nodes()[1].textContent).toContain('Another Root File');

      press('r');
      expect(document.activeElement).toBe(nodes()[0]);
    });

    it('keeps caret buttons out of the tab order', () => {
      const { fixture } = setup();
      const caret = fixture.nativeElement.querySelector('.caret-btn') as HTMLElement;
      expect(caret.tabIndex).toBe(-1);
    });
  });

  describe('keyboard reordering with a sortable manager', () => {
    @Component({
      template: `<sh-tree [(items)]="nodes" [sortableManager]="manager" />`,
      standalone: true,
      imports: [ShipTree],
    })
    class SortableHostComponent {
      nodes = signal<any[]>([
        { id: 'a', name: 'Alpha', type: 'file', parentId: null },
        { id: 'b', name: 'Beta', type: 'file', parentId: null },
        { id: 'dir', name: 'Docs', type: 'dir', parentId: null, isOpen: true },
        { id: 'c', name: 'Child', type: 'file', parentId: 'dir' },
      ]);
      manager = createTreeSortableManager(this.nodes);
    }

    function setupSortable() {
      const fixture = TestBed.createComponent(SortableHostComponent);
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector('[role="tree"]') as HTMLElement;
      const nodes = () => [...fixture.nativeElement.querySelectorAll('[role="treeitem"]')] as HTMLElement[];
      const press = (key: string) => {
        container.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
        fixture.detectChanges();
      };
      return { fixture, nodes, press };
    }

    it('grabs with Space, exposes aria-grabbed and announces it', () => {
      const { fixture, nodes, press } = setupSortable();

      expect(nodes()[0].getAttribute('aria-grabbed')).toBe('false');
      press(' ');
      expect(nodes()[0].getAttribute('aria-grabbed')).toBe('true');
      expect(fixture.nativeElement.querySelector('.sh-tree-live').textContent).toContain('Alpha grabbed');

      press(' ');
      expect(nodes()[0].getAttribute('aria-grabbed')).toBe('false');
      expect(fixture.nativeElement.querySelector('.sh-tree-live').textContent).toContain('Alpha dropped');
    });

    it('moves the grabbed node with arrow keys and keeps focus on it', async () => {
      vi.useFakeTimers();
      const { fixture, nodes, press } = setupSortable();

      press(' ');
      press('ArrowDown');
      vi.runAllTimers();
      fixture.detectChanges();

      const rowNames = nodes().map((n) => n.textContent!.trim());
      expect(rowNames[0]).toContain('Beta');
      expect(rowNames[1]).toContain('Alpha');
      expect(rowNames[2]).toContain('Docs');
      expect(rowNames[3]).toContain('Child');
      expect(nodes()[1].getAttribute('aria-grabbed')).toBe('true');
      expect(document.activeElement).toBe(nodes()[1]);

      // Next step down goes inside the open Docs folder.
      press('ArrowDown');
      vi.runAllTimers();
      fixture.detectChanges();
      const host = fixture.componentInstance;
      expect(host.nodes().find((n: any) => n.id === 'a').parentId).toBe('dir');

      press(' ');
      vi.useRealTimers();
    });

    it('reverts to the original position when the grab is cancelled with Escape', () => {
      vi.useFakeTimers();
      const { fixture, nodes, press } = setupSortable();
      const host = fixture.componentInstance;
      const originalIds = host.nodes().map((n: any) => n.id);

      press(' ');
      expect(nodes()[0].getAttribute('aria-grabbed')).toBe('true');

      press('ArrowDown');
      vi.runAllTimers();
      fixture.detectChanges();
      expect(host.nodes().map((n: any) => n.id)).not.toEqual(originalIds);

      press('Escape');
      vi.runAllTimers();
      fixture.detectChanges();

      expect(host.nodes().map((n: any) => n.id)).toEqual(originalIds);
      expect(nodes()[0].getAttribute('aria-grabbed')).toBe('false');
      expect(fixture.nativeElement.querySelector('.sh-tree-live').textContent).toContain('returned to original position');
      vi.useRealTimers();
    });

    it('does not collapse or select while grabbed', () => {
      const { fixture, nodes, press } = setupSortable();
      const host = fixture.componentInstance;

      // Focus/grab the open Docs folder.
      nodes()[2].click();
      fixture.detectChanges();
      press(' ');
      press('ArrowLeft');
      expect(host.nodes().find((n: any) => n.id === 'dir').isOpen).toBe(true);
    });
  });
});

import { describe, beforeEach, it, expect } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    // Root Folder (id 1) and Another Root File (id 3) should be visible.
    // Child File (id 2) is hidden because its parent is closed.
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
    
    // Find caret button of Root Folder
    const caretBtn = fixture.nativeElement.querySelector('.caret-btn');
    expect(caretBtn).toBeTruthy();

    // Toggle open
    caretBtn.click();
    fixture.detectChanges();

    expect(host.toggledNode.id).toBe('1');
    expect(host.toggledState).toBe(true);
    expect(host.items()[0].isOpen).toBe(true);

    // Verify child node is now visible in DOM
    const nodesAfterOpen = fixture.nativeElement.querySelectorAll('.sh-tree-node');
    expect(nodesAfterOpen.length).toBe(3);
    expect(nodesAfterOpen[1].textContent).toContain('Child File');

    // Toggle closed
    caretBtn.click();
    fixture.detectChanges();

    expect(host.toggledState).toBe(false);
    expect(host.items()[0].isOpen).toBe(false);

    // Verify child node is hidden again
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
});

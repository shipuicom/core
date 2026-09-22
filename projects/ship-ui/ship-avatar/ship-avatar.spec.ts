import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ShipAvatar, ShipAvatarGroup, shipAvatarHue, shipAvatarInitials, SHIP_AVATAR_HUES } from './ship-avatar';

@Component({
  standalone: true,
  imports: [ShipAvatar, ShipAvatarGroup],
  template: `
    <sh-avatar-group [max]="max()" [size]="groupSize()">
      @for (name of names(); track name) {
        <sh-avatar [name]="name" />
      }
    </sh-avatar-group>
  `,
})
class GroupHost {
  names = signal(['Ada Lovelace', 'Grace Hopper', 'Linus Torvalds', 'Margaret Hamilton', 'Ken Thompson']);
  max = signal(3);
  groupSize = signal<'small' | null>(null);
}

describe('shipAvatarInitials', () => {
  it('takes the first and last word of a full name', () => {
    expect(shipAvatarInitials('Simon Pedersen')).toBe('SP');
    expect(shipAvatarInitials('  ada   king lovelace ')).toBe('AL');
  });

  it('takes one letter for a single word and ? for nothing', () => {
    expect(shipAvatarInitials('simon')).toBe('S');
    expect(shipAvatarInitials('')).toBe('?');
    expect(shipAvatarInitials(undefined)).toBe('?');
  });
});

describe('shipAvatarHue', () => {
  it('is deterministic, case-insensitive and within the bucket count', () => {
    expect(shipAvatarHue('Simon Pedersen')).toBe(shipAvatarHue('simon pedersen'));
    for (const name of ['a', 'Ada', 'Grace Hopper', 'x'.repeat(200)]) {
      const hue = shipAvatarHue(name);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(SHIP_AVATAR_HUES);
    }
  });
});

describe('ShipAvatar', () => {
  let fixture: ComponentFixture<ShipAvatar>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ShipAvatar] }).compileComponents();
    fixture = TestBed.createComponent(ShipAvatar);
    host = fixture.nativeElement;
  });

  it('renders initials, a hue class and the name as its label', () => {
    fixture.componentRef.setInput('name', 'Simon Pedersen');
    fixture.detectChanges();

    expect(host.querySelector('.initials')?.textContent?.trim()).toBe('SP');
    expect(host.classList.contains(`hue-${shipAvatarHue('Simon Pedersen')}`)).toBe(true);
    expect(host.getAttribute('aria-label')).toBe('Simon Pedersen');
    expect(host.getAttribute('role')).toBe('img');
  });

  it('uses the semantic colour instead of the hue when given', () => {
    fixture.componentRef.setInput('name', 'Simon Pedersen');
    fixture.componentRef.setInput('color', 'accent');
    fixture.detectChanges();

    expect(host.classList.contains('accent')).toBe(true);
    expect(host.className).not.toContain('hue-');
  });

  it('applies the size and ring classes', () => {
    fixture.componentRef.setInput('name', 'A');
    fixture.componentRef.setInput('size', 'small');
    fixture.componentRef.setInput('ring', true);
    fixture.componentRef.setInput('ringColor', 'warn');
    fixture.detectChanges();

    expect(host.classList.contains('small')).toBe(true);
    expect(host.classList.contains('ring')).toBe(true);
    expect(host.classList.contains('ring-warn')).toBe(true);
  });

  it('shows the image when src is set and falls back to initials when it fails', () => {
    fixture.componentRef.setInput('name', 'Simon Pedersen');
    fixture.componentRef.setInput('src', 'https://example.test/simon.png');
    fixture.detectChanges();

    const img = host.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://example.test/simon.png');
    expect(img?.getAttribute('alt')).toBe('Simon Pedersen');
    expect(host.querySelector('.initials')).toBeNull();

    img!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(host.querySelector('img')).toBeNull();
    expect(host.querySelector('.initials')?.textContent?.trim()).toBe('SP');

    fixture.componentRef.setInput('src', 'https://example.test/other.png');
    fixture.detectChanges();
    expect(host.querySelector('img')).not.toBeNull();
  });
});

describe('ShipAvatarGroup', () => {
  let fixture: ComponentFixture<GroupHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GroupHost] }).compileComponents();
    fixture = TestBed.createComponent(GroupHost);
    fixture.detectChanges();
  });

  const visible = () =>
    Array.from(fixture.nativeElement.querySelectorAll('sh-avatar')).filter(
      (el) => !(el as HTMLElement).classList.contains('hidden')
    );

  it('shows max avatars and folds the rest into +N', () => {
    expect(visible().length).toBe(3);
    expect(fixture.nativeElement.querySelector('.sh-avatar-overflow')?.textContent?.trim()).toBe('+2');
  });

  it('follows changes to max and to the list', () => {
    fixture.componentInstance.max.set(5);
    fixture.detectChanges();
    expect(visible().length).toBe(5);
    expect(fixture.nativeElement.querySelector('.sh-avatar-overflow')).toBeNull();

    fixture.componentInstance.names.set(['Ada Lovelace']);
    fixture.componentInstance.max.set(0);
    fixture.detectChanges();
    expect(visible().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.sh-avatar-overflow')?.textContent?.trim()).toBe('+1');
  });

  it('passes its size down to avatars without one', () => {
    fixture.componentInstance.groupSize.set('small');
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('small') || fixture.nativeElement.querySelector('sh-avatar-group.small')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('sh-avatar')?.classList.contains('small')).toBe(true);
  });
});

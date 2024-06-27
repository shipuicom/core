import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

@Injectable()
export class LOCALSTORAGE implements Storage {
  private platformId = inject(PLATFORM_ID);
  private STORAGE_VERSION = 'v1';
  private APP_NAME = 'duplicati';

  getItemParsed<T>(key: string, presistedThroughClear = false): T | null {
    if (isPlatformServer(this.platformId)) return null;

    return JSON.parse(
      localStorage.getItem(
        `${this.STORAGE_VERSION}:${presistedThroughClear ? 'presist-duplicati' : this.APP_NAME}:${key}`
      ) ?? 'null'
    );
  }

  setItemParsed<T>(key: string, value: T, presistThroughClear = false): void {
    if (isPlatformServer(this.platformId)) return;

    return localStorage.setItem(
      `${this.STORAGE_VERSION}:${presistThroughClear ? 'presist-duplicati' : this.APP_NAME}:${key}`,
      JSON.stringify(value)
    );
  }

  get length(): number {
    return isPlatformBrowser(this.platformId) ? localStorage.length : 0;
  }

  getItem(key: string): string | null {
    if (isPlatformServer(this.platformId)) return null;

    return localStorage.getItem(`${this.STORAGE_VERSION}:${this.APP_NAME}:${key}`) ?? null;
  }

  setItem(key: string, value: string): void {
    if (isPlatformServer(this.platformId)) return;

    return localStorage.setItem(`${this.STORAGE_VERSION}:${this.APP_NAME}:${key}`, value);
  }

  removeItem(key: string): void {
    if (isPlatformServer(this.platformId)) return;

    localStorage.removeItem(`${this.STORAGE_VERSION}:${this.APP_NAME}:${key}`);
  }

  clearAllNotCurrentVersion(): void {
    if (isPlatformServer(this.platformId)) return;

    for (var key in localStorage) {
      if (!key.startsWith(this.STORAGE_VERSION)) {
        localStorage.removeItem(key);
      }
    }
  }

  clearAll(): void {
    if (isPlatformServer(this.platformId)) return;

    localStorage.clear();
  }

  clear(): void {
    if (isPlatformServer(this.platformId)) return;

    for (var key in localStorage) {
      if (key.includes(this.APP_NAME) && !key.includes(`presist-${this.APP_NAME}`)) {
        localStorage.removeItem(key);
      }
    }
  }

  key(index: number): string | null {
    if (isPlatformServer(this.platformId)) return null;

    return localStorage.key(index);
  }
}

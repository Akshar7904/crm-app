import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Key } from '../enum/key.enum';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeSubject = new BehaviorSubject<Theme>(this.getStoredTheme());
  theme$ = this.themeSubject.asObservable();

  constructor() {
    this.applyTheme(this.getStoredTheme());
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (this.themeSubject.value === 'system') {
          this.applyResolvedTheme();
        }
      });
  }

  setTheme(theme: Theme): void {
    localStorage.setItem(Key.THEME, theme);
    this.themeSubject.next(theme);
    this.applyTheme(theme);
  }

  getTheme(): Theme {
    return this.themeSubject.value;
  }

  private getStoredTheme(): Theme {
    return 'light';
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  private applyResolvedTheme(): void {
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

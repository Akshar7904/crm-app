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
    const stored = localStorage.getItem(Key.THEME) as Theme;
    return stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
  }

  private applyTheme(theme: Theme): void {
    if (theme === 'system') {
      this.applyResolvedTheme();
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  private applyResolvedTheme(): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
}

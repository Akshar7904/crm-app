// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface ThemeTokens {
  sidebarBg?: string;
  sidebarText?: string;
  navbarBg?: string;
  navbarText?: string;
  contentBg?: string;
  contentText?: string;
  titleText?: string;
  accentColor?: string;
}

export const DEFAULT_THEME: Required<ThemeTokens> = {
  sidebarBg: '#7f9f80',
  sidebarText: '#ffffff',
  navbarBg: '#ffffff',
  navbarText: '#1a1a1a',
  contentBg: '#f4f6f9',
  contentText: '#1a1a1a',
  titleText: '#0a2c54',
  accentColor: '#124076'
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rl, gl, bl] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** Guided-pairing suggestion: given a background hex, suggest a readable text color. */
export function suggestTextColor(bgHex: string): string {
  return relativeLuminance(bgHex) > 0.5 ? '#1a1a1a' : '#ffffff';
}

function rgbString(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

/** Mixes a hex color toward black by `amount` (0–1), for gradient/hover shades. */
function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c: number) => Math.round(c * (1 - amount));
  return `#${[mix(r), mix(g), mix(b)].map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

export interface CompanyBranding {
  id: number;
  name: string;
  tagline: string;
  primaryColor: string;
  logoUrl: string;
  theme: ThemeTokens;
}

@Injectable()
export class BrandingService {

  private readonly DEFAULT_PRIMARY = '#124076';
  private readonly CSS_VAR = '--orion-primary';

  private _branding: CompanyBranding | null = null;
  private _loaded = false;
  private _personalTheme: ThemeTokens = {};

  /** Emits every time branding changes so subscribers can react. */
  readonly branding$ = new BehaviorSubject<CompanyBranding | null>(null);

  constructor(private http: HttpClient) {}

  get branding(): CompanyBranding | null { return this._branding; }
  get loaded(): boolean { return this._loaded; }

  /**
   * Loads branding for the authenticated user's company via GET /api/v1/companies/my.
   * Applies --orion-primary CSS custom property to document root.
   * Returns immediately if already loaded.
   */
  load(): Observable<CompanyBranding | null> {
    if (this._loaded) return of(this._branding);

    return this.http.get<any>(`${environment.apiUrl}/api/v1/companies/my`).pipe(
      map(res => {
        const c = res?.data?.company;
        if (!c) return null;
        const branding: CompanyBranding = {
          id:           c.id,
          name:         c.name      ?? '',
          tagline:      c.tagline   ?? '',
          primaryColor: c.primaryColor ?? this.DEFAULT_PRIMARY,
          // Cache-bust with updatedAt — the logo endpoint has a 24h Cache-Control
          // and a fixed URL, so without this a re-uploaded logo won't show until
          // the browser cache expires.
          logoUrl:      `${environment.apiUrl}/api/v1/companies/${c.id}/logo?v=${c.updatedAt ? new Date(c.updatedAt).getTime() : ''}`,
          theme:        this.parseTheme(c.themeJson),
        };
        return branding;
      }),
      switchMap(branding =>
        this.http.get<any>(`${environment.apiUrl}/api/v1/users/me/theme`).pipe(
          map(res => ({ branding, personalRaw: res?.data?.theme })),
          catchError(() => of({ branding, personalRaw: null }))
        )
      ),
      tap(({ branding, personalRaw }) => {
        this._branding = branding;
        this._loaded = true;
        this._personalTheme = this.parseTheme(personalRaw);
        this.applyResolvedTheme(branding);
        this.branding$.next(branding);
      }),
      map(({ branding }) => branding),
      catchError(() => {
        this._loaded = true;
        this.applyResolvedTheme(null);
        return of(null);
      })
    );
  }

  /**
   * Loads branding for a specific company by ID (public endpoint, no auth needed).
   * Used on the login page to show company theming before the user authenticates.
   */
  loadPublic(companyId: number): Observable<CompanyBranding | null> {
    return this.http.get<any>(`${environment.apiUrl}/api/v1/companies/${companyId}/branding`).pipe(
      map(res => {
        const b = res?.data?.branding;
        if (!b) return null;
        return {
          id:           b.id,
          name:         b.name         ?? '',
          tagline:      b.tagline       ?? '',
          primaryColor: b.primaryColor  ?? this.DEFAULT_PRIMARY,
          logoUrl:      `${environment.apiUrl}/api/v1/companies/${b.id}/logo?v=${b.logoVersion ? new Date(b.logoVersion).getTime() : ''}`,
          theme:        this.parseTheme(b.theme),
        } as CompanyBranding;
      }),
      tap(branding => {
        this.applyResolvedTheme(branding);
        this.branding$.next(branding);
      }),
      catchError(() => of(null))
    );
  }

  /** Resets the CSS custom property and clears stored state (call on logout). */
  clear(): void {
    this._branding = null;
    this._loaded = false;
    this._personalTheme = {};
    this.applyResolvedTheme(null);
    this.branding$.next(null);
  }

  private parseTheme(raw: string | null | undefined): ThemeTokens {
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  }

  private applyResolvedTheme(branding: CompanyBranding | null): void {
    const companyTheme = branding?.theme ?? {};
    const personalTheme = this._personalTheme;
    const root = document.documentElement.style;

    const isValidHex = (v: unknown): v is string =>
      typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v);

    const resolve = (key: keyof ThemeTokens): string => {
      const candidate = personalTheme[key] ?? companyTheme[key]
        ?? (key === 'accentColor' ? branding?.primaryColor : undefined);
      if (isValidHex(candidate)) return candidate as string;
      return key === 'accentColor' ? this.DEFAULT_PRIMARY : DEFAULT_THEME[key]!;
    };

    const hasAny = (...keys: (keyof ThemeTokens)[]): boolean =>
      keys.some(k => isValidHex(personalTheme[k]) || isValidHex(companyTheme[k]));

    // Accent — always resolvable (primaryColor/DEFAULT_PRIMARY back-compat), matches
    // pre-feature behavior where every company already had a primaryColor.
    const accentColor = resolve('accentColor');
    root.setProperty(this.CSS_VAR, accentColor);
    root.setProperty('--page-header-bg', `linear-gradient(135deg, ${darken(accentColor, 0.35)} 0%, ${accentColor} 100%)`);

    // Sidebar — only touch these vars if a theme actually customizes the sidebar;
    // otherwise clear any previously-applied override so the stylesheet's own
    // [data-theme="light"] defaults take full, unmodified effect.
    if (hasAny('sidebarBg', 'sidebarText')) {
      const sidebarBg = resolve('sidebarBg');
      const sidebarText = resolve('sidebarText');
      root.setProperty('--bg-sidebar', sidebarBg);
      root.setProperty('--sidebar-text', `rgba(${rgbString(sidebarText)}, 0.85)`);
      root.setProperty('--sidebar-text-hover', sidebarText);
      root.setProperty('--sidebar-text-active', sidebarText);
      root.setProperty('--sidebar-icon', `rgba(${rgbString(sidebarText)}, 0.7)`);
      root.setProperty('--sidebar-icon-active', sidebarText);
      root.setProperty('--sidebar-hover', `rgba(${rgbString(sidebarText)}, 0.14)`);
      root.setProperty('--sidebar-border', `rgba(${rgbString(sidebarText)}, 0.18)`);
    } else {
      ['--bg-sidebar', '--sidebar-text', '--sidebar-text-hover', '--sidebar-text-active',
       '--sidebar-icon', '--sidebar-icon-active', '--sidebar-hover', '--sidebar-border']
        .forEach(v => root.removeProperty(v));
    }

    // Navbar
    if (hasAny('navbarBg', 'navbarText')) {
      const navbarBg = resolve('navbarBg');
      const navbarText = resolve('navbarText');
      root.setProperty('--bg-navbar', navbarBg);
      root.setProperty('--navbar-text', navbarText);
      root.setProperty('--navbar-text-muted', `rgba(${rgbString(navbarText)}, 0.6)`);
      root.setProperty('--navbar-icon', `rgba(${rgbString(navbarText)}, 0.6)`);
      root.setProperty('--navbar-icon-hover', navbarText);
      root.setProperty('--navbar-divider', `rgba(${rgbString(navbarText)}, 0.1)`);
    } else {
      ['--bg-navbar', '--navbar-text', '--navbar-text-muted', '--navbar-icon',
       '--navbar-icon-hover', '--navbar-divider']
        .forEach(v => root.removeProperty(v));
    }

    // Content
    if (hasAny('contentBg', 'contentText', 'titleText')) {
      const contentBg = resolve('contentBg');
      const contentText = resolve('contentText');
      const titleText = resolve('titleText');
      root.setProperty('--bg-body', contentBg);
      root.setProperty('--text-primary', contentText);
      root.setProperty('--text-secondary', `rgba(${rgbString(contentText)}, 0.75)`);
      root.setProperty('--text-muted', `rgba(${rgbString(contentText)}, 0.55)`);
      root.setProperty('--text-light', `rgba(${rgbString(contentText)}, 0.35)`);
      root.setProperty('--section-title-color', titleText);
      root.setProperty('--logo-text-color', titleText);
    } else {
      ['--bg-body', '--text-primary', '--text-secondary', '--text-muted',
       '--text-light', '--section-title-color', '--logo-text-color']
        .forEach(v => root.removeProperty(v));
    }
  }

  /** Re-applies the current branding+personal theme (call after either tier changes). */
  reapply(): void {
    this.applyResolvedTheme(this._branding);
  }

  setPersonalTheme(theme: ThemeTokens): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/api/v1/users/me/theme`, { theme: JSON.stringify(theme) }).pipe(
      tap(() => { this._personalTheme = theme; this.reapply(); })
    );
  }

  clearPersonalTheme(): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/api/v1/users/me/theme`).pipe(
      tap(() => { this._personalTheme = {}; this.reapply(); })
    );
  }

  get personalTheme(): ThemeTokens { return this._personalTheme; }
}

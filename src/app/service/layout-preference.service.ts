// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Key } from '../enum/key.enum';

export type LayoutMode = 'sidebar' | 'topnav';

@Injectable({ providedIn: 'root' })
export class LayoutPreferenceService {
  private modeSubject = new BehaviorSubject<LayoutMode>(this.getStoredMode());
  mode$ = this.modeSubject.asObservable();

  setMode(mode: LayoutMode): void {
    localStorage.setItem(Key.LAYOUT_MODE, mode);
    this.modeSubject.next(mode);
  }

  getMode(): LayoutMode {
    return this.modeSubject.value;
  }

  private getStoredMode(): LayoutMode {
    const stored = localStorage.getItem(Key.LAYOUT_MODE);
    return stored === 'topnav' ? 'topnav' : 'sidebar';
  }
}

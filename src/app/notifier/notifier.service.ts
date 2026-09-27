// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotifierService {

  // Errors/warnings stay on screen longer than routine confirmations, so a
  // user has more time to read and act on something that needs attention.
  private static readonly DURATIONS: Record<string, number> = {
    error: 8000,
    warning: 7000,
    success: 4000,
    info: 5000,
    default: 5000
  };

  notify(type: string, message: string): void {
    const list = this.getOrCreateContainer();
    const item = document.createElement('li');
    item.className = `notifier__notification notifier__notification--${type}`;
    item.innerHTML = `<span>${this.escape(message)}</span>
      <button class="notifier__notification-button" onclick="this.parentElement.remove()">&#x2715;</button>`;
    list.appendChild(item);
    const duration = NotifierService.DURATIONS[type] ?? NotifierService.DURATIONS['default'];
    setTimeout(() => { if (item.parentElement) item.remove(); }, duration);
  }

  private getOrCreateContainer(): HTMLElement {
    let list = document.querySelector('.notifier__container-list') as HTMLElement;
    if (!list) {
      const wrap = document.createElement('div');
      wrap.className = 'notifier__container';
      list = document.createElement('ul');
      list.className = 'notifier__container-list';
      wrap.appendChild(list);
      document.body.appendChild(wrap);
    }
    return list;
  }

  private escape(text: string): string {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(text));
    return d.innerHTML;
  }
}

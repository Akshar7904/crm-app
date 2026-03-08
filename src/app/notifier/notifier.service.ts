import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotifierService {

  notify(type: string, message: string): void {
    const list = this.getOrCreateContainer();
    const item = document.createElement('li');
    item.className = `notifier__notification notifier__notification--${type}`;
    item.innerHTML = `<span>${this.escape(message)}</span>
      <button class="notifier__notification-button" onclick="this.parentElement.remove()">&#x2715;</button>`;
    list.appendChild(item);
    setTimeout(() => { if (item.parentElement) item.remove(); }, 5000);
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

// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'moduleFilter', standalone: false })
export class ModuleFilterPipe implements PipeTransform {
  transform(modules: { starter: boolean }[], isStarter: boolean): any[] {
    if (!modules) return [];
    return modules.filter(m => m.starter === isStarter);
  }
}

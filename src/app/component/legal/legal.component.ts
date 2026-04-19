// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

export type LegalSection = 'terms' | 'privacy' | 'compliance' | 'ip';

@Component({
  selector: 'app-legal',
  templateUrl: './legal.component.html',
  styleUrls: ['./legal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegalComponent implements OnInit {

  activeSection: LegalSection = 'terms';

  readonly effectiveDate = '1 May 2026';
  readonly companyName   = 'LKCentrix Solutions (PTY) LTD';
  readonly productName   = 'ORION';
  readonly supportEmail  = 'legal@lkcentrix.co.za';
  readonly contactEmail  = 'support@lkcentrix.co.za';
  readonly website       = 'www.lkcentrix.co.za';
  readonly regNumber     = '(Registration number to be inserted)';
  readonly address       = 'South Africa';

  readonly navItems: { key: LegalSection; label: string; icon: string }[] = [
    { key: 'terms',      label: 'Terms of Use',        icon: 'bi-file-text'       },
    { key: 'privacy',    label: 'Privacy Policy',       icon: 'bi-shield-lock'     },
    { key: 'compliance', label: 'Data Compliance',      icon: 'bi-database-lock'   },
    { key: 'ip',         label: 'IP & Copyright',       icon: 'bi-award'           },
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const section = params.get('section') as LegalSection;
      if (section && this.navItems.some(n => n.key === section)) {
        this.activeSection = section;
      }
    });
  }

  navigate(section: LegalSection): void {
    this.activeSection = section;
    this.router.navigate(['/legal', section], { replaceUrl: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isActive(section: LegalSection): boolean {
    return this.activeSection === section;
  }
}

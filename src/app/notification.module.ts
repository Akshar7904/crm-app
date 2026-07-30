// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { NotifierModule, NotifierOptions } from './notifier/notifier.module';

const notificationConfig: NotifierOptions = {
    position: {
        horizontal: {
            position: 'left',
            distance: 150
        },
        vertical: {
            position: 'bottom',
            distance: 12,
            gap: 10
        }
    },
  theme: 'material',
  behaviour: {
    autoHide: 5000,
    onClick: 'hide',
    onMouseover: 'pauseAutoHide',
    showDismissButton: true,
    stacking: 4
  },
  animations: {
    enabled: true,
    show: {
      preset: 'slide',
      speed: 300,
      easing: 'ease'
    },
    hide: {
      preset: 'fade',
      speed: 300,
      easing: 'ease',
      offset: 50
    },
    shift: {
      speed: 300,
      easing: 'ease'
    },
    overlap: 150
  }
};

@NgModule({
  imports: [ NotifierModule.withConfig(notificationConfig)],
  exports: [ NotifierModule ]
})
export class NotificationModule {}
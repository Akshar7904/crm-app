import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { NotificationListComponent } from './notification-list/notification-list.component';

const routes: Routes = [
  { path: '', component: NotificationListComponent }
];

@NgModule({
  declarations: [
    NotificationListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
  exports: [
    NotificationListComponent
  ]
})
export class UserNotificationModule { }

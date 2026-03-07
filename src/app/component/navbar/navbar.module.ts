import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { NavbarComponent } from './navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NgOptimizedImage } from "@angular/common";
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NotificationDropdownComponent } from '../notification/notification-dropdown/notification-dropdown.component';

@NgModule({
  declarations: [
    NavbarComponent,
    SidebarComponent,
    NotificationDropdownComponent
  ],
  imports: [
    SharedModule,
    NgOptimizedImage,
    NgbDropdownModule
  ],
  exports: [
    NavbarComponent,
    SidebarComponent,
    NotificationDropdownComponent
  ]
})
export class NavBarModule {}

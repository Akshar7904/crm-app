import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { NavBarModule } from '../navbar/navbar.module';
import { UserComponent } from './user/user.component';
import { UserRoutingModule } from './user-routing.module';

@NgModule({
  declarations: [ UserComponent ],
  imports: [ SharedModule, UserRoutingModule, NavBarModule ]
})
export class UserModule {}

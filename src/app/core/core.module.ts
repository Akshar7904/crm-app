import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CacheInterceptor } from '../interceptor/cache.interceptor';
import { TokenInterceptor } from '../interceptor/token.interceptor';
import { UserService } from '../service/user.service';
import { CustomerService } from '../service/customer.service';
import { HttpCacheService } from '../service/http.cache.service';
import { NotificationService } from '../service/notification.service';

@NgModule({
    imports: [ HttpClientModule ],
    providers: [
        UserService, CustomerService, HttpCacheService, NotificationService,
        { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true }
    ]
})
export class CoreModule {}

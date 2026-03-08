import { NgModule, ModuleWithProviders } from '@angular/core';
import { NotifierContainerComponent } from './notifier-container.component';
import { NotifierService } from './notifier.service';

export interface NotifierOptions { [key: string]: any; }

@NgModule({
  declarations: [NotifierContainerComponent],
  exports: [NotifierContainerComponent]
})
export class NotifierModule {
  static withConfig(config: NotifierOptions): ModuleWithProviders<NotifierModule> {
    return { ngModule: NotifierModule, providers: [NotifierService] };
  }
}

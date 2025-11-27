import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { DefaultCdComponent } from './default-cd/default-cd.component';
import { OnpushCdComponent } from './onpush-cd/onpush-cd.component';
import { ManualCdComponent } from './cd-examples/manual-cd/manual-cd.component';
import { AsyncCdComponent } from './cd-examples/async-cd/async-cd.component';
import { OutsideZoneComponent } from './cd-examples/outside-zone/outside-zone.component';
import { ObservableCdComponent } from './cd-examples/observable-cd/observable-cd.component';

@NgModule({
  declarations: [
    AppComponent,
    DefaultCdComponent,
    OnpushCdComponent,
    ManualCdComponent,
    AsyncCdComponent,
    OutsideZoneComponent,
    ObservableCdComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

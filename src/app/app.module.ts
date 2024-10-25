import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { AsistenteVozComponent } from './asistente-voz/asistente-voz.component';

@NgModule({
  declarations: [
    AppComponent,
    AsistenteVozComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

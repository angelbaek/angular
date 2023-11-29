import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { NgxApexchartsModule } from 'ngx-apexcharts';
import { SessionComponentComponent } from './session-component/session-component.component';
import { NeovizGraphComponent } from './neoviz-graph/neoviz-graph.component';

@NgModule({
  declarations: [AppComponent, SessionComponentComponent, NeovizGraphComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgxApexchartsModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

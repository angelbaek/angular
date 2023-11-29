import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { SessionComponentComponent } from './session-component/session-component.component';

const routes: Routes = [
  { path: 'graph2d', component: AppComponent },
  { path: 'moira', component: AppComponent },
  { path: 'login', component: SessionComponentComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}

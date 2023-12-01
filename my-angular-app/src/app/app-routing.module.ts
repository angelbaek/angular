import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { NeovizGraphComponent } from './neoviz-graph/neoviz-graph.component';
import { SessionComponentComponent } from './session-component/session-component.component';
import { SessionGuard } from './session.guard';

const routes: Routes = [
  { path: 'login', component: SessionComponentComponent },
  {
    path: '',
    component: AppComponent,
    // canActivate: [SessionGuard],
    children: [
      {
        path: 'graph2d',
        component: NeovizGraphComponent,
        // canActivate: [SessionGuard],
      },
      {
        path: 'moira',
        component: NeovizGraphComponent,
        // canActivate: [SessionGuard],
      },
      {
        path: '',
        component: NeovizGraphComponent,
        // canActivate: [SessionGuard],
      },
      // ... 기타 라우트
    ],
  },
  { path: '**', redirectTo: 'localhost:4200/#/login' }, // 알 수 없는 경로 처리
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}

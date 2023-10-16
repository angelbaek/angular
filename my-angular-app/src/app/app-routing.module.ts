import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // ... (다른 라우트 정의)
  // { path: '**', redirectTo: '', pathMatch: 'full' } // 모든 알 수 없는 경로를 메인 페이지로 리디렉션
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

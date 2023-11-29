import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SessionGuard implements CanActivate {
  constructor(private http: HttpClient, private router: Router) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.http.get('http://112.151.254.17:3000/get-session-data', { withCredentials: true })
      .pipe(
        map((response: any) => {
          // 세션이 있는 경우 true 반환
          return true;
        }),
        catchError((error) => {
          // 세션 확인 실패, 로그인 페이지로 리다이렉트
          this.router.navigate(['/login']);
          return of(false);
        })
      );
  }
}

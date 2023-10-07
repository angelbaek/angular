import { Component, OnInit } from '@angular/core';
import { AngularFaviconService } from 'angular-favicon';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [
    './app.component.css',
    '../assets/css/aos.css',
    '../assets/css/basicClass.css',
    '../assets/css/basicStyle.css',
    '../assets/css/bootstrap.min.css',
    '../assets/css/formStyle.css',
    '../assets/css/swiper-bundle.css',
  ],
})
export class AppComponent implements OnInit {
  url: string = 'http://localhost:3000/api/greet';
  message: string = '';
  currentUrl: string = ''; // 현재 브라우저 URL을 저장할 속성

  constructor(
    private http: HttpClient,
    private router: Router,
    private ngxFavicon: AngularFaviconService
  ) {
    this.getMessage();
    this.getCurrentUrl();
  }

  ngOnInit(): void {
    this.ngxFavicon.setFavicon('../assets/images/favicon.ico');
  }

  // getMessage(): void {
  //   this.http.get<{ message: string }>(this.url).subscribe(
  //     (data) => (this.message = data.message),
  //     (error) => console.error(error)
  //   );
  // }
  // getMessage(): void {
  //   this.http.get<{ message: string }>(this.url).subscribe(
  //     (res) => {
  //       console.log(res);
  //       this.message = res.message;
  //     },
  //     (error) => console.error(error)
  //   );
  // }

  getMessage(): void {
    this.http.get<{ message: string }>(this.url).subscribe({
      next: (res) => {
        console.log(res);
        this.message = res.message;
      },
      error: (error) => console.error(error),
      complete: () => {
        // Optional: 작업이 완료될 때 수행할 작업을 여기에 추가합니다.
      },
    });
  }

  // 새로운 메서드를 만들어 현재 URL을 가져옵니다.
  // getCurrentUrl(): void {
  //   this.router.events.subscribe(() => {
  //     this.currentUrl = this.router.url;
  //     console.log('Now Address: ', this.currentUrl);
  //   });
  // }
  getCurrentUrl(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl = this.router.url;
        console.log('Now Address: ', this.currentUrl);
      });
  }
}

import { Component, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-session-component',
  templateUrl: './session-component.component.html',
  styleUrls: ['./session-component.component.css'],
})
export class SessionComponentComponent {
  sessionCheck = false;
  inputValue: string = ''; // 사용자 입력을 저장할 변수
  constructor(private http: HttpClient, private router: Router) {}

  @Output() sessionChange = new EventEmitter<boolean>();

  // session 값을 변경하는 메서드
  changeSession(value: boolean) {
    this.sessionCheck = value;
    this.sessionChange.emit(this.sessionCheck);
  }

  sendSessionData(value: string) {
    return this.http.post(
      'http://112.151.254.17:3000/path-to-your-endpoint',
      { value },
      {
        withCredentials: true,
      }
    );
  }

  onButtonClick() {
    this.sendSessionData(this.inputValue).subscribe((data:any) => {
      console.log(data);      
       // 추가 처리 후 리다이렉트
    this.router.navigateByUrl('/graph2d?keyword=korea');
    });
  }
}

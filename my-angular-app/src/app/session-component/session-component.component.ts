import { Component, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-session-component',
  templateUrl: './session-component.component.html',
  styleUrls: ['./session-component.component.css'],
})
export class SessionComponentComponent {
  sessionCheck = false;
  inputValue: string = ''; // 사용자 입력을 저장할 변수
  constructor(private http: HttpClient) {}

  @Output() sessionChange = new EventEmitter<boolean>();

  // session 값을 변경하는 메서드
  changeSession(value: boolean) {
    this.sessionCheck = value;
    this.sessionChange.emit(this.sessionCheck);
  }

  sendSessionData(value: string) {
    return this.http.post(
      'http://192.168.32.22:3000/path-to-your-endpoint',
      { value },
      {
        withCredentials: true,
      }
    );
  }

  onButtonClick() {
    this.sendSessionData(this.inputValue).subscribe((data) => {
      console.log(data);
      // 필요한 추가 처리...
    });
  }
}

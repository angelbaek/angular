import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  AfterViewInit,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { serverConfig } from '../serverConfig';
import { DataService } from '../data.service';

@Component({
  selector: 'app-session-component',
  templateUrl: './session-component.component.html',
  styleUrls: ['./session-component.component.css'],
})
export class SessionComponentComponent implements OnInit, AfterViewInit {
  inputValue: string = ''; // 사용자 입력을 저장할 변수
  checkOk: string = 'none';
  checkCancle: string = 'none';
  isValidInput: boolean = false;
  constructor(
    private http: HttpClient,
    private router: Router,
    private dataService: DataService
  ) {}
  userQuery: any;
  targetWordQuery: any;
  compareQueryStringQuery: any;
  apiDatas: any[] = [];

  ngOnInit() {}

  ngAfterViewInit() {}

  sendSessionData(value: string) {
    return this.http.post(
      `http://${serverConfig.angularIp}:${serverConfig.backendNodeExpressPort}/api/session/val`,
      { value },
      {
        withCredentials: true,
      }
    );
  }

  onButtonClick() {
    this.sendSessionData(this.inputValue).subscribe((data: any) => {
      this.dataService.updateUser(this.inputValue);
      const urls = this.dataService.getSavedUrl();
      const keywordOrMainName = this.getKeywordOrMainNameFromUrl(
        this.dataService.getSavedUrl()
      );
      this.dataService.updateTargetWord(keywordOrMainName);
      this.dataService.updateCompareQueryString(this.compareQueryStringQuery);
      this.apiDatas.push({
        key: this.compareQueryStringQuery,
        value: keywordOrMainName,
      });
      this.dataService.updateApiData(this.apiDatas);
      if (this.compareQueryStringQuery == undefined) {
        this.router.navigateByUrl(`/graph2d?user=${this.inputValue}`);
      } else if (this.compareQueryStringQuery == 'keyword') {
        this.router.navigateByUrl(
          `/graph2d?keyword=${keywordOrMainName}&user=${this.inputValue}`
        );
      } else if (this.compareQueryStringQuery == 'main_name') {
        this.router.navigateByUrl(
          `/graph2d?main_name=${keywordOrMainName}&user=${this.inputValue}`
        );
      }
    });
  }

  getKeywordOrMainNameFromUrl(url: string): string {
    try {
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return ''; // 해시(#)가 없으면 빈 문자열 반환

      const hashString = url.substring(hashIndex);
      const queryString = hashString.split('?')[1]; // 해시(#) 뒤의 쿼리 문자열 추출
      if (!queryString) return ''; // 쿼리 문자열이 없으면 빈 문자열 반환

      const params = new URLSearchParams(queryString);

      const keyword = params.get('keyword');
      const mainName = params.get('main_name');
      if (keyword != null) {
        this.compareQueryStringQuery = 'keyword';
      } else if (mainName != null) {
        this.compareQueryStringQuery = 'main_name';
      }
      return keyword || mainName || ''; // keyword, main_name 둘 다 없는 경우 빈 문자열 반환
    } catch (error) {
      console.error('Error parsing URL', error);
      return '';
    }
  }

  checkInput(event: any) {
    const value = event.target.value;
    console.log(value);
    if (value.length == '') {
      this.checkOk = 'none';
      this.checkCancle = 'none';
      return;
    }
    // 정규식을 사용하여 특수 문자 또는 한글을 체크
    const specialCharsOrKorean =
      /[!@#$%^&*()_+[\]{};':"\\|,.<>?ㄱ-ㅎㅏ-ㅣ가-힣]/g;
    if (specialCharsOrKorean.test(value)) {
      console.log('특수 문자 또는 한글이 포함되어 있습니다.');
      this.checkOk = 'none';
      this.checkCancle = 'flex';
      this.isValidInput = false;
      return;
    }

    // 문자 길이가 4자에서 8자 사이인지 체크
    if (value.length < 4 || value.length > 8) {
      console.log('문자 길이는 4자에서 8자 사이여야 합니다.');
      this.checkOk = 'none';
      this.checkCancle = 'flex';
      this.isValidInput = false;
      return;
    }

    // 모든 조건을 만족하는 경우
    console.log('입력값이 유효합니다.');
    this.checkOk = 'flex';
    this.checkCancle = 'none';
    this.isValidInput = true;
  }
}

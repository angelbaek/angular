// data.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private userSource = new BehaviorSubject<any>(null);
  private targetWordSource = new BehaviorSubject<string>('');
  private compareQueryStringSource = new BehaviorSubject<string>('');
  private apiDataSource = new BehaviorSubject<any[]>([]);
  private executionCount = 0;
  private savedUrl = '';

  saveUrl(url: string) {
    this.savedUrl = url;
  }

  getSavedUrl() {
    return this.savedUrl;
  }

  incrementExecutionCount() {
    this.executionCount++;
  }
  shouldExecuteLogic(): boolean {
    return this.executionCount === 0;
  }

  user = this.userSource.asObservable();
  targetWord = this.targetWordSource.asObservable();
  compareQueryString = this.compareQueryStringSource.asObservable();
  apiData = this.apiDataSource.asObservable();

  getUser(): Observable<string> {
    // rxjs/operators 모듈에서 가져온 map 연산자를 사용
    return this.userSource.pipe(
      map((data: any) => data.toString()) // 데이터를 문자열로 변환
    );
  }

  updateUser(user: any) {
    console.log(user);
    this.userSource.next(user);
  }

  updateTargetWord(targetWord: string) {
    console.log(targetWord);
    this.targetWordSource.next(targetWord);
  }

  updateCompareQueryString(compareQueryString: string) {
    console.log(compareQueryString);
    this.compareQueryStringSource.next(compareQueryString);
  }

  updateApiData(apiData: any[]) {
    this.apiDataSource.next(apiData);
  }
}

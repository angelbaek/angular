import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from './data.service';
import { AngularFaviconService } from 'angular-favicon';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private ngxFavicon: AngularFaviconService
  ) {}

  ngOnInit() {
    this.ngxFavicon.setFavicon('../assets/images/favicon.ico');
    if (this.dataService.shouldExecuteLogic()) {
      this.dataService.incrementExecutionCount();
      this.route.queryParams.subscribe((params) => {
        this.dataService.updateUser(params['user']);
        let apiData = [];
        for (let key in params) {
          if (key === 'keyword' || key === 'main_name') {
            this.dataService.updateTargetWord(params[key]);
            this.dataService.updateCompareQueryString(key);
          }

          if (params.hasOwnProperty(key)) {
            apiData.push({ key: key, value: params[key] });
          }
        }
        this.dataService.updateApiData(apiData);
      });
    }
  }
}

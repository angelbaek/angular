import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { AngularFaviconService } from 'angular-favicon';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LabelConfig } from './labelConfig';
import { Neo4jConfig } from './neo4jConfig';
import { RealtionshipConfig } from './relationConfig';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { serverConfig } from '../serverConfig';
import NeoVis from 'neovis.js';
import { error, param } from 'jquery';
import { DataService } from '../data.service';
import { Subscription } from 'rxjs'; // Subscription을 추가로 가져옵니다.

/**
 * 필터 타입 선언
 */
type FilterNodeType = {
  [key: string]: {
    or: boolean;
    and: boolean;
    not: boolean;
  };
};

type FilterFileType = {
  [key: string]: {
    or: boolean;
    and: boolean;
    not: boolean;
  };
};

/**
 *  인터페이스 선언
 */
interface RelatedNodeType {
  //연관된 노드
  count: number;
  values: string[];
  isExpanded?: boolean; // 추가된 속성
  combined?: { value: string; id: string; highNodeId: string }[];
}

interface RelationshipType {
  // 연관타입
  count: number;
  relatedNodeTypes: {
    [key: string]: RelatedNodeType;
  };
}

interface MenuItem {
  // html 바인딩 데이터
  type: string;
  data: {
    count: number;
    relatedNodeTypes: { [key: string]: RelatedNodeType };
  };
  isExpanded?: boolean; // isExpanded 속성 추가
}

// NeovizGraphComponent
declare function initializeSomething(): void;

@Component({
  selector: 'app-neoviz-graph',
  templateUrl: './neoviz-graph.component.html',
  styleUrls: ['./neoviz-graph.component.css'],
})
export class NeovizGraphComponent implements OnInit, AfterViewInit {
  @ViewChild('graphSearchSetting') graphSearchSetting!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('jsonSearchfileInput') jsonSearchfileInput!: ElementRef;
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'z') {
      // Ctrl + Z가 눌렸을 때 실행할 로직
      this.backward();
      // this.doSomething();
    } else if (event.ctrlKey && event.shiftKey && event.key === 'Z') {
      this.forward();
    }
  }

  private _selectedNodeData: any;
  private _cachedNodeDataArray: any;

  angularIp: string = serverConfig.angularIp; // 앵귤러 프로젝트 ip
  pythonIp: string = serverConfig.pythonIp; // pyhton API IP
  pythonPort: string = serverConfig.pythonPort; // python API Port
  backendNodeExpressPort: string = serverConfig.backendNodeExpressPort; // node express ip
  neo4jIp: string = serverConfig.neo4jIp; // neo4j ip
  neo4jPort: string = serverConfig.neo4jPort; // neo4j port

  visibility: string = 'visible'; // 기본값은 hidden으로 설정
  loadingVisibility: string = 'visible'; // 로딩 애니메이션
  currentUrl: string = ''; // 현재 브라우저 URL을 저장할 속성
  viz: any; // 그래프
  selectedNodeData: any; // 선택한 노드정보 객체
  cyperQueryRel: string = ''; // 쿼리 릴레이션 문자열
  initialCypher: string = ''; // 사이퍼쿼리 문자열
  user: string = ''; // user 정보객체
  nodeFontSize: number = 25; // 노드 폰트사이즈
  edgeFontSize: number = 15; // 엣지 폰트사이즈
  apiData: any = []; // API 객체
  targetWord: string = ''; // 문자열 해석
  compareQueryString: string = '';
  clickOff: any; // 클릭 비활성화 시 받을 객체
  groupedNodes = new Map<string, { rawid: any; name: any }[]>(); // 그룹노드
  selectedGroup: string = ''; // 사용자가 선택한 그룹 이름
  groupKeys: string[] = []; // 그룹노드 key
  isRelatedNodeClicked: boolean = false; // 연관된 노드 클릭객체
  public chartOptions: any; // 차트옵션
  public chartSeries: any[] = []; // 차트시리즈
  sessionCheck: boolean = true;
  userSubscription!: Subscription; // 구독을 관리하기 위한 Subscription 변수
  /**
   * 생성자
   * @param http http클라이언트
   * @param router 라우터 이벤트 객체
   * @param ngxFavicon 파비콘
   * @param neo4jService 지금은 안쓰지만 클라이언트side에서 neo4j 접근하기 위한 객체
   * @param route 라우터 이벤트 객체 안 라우트 쿼리해석에 사용될 객체
   */
  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private clipboardService: ClipboardService,
    private dataService: DataService,
    private cdr: ChangeDetectorRef
  ) {
    // this.router.events
    //   .pipe(filter((event: any) => event instanceof NavigationEnd))
    //   .subscribe(() => {
    //     this.route.queryParams.subscribe((params: any) => {
    //       console.log('출력 되나?');
    //       this.user = params['user'];
    //       for (let key in params) {
    //         console.log(key);
    //         // keyword or main_name 타겟워드 대입
    //         if (key == 'keyword') {
    //           this.targetWord = params[key];
    //           this.compareQueryString = 'keyword';
    //           console.log('타겟워드:', this.targetWord);
    //         } else if (key == 'main_name') {
    //           this.targetWord = params[key];
    //           this.compareQueryString = 'main_name';
    //           console.log('타겟워드:', this.targetWord);
    //         }
    //         if (params.hasOwnProperty(key)) {
    //           this.apiData.push({ key: key, value: params[key] });
    //         }
    //       }
    //       console.log(this.apiData);
    //       this.apiRequest(this.apiData, false);
    //     });
    //   });
  }

  /**
   * 초기화
   */
  ngOnInit(): void {
    this.userSubscription = this.dataService
      .getUser()
      .subscribe((userData: string) => {
        this.user = userData;
      });
    if (this.targetWord == '') {
      this.draw();
      this.apiGetWeb();
      localStorage.clear();
      this.graphMultiSearch();
    } else if (this.targetWord != '') {
      this.draw();
      this.apiGetWeb();
      localStorage.clear();
      this.graphMultiSearch();
    }
    // this.draw();
    // this.apiGetWeb();
    // localStorage.clear();
    // this.graphMultiSearch();
  }
  // setupNodeEventListeners() {
  //   // 노드가 추가될 때의 이벤트 핸들러
  // }
  ngAfterViewInit() {
    initializeSomething();
  }

  graphSettingStyle: any = {};
  graphSettingLowStyle: any = {};
  isGraphSettingExtend: boolean = false;
  graphSettingIconClass: string = 'fa-solid fa-caret-left';
  isScrollExist: boolean = false;

  widthGet = () => {
    this.isGraphSettingExtend = !this.isGraphSettingExtend;
    const scrollWidth = this.graphSearchSetting.nativeElement.scrollWidth;
    console.log(this.graphSettingWidth, scrollWidth);

    if (this.isGraphSettingExtend) {
      this.graphSettingStyle = {
        position: 'absolute',
        transform: `translate(${
          this.graphSettingWidth - (scrollWidth + 20)
        }px,0px)`,
        'background-color': '#F7F7F7',
        'border-left': '1px solid rgb(221, 221, 221)',
        width: this.graphSettingWidth + (scrollWidth - this.graphSettingWidth),
      };
      this.graphSettingLowStyle = {
        'margin-top': '96px',
      };
      this.graphSettingIconClass = 'fa-solid fa-caret-right';
    } else if (!this.isGraphSettingExtend) {
      this.graphSettingStyle = {
        position: 'relative',
        width: this.graphSettingWidth,
        transform: `translate(0px,0px)`,
        'background-color': '#F7F7F7',
        'border-left': 'none',
      };
      this.graphSettingLowStyle = {
        'margin-top': '0px',
      };
      this.graphSettingIconClass = 'fa-solid fa-caret-left';
    }
  };

  patchVersionDisplay: string = 'none';

  // webInputFoucus($event:any){
  //   this.webSearch()
  // }

  webSearchOnEnterPress() {
    // Enter 키가 눌렸을 때 실행할 코드 (예: 검색 함수 호출)
    this.webSearch();
  }

  graphSearchOnEnterPress() {
    // Enter 키가 눌렸을 때 실행할 코드 (예: 검색 함수 호출)
    this.graphSearch();
  }

  apiGetWeb() {
    this.http
      .get(
        `http://${serverConfig.angularIp}:${serverConfig.backendNodeExpressPort}/get-session-data`,
        { withCredentials: true }
      )
      .subscribe(
        (response: any) => {
          // console.log('세션:::', response);
          this.user = response.storedSessionData;
        },
        (error: any) => {
          // this.alarmOn('서버로 요청이 실패했습니다');
        }
      );
    // this.dataService.user.subscribe((user) => (this.user = user));
    this.dataService.targetWord.subscribe((word) => (this.targetWord = word));
    this.dataService.compareQueryString.subscribe(
      (query) => (this.compareQueryString = query)
    );
    // if (this.compareQueryString == 'keyword') {
    //   this.router.navigateByUrl(
    //     `/graph2d?keyword=${this.compareQueryString}&user=${this.user}`
    //   );
    // } else if (this.compareQueryString == 'main_name') {
    //   this.router.navigateByUrl(
    //     `/graph2d?main_name=${this.compareQueryString}&user=${this.user}`
    //   );
    // }
    if (this.targetWord == '') return;
    this.dataService.apiData.subscribe((data) => (this.apiData = data));
    this.apiRequest(this.apiData, false, '');
  }

  patchInfo() {
    this.patchVersionDisplay = 'block';
    this.backgroundVisible = 'block';
  }
  patchInfoClose() {
    this.patchVersionDisplay = 'none';
    this.backgroundVisible = 'none';
  }

  clipBoardDisplay: string = 'none';

  clipCopy(text: string) {
    this.clipboardService.copyFromContent(text);
    this.clipBoardDisplay = 'block';
    setTimeout(() => {
      this.clipBoardDisplay = 'none';
    }, 2000);
    // console.log('텍스트가 클립보드에 복사되었습니다.');
  }

  // 챠트 로딩 보이기 객체
  chartLoadingVisibility: string = 'visible';

  /**
   * 챠트 그리기 메소드
   */
  chart() {
    const nodesData = this.viz.network.body.data.nodes.get(); // 모든 노드 데이터 가져오기
    // `created` 속성이 있는 노드만 필터링
    const createdData = nodesData
      .filter((node: any) => /^[0-9]+$/.test(node.id)) // ID가 숫자로만 이루어진 노드만 필터링
      .filter((node: any) => node.raw.properties && node.raw.properties.created) // properties.created가 있는 노드만 필터링
      .map((node: any) => {
        const yearMatch = node.raw.properties.created.match(/^\d{4}/);
        return yearMatch ? yearMatch[0] : null; // 일치하는 경우 연도 값을 반환하고, 그렇지 않은 경우 null을 반환
      })
      .filter(Boolean); // 결과 배열에서 null 값을 제거

    // 데이터 처리
    const dataCount = createdData.reduce((acc: any, curr: any) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});

    if (Object.keys(dataCount).length === 0) {
      // dataCount가 빈 객체인 경우의 처리 로직
      console.log('No data available for the chart.');
      this.timeLineGraphVisibility = 'none';
      return; // 이후의 로직을 실행하지 않고 함수를 종료
    } else {
      this.timeLineGraphVisibility = 'flex';
    }

    // 모든 시리즈 데이터에서 최대값을 찾습니다.
    // const maxDataValue = Math.max(
    //   ...this.chartSeries.flatMap((series) => series.data)
    // );
    const maxDataValue = Math.max(...(Object.values(dataCount) as number[]));

    // 최대값보다 10% 높은 값을 y축의 최대값으로 설정합니다.
    // const yAxisMax = maxDataValue + maxDataValue * 0.2;
    console.log('반올림 전 값: ', maxDataValue);
    const yAxisMax = Math.ceil(maxDataValue + maxDataValue * 0.1);

    console.log('맥스값::', yAxisMax, '객체::', dataCount);

    this.chartLoadingVisibility = 'hidden';

    const colors = {
      primary: 'rgba(20, 60, 117, .25)',
      secondary: '#7987a1',
      success: '#05a34a',
      info: '#66d1d1',
      warning: '#fbbc06',
      danger: '#ff3366',
      light: '#e9ecef',
      dark: '#060c17',
      muted: '#7987a1',
      gridBorder: '',
      bodyColor: '#000',
      cardBg: '',
    };

    this.chartOptions = {
      chart: {
        type: 'bar',
        fontFamily: 'pretendard, sans-serif',
        height: '110', // 높이 설정
        stacked: false, // 스택 설정
        toolbar: {
          show: false, // 툴바 숨기기
        },
        background: colors.cardBg, // 배경색 설정
        foreColor: colors.bodyColor, // 전경색 설정
        // ... 기존의 chart 옵션들
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            const clickedBarIndex = config.dataPointIndex;
            const clickedYear =
              this.chartOptions.xaxis.categories[clickedBarIndex];
            console.log(clickedBarIndex);
            console.log(clickedYear);
            console.log('그래프 탐색', clickedYear);
            this.showNodesByYear(clickedYear);

            const clickedDataPointIndex = config.dataPointIndex;
            const clickedSeriesIndex = config.seriesIndex;

            // 클릭한 데이터 포인트의 x 값(카테고리)을 가져옵니다.
            const clickedCategory =
              this.chartOptions.xaxis.categories[clickedDataPointIndex];

            // 클릭한 데이터 포인트에 세로 줄 주석을 추가합니다.
            // if (this.timeLineGraphverticalLine) {
            //   chartContext.updateOptions(
            //     {
            //       annotations: {
            //         xaxis: [
            //           {
            //             x: clickedCategory,
            //             borderColor: 'gray',
            //             // strokeDashArray: 5,
            //             // label: {
            //             //   text: 'ON',
            //             // },
            //           },
            //         ],
            //       },
            //     },
            //     false,
            //     false
            //   ); // 두 번째 인자는 애니메이션 여부, 세 번째 인자는 업데이트 유형을 의미합니다.
            // } else if (!this.timeLineGraphverticalLine) {
            //   chartContext.updateOptions(
            //     {
            //       annotations: {
            //         xaxis: [
            //           {
            //             x: clickedCategory,
            //             borderColor: 'none',
            //             // label: {
            //             //   text: '선택된 포인트',
            //             // },
            //           },
            //         ],
            //       },
            //     },
            //     false,
            //     false
            //   ); // 두 번째 인자는 애니메이션 여부, 세 번째 인자는 업데이트 유형을 의미합니다.
            // }
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 2,
          columnWidth: '60%',
          dataLabels: {
            position: 'top', // top, center, bottom
          },
        },
      },
      xaxis: {
        categories: Object.keys(dataCount),
        labels: {
          style: {
            fontFamily: 'pretendard, sans-serif',
            fontSize: '12px',
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        crosshairs: {
          fill: {
            type: 'gradient',
            gradient: {
              // colorFrom: '#D8E3F0',
              // colorTo: '#BED1E6',
              colorFrom: 'black',
              colorTo: 'black',
              stops: [0, 100],
              // opacityFrom: 0.4,
              // opacityTo: 0.5,
              opacityFrom: 0,
              opacityTo: 0,
            },
          },
          show: true,
          width: 1, // 선의 두께
          position: 'back',
          opacity: 0.9,
          stroke: {
            color: '#b6b6b6',
            width: 1,
            dashArray: 5,
          },
        },
        tooltip: {
          enabled: true,
          offsetY: 7,
          shared: true,
          intersect: false, // 이 옵션을 false로 설정하면, 세로 줄이 데이터 포인트를 교차할 때만 표시되지 않습니다.
          followCursor: true, // 마우스 커서를 따라다니도록 설정
        },
      },
      yaxis: {
        max: yAxisMax, // 최대값을 데이터 포인트 최대값보다 크게 설정
        tickAmount: 3, // y축에 표시할 눈금의 총 개수를 정의 (예시)
        labels: {
          formatter: function (val: any) {
            if (val === yAxisMax) {
              return val.toFixed(0); // 최대값일 경우 정수로 포맷하여 반환
            }
            // 다른 값들에 대한 포맷은 기본 로직을 사용
            return val.toFixed(0); // 값을 정수로 포맷
          },
        },
        // 기타 y축 설정
      },
      stroke: {
        width: 0,
      },

      theme: {
        mode: 'light', // 테마 설정
      },
      tooltip: {
        theme: 'light', // 툴팁 테마 설정,
        y: [
          {
            formatter: function (y: any) {
              if (typeof y !== 'undefined') {
                return y.toFixed(0) + '노드';
              }
              return y;
            },
          },
          {
            formatter: function (y: any) {
              if (typeof y !== 'undefined') {
                return y.toFixed(2) + ' $';
              }
              return y;
            },
          },
        ],
      },
      dataLabels: {
        enabled: true, // 데이터 라벨 활성화
        textAnchor: 'middle', // 바의 안쪽에 텍스트 표시
        offsetY: -15, // Y축 방향으로 텍스트 위치 조정 (필요에 따라 조절)
        // offsetX: 2,
        style: {
          fontSize: '12px',
          colors: ['#333333'], // 텍스트 색상 설정 (바의 색상과 대비되게 설정)
        },
      },
    };

    this.chartSeries = [
      {
        // color: '#143c7540',
        color: colors.primary, // 기본 색상 설정
        name: 'Total',
        data: Object.values(dataCount),
      },
    ];
  }

  customColors: any;
  onSelect(event: any) {
    this.customColors = [
      {
        name: event.name,
        value: '#ff0000',
      },
    ];
  }

  // changeBarColor(barIndex: number) {
  //   // 원래의 시리즈 데이터 복사
  //   let newSeries = [...this.chartSeries];

  //   // 색상 변경 로직
  //   // 예: 모든 바를 기본 색상으로 설정하고, 선택된 바만 빨간색으로 변경
  //   newSeries = newSeries.map((s, index) => {
  //     return {
  //       ...s,
  //       data: s.data.map((d:any, dataIndex:any) => {
  //         return {
  //           ...d,
  //           fillColor: dataIndex === barIndex ? 'red' : '기본 색상' // 기본 색상은 실제 색상 코드로 대체
  //         };
  //       })
  //     };
  //   });

  //   // 차트 시리즈 업데이트
  //   this.chartSeries = newSeries;
  // }

  compareCreated: string = '';
  countCreatedClick: number = 0;
  timeLineGraphverticalLine: boolean = true;

  /**
   * 챠트 그리기에 사용되는 년도 처리 메소드
   * @param year 년도
   */
  showNodesByYear(year: string) {
    const nodes = this.viz.network.body.data.nodes;
    const nodeUpdateTarget: any = [];

    if (this.compareCreated == year && this.countCreatedClick < 1) {
      this.countCreatedClick++;
      nodes.forEach((node: any) => {
        if (
          node.raw &&
          node.raw.properties &&
          node.raw.properties.created &&
          node.raw.properties.created.startsWith(year)
        ) {
        } else {
          // nodes.update([{ id: node.id, hidden: false }]);
          node.hidden = false;
          nodeUpdateTarget.push(node);
        }
      });
      nodes.update(nodeUpdateTarget);
      this.timeLineGraphverticalLine = false;
      return;
    }
    this.countCreatedClick = 0;
    this.compareCreated = year;
    this.timeLineGraphverticalLine = true;
    console.log(year, '를 받음');
    // NeoVis를 사용하여 해당 년도의 `created` 값을 포함하는 노드만 표시합니다.
    // 모든 노드 데이터를 가져옵니다.

    // 먼저, 모든 노드를 숨깁니다.
    nodes.forEach((node: any) => {
      node.hidden = true;
    });

    nodes.forEach((node: any) => {
      if (
        node.raw &&
        node.raw.properties &&
        node.raw.properties.created &&
        node.raw.properties.created.startsWith(year)
      ) {
        node.hidden = false;
        nodeUpdateTarget.push(node);
      } else {
        node.hidden = true;
        nodeUpdateTarget.push(node);
      }
    });
    nodes.update(nodeUpdateTarget);
  }
  mouseX = 0;
  mouseY = 0;
  contextMenuVisible = false;
  /**
   * neovis를 이용하여 초기 viz 그래프를 setup후 렌더링 메소드
   */
  draw() {
    const config: any = {
      containerId: 'viz',

      neo4j: {
        ...Neo4jConfig,
        serverUrl: `bolt://${this.neo4jIp}:${this.neo4jPort}`, // local
      },
      labels: {
        ...LabelConfig,
      },

      visConfig: {
        physics: true, // 물리 엔진을 끄는 옵션
        nodes: {
          hidden: false,
          size: 30,
          font: {
            color: '#343434',
            size: 20,
            face: 'pretendard',
            strokeWidth: 2,
          },
        },
        edges: {
          color: { color: '#597EAD', highlight: '	#B90E0A', hover: '#B90E0A' },

          arrows: {
            to: { enabled: true },
          },
          font: {
            color: '#343434',
            size: 15,
            face: 'pretendard',
            strokeWidth: 2,
          },
        },
        interaction: {
          hover: true,
          // navigationButtons: true,
        },
        configure: {
          enabled: false,
        },
        // manipulation: {
        //   enabled: false,

        //   addNode: function (nodeData: any, callback: any) {
        //     console.log('노드 추가 감지');
        //     nodeData.label = 'hello world';
        //     callback(nodeData);
        //   },
        // },
      },
      relationships: {
        ...RealtionshipConfig,
      },
      initialCypher: 'MATCH (n) RETURN * LIMIT 0',
    };

    this.viz = new NeoVis(config);
    this.viz.render();

    // 결과 배열 초기화
    const result: string[] = [];

    /**
     * 렌더링 완료 후 각 노드들의 events를 처리할 메소드
     */
    this.viz.registerOnEvent('completed', (evt: any) => {
      this.viz.network.on('oncontext', (params: any) => {
        params.event.preventDefault();
        const nodeID = this.viz.network.getNodeAt(params.pointer.DOM);
        console.log('우클릭', nodeID);
        if (nodeID) {
          this.viz.network.selectNodes([nodeID]);
          this.mouseX = params.event.pageX;
          this.mouseY = params.event.pageY;
          // 추가적인 로직을 실행할 수 있습니다.
          // 예를 들어, 컨텍스트 메뉴를 표시하거나 노드에 대한 정보를 표시하는 등의 동작을 수행할 수 있습니다.
          this.openNodeInfoModal(nodeID);
        }
      });

      this.viz.network.on('selectNode', (properties: any) => {
        // 노드를 선택했을 때 이벤트

        const clickedNodeId = properties.nodes[0]; // 클릭된 노드의 ID
        this.clickOff = clickedNodeId;

        // 연관된 노드 찾기
        const connectedNodes =
          this.viz.network.getConnectedNodes(clickedNodeId);

        // 원본 노드 이미지 변경
        const nodeImageChange =
          this.viz.network.body.data.nodes.get(clickedNodeId);
        if (nodeImageChange == null) {
          return;
        }
        if (nodeImageChange.image && nodeImageChange.image.endsWith('_4.png')) {
          // console.log('노드 이미지 찾음:', nodeImageChange.image);
          const updatedImage = nodeImageChange.image.replace(
            '_4.png',
            '_3.png'
          ); // 이미지 주소 변경
          nodeImageChange.image = updatedImage;
          this.viz.network.body.data.nodes.update(nodeImageChange);
        }

        // 이미지 변경 (연관 노드)
        connectedNodes.forEach((nodeId: any) => {
          const node = this.viz.network.body.data.nodes.get(nodeId);
          // console.log(node.image);
          // 이미지 주소가 '3.png'로 끝나는지 확인
          if (node.image && node.image.endsWith('_4.png')) {
            // console.log('노드 이미지 찾음:', node.image);
            const updatedImage = node.image.replace('_4.png', '_3.png'); // 이미지 주소 변경
            node.image = updatedImage;
            this.viz.network.body.data.nodes.update(node);
          }
        });

        this.groupedNodes.clear(); //초기화
        connectedNodes.forEach((nodeId: any) => {
          // 연관된 노드 작업
          const target = this.viz.network.body.data.nodes.get(nodeId);
          // console.log('노드 찾아보자', target);

          const group = target.group;

          // 몇개인지 count
          let countNumber = 1;
          if (!this.groupedNodes.has(group)) {
            // 해당 그룹에 대한 배열이 없으면 새 배열을 생성
            this.groupedNodes.set(group, []);
          } else {
            // console.log('이미 있는 배열', this.groupedNodes.get(group));
          }

          // 해당 그룹의 배열에 rawid와 name 추가
          this.groupedNodes.get(group)!.push({
            rawid: target.id, // rawid와 name은 target에 있는 것으로 가정
            name: target.label,
          });
          this.groupKeys = Array.from(this.groupedNodes.keys());
          // console.log('확인::::', this.groupKeys);
        });

        // 결과 확인
        this.groupedNodes.forEach((values, key) => {
          // console.log(`Group: ${key}, Values:`, values);
        });

        const edgeLength: number = properties.edges.length;
        // console.log('Edge 길이:::', edgeLength);
        const edgeNumber: any = [];
        if (edgeLength == 1) {
          edgeNumber.push(properties.edges[0]);
        } else {
          properties.edges.forEach((edge: any) => {
            edgeNumber.push(edge);
          });
        }
        // console.log('Edge 결과물:::', edgeNumber);

        const selectedNodeId = properties.nodes[0]; // 선택된 노드의 ID
        // console.log('노드 ', properties);

        //아이디 문자열 (그룹노드) 일때 예외처리
        if (typeof selectedNodeId !== 'number') {
          console.log('그룹노드:::', selectedNodeId);
          console.log(
            'value:',
            this.viz.network.body.data.nodes.get(selectedNodeId)
          );
          return;
        }

        const selectedNode =
          this.viz.network.body.data.nodes.get(selectedNodeId);

        console.log('선택된 노드::', selectedNode);

        // 노드 정보 표출하기
        this.onNodeClick(selectedNode);

        // 인접노드 관계정보 가져오기
        this.logAdjacentNodesAndRelationships(selectedNodeId);

        this.malwareInfoAPI(selectedNode);
      });

      //노드 선택 해제 시
      this.viz.network.on('deselectNode', (params: any) => {
        const nodeId = this.clickOff;
        const connectedNodes = this.viz.network.getConnectedNodes(nodeId);

        // 원본 노드 이미지 변경
        const nodeImageChange = this.viz.network.body.data.nodes.get(nodeId);
        if (nodeImageChange == null) {
          return;
        }
        if (nodeImageChange.image && nodeImageChange.image.endsWith('_3.png')) {
          console.log('노드 이미지 찾음:', nodeImageChange.image);
          const updatedImage = nodeImageChange.image.replace(
            '_3.png',
            '_4.png'
          ); // 이미지 주소 변경
          nodeImageChange.image = updatedImage;
          this.viz.network.body.data.nodes.update(nodeImageChange);
        } else {
        }

        connectedNodes.forEach((connectedNodeId: any) => {
          const node = this.viz.network.body.data.nodes.get(connectedNodeId);

          if (node.image && node.image.endsWith('_3.png')) {
            const updatedImage = node.image.replace('_3.png', '_4.png');
            node.image = updatedImage;
            this.viz.network.body.data.nodes.update(node);
          }
        });
        this.clickOff = undefined;
      });

      // 더블클릭 event
      this.viz.network.on('doubleClick', (properties: any) => {
        this.nodeDoubleClick(properties);
      });
    });
  }

  localIndexNum = 0;
  // 탐색 인덱스
  searchIndex = -1;

  localStorageTest() {
    // 현재 저장된 항목들을 가져옵니다.
    const nodes = this.viz.network.body.data.nodes.get();
    const edges = this.viz.network.body.data.edges.get();
    const data = { nodes: nodes, edges: edges };

    if (this.localIndexNum != 10) {
      localStorage.setItem(`${this.localIndexNum}`, JSON.stringify(data));
      this.localIndexNum++;
      this.searchIndex++;
    } else if (this.localIndexNum == 10) {
      localStorage.removeItem('0');
      for (let i = 1; i <= 9; i++) {
        const item: any = localStorage.getItem(`${i}`);
        localStorage.setItem(`${i - 1}`, item);
      }
      localStorage.setItem(`9`, JSON.stringify(data));
      const output: any = localStorage.getItem('0');
      console.log('마지막 삭제 반영 후 마지막 데이터:::', JSON.parse(output));
    }
  }

  backward() {
    if (this.contextMenuVisible) {
      this.contextMenuVisible = !this.contextMenuVisible;
    }
    if (this.searchIndex == 0) {
      console.log('더이상 탐색X');
      return;
    }
    this.searchIndex--;
    console.log('로컬탐색:', this.searchIndex, '맥스값:', this.localIndexNum);
    const testString: any = localStorage.getItem(`${this.searchIndex}`);
    const test = JSON.parse(testString);
    const nodes = test.nodes;
    const edges = test.edges;
    this.viz.network.setData({ nodes: nodes, edges: edges });
    if (this.searchIndex == 0) {
      console.log('더이상 탐색X');
    } else {
      this.chart();
      this.filtering(false);
    }
  }

  forward() {
    if (this.contextMenuVisible) {
      this.contextMenuVisible = !this.contextMenuVisible;
    }
    if (this.searchIndex + 1 == this.localIndexNum) {
      console.log('더 이상 탐색X');
      return;
    }
    console.log('로컬탐색 증가전:', this.searchIndex);
    this.searchIndex++;
    console.log('로컬탐색:', this.searchIndex, '맥스값:', this.localIndexNum);
    const testString: any = localStorage.getItem(`${this.searchIndex}`);
    const test = JSON.parse(testString);
    const nodes = test.nodes;
    const edges = test.edges;
    this.viz.network.setData({ nodes: nodes, edges: edges });
    this.chart();
    this.filtering(false);
  }

  nodeDoubleClick(properties: any) {
    const clickedNodeIds = properties.nodes;
    console.log(clickedNodeIds);
    if (clickedNodeIds[0] == 'keyword') {
      console.log('키워드 더블클릭');

      return;
    }
    const clickedNodeEdgesInfo = properties.edges;
    // const clickedNodeEdgesLength = properties.edges.length;
    console.log(
      '엣지 현황:::',
      this.viz.network.body.data.edges.get(clickedNodeEdgesInfo)
    );
    const clickedNodeEdgesInfoDetail =
      this.viz.network.body.data.edges.get(clickedNodeEdgesInfo);
    // const edgeToObj = clickedNodeEdgesInfoDetail[0].to;
    let edgeToObj: any;
    if (
      clickedNodeEdgesInfoDetail &&
      clickedNodeEdgesInfoDetail.length > 0 &&
      clickedNodeEdgesInfoDetail[0]
    ) {
      edgeToObj = clickedNodeEdgesInfoDetail[0].to;
      // ... 나머지 코드 ...
    } else if (clickedNodeIds[0]) {
      console.log('릴레이션 없는 노드');
    } else {
      console.log('노드를 향해 더블클릭 하시오');
      return;
    }

    const typeEdgeToObj = typeof edgeToObj;

    if (clickedNodeIds.length > 0) {
      let clickedNodeId = clickedNodeIds[0];
      // 여기서 원하는 작업 수행
      console.log('노드가 더블클릭됨:', clickedNodeId);
      let typeCheck = typeof clickedNodeId;
      console.log('타입::', typeCheck);
      if (typeCheck != 'number') {
        console.log('타입::그룹노드');
        console.log(typeEdgeToObj);
        if (typeEdgeToObj != 'number') {
          console.log('하위 그룹노드 없음');
          console.log(
            '그룹노드 이미지 바꾸자~',
            this.viz.network.body.data.nodes.get(clickedNodeId)
          );
          this.groupNodeOpenImage(clickedNodeId);
          // 만약 그룹노드의 부모 노드가 keyword일 경우에 다른 로직처리
          const connectedEdges =
            this.viz.network.getConnectedEdges(clickedNodeId);
          console.log('다른 로직 처리중...', connectedEdges);
          console.log('이 그룹노드의 라벨은??', clickedNodeId);
          const parentLabel =
            this.viz.network.body.data.edges.get(connectedEdges)[0].from;
          console.log(parentLabel);
          if (
            typeof parentLabel === 'string' &&
            (parentLabel.includes('keyword') ||
              parentLabel.includes('searchKeyword'))
          ) {
            const connEdgeCount =
              this.viz.network.getConnectedEdges(clickedNodeId);
            console.log(connEdgeCount);
            let count: number = 0;
            connEdgeCount.forEach((edgeId: any) => {
              const edge = this.viz.network.body.data.edges.get(edgeId);
              console.log(edge);
              if (edge.to != clickedNodeId) {
                // 자신의 부모노드와의 관계 제외하기
                count++;
              }
            });

            if (count >= 0 || count >= 10) {
              // 신규 기능 searchKeyword 추가로 인한 타겟워딩
              const targetWord =
                this.viz.network.body.data.nodes.get(parentLabel).word;
              // 보낼 객체 type과 target 보내기
              // 타입 리 컨펌
              // clickedNodeId = this.typeRawConfirm(clickedNodeId);
              const reqObj: any = {
                type: clickedNodeId,
                // word: this.targetWord,
                word: targetWord,
                limit: count,
              };
              console.log('자 count 보낸다', count);
              this.apiKeywordFromGroupNode(reqObj);
            }
          } else {
            // 여기부터 다시 하위 그룹노드 만들기

            // 엣지 갯수 가져오기 test
            console.log(clickedNodeId);
            console.log(this.viz.network.body.data.edges.get(clickedNodeId));
            const connEdgeCount =
              this.viz.network.getConnectedEdges(clickedNodeId);
            console.log(connEdgeCount);
            let count: number = 0;
            connEdgeCount.forEach((edgeId: any) => {
              const edge = this.viz.network.body.data.edges.get(edgeId);
              console.log(edge);
              if (edge.to != clickedNodeId) {
                // 자신의 부모노드와의 관계 제외하기
                count++;
              }
            });
            console.log('카운트 확인::::::', count);
            if (count == 0 || count >= 1) {
              // 타입 리 컨펌
              // clickedNodeId = this.typeRawConfirm(clickedNodeId);
              const reqObj: any = {
                type: clickedNodeId,
                word: this.targetWord,
                limit: count,
              };
              console.log('자 count 보낸다', count);
              this.apiLowGroupNodeAddFromGroupNode(reqObj, clickedNodeId);
            }
          }
        } else if (typeEdgeToObj == 'number') {
          console.log('하위 노드 있음');
        }
        // if(clickedNodeEdgesLength)
      } else if (typeCheck == 'number') {
        console.log('타입::하위노드');
        console.log('노드 아이디:', clickedNodeId);
        // 주석 친 부분은 기존 관련 노드
        const findNode = this.viz.network.body.data.nodes.get(clickedNodeId);
        const findNodeType = findNode.raw.properties.type;
        console.log('타입찾자:', findNode);
        // 타입 리 컨펌
        clickedNodeId = this.typeRawConfirm(clickedNodeId);
        const reqObj: any = {
          type: findNodeType,
          id: clickedNodeId,
          word: this.targetWord,
        };

        // 이곳부터 새로운 하위노드 생성
        this.apiAllNodeGet(reqObj);
      }
    }
  }

  nodeRemove(param: any) {
    this.closeModal();
    if (param === undefined) {
      this.alarmOn('노드를 선택 후 사용하세요');
      return;
    }
    const node = this.viz.network.body.data.nodes.get(
      param.id ? param.id : param
    );
    // this.viz.network.body.data.nodes.remove();
    const connectedNodes = this.viz.network.getConnectedEdges(
      param.id ? param.id : param
    );
    this.viz.network.body.data.nodes.remove(param.id ? param.id : param);
    connectedNodes.forEach((element: any) => {
      this.viz.network.body.data.edges.remove(element);
    });
    console.log(node, connectedNodes);
    this.filtering(true);
  }

  extention(param: any) {
    this.closeModal();
    const req = { nodes: [param.id] };
    this.nodeDoubleClick(req);
  }

  rightClickObj: any;
  rightClickNodeId: any;
  openNodeInfoModal(nodeId: string) {
    this.rightClickNodeId = nodeId;
    // nodeId를 사용하여 노드 정보를 가져옵니다.
    const nodeData = this.viz.network.body.data.nodes.get(nodeId);
    this.rightClickObj = nodeData;
    this.contextMenuVisible = true;
  }

  closeModal(): void {
    this.contextMenuVisible = false;
  }

  selectedGroups: string[] = []; // 선택된 그룹들을 저장하는 배열

  realFullScreen() {
    const vizElement = document.getElementById('viz');

    if (vizElement) {
      if (!document.fullscreenElement) {
        if (vizElement.requestFullscreen) {
          vizElement.requestFullscreen();
        } else if ((vizElement as any).mozRequestFullScreen) {
          /* Firefox */
          (vizElement as any).mozRequestFullScreen();
        } else if ((vizElement as any).webkitRequestFullscreen) {
          /* Chrome, Safari and Opera */
          (vizElement as any).webkitRequestFullscreen();
        } else if ((vizElement as any).msRequestFullscreen) {
          /* IE/Edge */
          (vizElement as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          /* Firefox */
          (document as any).mozCancelFullScreen();
        } else if ((document as any).webkitExitFullscreen) {
          /* Chrome, Safari and Opera */
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          /* IE/Edge */
          (document as any).msExitFullscreen();
        }
      }
    }
  }
  /**
   * canvas 풀스크린 메소드
   */
  toggleFullScreen() {
    // 그래프를 화면에 맞춤
    this.viz.network.fit({ animation: true });
  }

  /**
   * canva 줌인 메소드
   */
  zoomIn() {
    const scale = this.viz.network.getScale();
    this.viz.network.moveTo({
      scale: scale * 1.2,
    });
  }

  /**
   * canva 줌아웃 메소드
   */
  zoomOut() {
    const scale = this.viz.network.getScale();
    this.viz.network.moveTo({
      scale: scale / 1.2,
    });
  }

  toggleGroup(group: string) {
    if (this.selectedGroups.includes(group)) {
      // 이미 선택된 그룹이면 배열에서 제거
      this.selectedGroups = this.selectedGroups.filter((g) => g !== group);
    } else {
      // 선택되지 않은 그룹이면 배열에 추가
      this.selectedGroups.push(group);
    }
  }

  handleSelectNodeEvent(properties: any) {
    // 여기에 this.viz.network.on('selectNode', (properties: any) => {...} 내부의 로직을 넣습니다.
    /**
     *  Related Node 메소드 구현....
     */

    // 클릭된 노드의 ID
    const clickedNodeId = properties.nodes[0];

    // 전의 노드 이미지 변경
    let nodeImageChanges = this.viz.network.body.data.nodes;
    nodeImageChanges.forEach((element: any) => {
      if (element.image && element.image.endsWith('_3.png')) {
        console.log('이미지 오류?', element);
        console.log('활성화 4로 바꾸기:', element.image);
        const updatedImage = element.image.replace('_3.png', '_4.png'); // 이미지 주소 변경
        element.image = updatedImage;
        this.viz.network.body.data.nodes.update(element);
      }
    });

    // 2. 연관된 노드 찾기
    const connectedNodes = this.viz.network.getConnectedNodes(clickedNodeId);

    // 원본 노드 이미지 변경
    const nodeImageChange = this.viz.network.body.data.nodes.get(clickedNodeId);
    if (nodeImageChange.image && nodeImageChange.image.endsWith('_4.png')) {
      console.log('노드 이미지 찾음:', nodeImageChange.image);
      const updatedImage = nodeImageChange.image.replace('_4.png', '_3.png'); // 이미지 주소 변경
      nodeImageChange.image = updatedImage;
      this.viz.network.body.data.nodes.update(nodeImageChange);
    }

    // 3. 이미지 변경 (연관 노드)
    connectedNodes.forEach((nodeId: any) => {
      const node = this.viz.network.body.data.nodes.get(nodeId);
      console.log(node.image);
      // 이미지 주소가 '3.png'로 끝나는지 확인
      if (node.image && node.image.endsWith('_4.png')) {
        console.log('노드 이미지 찾음:', node.image);
        const updatedImage = node.image.replace('_4.png', '_3.png'); // 이미지 주소 변경
        node.image = updatedImage;
        this.viz.network.body.data.nodes.update(node);
      }
    });

    //초기화
    this.groupedNodes.clear();
    // 연관된 노드 작업
    connectedNodes.forEach((nodeId: any) => {
      const target = this.viz.network.body.data.nodes.get(nodeId);
      console.log('노드 찾아보자', target);

      const group = target.group;

      // 몇개인지 count
      let countNumber = 1;
      if (!this.groupedNodes.has(group)) {
        // 해당 그룹에 대한 배열이 없으면 새 배열을 생성
        this.groupedNodes.set(group, []);
      } else {
        console.log('이미 있는 배열', this.groupedNodes.get(group));
      }

      // 해당 그룹의 배열에 rawid와 name 추가
      this.groupedNodes.get(group)!.push({
        rawid: target.id, // rawid와 name은 target에 있는 것으로 가정
        name: target.label,
      });
      this.groupKeys = Array.from(this.groupedNodes.keys());
      console.log('확인::::', this.groupKeys);
    });

    const selectedNodeId = properties.nodes[0]; // 선택된 노드의 ID
    console.log('노드 ', properties);

    //아이디 문자열 (그룹노드) 일때 예외처리
    if (typeof selectedNodeId !== 'number') {
      console.log('그룹노드:::', selectedNodeId);
      return;
    }

    const selectedNode = this.viz.network.body.data.nodes.get(selectedNodeId);

    console.log('선택된 노드::', selectedNode);

    // 노드 정보 표출하기
    this.onNodeClick(selectedNode);

    // 인접노드 관계정보 가져오기
    this.logAdjacentNodesAndRelationships(selectedNodeId);
  }

  focusCount: number = 0;

  /**
   * 노드를 Focus 이벤트 처리 할 메소드
   * @param nodeId focus할 노드의 raw id
   */
  focusNode(nodeId: any) {
    this.viz.network.selectNodes([nodeId], true);
    this.focusCount++;
    // 선택된 노드에 대한 selectNode 이벤트 로직 수행
    const properties = { nodes: [nodeId] }; // properties 객체 형태를 일치시킵니다.
    this.handleSelectNodeEvent(properties); // selectNode 이벤트 로직을 수행하는 함수 호출

    //연속으로 추가 한 경우 그 전에 있던 노드 비활성화 처리
    // if (this.focusCount >= 2) {
    //   console.log('포커스 2중첩!!!');
    //   // 전의 노드 이미지 변경
    //   const nodeImageChange = this.viz.network.body.data.nodes.get(
    //     this.clickOff
    //   );
    //   if (nodeImageChange.image && nodeImageChange.image.endsWith('_3.png')) {
    //     console.log('이미지 오류?', nodeImageChange);
    //     console.log('노드 이미지 찾음:', nodeImageChange.image);
    //     const updatedImage = nodeImageChange.image.replace('_3.png', '_4.png'); // 이미지 주소 변경
    //     nodeImageChange.image = updatedImage;
    //     this.viz.network.body.data.nodes.update(nodeImageChange);
    //     // 변경 후 비활성화 시 담을 노드 아이디
    //     this.clickOff = nodeId;
    //   }
    // } else {
    //   this.clickOff = nodeId;
    // }
    this.viz.network.focus(nodeId, {
      scale: 1.0, // 원하는 스케일로 설정
      animation: {
        duration: 1000,
        easingFunction: 'easeInOutQuad',
      },
    });

    // 원본 노드 이미지 변경
    const nodeImageChange = this.viz.network.body.data.nodes.get(nodeId);
    if (nodeImageChange.image && nodeImageChange.image.endsWith('_4.png')) {
      console.log('노드 이미지 찾음:', nodeImageChange.image);
      const updatedImage = nodeImageChange.image.replace('_4.png', '_3.png'); // 이미지 주소 변경
      nodeImageChange.image = updatedImage;
      this.viz.network.body.data.nodes.update(nodeImageChange);
    }
  }

  /**
   * 더보기 버튼을 보여줄지 결정할 메소드
   * @param relatedNode
   * @returns
   */
  shouldShowMoreButton(relatedNode: any): boolean {
    const currentCount = this.displayedItemsCount[relatedNode.key] || 0; // 현재 표시된 항목 수
    const totalCount = relatedNode?.['value']?.combined?.length || 0; // 전체 항목 수
    return currentCount < totalCount;
  }

  displayedItemsCount: { [key: string]: number } = {};

  /**
   * 더보기 클릭 시 보여줄 갯수를 담당 할 메소드
   * @param key 해당하는 Type값
   */
  increaseDisplayedItems(key: string) {
    if (!this.displayedItemsCount[key]) {
      this.displayedItemsCount[key] = 10; // 처음에 10개 항목을 표시
    } else {
      this.displayedItemsCount[key] += 10; // 클릭할 때마다 10개씩 증가
    }
  }

  malwareAPIResult: any = {};

  malwareInfoAPI(node: any) {
    console.log(node);
    let params: any;
    if (
      node &&
      node.raw != undefined &&
      node.raw.properties != undefined &&
      node.raw.properties.hash_type != undefined &&
      node.raw.properties.hash_type == 'MD5'
    ) {
      const id = node.id;
      const name = node.raw.properties.name;
      params = {
        id: id,
        name: name,
      };
      console.log(id, name);
      this.http
        .post(`http://${this.pythonIp}:${this.pythonPort}/api/malware`, params)
        .subscribe(
          (response: any) => {
            console.log(response);
            console.log(Object.keys(this.malwareAPIResult));
            this.malwareAPIResult = response;
            console.log(Object.keys(this.malwareAPIResult));
          },
          (error: any) => {
            this.alarmOn('서버로 요청이 실패했습니다');
          }
        );
    } else {
      this.malwareAPIResult = {};
    }
  }

  /**
   * 키워드 관련 그룹노드 API
   * @param params API에 보낼 객체
   */
  apiKeywordFromGroupNode(params: any) {
    this.searchLoadingOn();
    params.type = this.typeRawConfirm(params.type);
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/hnkgd`,
        params
      )
      .subscribe(
        (response: any) => {
          console.log(response);
          response.forEach((element: any) => {
            const rawId = element.m.identity.low;
            const rawName = element.m.properties.name;
            const rawProperties = element.m.properties;
            let rawType = this.typeConfirm(element.m.properties.type);
            const edgeLabel = element.relationshipTypes[0];
            const nodeId = this.typeConfirm(params.type);
            // 만약 기존에 이미 노드가 추가되어있을 경우 relation만 추가
            if (this.viz.network.body.data.nodes.get(rawId)) {
              //그룹노드와 원본노드 엣지 추가
              const hasNumber = /\d/.test(nodeId);

              if (hasNumber) {
                // 그리고 relation이 있는지도 확인해야됨
                console.log('nodeId에 숫자가 포함되어 있습니다.');
                this.viz.network.body.data.edges.add({
                  label: edgeLabel,
                  id: rawId + '_from_' + nodeId,
                  from: nodeId,
                  to: rawId,
                });
              } else {
                // 원본 그룹 노드
                console.log('nodeId에 숫자가 포함되어 있지 않습니다.');
                // 그리고 relation이 있는지도 확인해야됨
                const findIdRel = rawId + '_from_' + nodeId;
                if (this.viz.network.body.data.edges.get(findIdRel)) {
                  console.log('있으니 pass');
                } else {
                  this.viz.network.body.data.edges.add({
                    label: edgeLabel,
                    id: rawId + '_from_' + nodeId,
                    from: nodeId,
                    to: rawId,
                  });
                }
              }
            } else {
              this.viz.network.body.data.nodes.add({
                id: rawId,
                label: this.labelReform(rawName),
                title: rawName,
                group: rawType,
                // type: rawName,
                shape: 'image',
                image: `../assets/images/${rawType}/${rawType}_4.png`,
                raw: { properties: rawProperties },
                visConfig: {
                  nodes: {
                    size: 55,
                    font: {
                      color: '#343434',
                      size: this.nodeFontSize,
                      face: 'pretendard',
                      strokeWidth: 2,
                    },
                  },

                  edges: {
                    arrows: {
                      to: { enabled: true },
                    },
                    font: {
                      // background: 'black',
                      color: '#343434',
                      size: this.edgeFontSize, // px
                      face: 'pretendard',
                      strokeWidth: 2, // px
                      // strokeColor: "blue",
                    },
                  },
                },
              });
              //그룹노드와 원본노드 엣지 추가
              this.viz.network.body.data.edges.add({
                label: edgeLabel,
                id: rawId + '_from_' + nodeId,
                from: nodeId,
                to: rawId,
              });
              // this.chart();
              // this.filtering(true);
            }
          });
          this.chart();
          this.filtering(true);
          this.searchLoadingOff();
        },
        (error: any) => {
          this.alarmOn('서버로 요청이 실패했습니다');
        }
      );
  }

  typeConfirm(params: any) {
    // if (params == 'attack-pattern') {
    //   return 'Technique';
    // } else if (params == 'tool') {
    //   return 'Software';
    // } else if (params == 'intrusion-set') {
    //   return 'Group';
    // } else if (params == 'ipv4_addr') {
    //   return 'ipv4-addr';
    // } else if (params == 'windows-registry-key') {
    //   return 'registry';
    // } else if (params == 'email') {
    //   return 'Email';
    // }
    if (params == 'attack-pattern') {
      return 'Technique';
    } else if (params == 'tool') {
      return 'Software';
    } else if (params == 'intrusion-set') {
      return 'Group';
    } else if (params == 'windows-registry-key') {
      return 'registry';
    } else if (params == 'email') {
      return 'Email';
    }
    return params;
  }

  typeRawConfirm(params: any) {
    // if (params == 'Technique') {
    //   return 'attack-pattern';
    // } else if (params == 'Software') {
    //   return 'tool';
    // } else if (params == 'Group') {
    //   return 'intrusion-set';
    // } else if (params == 'ipv4-addr') {
    //   return 'ipv4_addr';
    // } else if (params == 'registry') {
    //   return 'windows-registry-key';
    // } else if (params == 'Email') {
    //   return 'email';
    // }
    if (params == 'Technique') {
      return 'attack-pattern';
    } else if (params == 'Software') {
      return 'tool';
    } else if (params == 'Group') {
      return 'intrusion-set';
    } else if (params == 'registry') {
      return 'windows-registry-key';
    } else if (params == 'Email') {
      return 'email';
    }
    return params;
  }

  apiAllNodeGet(params: any) {
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/all/node`,
        params
      )
      .subscribe((response: any) => {
        console.log(response);

        const multiBoolean = response.multi;
        if (multiBoolean) {
          console.log('다중노드 발견');
          console.log('더블클릭 한 노드 id:', params.id);
          for (var i = 0; i < response.data.mTypes.length; i++) {
            let groupLabel = this.typeConfirm(response.data.mTypes[i]);
            let rawId = params.id;
            // 만약 그룹 노드가 이미 있을 경우
            let findGroupNodeId = groupLabel + '_from_' + rawId;
            if (this.viz.network.body.data.nodes.get(findGroupNodeId)) {
              console.log('그룹노드가 이미 있으니 해당 그룹노드 추가는 건너뜀');
            } else {
              this.viz.network.body.data.nodes.add({
                id: groupLabel + '_from_' + rawId,
                label: this.labelReform(groupLabel),
                title: groupLabel,
                group: groupLabel,
                shape: 'image',
                image: `../assets/images/${groupLabel}/${groupLabel}_1.png`,
                visConfig: {
                  nodes: {
                    size: 55,
                    font: {
                      color: '#343434',
                      size: this.nodeFontSize, // px
                      face: 'pretendard',
                      strokeWidth: 2, // px
                    },
                  },
                  edges: {
                    arrows: {
                      to: { enabled: true },
                    },
                    font: {
                      color: '#343434',
                      size: this.edgeFontSize, // px
                      face: 'pretendard',
                      strokeWidth: 2, // px
                    },
                  },
                },
              });
              //그룹노드와 원본노드 엣지 추가
              this.viz.network.body.data.edges.add({
                // id: rawId,
                label: response.data.rTypes[i],
                from: rawId,
                to: groupLabel + '_from_' + rawId,
              });
            }
          }
          this.chart();
          this.filtering(true);
        } else if (!multiBoolean) {
          console.log('다중노드 아니고 상위 노드와 같은지 비교 로직 필요');
          console.log(response.data);
          const connEdge = this.viz.network.getConnectedEdges(params.id);
          let connEdgeLabel: any;
          console.log(connEdge);
          connEdge.forEach((edgeId: any) => {
            const edge = this.viz.network.body.data.edges.get(edgeId);
            console.log(edge);
            // connEdgeLabel = edge.from.replace(/_from_\d+$/, '');
            if (/^\d+$/.test(edge.from)) {
              // from 값이 숫자만으로 구성된 경우의 처리 로직
              console.log(
                'The "from" value consists of numbers only:',
                edge.from
              );
            } else {
              connEdgeLabel = edge.from.replace(/_from_\d+$/, '');
            }
            console.log(connEdgeLabel);
          });
          console.log(
            '비교해바바바바:::::::',
            response.data.mTypes[0],
            connEdgeLabel
          );
          if (response.data.mTypes[0] == connEdgeLabel) {
            console.log(
              '서로 같은 라벨 노드그룹 만들필요 없이 바로 하위 노드 연결 로직 필요'
            );
            const req = {
              type: response.data,
              id: params.id,
            };

            this.rawNodeExtendNotMultiGroup(req);
          } else if (response.data.mTypes[0] != connEdgeLabel) {
            console.log('서로 다른 라벨 노드그룹 만들필요 로직');
            const req = {
              type: response.data,
              id: params.id,
            };
            this.anotherLabelAddNodeGroup(req);
          }
        }
        // this.chart();
        // this.filtering(true);
      });
  }

  timeLineGraphVisibility: string = 'flex';
  timeGraphToggle() {
    if (this.timeLineGraphVisibility == 'flex') {
      this.timeLineGraphVisibility = 'none';
    } else if ((this.timeLineGraphVisibility = 'none')) {
      this.timeLineGraphVisibility = 'flex';
    }
  }

  groupNodeOpenImage(nodeId: any) {
    const node = this.viz.network.body.data.nodes.get(nodeId);
    const nodeImage = node.image;
    const updatedImage = nodeImage.replace(/(\d+)(\.png)$/, '2$2');
    console.log(updatedImage);
    const updatedNode = { ...node, image: updatedImage };
    this.viz.network.body.data.nodes.update(updatedNode);
  }

  //하위노드 확장 시 다중그룹이 아닌 api
  rawNodeExtendNotMultiGroup(params: any) {
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/rnenmg`,
        params
      )
      .subscribe((response: any) => {
        console.log(response);
        // 이미 추가되어있는지 확인하기
        response.forEach((element: any) => {
          const id = element.m.identity.low;
          const findNode = this.viz.network.body.data.nodes.get(id);
          if (findNode) {
            // 있을때
            // this.focusNode(id);
            // this.viz.network.body.data.edges.add({
            //   id: rawId,
            //   label: ,
            //   from: rawId,
            //   to: label + '_from_' + rawId,
            // });
            // 엣지가 추가되어있는지 확인 후 없으면 추가하기
            const parentId = params.id;
            const rawId = element.m.identity.low;
            const rawName = element.m.properties.name;
            const rawType = element.m.properties.type;
            const rawProperties = element.m.properties;
            const edgeLabel = params.type.rTypes[0];
            const findWord = id + '_from_' + parentId;
            const findEdge = this.viz.network.body.data.edges.get(findWord);
            if (!findEdge) {
              console.log('존재하지 않으니 엣지 추가하자');
              this.viz.network.body.data.edges.add({
                id: findWord,
                label: edgeLabel,
                from: parentId,
                to: id,
              });
            } else {
              console.log('존재함');
            }
          } else {
            // 없을때
            const parentId = params.id;
            const rawId = element.m.identity.low;
            const rawName = element.m.properties.name;
            const rawType = element.m.properties.type;
            const rawProperties = element.m.properties;
            const edgeLabel = params.type.rTypes[0];
            console.log('노드 추가 로직 구현중...', element, params);
            this.viz.network.body.data.nodes.add({
              id: rawId,
              label: this.labelReform(rawName),
              title: rawName,
              shape: 'image',
              group: rawType,
              image: `../assets/images/${rawType}/${rawType}_4.png`,
              raw: { properties: rawProperties },
              visConfig: {
                nodes: {
                  size: 55,
                  font: {
                    // background: 'black',
                    color: '#343434',
                    size: this.nodeFontSize, // px
                    face: 'pretendard',
                    strokeWidth: 2, // px
                    // strokeColor: "blue",
                  },
                },

                edges: {
                  arrows: {
                    to: { enabled: true },
                  },
                  font: {
                    // background: 'black',
                    color: '#343434',
                    size: this.edgeFontSize, // px
                    face: 'pretendard',
                    strokeWidth: 2, // px
                    // strokeColor: "blue",
                  },
                },
              },
            });
            //그룹노드와 원본노드 엣지 추가
            this.viz.network.body.data.edges.add({
              label: edgeLabel,
              id: rawId + '_from_' + parentId,
              from: parentId,
              to: rawId,
            });
            this.filtering(true);
          }
        });
      });
  }

  // selectedButtonType: string = ''; // 'and', 'or', 'not' 중 하나의 값을 가질 수 있습니다.
  // testObj: any;

  // filterObj = {
  //   nodeType: {
  //     file:{or:false,and:false,not:false}
  //   },
  //   fileType: {},
  //   on:"",
  // }

  filterObj: {
    nodeType: FilterNodeType;
    fileType: FilterFileType;
    on: string;
    fileOn: string;
  } = {
    nodeType: {},
    fileType: {},
    on: '',
    fileOn: '',
  };

  // initFilterObj() {
  //   // `filterType` 기반으로 `filterObj.nodeType` 초기화
  //   Object.keys(this.filterType).forEach((key: any) => {
  //     this.filterObj.nodeType[key] = { or: false, and: false, not: false };
  //   });
  // }

  onButtonFileClick(type: 'or' | 'and' | 'not', nodeKey: string) {
    // 해당 노드 키와 버튼 타입에 따라 상태를 토글
    this.filterObj.fileType[nodeKey][type] =
      !this.filterObj.fileType[nodeKey][type];

    // filterObj.fileType 전체를 검사하여 true인 타입이 있는지 확인
    let activeType: 'or' | 'and' | 'not' | '' = '';
    for (const key in this.filterObj.fileType) {
      for (const subType of ['or', 'and', 'not'] as const) {
        if (this.filterObj.fileType[key][subType]) {
          activeType = subType;
          break;
        }
      }
      if (activeType) break;
    }
    this.filterObj.fileOn = activeType;
    this.fileFilterViewUpdate();
  }

  onButtonClick(type: 'or' | 'and' | 'not', nodeKey: string) {
    // 해당 노드 키와 버튼 타입에 따라 상태를 토글
    this.filterObj.nodeType[nodeKey][type] =
      !this.filterObj.nodeType[nodeKey][type];

    // filterObj.nodeType 전체를 검사하여 true인 타입이 있는지 확인
    let activeType: 'or' | 'and' | 'not' | '' = '';
    for (const key in this.filterObj.nodeType) {
      for (const subType of ['or', 'and', 'not'] as const) {
        if (this.filterObj.nodeType[key][subType]) {
          activeType = subType;
          break;
        }
      }
      if (activeType) break;
    }
    this.filterObj.on = activeType;
    this.nodeFilterViewUpdate();
  }

  visibleNodeType = 'block';
  visibleFileType = 'flex';
  showNodeType() {
    this.visibleNodeType = 'block';
  }
  showFileType() {
    this.visibleFileType = 'flex';
  }
  hiddenNodeType() {
    this.visibleNodeType = 'none';
  }
  hiddenFileType() {
    this.visibleFileType = 'none';
  }

  nodeTypeReset() {
    // filterObj.nodeType의 모든 키에 대해 or, and, not 값을 false로 설정
    for (const key in this.filterObj.nodeType) {
      this.filterObj.nodeType[key].or = false;
      this.filterObj.nodeType[key].and = false;
      this.filterObj.nodeType[key].not = false;
    }

    // 필요한 경우, fileType과 on 값을 초기화
    // this.filterObj.fileType = {};
    this.filterObj.on = '';
    this.allNodesShow();
  }

  fileTypeReset() {
    // filterObj.nodeType의 모든 키에 대해 or, and, not 값을 false로 설정
    for (const key in this.filterObj.fileType) {
      this.filterObj.fileType[key].or = false;
      this.filterObj.fileType[key].and = false;
      this.filterObj.fileType[key].not = false;
    }

    // 필요한 경우, fileType과 on 값을 초기화
    // this.filterObj.fileType = {};
    this.filterObj.fileOn = '';
    this.nodeFilterViewUpdate(); // 기존과 다르게 Node Type에 따라감
  }

  fileFilterViewUpdate() {
    // filterObj.nodeType에서 on 값이 설정된 모든 키와 타입 가져오기
    const activeKeysAndTypes = Object.keys(this.filterObj.fileType)
      .filter(
        (key) =>
          this.filterObj.fileType[key][
            this.filterObj.fileOn as 'or' | 'and' | 'not'
          ]
      )
      .map((key) => {
        return {
          key: key,
          type: ['or', 'and', 'not'].find(
            (type) => this.filterObj.fileType[key][type as 'or' | 'and' | 'not']
          ),
        };
      });

    // 전체 활성화
    if (activeKeysAndTypes.length == 0) {
      this.nodeFilterViewUpdate();
      return;
    }

    // ... 함수의 나머지 부분

    console.log(activeKeysAndTypes);
    const orAndNotType = activeKeysAndTypes[0].type;

    if (orAndNotType == 'and') {
      this.fileTypeAnd(activeKeysAndTypes);
    } else if (orAndNotType == 'or') {
      this.fileTypeOr(activeKeysAndTypes);
    } else if (orAndNotType == 'not') {
      this.fileTypeNot(activeKeysAndTypes);
    }
  }

  nodeFilterViewUpdate() {
    // filterObj.nodeType에서 on 값이 설정된 모든 키와 타입 가져오기
    const activeKeysAndTypes = Object.keys(this.filterObj.nodeType)
      .filter(
        (key) =>
          this.filterObj.nodeType[key][
            this.filterObj.on as 'or' | 'and' | 'not'
          ]
      )
      .map((key) => {
        return {
          key: key,
          type: ['or', 'and', 'not'].find(
            (type) => this.filterObj.nodeType[key][type as 'or' | 'and' | 'not']
          ),
        };
      });

    // 전체 활성화
    if (activeKeysAndTypes.length == 0) {
      this.allNodesShow();
      return;
    }

    // ... 함수의 나머지 부분
    const orAndNotType = activeKeysAndTypes[0].type;

    if (orAndNotType == 'and') {
      this.nodeTypeAnd(activeKeysAndTypes);
    } else if (orAndNotType == 'or') {
      this.nodeTypeOr(activeKeysAndTypes);
    } else if (orAndNotType == 'not') {
      this.nodeTypeNot(activeKeysAndTypes);
    }
  }

  allNodesShow() {
    const updateTargetNodes = this.viz.network.body.data.nodes;
    const nodesToUpdate: any = [];
    updateTargetNodes.forEach((element: any) => {
      element.hidden = false;
      nodesToUpdate.push(element);
    });
    updateTargetNodes.update(nodesToUpdate);
  }

  // Node Type and
  // nodeTypeAnd(activeKeysAndTypes: any) {
  //   const updateTargetNodes = this.viz.network.body.data.nodes;
  //   // and 조건
  //   if (activeKeysAndTypes.length >= 2) {
  //     updateTargetNodes.forEach((element: any) => {
  //       element.hidden = true;
  //       updateTargetNodes.update(element);
  //     });
  //     return;
  //   } else if (activeKeysAndTypes.length == 1) {
  //     updateTargetNodes.forEach((element: any) => {
  //       const activeKeys = activeKeysAndTypes.map((item: any) => item.key);
  //       if (element.group == activeKeys) {
  //         element.hidden = false;
  //         updateTargetNodes.update(element);
  //       } else {
  //         element.hidden = true;
  //         updateTargetNodes.update(element);
  //       }
  //       console.log(activeKeys);
  //     });
  //   }
  // }
  nodeTypeAnd(activeKeysAndTypes: any) {
    const updateTargetNodes = this.viz.network.body.data.nodes;
    const nodesToUpdate: any = [];

    // and 조건
    if (activeKeysAndTypes.length >= 2) {
      updateTargetNodes.forEach((element: any) => {
        element.hidden = true;
        nodesToUpdate.push(element);
      });
    } else if (activeKeysAndTypes.length == 1) {
      const activeKeys = activeKeysAndTypes.map((item: any) => item.key);
      updateTargetNodes.forEach((element: any) => {
        if (element.group == activeKeys) {
          element.hidden = false;
        } else {
          element.hidden = true;
        }
        nodesToUpdate.push(element);
      });
    }

    // 한 번에 모든 변경사항을 적용
    updateTargetNodes.update(nodesToUpdate);
  }

  fileTypeAnd(activeKeysAndTypes: any) {
    const updateTargetNodes = this.viz.network.body.data.nodes;
    const nodesToUpdate: any = [];

    // and 조건
    if (activeKeysAndTypes.length >= 2) {
      updateTargetNodes.forEach((element: any) => {
        element.hidden = true;
        nodesToUpdate.push(element);
      });
    } else if (activeKeysAndTypes.length == 1) {
      const activeKeys = activeKeysAndTypes.map((item: any) => item.key);
      updateTargetNodes.forEach((element: any) => {
        if (
          element.raw &&
          element.raw.properties &&
          (element.raw.properties.file_type == activeKeys ||
            element.raw.properties.hash_type == activeKeys)
        ) {
          element.hidden = false;
        } else {
          element.hidden = true;
        }
        nodesToUpdate.push(element);
      });
    }

    // 한 번에 모든 변경사항을 적용
    updateTargetNodes.update(nodesToUpdate);
  }

  // Node Type or
  nodeTypeOr(activeKeysAndTypes: any) {
    const updateTargetNodes = this.viz.network.body.data.nodes;
    const nodesToUpdate: any = [];
    const activeKeys = activeKeysAndTypes.map((item: any) => item.key);
    console.log(activeKeys);
    updateTargetNodes.forEach((element: any) => {
      for (let nodeType of activeKeys) {
        if (element.group == nodeType) {
          element.hidden = false;
          // updateTargetNodes.update(element);
          nodesToUpdate.push(element);
          break;
        } else {
          element.hidden = true;
          // updateTargetNodes.update(element);
          nodesToUpdate.push(element);
        }
      }
    });
    updateTargetNodes.update(nodesToUpdate);
  }

  // File Type or
  fileTypeOr(activeKeysAndTypes: any) {
    const updateTargetNodes = this.viz.network.body.data.nodes;
    const nodesToUpdate: any = [];
    const activeKeys = activeKeysAndTypes.map((item: any) => item.key);
    console.log(activeKeys);
    updateTargetNodes.forEach((element: any) => {
      for (let nodeType of activeKeys) {
        if (
          element.raw &&
          element.raw.properties &&
          (element.raw.properties.file_type == nodeType ||
            element.raw.properties.hash_type == nodeType)
        ) {
          element.hidden = false;
          // updateTargetNodes.update(element);
          nodesToUpdate.push(element);
          break;
        } else if (element.group == 'file' && element.raw == undefined) {
          element.hidden = true;
          // updateTargetNodes.update(element);
          nodesToUpdate.push(element);
          break;
        } else if (
          element.group != 'file' ||
          element.raw.properties.file_type != nodeType ||
          element.raw.properties.hash_type != nodeType
        ) {
          element.hidden = true;
          nodesToUpdate.push(element);
        }
        // else {
        //   element.hidden = true;
        //   // updateTargetNodes.update(element);
        //   nodesToUpdate.push(element);
        // }
      }
    });
    updateTargetNodes.update(nodesToUpdate);
  }

  // Node Type not
  nodeTypeNot(activeKeysAndTypes: any) {
    const updateTargetNodes = this.viz.network.body.data.nodes;
    const nodesToUpdate: any = [];
    const activeKeys = activeKeysAndTypes.map((item: any) => item.key);
    console.log(activeKeys);
    updateTargetNodes.forEach((element: any) => {
      for (let nodeType of activeKeys) {
        if (element.group == nodeType) {
          element.hidden = true;
          nodesToUpdate.push(element);
          // updateTargetNodes.update(element);
          break;
        } else {
          element.hidden = false;
          nodesToUpdate.push(element);
          // updateTargetNodes.update(element);
        }
      }
    });
    updateTargetNodes.update(nodesToUpdate);
  }

  // file Type not
  fileTypeNot(activeKeysAndTypes: any) {
    const updateTargetNodes = this.viz.network.body.data.nodes;
    const nodesToUpdate: any = [];
    const activeKeys = activeKeysAndTypes.map((item: any) => item.key);
    console.log(activeKeys);
    updateTargetNodes.forEach((element: any) => {
      for (let nodeType of activeKeys) {
        if (
          element.raw &&
          element.raw.properties &&
          (element.raw.properties.file_type == nodeType ||
            element.raw.properties.hash_type == nodeType)
        ) {
          console.log('비교대상:', nodeType);
          console.log('파일타입 검색중', element);
          element.hidden = true;
          nodesToUpdate.push(element);
          // updateTargetNodes.update(element);
          break;
        } else if (element.group == 'file') {
          element.hidden = false;
          nodesToUpdate.push(element);
        }
        // else {
        //   element.hidden = false;
        //   nodesToUpdate.push(element);
        //   // updateTargetNodes.update(element);
        // }
      }
    });
    updateTargetNodes.update(nodesToUpdate);
  }

  triggerFileInputJson() {
    this.jsonSearchfileInput.nativeElement.click();
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  graphInitializing() {
    this.viz.network.setData({ nodes: [], edges: [] });
    this.chartInit();
    this.data = {};
    this.filterType = null;
    this.fileTypeCounts = null;
    this.filterObj = {
      nodeType: {},
      fileType: {},
      on: '',
      fileOn: '',
    };
    this.filtering(true);
    // this.chart();
  }

  chartInit() {
    this.chartOptions = undefined; // 차트옵션
    this.chartSeries = []; // 차트시리즈
    // this.timeLineGraphVisibility = 'none';
  }

  // 파일이 선택되면 호출되는 함수
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.searchLoadingOn();
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = reader.result as string;
        // 여기에서 파일 내용을 처리합니다. 예를 들어 JSON으로 파싱할 수 있습니다.
        try {
          const json = JSON.parse(content);

          const nodes = json.nodes;
          const edges = json.edges;

          const keys = Object.keys(json.target)[0];
          const keysValue = json.target[keys];
          if (keys == 'keyword') {
            this.targetWord = keysValue;
          } else if (keys == 'main_name') {
            this.targetWord = keysValue;
          }
          this.apiData = [];
          this.apiData.push({ key: keys, value: keysValue });
          this.viz.network.setData({ nodes: [], edges: [] });
          this.viz.network.setData({ nodes: nodes, edges: edges });
          this.chartInit();
          this.graphResult(this.apiData);
          this.filtering(true);
          this.chart();
          // setTimeout(() => {
          //   this.searchLoadingOff();
          // }, 3000);
        } catch (err) {
          this.searchLoadingOff();
          this.alarmOn('파일 형식과 내용을 확인하세요');
          console.error('파일을 읽는 도중 오류가 발생했습니다.', err);
        }
      };

      event.target.value = '';
      reader.readAsText(file);
    }
  }

  // 알림창 관련
  alarmText: string = '';
  alarmVisible: string = 'none';

  // 백그라운드
  backgroundVisible: string = 'none';

  // 모달창 관련
  modalTitle: string = '';
  modalVisible: string = 'none';
  modalGraphLoadList: [] = [];

  // 선택된 그래프 파일명을 저장하는 프로퍼티
  selectedGraphFile: string = '';

  // 저장데이터 요청 api
  graphLoad() {
    const params = {
      user: this.user,
      title: this.selectedGraphFile,
    };
    if (this.selectedGraphFile == '') {
      this.modalConfirm();
      this.alarmOn('파일을 선택 후 사용하세요');
      return;
    }
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/graph/load`,
        params
      )
      .subscribe((response: any) => {
        this.modalConfirm();
        console.log(response);
        // 그래프, 검색결과, 필터, 시계열 작업하기
        // this.chartInit();
        // this.graphInit();
        const nodes = response.data.nodes;
        const edges = response.data.edges;
        this.viz.network.setData({ nodes: nodes, edges: edges });
        const keys = Object.keys(response.key)[0];
        const keysValue = response.key[keys];
        if (keys == 'keyword') {
          this.targetWord = keysValue;
        } else if (keys == 'main_name') {
          this.targetWord = keysValue;
        }
        this.apiData = [];
        this.apiData.push({ key: keys, value: keysValue });
        this.graphResult(this.apiData);
        this.filtering(true);
        this.chartInit();
        this.chart();
      });
  }

  // 저장목록 요청 api
  graphListLoad() {
    const params = {
      user: this.user,
    };
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/graph/list/load`,
        params
      )
      .subscribe(
        (response: any) => {
          console.log(response);
          this.modalGraphLoadList = response;
          this.modalOn();
        },
        (error: any) => {
          // 에러가 발생했을 때의 처리를 여기에 추가할 수 있습니다.
          console.error('An error occurred:', error);
          this.alarmOn('저장 데이터가 없습니다');
        }
      );
  }

  graphSaveRenameDisplay: string = 'none';
  graphSaveRenameText: string = '';

  graphSaveRenameCancle() {
    this.graphSaveRenameDisplay = 'none';
    this.backgroundVisible = 'none';
  }

  // 다른이름으로 저장
  graphSaveRename() {
    this.backgroundVisible = 'block';
    this.graphSaveRenameDisplay = 'block';
  }

  graphSaveRenameAPI(param: string) {
    if (param == '') {
      this.graphSaveRenameCancle();
      this.alarmOn('파일명을 기입하세요');
      return;
    }
    console.log(param);
    const nodes = this.viz.network.body.data.nodes.get();
    const edges = this.viz.network.body.data.edges.get();
    const data = { nodes: nodes, edges: edges };
    const params = {
      user: this.user,
      key: { [this.compareQueryString]: this.targetWord },
      data: data,
      fileName: param,
    };
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/graph/save/rename`,
        { data: params },
        { responseType: 'text' }
      )
      .subscribe((response: any) => {
        if (response == 'Success') {
          this.graphSaveRenameCancle();
          this.alarmOn('그래프가 저장되었습니다');
        } else if (response == 'Failed') {
          this.graphSaveRenameCancle();
          this.alarmOn('그래프가 저장에 실패하였습니다');
        }
      });
  }

  // 그래프 저장
  graphSave() {
    const nodes = this.viz.network.body.data.nodes.get();
    const edges = this.viz.network.body.data.edges.get();
    const data = { nodes: nodes, edges: edges };
    const params = {
      user: this.user,
      key: { [this.compareQueryString]: this.targetWord },
      data: data,
    };
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/graph/save`,
        { data: params },
        { responseType: 'text' }
      )
      .subscribe((response: any) => {
        if (response == 'Success') {
          this.alarmOn('그래프가 저장되었습니다');
        } else if (response == 'Failed') {
          this.alarmOn('그래프가 저장에 실패하였습니다');
        }
      });
  }

  modalOn() {
    this.modalVisible = 'block';
    this.backgroundVisible = 'block';
  }

  modalConfirm() {
    this.modalVisible = 'none';
    this.backgroundVisible = 'none';
  }

  alarmOn(param: string) {
    this.alarmText = param;
    this.alarmVisible = 'block';
    this.backgroundVisible = 'block';
  }

  alarmConfirm() {
    this.alarmVisible = 'none';
    this.backgroundVisible = 'none';
  }

  // 파일 다운
  fileDown(file: boolean, doc: boolean) {
    if (this.contextMenuVisible) {
      this.contextMenuVisible = !this.contextMenuVisible;
    }
    if (file && doc) {
      // Neovis.js 인스턴스에서 데이터 추출 (가정)
      const nodes = this.viz.network.body.data.nodes.get();
      const edges = this.viz.network.body.data.edges.get();
      const keyobj = this.compareQueryString;
      const value = this.targetWord;
      const graphData = {
        nodes: nodes,
        edges: edges,
        target: { [keyobj]: value },
      };

      // JSON 포맷으로 변환
      var jsonStr = JSON.stringify(graphData, null, 2);

      // 파일 생성 및 다운로드
      var blob = new Blob([jsonStr], { type: 'application/json' });
      var url = URL.createObjectURL(blob);

      // a 태그를 만들어 파일 다운로드 링크 생성
      var a = document.createElement('a');
      a.download = 'graph-data.json';
      a.href = url;
      a.textContent = 'Download graph-data.json';

      // a 태그를 클릭하여 다운로드 실행
      a.click();

      // 생성된 URL 객체 해제
      URL.revokeObjectURL(url);
      this.documentFileDown(graphData);
    } else if (file) {
      // Neovis.js 인스턴스에서 데이터 추출 (가정)
      const nodes = this.viz.network.body.data.nodes.get();
      const edges = this.viz.network.body.data.edges.get();
      const keyobj = this.compareQueryString;
      const value = this.targetWord;
      const graphData = {
        nodes: nodes,
        edges: edges,
        target: { [keyobj]: value },
      };

      // JSON 포맷으로 변환
      var jsonStr = JSON.stringify(graphData, null, 2);

      // 파일 생성 및 다운로드
      var blob = new Blob([jsonStr], { type: 'application/json' });
      var url = URL.createObjectURL(blob);

      // a 태그를 만들어 파일 다운로드 링크 생성
      var a = document.createElement('a');
      a.download = 'graph-data.json';
      a.href = url;
      a.textContent = 'Download graph-data.json';

      // a 태그를 클릭하여 다운로드 실행
      a.click();

      // 생성된 URL 객체 해제
      URL.revokeObjectURL(url);
    } else if (doc) {
      const nodes = this.viz.network.body.data.nodes.get();
      const edges = this.viz.network.body.data.edges.get();
      const keyobj = this.compareQueryString;
      const value = this.targetWord;
      const graphData = {
        nodes: nodes,
        edges: edges,
        target: { [keyobj]: value },
      };
      this.documentFileDown(graphData);
    }
  }

  documentFileDown(graphData: any) {
    const canvasElement = document.querySelector('canvas');
    if (canvasElement) {
      html2canvas(canvasElement as HTMLElement).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // 제목을 추가합니다.
        const title = 'Node Info';
        const titleFontSize = 20;
        const titleX = 10; // 페이지 왼쪽 여백에서부터의 x 좌표
        const titleY = 30; // 페이지 상단에서부터의 y 좌표 + 여백

        pdf.setFontSize(titleFontSize);
        pdf.setTextColor(20, 60, 127); // 글자색을 흰색으로 설정
        // pdf.setFillColor(0, 0, 255); // 배경색을 파란색으로 설정
        const titleWidth =
          (pdf.getStringUnitWidth(title) * titleFontSize) /
          pdf.internal.scaleFactor;

        pdf.text(title, titleX + 3, titleY); // 제목 텍스트를 배경 사각형 위에 추가

        // 캔버스 이미지를 페이지에 추가합니다.
        const imgProps = pdf.getImageProperties(imgData);
        const canvasWidth = pdfWidth;
        const canvasHeight = (imgProps.height * canvasWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, titleY + 10, canvasWidth, canvasHeight);
        // 본문에 대한 글자색을 검은색으로 설정합니다.
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);

        // 텍스트를 추가하기 시작할 y 위치를 설정합니다.
        let yPosition = titleY + canvasHeight + 20; // 이미지와 제목 아래에 여백을 추가합니다.

        const lines = pdf.splitTextToSize(
          JSON.stringify(graphData, null, 2),
          pdfWidth - 20
        );

        lines.forEach((line: any) => {
          if (yPosition >= pdfHeight - 10) {
            // 페이지의 바닥까지 남은 여백을 고려합니다.
            pdf.addPage();
            yPosition = 20; // 새 페이지 상단의 여백 설정
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(12);
          }
          pdf.text(line, 10, yPosition);
          yPosition += 7; // 줄 간격 설정
        });

        pdf.save('graph-report.pdf');
      });
    } else {
      console.error('Canvas element not found');
    }
  }

  // string 타입으로 변환
  getStringKey(key: unknown): string {
    return String(key);
  }

  //거쳐갈 필터 객체
  filterType: any;
  fileTypeCounts: any;

  //필터
  filtering(param: boolean) {
    console.log('필터링 시행됨!!!!!!!!!!!!!!!!!!!!!!!!!');
    // 모든 노드를 가져옵니다.
    const nodes = this.viz.network.body.data.nodes.get();

    // 그룹 속성을 기준으로 노드를 그룹화하고 각 그룹의 개수를 카운트합니다.
    const groupCounts = nodes.reduce((acc: any, node: any) => {
      // console.log('acc:?', acc);
      const group = node.group; // 노드의 그룹 속성
      acc[group] = (acc[group] || 0) + 1; // 그룹의 개수를 카운트
      return acc;
    }, {});
    this.filterType = groupCounts;
    console.log(this.filterType); // 각 그룹의 개수를 출력

    // filterType의 각 키에 대해 filterObj.nodeType를 업데이트합니다.
    for (const key of Object.keys(this.filterType)) {
      this.filterObj.nodeType[key] = { or: false, and: false, not: false };
    }

    // 만약 filterObj.nodeType의 key값이 file이 존재한다면...
    if (this.filterObj.nodeType['file']) {
      const fileNodes = nodes.filter(
        (node: any) =>
          node.group === 'file' &&
          node.raw &&
          node.raw.properties &&
          (node.raw.properties.file_type !== undefined ||
            node.raw.properties.hash_type !== undefined)
      );

      // fileNodes의 file_type 속성을 기준으로 카운트를 집계합니다.
      const fileTypeCounts = fileNodes.reduce((acc: any, node: any) => {
        if (node.raw && node.raw.properties) {
          const fileType =
            node.raw.properties.file_type || node.raw.properties.hash_type;
          acc[fileType] = (acc[fileType] || 0) + 1;
        }

        return acc;
      }, {});
      this.fileTypeCounts = fileTypeCounts;
      console.log(this.fileTypeCounts);

      // fileTypeCounts의 각 키에 대해 filterObj.fileType를 업데이트합니다.
      for (const key of Object.keys(fileTypeCounts)) {
        this.filterObj.fileType[key] = { or: false, and: false, not: false };
      }
      console.log('파일타입 결과물:', this.filterObj);
    }

    if (param) {
      this.localStorageTest();
    }
  }

  labelReform(label: string) {
    if (label && label.length > 15) {
      return label.substring(0, 15) + '...';
    }
    return label;
  }

  //서로 다른 라벨 노드그룹 만들기
  anotherLabelAddNodeGroup(req: any) {
    const rawId = req.id;
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/other/ng`,
        req
      )
      .subscribe((response: any) => {
        console.log(response);
        const label = this.typeConfirm(response.groupLabel);
        const relationLabel = response.relationLabel;
        // 이미 있는 그룹노드인지 확인
        const findGroupNodeId = label + '_from_' + rawId;
        if (this.viz.network.body.data.nodes.get(findGroupNodeId)) {
          console.log('해당 노드는 이미 존재하니 건너뜀');
        } else {
          this.viz.network.body.data.nodes.add({
            id: label + '_from_' + rawId,
            label: this.labelReform(label),
            title: label,
            shape: 'image',
            group: label,
            image: `../assets/images/${label}/${label}_1.png`,
            // raw: { properties: rawProperties },
            visConfig: {
              nodes: {
                size: 55,
                font: {
                  // background: 'black',
                  color: '#343434',
                  size: this.nodeFontSize, // px
                  face: 'pretendard',
                  strokeWidth: 2, // px
                  // strokeColor: "blue",
                },
              },
              edges: {
                arrows: {
                  to: { enabled: true },
                },
                font: {
                  // background: 'black',
                  color: '#343434',
                  size: this.edgeFontSize, // px
                  face: 'pretendard',
                  strokeWidth: 2, // px
                  // strokeColor: "blue",
                },
              },
            },
          });
          //그룹노드와 원본노드 엣지 추가
          this.viz.network.body.data.edges.add({
            // id: label + '_from_' + rawId,
            label: relationLabel,
            from: rawId,
            to: label + '_from_' + rawId,
          });
        }
        this.chart();
        this.filtering(true);
      });
  }

  // 부모 노드를 재귀적으로 탐색하는 함수
  findParentNodes(nodeId: any, allParents: any = []) {
    const connectedEdges = this.viz.network.getConnectedEdges(nodeId);
    let parentNodes: any = [];

    connectedEdges.forEach((edgeId: any) => {
      const edge = this.viz.network.body.data.edges.get(edgeId);

      if (edge.to === nodeId) {
        parentNodes.push(edge.from);
      }
    });

    allParents.push(...parentNodes);

    parentNodes.forEach((parentId: any) => {
      this.findParentNodes(parentId, allParents);
    });

    return allParents;
  }

  // 상위 그룹노드가 있는 원본노드 더블클릭 시 하위 노드 만들기
  apiLowGroupNodeAddFromLowNode(params: any, nodeId: any) {
    const rawId = params.id;
    console.log(params);
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/lgnafln`,
        params
      )
      .subscribe((response: any) => {
        console.log(response);
        if (response.multi) {
          console.log('다중 그룹 생성');
          response.data.forEach((element: any) => {
            console.log(element);
            let groupLabel = this.typeConfirm(element['m.type']);
            // if (groupLabel == 'domain-name') {
            //   groupLabel = 'domain_name';
            // }
            this.viz.network.body.data.nodes.add({
              id: groupLabel + '_from_' + rawId,
              label: this.labelReform(groupLabel),
              title: groupLabel,
              shape: 'image',
              group: groupLabel,
              image: `../assets/images/${groupLabel}/${groupLabel}_1.png`,
              // raw: { properties: rawProperties },
              visConfig: {
                nodes: {
                  size: 55,
                  font: {
                    // background: 'black',
                    color: '#343434',
                    size: this.nodeFontSize, // px
                    face: 'pretendard',
                    strokeWidth: 2, // px
                    // strokeColor: "blue",
                  },
                },
                edges: {
                  arrows: {
                    to: { enabled: true },
                  },
                  font: {
                    // background: 'black',
                    color: '#343434',
                    size: this.edgeFontSize, // px
                    face: 'pretendard',
                    strokeWidth: 2, // px
                    // strokeColor: "blue",
                  },
                },
              },
            });
            //그룹노드와 원본노드 엣지 추가
            this.viz.network.body.data.edges.add({
              // id: rawId,
              from: nodeId,
              to: groupLabel + '_from_' + rawId,
            });
          });
        } else if (!response.multi) {
          console.log('다중 그룹이 아니지만 상위 노드와 같은지 확인해야함');
          console.log(response);
          const lowType = this.typeConfirm(response.data[0]['m.type']);
          const highGroupNode =
            this.viz.network.body.data.edges.get(nodeId).from;
          if (lowType != highGroupNode) {
            //서로 다른 노드일때 그룹노드 생성
            this.viz.network.body.data.nodes.add({
              id: lowType + '_from_' + rawId,
              label: this.labelReform(lowType),
              title: lowType,
              shape: 'image',
              group: lowType,
              image: `../assets/images/${lowType}/${lowType}_1.png`,
              // raw: { properties: rawProperties },
              visConfig: {
                nodes: {
                  size: 55,
                  font: {
                    // background: 'black',
                    color: '#343434',
                    size: this.nodeFontSize, // px
                    face: 'pretendard',
                    strokeWidth: 2, // px
                    // strokeColor: "blue",
                  },
                },
                edges: {
                  arrows: {
                    to: { enabled: true },
                  },
                  font: {
                    // background: 'black',
                    color: '#343434',
                    size: this.edgeFontSize, // px
                    face: 'pretendard',
                    strokeWidth: 2, // px
                    // strokeColor: "blue",
                  },
                },
              },
            });
            //그룹노드와 원본노드 엣지 추가
            this.viz.network.body.data.edges.add({
              // id: rawId,
              from: rawId,
              to: lowType + '_from_' + rawId,
            });
          }
        }
      });
    this.chart();
    this.filtering(true);
  }

  // 상위 그룹노드가 있는 그룹노드 더블클릭 시 하위 노드 만들기
  apiLowGroupNodeAddFromGroupNode(params: any, nodeId: any) {
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/lgnafgn`,
        params
      )
      .subscribe((response: any) => {
        console.log(response);
        if (response.data) {
          // response 객체 내에 data 프로퍼티가 있는 경우
          response.data.forEach((element: any) => {
            console.log('1068 찾아보자', element);
            const rawId = element.n.identity.low;
            const rawName = element.n.properties.name;
            const rawType = this.typeConfirm(element.n.properties.type);
            const rawProperties = element.n.properties;
            const edgeLabel = element.rels[0].type;

            // ID가 이미 존재하는지 확인
            if (!this.viz.network.body.data.nodes.get(rawId)) {
              this.viz.network.body.data.nodes.add({
                id: rawId,
                label: this.labelReform(rawName),
                title: rawName,
                shape: 'image',
                group: rawType,
                image: `../assets/images/${rawType}/${rawType}_4.png`,
                raw: { properties: rawProperties },
                visConfig: {
                  nodes: {
                    size: 55,
                    font: {
                      // background: 'black',
                      color: '#343434',
                      size: this.nodeFontSize, // px
                      face: 'pretendard',
                      strokeWidth: 2, // px
                      // strokeColor: "blue",
                    },
                  },

                  edges: {
                    arrows: {
                      to: { enabled: true },
                    },
                    font: {
                      // background: 'black',
                      color: '#343434',
                      size: this.edgeFontSize, // px
                      face: 'pretendard',
                      strokeWidth: 2, // px
                      // strokeColor: "blue",
                    },
                  },
                },
              });
              //그룹노드와 원본노드 엣지 추가
              this.viz.network.body.data.edges.add({
                label: edgeLabel,
                id: rawId + '_from_' + nodeId,
                from: nodeId,
                to: rawId,
              });
            } else {
              console.log(`Node with ID ${rawId} already exists!`);

              //만약 이미 추가된 엣지인지 확인
              const targetEdges = this.viz.network.body.data.edges.get({
                filter: function (edge: any) {
                  return edge.to === rawId && edge.from === nodeId;
                },
              });
              if (targetEdges.length >= 1) {
                console.log('이미 추가된 edge 생략', targetEdges); // 일치하는 엣지들의 배열을 출력
              } else {
                //그룹노드와 원본노드 엣지 추가
                this.viz.network.body.data.edges.add({
                  label: edgeLabel,
                  id: rawId + 'from' + nodeId,
                  from: nodeId,
                  to: rawId,
                  // from: rawId,
                  // to: nodeId,
                });
              }
            }
          });
        } else {
          // response 객체 내에 data 프로퍼티가 없는 경우
          response.forEach((element: any) => {
            console.log('1068 찾아보자', element);
            const rawId = element.m.identity.low;
            const rawName = element.m.properties.name;
            const rawType = this.typeConfirm(element.m.properties.type);
            const rawProperties = element.m.properties;
            const edgeLabel = element.rels[0].type;

            // ID가 이미 존재하는지 확인
            if (!this.viz.network.body.data.nodes.get(rawId)) {
              this.viz.network.body.data.nodes.add({
                id: rawId,
                label: this.labelReform(rawName),
                title: rawName,
                shape: 'image',
                group: rawType,
                image: `../assets/images/${rawType}/${rawType}_4.png`,
                raw: { properties: rawProperties },
                visConfig: {
                  nodes: {
                    size: 55,
                    font: {
                      // background: 'black',
                      color: '#343434',
                      size: this.nodeFontSize, // px
                      face: 'pretendard',
                      strokeWidth: 2, // px
                      // strokeColor: "blue",
                    },
                  },

                  edges: {
                    arrows: {
                      to: { enabled: true },
                    },
                    font: {
                      // background: 'black',
                      color: '#343434',
                      size: this.edgeFontSize, // px
                      face: 'pretendard',
                      strokeWidth: 2, // px
                      // strokeColor: "blue",
                    },
                  },
                },
              });
              //그룹노드와 원본노드 엣지 추가
              this.viz.network.body.data.edges.add({
                label: edgeLabel,
                id: rawId + '_from_' + nodeId,
                from: nodeId,
                to: rawId,
              });
            } else {
              console.log(`Node with ID ${rawId} already exists!`);

              //만약 이미 추가된 엣지인지 확인
              const targetEdges = this.viz.network.body.data.edges.get({
                filter: function (edge: any) {
                  return edge.to === rawId && edge.from === nodeId;
                },
              });
              if (targetEdges.length >= 1) {
                console.log('이미 추가된 edge 생략', targetEdges); // 일치하는 엣지들의 배열을 출력
              } else {
                //그룹노드와 원본노드 엣지 추가
                this.viz.network.body.data.edges.add({
                  label: edgeLabel,
                  id: rawId + 'from' + nodeId,
                  from: nodeId,
                  to: rawId,
                  // from: rawId,
                  // to: nodeId,
                });
              }
            }
          });
        }
        this.chart();
        this.filtering(true);
      });
  }

  onNodeClick(nodeData: any) {
    console.log('Selected node :', nodeData);
    console.log('Selected node label:', nodeData.label);
    // 선택된 노드의 데이터를 컴포넌트의 상태로 설정합니다.
    this.selectedNodeData = nodeData;
  }

  get nodeDataArray() {
    // selectedNodeData가 변경된 경우에만 계산
    if (this._selectedNodeData !== this.selectedNodeData) {
      this._selectedNodeData = this.selectedNodeData;
      this._cachedNodeDataArray = this.selectedNodeData
        ? Object.keys(this.selectedNodeData.raw.properties).map((key) => ({
            key,
            value: this.selectedNodeData.raw.properties[key],
          }))
        : [];
    }

    return this._cachedNodeDataArray;
  }

  /**
   *
   * 첫 진입시 그래프 생성 api
   */
  apiRequest(params: any, graphSearch: boolean, type: string) {
    this.searchLoadingOn();
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/data`,
        params
      )
      .subscribe(
        (response: any) => {
          if (response.data.length == 0) {
            this.searchLoadingOff();
            this.alarmOn('데이터가 없습니다');
            return;
          }
          // console.log(response);
          if (response.label == 'keyword') {
            this.firstGraphKeyword(response, graphSearch, type);
          } else if (response.label == 'name') {
            this.firstGraphName(response);
          }
          this.loadingVisibility = 'hidden';
          this.visibility = 'visible';
          // 우측 그래프 검색결과 추가
          this.graphResult(params);
          // this.filtering(true);
          // this.localStorageTest();
        },
        (error: any) => {
          this.searchLoadingOff();
          this.alarmOn('서버로 요청이 실패했습니다.');
        }
      );
  }

  data: { [key: string]: any[] } = {
    // ... 주어진 데이터
  };
  Object = Object;
  selectedKey: string | null = null;

  selectedData: any[] = []; // 선택된 키의 데이터를 저장할 변수
  selectedKeys: string[] = [];
  toggleKeyContent(key: string) {
    const index = this.selectedKeys.indexOf(key);
    if (index > -1) {
      this.selectedKeys.splice(index, 1); // 이미 선택된 키를 배열에서 제거
    } else {
      this.selectedKeys.push(key); // 선택되지 않은 키를 배열에 추가
      if (!this.displayedCounts[key]) {
        // 해당 키에 대한 displayedCounts 값이 없는 경우만 10으로 초기화
        this.displayedCounts[key] = 10;
      }
    }
    // for (const key of Object.keys(this.data)) {
    //   this.displayedCounts[key] = 10;
    // }
  }

  searchQueries: { [key: string]: string } = {};

  getFilteredData(key: string): any[] {
    const query = this.searchQueries[key];
    if (!query) {
      return this.data[key];
    }
    return this.data[key].filter((item) => item.name.includes(query));
  }

  displayedCounts: { [key: string]: number } = {};

  loadMore(key: string, event: MouseEvent) {
    event.stopPropagation(); // 이벤트 버블링 중단
    this.displayedCounts[key] += 10;
  }

  test(key: string, id: any, name: string) {
    console.log(key, id, name);
    const target = this.viz.network.body.data.nodes.get(id);
    console.log(target);
    if (target) {
      this.focusNode(id);
    } else {
      console.log('없음');
      // 우측 검색결과 클릭 api
      const reqContents = {
        id: id,
        name: name,
      };
      this.graphResultNodeAdd(reqContents);
    }
  }

  graphResultNodeAdd(params: any) {
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/graphResultNodeAdd`,
        params
      )
      .subscribe((response: any) => {
        console.log('노드 추가 결과:::', response);
        const id = params.id;
        const name = params.name;
        const properties = response[0].n.properties;
        const type = this.typeConfirm(response[0].n.properties.type);
        this.viz.network.body.data.nodes.add({
          id: id,
          label: this.labelReform(name),
          title: name,
          shape: 'image',
          group: type,
          image: `../assets/images/${type}/${type}_4.png`,
          raw: { properties: properties },
          visConfig: {
            nodes: {
              size: 55,
              font: {
                // background: 'black',
                color: '#343434',
                size: this.nodeFontSize, // px
                face: 'pretendard',
                strokeWidth: 2, // px
                // strokeColor: "blue",
              },
            },

            edges: {
              arrows: {
                to: { enabled: true },
              },
              font: {
                // background: 'black',
                color: '#343434',
                size: this.edgeFontSize, // px
                face: 'pretendard',
                strokeWidth: 2, // px
                // strokeColor: "blue",
              },
            },
          },
        });

        // rawType + '_from_' + targetHighNodeId
        //그룹노드와 원본노드 엣지 추가
        this.viz.network.body.data.edges.add({
          // id: name + '_Group',
          id: id + '_from_' + name,
          from: type,
          to: id,
        });
      });
    this.chart();
    this.filtering(true);
  }

  graphResult(params: any) {
    this.searchLoadingOn();
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/graphResult`,
        params
      )
      .subscribe((response: any) => {
        console.log('그래프 검색결과', response);
        if (response['windows-registry-key']) {
          response['registry'] = response['windows-registry-key'];
          delete response['windows-registry-key'];
        }
        if (Object.keys(this.data).length == 0) {
          this.data = response;
        } else if (Object.keys(this.data).length != 0) {
          // test
          let key = Object.keys(response);
          for (let item of key) {
            if (this.data[item] == undefined) {
              this.data[item] = response[item];
            } else if (this.data[item] != undefined) {
              response[item].forEach((element: any) => {
                this.data[item].push(element);
              });
            }
          }
        }

        console.log('data:::', this.data);
        this.searchLoadingOff();
      });
  }

  firstGraphName(response: any) {
    this.viz.network.setData({ nodes: [], edges: [] });
    console.log('네임 노드 상위그룹노드 생성', response);
    let name = this.typeConfirm(response.data[0].n.labels[0]);
    this.viz.network.body.data.nodes.add({
      id: name,
      label: this.labelReform(name),
      title: name,
      shape: 'image',
      group: name,
      image: `../assets/images/${name}/${name}_2.png`,
      visConfig: {
        nodes: {
          size: 55,
          font: {
            // background: 'black',
            color: '#343434',
            size: this.nodeFontSize, // px
            face: 'pretendard',
            strokeWidth: 2, // px
            // strokeColor: "blue",
          },
        },

        edges: {
          arrows: {
            to: { enabled: true },
          },
          font: {
            // background: 'black',
            color: '#343434',
            size: this.edgeFontSize, // px
            face: 'pretendard',
            strokeWidth: 2, // px
            // strokeColor: "blue",
          },
        },
      },
    });
    // 그룹노드 하위 원본 데이터 작성
    console.log('하위노드 수정중...', response.data);
    response.data.forEach((element: any) => {
      let rawId = parseInt(element.n.elementId);
      let rawLabel = this.typeConfirm(element.n.labels[0]);
      let rawProperties = element.n.properties;
      // console.log(this.viz.network.body.data.nodes);
      // console.log('결과물:::', rawId, rawLabel);
      // console.log('rawProperties:', rawProperties);
      this.viz.network.body.data.nodes.add({
        id: rawId,
        label: this.labelReform(rawProperties.name),
        title: rawProperties.name,
        shape: 'image',
        group: name,
        image: `../assets/images/${rawLabel}/${rawLabel}_4.png`,
        raw: { properties: rawProperties },
        visConfig: {
          nodes: {
            size: 55,
            font: {
              // background: 'black',
              color: '#343434',
              size: this.nodeFontSize, // px
              face: 'pretendard',
              strokeWidth: 2, // px
              // strokeColor: "blue",
            },
          },

          edges: {
            arrows: {
              to: { enabled: true },
            },
            font: {
              // background: 'black',
              color: '#343434',
              size: this.edgeFontSize, // px
              face: 'pretendard',
              strokeWidth: 2, // px
              // strokeColor: "blue",
            },
          },
        },
      });

      // rawType + '_from_' + targetHighNodeId
      //그룹노드와 원본노드 엣지 추가
      this.viz.network.body.data.edges.add({
        // id: name + '_Group',
        id: rawId + '_from_' + name,
        from: name,
        to: rawId,
      });
    });

    this.chart();

    this.filtering(true);
    this.searchLoadingOff();
  }

  firstGraphKeyword(response: any, graphSearch: boolean, type: string) {
    if (graphSearch && type == 'web') {
      // 웹 기반 검색 임시 추가
      // 키워드 노드
      if (
        this.viz.network.body.data.nodes.get(
          'searchKeyword_' + this.webSearchText
        )
      ) {
        this.alarmOn('웹기반 검색 키워드가 존재합니다');
        return;
      }
      this.viz.network.body.data.nodes.add({
        id: 'searchKeyword_' + this.webSearchText,
        label: `keyword\n${this.labelReform(this.targetWord)}`,
        word: this.targetWord,
        shape: 'image',
        title: 'keyword',
        group: 'keyword',
        image: `../assets/images/keyword/keyword_1.png`,
        visConfig: {
          nodes: {
            size: 55,
            font: {
              // background: 'black',
              color: '#343434',
              size: this.nodeFontSize, // px
              face: 'pretendard',
              strokeWidth: 2, // px
              // strokeColor: "blue",
            },
          },

          edges: {
            arrows: {
              to: { enabled: true },
            },
            font: {
              // background: 'black',
              color: '#343434',
              size: this.edgeFontSize, // px
              face: 'pretendard',
              strokeWidth: 2, // px
              // strokeColor: "blue",
            },
          },
        },
      });

      // 키워드노드 하위 그룹노드
      response.data.forEach((element: any) => {
        console.log(element['n.type'] || element['m.type']);
        // let type = element['n.type'];
        let type =
          this.typeConfirm(element['n.type']) ||
          this.typeConfirm(element['m.type']);
        type = this.typeConfirm(type);
        if (this.viz.network.body.data.nodes.get(type)) {
        } else if (!this.viz.network.body.data.nodes.get(type)) {
          this.viz.network.body.data.nodes.add({
            id: type,
            label: this.labelReform(type),
            shape: 'image',
            group: type,
            image: `../assets/images/${type}/${type}_1.png`,
            title: type,
            visConfig: {
              nodes: {
                size: 55,
                font: {
                  // background: 'black',
                  color: '#343434',
                  size: this.nodeFontSize, // px
                  face: 'pretendard',
                  strokeWidth: 2, // px
                  // strokeColor: "blue",
                },
                // title: type,
              },

              edges: {
                arrows: {
                  to: { enabled: true },
                },
                font: {
                  // background: 'black',
                  color: '#343434',
                  size: this.edgeFontSize, // px
                  face: 'pretendard',
                  strokeWidth: 2, // px
                  // strokeColor: "blue",
                },
              },
            },
          });
          //엣지 추가
          this.viz.network.body.data.edges.add({
            id: type + '_Group',
            from: 'searchKeyword_' + this.webSearchText,
            to: type,
          });
        }
      });
      this.chart();
      this.filtering(true);
      this.searchLoadingOff();
    } else if (!graphSearch) {
      this.viz.network.setData({ nodes: [], edges: [] });
      console.log('키워드 노드 생성 및 하위 그룹노드 생성', response);
      // 키워드 노드
      this.viz.network.body.data.nodes.add({
        id: 'keyword',
        label: `keyword\n${this.labelReform(this.targetWord)}`,
        word: this.targetWord,
        shape: 'image',
        title: 'keyword',
        group: 'keyword',
        image: `../assets/images/keyword/keyword_1.png`,
        visConfig: {
          nodes: {
            size: 55,
            font: {
              // background: 'black',
              color: '#343434',
              size: this.nodeFontSize, // px
              face: 'pretendard',
              strokeWidth: 2, // px
              // strokeColor: "blue",
            },
          },

          edges: {
            arrows: {
              to: { enabled: true },
            },
            font: {
              // background: 'black',
              color: '#343434',
              size: this.edgeFontSize, // px
              face: 'pretendard',
              strokeWidth: 2, // px
              // strokeColor: "blue",
            },
          },
        },
      });

      // 키워드노드 하위 그룹노드
      response.data.forEach((element: any) => {
        console.log(element['n.type'] || element['m.type']);
        // let type = element['n.type'];
        let type =
          this.typeConfirm(element['n.type']) ||
          this.typeConfirm(element['m.type']);
        if (this.viz.network.body.data.nodes.get(type)) {
        } else if (!this.viz.network.body.data.nodes.get(type)) {
          this.viz.network.body.data.nodes.add({
            id: type,
            label: this.labelReform(type),
            shape: 'image',
            group: type,
            image: `../assets/images/${type}/${type}_1.png`,
            title: type,
            visConfig: {
              nodes: {
                size: 55,
                font: {
                  // background: 'black',
                  color: '#343434',
                  size: this.nodeFontSize, // px
                  face: 'pretendard',
                  strokeWidth: 2, // px
                  // strokeColor: "blue",
                },
                // title: type,
              },

              edges: {
                arrows: {
                  to: { enabled: true },
                },
                font: {
                  // background: 'black',
                  color: '#343434',
                  size: this.edgeFontSize, // px
                  face: 'pretendard',
                  strokeWidth: 2, // px
                  // strokeColor: "blue",
                },
              },
            },
          });
          //엣지 추가
          this.viz.network.body.data.edges.add({
            id: type + '_Group',
            from: 'keyword',
            to: type,
          });
        }
      });
    }
    this.chart();
    this.filtering(true);
    this.searchLoadingOff();
  }

  // 좌측 탭 클릭 노드 추가
  clickNodeAdd(id: string, highNodeId: string, rType: string) {
    console.log(rType, '새로 받아봄');
    const req = {
      id: id,
    };
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/lsna`,
        req
      )
      .subscribe((response: any) => {
        console.log(response);
        const rawId = response[0].n.identity.low;
        const rawType = this.typeConfirm(response[0].n.properties.type);
        const rawName = response[0].n.properties.name;
        const rawProperties = response[0].n.properties;
        const edgeLabel = response[0].r.type;
        const nodeId = id;
        if (!this.viz.network.body.data.nodes.get(rawId)) {
          //그룹 노드 있는지 확인하기
          let targetHighNodeId = highNodeId;
          let word = rawType + '_from_' + targetHighNodeId;
          console.log('이러한 상위노드가 있나?', word);
          console.log('상위 노드 id', highNodeId);
          const groupLabel = this.typeConfirm(rawType);
          if (!this.viz.network.body.data.nodes.get(word)) {
            // 그룹노드 없는데 만약 그 그룹노드와 상위 그룹노드가 같을경우 조건
            const connNode =
              this.viz.network.getConnectedNodes(targetHighNodeId);
            const parts = word.split('_from_');
            const beforeFrom = parts[0];
            for (const element of connNode) {
              console.log(element);
              if (element == beforeFrom) {
                //상위 그룹노드와 하위 그룹노드가 같을때
                this.viz.network.body.data.nodes.add({
                  id: rawId,
                  label: this.labelReform(rawName),
                  title: rawName,
                  group: rawType,
                  shape: 'image',
                  image: `../assets/images/${rawType}/${rawType}_4.png`,
                  raw: { properties: rawProperties },
                  visConfig: {
                    nodes: {
                      size: 55,
                      font: {
                        // background: 'black',
                        color: '#343434',
                        size: this.nodeFontSize, // px
                        face: 'pretendard',
                        strokeWidth: 2, // px
                        // strokeColor: "blue",
                      },
                    },

                    edges: {
                      arrows: {
                        to: { enabled: true },
                      },
                      font: {
                        // background: 'black',
                        color: '#343434',
                        size: this.edgeFontSize, // px
                        face: 'pretendard',
                        strokeWidth: 2, // px
                        // strokeColor: "blue",
                      },
                    },
                  },
                });
                this.viz.network.body.data.edges.add({
                  id: rawId + '_from_' + highNodeId,
                  label: rType,
                  from: highNodeId,
                  to: rawId,
                });
                this.chart();
                this.filtering(true);
                return;
              }
            }

            console.log(this.viz.network.body.data.nodes.get(word));
            console.log('그룹노드 없음');
            this.viz.network.body.data.nodes.add({
              // id: groupLabel + '_from_' + rawId,
              id: word,
              label: this.labelReform(groupLabel),
              shape: 'image',
              title: groupLabel,
              group: groupLabel,
              image: `../assets/images/${groupLabel}/${groupLabel}_2.png`,
              // raw: { properties: rawProperties },
              visConfig: {
                nodes: {
                  size: 55,
                  font: {
                    // background: 'black',
                    color: '#343434',
                    size: this.nodeFontSize, // px
                    face: 'pretendard',
                    strokeWidth: 2, // px
                    // strokeColor: "blue",
                  },
                },
                edges: {
                  arrows: {
                    to: { enabled: true },
                  },
                  font: {
                    // background: 'black',
                    color: '#343434',
                    size: this.edgeFontSize, // px
                    face: 'pretendard',
                    strokeWidth: 2, // px
                    // strokeColor: "blue",
                  },
                },
              },
            });
            //그룹노드와 원본노드 엣지 추가
            this.viz.network.body.data.edges.add({
              id: word + '_from_' + targetHighNodeId,
              from: targetHighNodeId,
              to: word,
            });
          } else {
            console.log(
              '그룹노드 있음',
              this.viz.network.body.data.nodes.get(word),
              this.viz.network.body.data.nodes.get(rawType)
            );
          }
          this.viz.network.body.data.nodes.add({
            id: rawId,
            label: this.labelReform(rawName),
            title: rawName,
            group: rawType,
            shape: 'image',
            image: `../assets/images/${rawType}/${rawType}_4.png`,
            raw: { properties: rawProperties },
            visConfig: {
              nodes: {
                size: 55,
                font: {
                  // background: 'black',
                  color: '#343434',
                  size: this.nodeFontSize, // px
                  face: 'pretendard',
                  strokeWidth: 2, // px
                  // strokeColor: "blue",
                },
              },

              edges: {
                arrows: {
                  to: { enabled: true },
                },
                font: {
                  // background: 'black',
                  color: '#343434',
                  size: this.edgeFontSize, // px
                  face: 'pretendard',
                  strokeWidth: 2, // px
                  // strokeColor: "blue",
                },
              },
            },
          });
          if (!this.viz.network.body.data.nodes.get(word)) {
            //그룹노드와 원본노드 엣지 추가
            console.log('내가 추가한 상위노드와 같을때');
            //그룹노드와 원본노드 엣지 추가
            this.viz.network.body.data.edges.add({
              id: rawId + '_from_' + highNodeId,
              label: rType,
              from: highNodeId,
              to: rawId,
            });
          } else {
            this.viz.network.body.data.edges.add({
              id: rawId + '_from_' + highNodeId,
              label: rType,
              from: word,
              to: rawId,
            });
          }
          // //그룹노드와 원본노드 엣지 추가
          // this.viz.network.body.data.edges.add({
          //   label: edgeLabel,
          //   from: word,
          //   to: rawId,
          // });
          this.chart();
          this.filtering(true);
        } else {
          console.log('포커스 이벤트 발동');
          this.focusNode(rawId);
        }
      });
  }

  graphInit() {
    console.log('초기화');
    // 모든 노드와 엣지 삭제
    this.viz.nodes.clear();
    this.viz.edges.clear();
  }

  labelOn() {
    this.viz.network.setOptions({
      nodes: {
        font: {
          size: 20, // 노드 라벨의 폰트 크기를 0으로 설정하여 비활성화
        },
      },
      edges: {
        font: {
          size: 15, // 엣지 라벨의 폰트 크기를 0으로 설정하여 비활성화
        },
      },
    });
  }

  labelOff() {
    this.viz.network.setOptions({
      nodes: {
        font: {
          size: 0, // 노드 라벨의 폰트 크기를 0으로 설정하여 비활성화
        },
      },
      edges: {
        font: {
          size: 0, // 엣지 라벨의 폰트 크기를 0으로 설정하여 비활성화
        },
      },
    });
  }

  pysicsOn() {
    console.log('물리엔진 on');
    this.viz.network.setOptions({
      physics: true,
    });
  }

  pysicsOff() {
    console.log('물리엔진 off');
    this.viz.network.setOptions({
      physics: false,
    });
  }

  checkRadio(event: Event) {
    const target = event.target as HTMLElement;
    const liElement = event.currentTarget as HTMLElement;

    // 클릭한 요소가 라디오 버튼이 아닌 경우에만 라디오 버튼을 체크
    if (!(target instanceof HTMLInputElement && target.type === 'radio')) {
      const radio = liElement.querySelector('input[type="radio"]');
      if (radio) {
        (radio as HTMLInputElement).checked = true;
      }
    }
  }

  menuData: { [key: string]: RelationshipType } = {};
  menuDataArray: MenuItem[] = [];

  toggleMenu(index: number): void {
    // 클릭된 메뉴 항목의 isExpanded 상태를 토글
    this.menuDataArray[index].isExpanded =
      !this.menuDataArray[index].isExpanded;
  }

  toggleSubMenu(i: number, key: string): void {
    // 클릭된 두 번째 메뉴 항목의 isExpanded 상태를 토글
    this.menuDataArray[i].data.relatedNodeTypes[key].isExpanded =
      !this.menuDataArray[i].data.relatedNodeTypes[key].isExpanded;

    // 만약 해당 relatedNode 항목이 확장되었고, displayedItemsCount에 해당 항목의 값이 없다면 초기화
    if (
      this.menuDataArray[i].data.relatedNodeTypes[key].isExpanded &&
      !this.displayedItemsCount[key]
    ) {
      this.displayedItemsCount[key] = 10;
    }
  }

  logAdjacentNodesAndRelationships(nodeId: any) {
    const reqObj = {
      id: nodeId,
    };
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/getAdjacentNodes`,
        reqObj
      )
      .subscribe((response: any) => {
        // 데이터를 정리하는 객체를 초기화합니다.
        const typeInfo: {
          [relType: string]: {
            count: number;
            relatedNodeTypes: {
              [relatedNodeType: string]: {
                count: number;
                values: string[];
                id: string[];
                highNodeId: string[];
              };
            };
          };
        } = {};

        const highNodeId = nodeId;
        response.forEach((record: any) => {
          const [node, relationship, relatedNode] = record._fields;
          const relType = relationship.type;
          const relatedNodeType = relatedNode.properties.type;
          const nodeName = relatedNode.properties.name;
          const nodeId = relatedNode.identity.low;
          const highNodeIdValue = highNodeId;

          // 관계 타입이 typeInfo에 없다면 초기화합니다.
          if (!typeInfo[relType]) {
            typeInfo[relType] = {
              count: 0,
              relatedNodeTypes: {},
            };
          }

          // 관련 노드 타입이 해당 관계 타입 아래에 없다면 초기화합니다.
          if (!typeInfo[relType].relatedNodeTypes[relatedNodeType]) {
            typeInfo[relType].relatedNodeTypes[relatedNodeType] = {
              count: 0,
              values: [],
              id: [],
              highNodeId: [],
            };
          }

          // 해당 관련 노드 타입의 count를 증가시킵니다.
          typeInfo[relType].relatedNodeTypes[relatedNodeType].count += 1;

          // 노드의 이름을 추가합니다.
          typeInfo[relType].relatedNodeTypes[relatedNodeType].values.push(
            nodeName
          );

          // 노드의 아이디 추가합니다.
          typeInfo[relType].relatedNodeTypes[relatedNodeType].id.push(nodeId);

          // 해당 관계 타입의 count를 증가시킵니다.
          typeInfo[relType].count += 1;

          // highNodeId 값을 추가합니다.
          typeInfo[relType].relatedNodeTypes[relatedNodeType].highNodeId.push(
            highNodeIdValue
          );
        });

        this.menuData = typeInfo;
        this.menuDataArray = Object.keys(this.menuData).map((key) => {
          const data = this.menuData[key];

          // 각 relatedNodeTypes 항목에 대해 values와 id를 결합합니다.
          for (let relatedNodeType in data.relatedNodeTypes) {
            const item: any = data.relatedNodeTypes[relatedNodeType];
            item.combined = item.values.map((value: any, index: any) => {
              return {
                value,
                id: item.id[index],
                highNodeId: item.highNodeId[index],
              };
            });
          }

          return { type: key, data: data };
        });
      });
  }

  // async logAdjacentNodesAndRelationships(nodeId: any) {
  //   const query = `
  //   MATCH (n)-[r]-(m)
  //   WHERE ID(n) = ${nodeId}
  //   RETURN n, r, m
  // `;
  //   console.log(nodeId, '로 관계정보 탐색중...');
  //   try {
  //     const result = await this.neo4jService.runQuery(query);

  //     console.log('결과값::', result);

  //     // 데이터를 정리하는 객체를 초기화합니다.
  //     const typeInfo: {
  //       [relType: string]: {
  //         count: number;
  //         relatedNodeTypes: {
  //           [relatedNodeType: string]: {
  //             count: number;
  //             values: string[];
  //             id: string[];
  //             highNodeId: string[];
  //           };
  //         };
  //       };
  //     } = {};

  //     console.log('Query Result Length:', result.length);
  //     // console.log('Query Result:', result);
  //     // console.log(`Adjacent nodes and relationships for node ${nodeId}:`);
  //     const highNodeId = nodeId;
  //     result.forEach((record: any) => {
  //       const [node, relationship, relatedNode] = record._fields;
  //       const relType = relationship.type;
  //       const relatedNodeType = relatedNode.properties.type;
  //       const nodeName = relatedNode.properties.name;
  //       const nodeId = relatedNode.identity.low;
  //       const highNodeIdValue = highNodeId;
  //       // console.log(nodeId);

  //       // 관계 타입이 typeInfo에 없다면 초기화합니다.
  //       if (!typeInfo[relType]) {
  //         typeInfo[relType] = {
  //           count: 0,
  //           relatedNodeTypes: {},
  //         };
  //       }

  //       // 관련 노드 타입이 해당 관계 타입 아래에 없다면 초기화합니다.
  //       if (!typeInfo[relType].relatedNodeTypes[relatedNodeType]) {
  //         typeInfo[relType].relatedNodeTypes[relatedNodeType] = {
  //           count: 0,
  //           values: [],
  //           id: [],
  //           highNodeId: [],
  //         };
  //       }

  //       // 해당 관련 노드 타입의 count를 증가시킵니다.
  //       typeInfo[relType].relatedNodeTypes[relatedNodeType].count += 1;

  //       // 노드의 이름을 추가합니다.
  //       typeInfo[relType].relatedNodeTypes[relatedNodeType].values.push(
  //         nodeName
  //       );

  //       // 노드의 아이디 추가합니다.
  //       typeInfo[relType].relatedNodeTypes[relatedNodeType].id.push(nodeId);

  //       // 해당 관계 타입의 count를 증가시킵니다.
  //       typeInfo[relType].count += 1;

  //       // highNodeId 값을 추가합니다.
  //       typeInfo[relType].relatedNodeTypes[relatedNodeType].highNodeId.push(
  //         highNodeIdValue
  //       );
  //     });

  //     this.menuData = typeInfo;
  //     this.menuDataArray = Object.keys(this.menuData).map((key) => {
  //       // return { type: key, data: this.menuData[key] };
  //       const data = this.menuData[key];

  //       // 각 relatedNodeTypes 항목에 대해 values와 id를 결합합니다.
  //       for (let relatedNodeType in data.relatedNodeTypes) {
  //         const item: any = data.relatedNodeTypes[relatedNodeType];
  //         item.combined = item.values.map((value: any, index: any) => {
  //           return {
  //             value,
  //             id: item.id[index],
  //             highNodeId: item.highNodeId[index],
  //           };
  //         });
  //       }

  //       return { type: key, data: data };
  //     });
  //     console.log('Type Info:', typeInfo);
  //     console.log('구조 확인::', this.menuDataArray);
  //   } catch (error) {
  //     console.error('Error:', error);
  //   }
  // }

  // 노드 검색
  nodeSearch() {
    const target = typeof this.clickOff;
    console.log(target);
    if (target === 'undefined') {
      // 없을때
      this.alarmOn('노드를 선택 후 사용하세요');
      return;
    } else if (target === 'string') {
      this.alarmOn('그룹노드는 탐색할 수 없습니다');
    } else if (target === 'number') {
      const node = this.viz.network.body.data.nodes.get(this.clickOff);
      const name = node.raw.properties.name;
      console.log(node);
      this.webSearchText = name;
      this.webSearch();
    }
  }

  // 웹 기반 검색 보여주기
  webSearchShow() {
    console.log(this.wikiResult);
    console.log(this.googleResult);
    if (this.wikiResult == '' && this.googleResult.length == 0) {
      this.alarmOn('검색값이 없습니다');
      return;
    }
    this.webSearchVisible = 'visible';
  }

  webSearchText: string = '';
  googleResult: any[] = [];
  wikiResult: string = '';
  webSearchVisible: string = 'hidden';
  webSearch() {
    console.log('웹 서치');
    if (this.webSearchText == '') {
      this.alarmOn('검색어를 입력하세요');
      return;
    }
    this.webSearchText = this.webSearchText.toLowerCase();
    // this.graphInitializing();
    // this.targetWord = this.webSearchText;
    // this.apiData = [];
    // this.apiData.push({ key: 'keyword', value: this.webSearchText });
    // this.apiRequest(this.apiData);
    this.searchLoadingOn();
    this.performSearch();
    this.searchCollect(this.webSearchText);
    // this.googleSearch();
    // this.wikiSearch();
  }

  // 파일 대용량 처리(json 넘겨주기)
  jsonSearch(event: any) {
    this.searchLoadingOn();
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = reader.result as string;
        // 여기에서 파일 내용을 처리합니다. 예를 들어 JSON으로 파싱할 수 있습니다.
        try {
          console.log(content);
          this.http
            .post(
              `http://${this.pythonIp}:${this.pythonPort}/api/jsonsearch`,
              content
            )
            // .post(`http://192.168.32.22:10300/api/google`, params)
            .subscribe(
              (response: any) => {
                this.searchLoadingOff();
                console.log(response);
                response.forEach((element: any) => {
                  element.forEach((target: any) => {
                    target = JSON.parse(target);
                    const nodes = target.nodes;
                    const rel = target.relationships;
                    // 노드 추가
                    nodes.forEach((node: any) => {
                      const rawId = node['<id>'];
                      const rawName = this.labelReform(node.name);
                      const rawType = node.type;
                      let rawProperties: any = {};
                      const key = Object.keys(node);
                      key.forEach((element) => {
                        if (element != '<id>' && element != '<labels>') {
                          rawProperties[element] = node[element];
                        }
                      });
                      if (this.viz.network.body.data.nodes.get(rawId)) {
                        // 이미 추가된 노드
                      } else if (!this.viz.network.body.data.nodes.get(rawId)) {
                        // 추가된 노드가 아님
                        this.viz.network.body.data.nodes.add({
                          id: rawId,
                          label: this.labelReform(rawName),
                          title: rawName,
                          group: rawType,
                          // type: rawName,
                          shape: 'image',
                          image: `../assets/images/${rawType}/${rawType}_4.png`,
                          raw: { properties: rawProperties },
                          visConfig: {
                            nodes: {
                              size: 55,
                              font: {
                                color: '#343434',
                                size: this.nodeFontSize,
                                face: 'pretendard',
                                strokeWidth: 2,
                              },
                            },

                            edges: {
                              arrows: {
                                to: { enabled: true },
                              },
                              font: {
                                // background: 'black',
                                color: '#343434',
                                size: this.edgeFontSize, // px
                                face: 'pretendard',
                                strokeWidth: 2, // px
                                // strokeColor: "blue",
                              },
                            },
                          },
                        });
                      }
                    });

                    //  릴레이션 추가
                    rel.forEach((element: any) => {
                      console.log(element);
                      const id = element['<rel.id>'];
                      const edgeLabel = element['<rel.type>'];
                      const start = element['<source.id>'];
                      const end = element['<target.id>'];
                      if (this.viz.network.body.data.edges.get(id)) {
                        // console.log("이미 있는 엣지 ")
                      } else if (!this.viz.network.body.data.edges.get(id)) {
                        this.viz.network.body.data.edges.add({
                          label: edgeLabel,
                          // id: start + '_from_' + end,
                          id: id,
                          from: start,
                          to: end,
                        });
                      }
                    });
                  });
                });
              },
              (error: any) => {
                this.searchLoadingOff();
                this.alarmOn('서버로 요청이 실패했습니다');
              }
            );
        } catch (err) {
          this.searchLoadingOff();
          console.error('파일을 읽는 도중 오류가 발생했습니다.', err);
        }
      };

      // event.target.value = '';
      reader.readAsText(file);
    }
  }

  shortPathModalDisplay: string = 'none';
  shortPathModalTargetValue: string = '';

  shortPathOn() {
    if (this.contextMenuVisible) {
      this.contextMenuVisible = !this.contextMenuVisible;
    }
    const typeCheck = typeof this.rightClickNodeId;
    console.log(typeCheck);
    if (typeCheck == 'string') {
      this.multiHopModalOff();
      this.alarmOn('그룹노드에서 검색할 수 없습니다');
      return;
    }
    this.shortPathModalDisplay = 'block';
    this.backgroundVisible = 'block';
    this.shortPathModalTargetValue = '';
  }

  shortPathOff() {
    this.shortPathModalDisplay = 'none';
    this.backgroundVisible = 'none';
  }

  // 최단거리
  shortPath() {
    if (this.shortPathModalTargetValue == '') {
      this.shortPathOff();
      this.alarmOn('대상을 기입하세요');
      return;
    }
    this.shortPathOff();
    this.searchLoadingOn();
    const params = {
      nid: this.rightClickNodeId,
      target: this.shortPathModalTargetValue,
    };
    console.log(params);
    this.http
      .post(`http://${this.pythonIp}:${this.pythonPort}/api/shortpath`, params)
      // .post(`http://192.168.32.22:10300/api/google`, params)
      .subscribe(
        (response: any) => {
          console.log(response);
          this.searchLoadingOff();
          if (response.length == 0) {
            this.multiHopModalOff();
            this.searchLoadingOff();
            this.alarmOn('결과값이 없습니다');
            console.log(response);
          } else if (response.length >= 1) {
            this.multiHopModalOff();
            this.searchLoadingOff();
            console.log(response);
            console.log(JSON.parse(response[0]));
            response.forEach((element: any) => {
              const target = JSON.parse(element);
              // console.log(target);
              const nodesArray = target.nodes;
              const edgesArray = target.relationships;
              console.log(nodesArray, edgesArray);
              // 노드 반복 추가
              nodesArray.forEach((node: any) => {
                const rawId = node['<id>'];
                const rawName = node.name;
                const rawType = node.type;
                // const value = node.values[0];
                const rawProperties = {
                  name: rawName,
                  type: rawType,
                  // values: value,
                };
                if (this.viz.network.body.data.nodes.get(rawId)) {
                  // console.log('이미 있는 노드');
                  // this.focusNode(rawId);
                } else if (!this.viz.network.body.data.nodes.get(rawId)) {
                  this.viz.network.body.data.nodes.add({
                    id: rawId,
                    label: this.labelReform(rawName),
                    title: rawName,
                    group: rawType,
                    // type: rawName,
                    shape: 'image',
                    image: `../assets/images/${rawType}/${rawType}_4.png`,
                    raw: { properties: rawProperties },
                    visConfig: {
                      nodes: {
                        size: 55,
                        font: {
                          color: '#343434',
                          size: this.nodeFontSize,
                          face: 'pretendard',
                          strokeWidth: 2,
                        },
                      },

                      edges: {
                        arrows: {
                          to: { enabled: true },
                        },
                        font: {
                          // background: 'black',
                          color: '#343434',
                          size: this.edgeFontSize, // px
                          face: 'pretendard',
                          strokeWidth: 2, // px
                          // strokeColor: "blue",
                        },
                      },
                    },
                  });
                }
              });
              // 엣지 반복 추가
              edgesArray.forEach((element: any) => {
                const id = element['<rel.id>'];
                const edgeLabel = element['<rel.type>'];
                const start = element['<source.id>'];
                const end = element['<target.id>'];
                if (this.viz.network.body.data.edges.get(id)) {
                  // console.log("이미 있는 엣지 ")
                } else if (!this.viz.network.body.data.edges.get(id)) {
                  this.viz.network.body.data.edges.add({
                    label: edgeLabel,
                    // id: start + '_from_' + end,
                    id: id,
                    from: start,
                    to: end,
                  });
                }
              });
            });
          }
        },
        (error: any) => {
          // 에러 발생시 로직
          this.alarmOn('서버로 요청이 실패했습니다');
          this.searchLoadingOff();
          // 에러 처리 관련 로직 추가
        }
      );
  }

  multiHopModalDisplay: string = 'none';
  multiHopModalHoplValue: number = 0;
  multiHopModalLabelValue: string = '';
  multiHopModalTargetValue: string = '';

  isNumber(value: any): boolean {
    return typeof value === 'number';
  }

  multiHopModalOn() {
    if (this.contextMenuVisible) {
      this.contextMenuVisible = !this.contextMenuVisible;
    }
    const typeCheck = typeof this.rightClickNodeId;
    console.log(typeCheck);
    if (typeCheck == 'string') {
      this.multiHopModalOff();
      this.alarmOn('그룹노드에서 검색할 수 없습니다');
      return;
    }
    this.multiHopModalTargetValue = '';
    this.multiHopModalDisplay = 'block';
    this.backgroundVisible = 'block';
  }
  multiHopModalOff() {
    this.multiHopModalDisplay = 'none';
    this.backgroundVisible = 'none';
  }

  multiHopSearch() {
    this.multiHopModalOff();
    this.searchLoadingOn();
    console.log(
      this.rightClickNodeId,
      this.multiHopModalHoplValue,
      this.multiHopModalLabelValue,
      this.multiHopModalTargetValue
    );
    // ipv4-addr처리
    if (this.multiHopModalLabelValue == 'ipv4-addr') {
      this.multiHopModalLabelValue = 'ipv4_addr';
    }
    const params = {
      nid: this.rightClickNodeId,
      hop: this.multiHopModalHoplValue,
      label: this.multiHopModalLabelValue,
      target: this.multiHopModalTargetValue,
    };
    this.http
      .post(`http://${this.pythonIp}:${this.pythonPort}/api/multihop`, params)
      // .post(`http://192.168.32.22:10300/api/google`, params)
      .subscribe(
        (response: any) => {
          if (response.length == 0) {
            this.multiHopModalOff();
            this.searchLoadingOff();
            this.alarmOn('결과값이 없습니다');
            console.log(response);
          } else if (response.length >= 1) {
            this.multiHopModalOff();
            this.searchLoadingOff();
            console.log(response);
            console.log(JSON.parse(response[0]));
            response.forEach((element: any) => {
              const target = JSON.parse(element);
              // console.log(target);
              const nodesArray = target.nodes;
              const edgesArray = target.relationships;
              console.log(nodesArray, edgesArray);
              // 노드 반복 추가
              nodesArray.forEach((node: any) => {
                const rawId = node['<id>'];
                const rawName = node.name;
                const rawType = node.type;
                // const value = node.values[0];
                const rawProperties = {
                  name: rawName,
                  type: rawType,
                  // values: value,
                };
                if (this.viz.network.body.data.nodes.get(rawId)) {
                  // console.log('이미 있는 노드');
                  // this.focusNode(rawId);
                } else if (!this.viz.network.body.data.nodes.get(rawId)) {
                  this.viz.network.body.data.nodes.add({
                    id: rawId,
                    label: this.labelReform(rawName),
                    title: rawName,
                    group: rawType,
                    // type: rawName,
                    shape: 'image',
                    image: `../assets/images/${rawType}/${rawType}_4.png`,
                    raw: { properties: rawProperties },
                    visConfig: {
                      nodes: {
                        size: 55,
                        font: {
                          color: '#343434',
                          size: this.nodeFontSize,
                          face: 'pretendard',
                          strokeWidth: 2,
                        },
                      },

                      edges: {
                        arrows: {
                          to: { enabled: true },
                        },
                        font: {
                          // background: 'black',
                          color: '#343434',
                          size: this.edgeFontSize, // px
                          face: 'pretendard',
                          strokeWidth: 2, // px
                          // strokeColor: "blue",
                        },
                      },
                    },
                  });
                }
              });
              // 엣지 반복 추가
              edgesArray.forEach((element: any) => {
                const id = element['<rel.id>'];
                const edgeLabel = element['<rel.type>'];
                const start = element['<source.id>'];
                const end = element['<target.id>'];
                if (this.viz.network.body.data.edges.get(id)) {
                  // console.log("이미 있는 엣지 ")
                } else if (!this.viz.network.body.data.edges.get(id)) {
                  this.viz.network.body.data.edges.add({
                    label: edgeLabel,
                    // id: start + '_from_' + end,
                    id: id,
                    from: start,
                    to: end,
                  });
                }
              });
            });
          }
        },
        (error: any) => {
          // 에러 발생시 로직
          this.multiHopModalOff();
          this.alarmOn('서버로 요청이 실패했습니다');
          this.searchLoadingOff();
          // 에러 처리 관련 로직 추가
        }
      );
  }

  performSearch() {
    const googleSearch$ = this.http.post<any[]>(
      `http://${this.pythonIp}:${this.pythonPort}/api/google`,
      { keyword: this.webSearchText }
    );
    const wikiSearch$ = this.http.post<string>(
      `http://${this.pythonIp}:${this.pythonPort}/api/wiki`,
      { keyword: this.webSearchText }
    );

    forkJoin([googleSearch$, wikiSearch$]).subscribe(
      (results: any) => {
        // 두 요청 모두 성공했을 때의 로직
        const googleResponse = results[0];
        const wikiResponse = results[1];

        // 구글 검색 결과 처리
        console.log(googleResponse);
        this.googleResult = googleResponse;

        // 위키 검색 결과 처리
        this.wikiResult = wikiResponse == '' ? '결과 없음' : wikiResponse;
        this.webSearchVisible = 'visible';

        // 두 검색이 모두 완료된 후 실행할 함수
        this.afterBothSearches();
      },
      (error: any) => {
        // 하나라도 실패했을 때의 에러 처리
        this.alarmOn('서버로의 요청이 실패했습니다');
        this.searchLoadingOff();

        // 잠시 test
        this.afterBothSearches();
      }
    );
  }

  afterBothSearches() {
    // 여기에 두 검색이 모두 성공했을 때 실행할 로직을 추가합니다
    // this.graphInitializing();
    this.targetWord = this.webSearchText;
    this.apiData = [];
    this.apiData.push({ key: 'keyword', value: this.webSearchText });
    this.apiRequest(this.apiData, true, 'web');
    // this.searchLoadingOff();
  }

  aiResultClick(node: any) {
    console.log(node);
    const rawId = node['<id>'];
    const rawName = this.labelReform(node.name);
    const rawType = node.type;
    const targetKey = Object.keys(node);
    let rawProperties: any = {};
    targetKey.forEach((element) => {
      const key = element;
      if (element != '<id>' && element != '<labels>') {
        const value = node[key];
        rawProperties[key] = value;
      }
    });
    let deleteArrayResult = this.aiSearchResultArray.filter(
      (element) => element != node
    );

    this.aiSearchResultArray = deleteArrayResult;
    console.log(deleteArrayResult.length);
    if (this.viz.network.body.data.nodes.get(rawId)) {
      this.focusNode(rawId);
    } else if (!this.viz.network.body.data.nodes.get(rawId)) {
      this.viz.network.body.data.nodes.add({
        id: rawId,
        label: this.labelReform(rawName),
        title: rawName,
        group: rawType,
        // type: rawName,
        shape: 'image',
        image: `../assets/images/${rawType}/${rawType}_4.png`,
        raw: { properties: rawProperties },
        visConfig: {
          nodes: {
            size: 55,
            font: {
              color: '#343434',
              size: this.nodeFontSize,
              face: 'pretendard',
              strokeWidth: 2,
            },
          },

          edges: {
            arrows: {
              to: { enabled: true },
            },
            font: {
              // background: 'black',
              color: '#343434',
              size: this.edgeFontSize, // px
              face: 'pretendard',
              strokeWidth: 2, // px
              // strokeColor: "blue",
            },
          },
        },
      });
    }
  }

  aiSearchValue: string = '';
  aiSearchResultArray: any[] = [];
  aiSearch() {
    this.searchLoadingOn();

    const params = {
      keyword: this.aiSearchValue,
      reportData: this.targetWord,
    };

    console.log(params);
    this.http
      .post(`http://${this.pythonIp}:${this.pythonPort}/api/aisearch`, params)
      // .post(`http://192.168.32.22:10300/api/google`, params)
      .subscribe(
        (response: any) => {
          // 요청 성공시 로직
          this.aiSearchResultArray = [];
          console.log(response);
          response.forEach((element: any) => {
            this.aiSearchResultArray.push(JSON.parse(element).n);
          });
          // this.googleResult = response;
          this.searchLoadingOff();
        },
        (error: any) => {
          // 에러 발생시 로직
          this.searchLoadingOff();
          this.alarmOn('검색 결과가 없습니다.');
          // 에러 처리 관련 로직 추가
        }
      );
  }

  graphSearchValue: string = '';
  graphSearch() {
    // this.searchLoadingOn();
    // this.graphInitializing();
    this.searchCollect(this.graphSearchValue);
    this.targetWord = this.graphSearchValue;
    this.apiData = [];
    this.apiData.push({ key: 'keyword', value: this.graphSearchValue });
    this.apiRequest(this.apiData, true, 'graph');
    // this.searchLoadingOff();
    // this.graphSearchValue = '';
  }

  // 검색어 수집 API
  searchCollect(text: string) {
    const params = { keyword: text, user: this.user };
    this.http
      .post(
        `http://${this.pythonIp}:${this.pythonPort}/api/search_stat`,
        params
      )
      // .post(`http://192.168.32.22:10300/api/google`, params)
      .subscribe(
        (response: any) => {},
        (error: any) => {
          // 에러 발생시 로직
          this.searchLoadingOff();
          this.alarmOn('검색어 수집 API Failed');
        }
      );
  }

  searchDisplay: string = 'none';

  searchLoadingOn() {
    this.searchDisplay = 'block';
    this.backgroundVisible = 'block';
  }
  searchLoadingOff() {
    this.searchDisplay = 'none';
    this.backgroundVisible = 'none';
  }

  // 웹 기반 검색 (구글)
  googleSearch() {
    const params = { keyword: this.webSearchText };
    this.http
      .post(`http://${this.pythonIp}:${this.pythonPort}/api/google`, params)
      // .post(`http://192.168.32.22:10300/api/google`, params)
      .subscribe(
        (response: any) => {
          // 요청 성공시 로직
          console.log(response);
          this.googleResult = response;
          this.searchLoadingOff();
        },
        (error: any) => {
          // 에러 발생시 로직
          this.alarmOn('서버로 요청이 실패했습니다');
          this.searchLoadingOff();
          // 에러 처리 관련 로직 추가
        }
      );
  }
  // 웹 기반 검색 (위키)
  wikiSearch() {
    const params = { keyword: this.webSearchText };
    this.http
      .post(`http://${this.pythonIp}:${this.pythonPort}/api/wiki`, params)
      // .post(`http://192.168.32.22:10300/api/wiki`, params)
      .subscribe(
        (response: any) => {
          // console.log(response);
          if (response == '') {
            this.wikiResult = '결과 없음';
          } else {
            this.wikiResult = response;
          }
          this.webSearchVisible = 'visible';
        },
        (error: any) => {
          // 에러 발생시 로직
          this.alarmOn('서버로 요청이 실패했습니다');
          this.searchLoadingOff();
          // 에러 처리 관련 로직 추가
        }
      );
  }

  toggleWebSearch() {
    this.webSearchVisible = 'hidden';
  }

  graphMultiFilterObj: any = {
    firstNode: { resultArray: [], selectVal: '', inputText: '' },
    firstRel: { resultArray: [], selectVal: '', inputText: '' },
    secondNode: { resultArray: [], selectVal: '', inputText: '' },
    secondRel: { resultArray: [], selectVal: '', inputText: '' },
    thirdNode: { resultArray: [], selectVal: '', inputText: '' },
    thirdRel: { resultArray: [], selectVal: '', inputText: '' },
    fourthNode: { resultArray: [], selectVal: '', inputText: '' },
  };

  // 그래프 다중검색
  graphMultiSearch() {
    console.log('다중검색');
    this.http
      .get(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/graph/multi`
      )
      .subscribe((response: any) => {
        // console.log(response);
        this.graphMultiFilterObj.firstNode.resultArray = [];
        response.forEach((element: any) => {
          this.graphMultiFilterObj.firstNode.resultArray.push(
            element._fields[0]
          );
        });
        console.log(this.graphMultiFilterObj.firstNode.resultArray);
        this.graphMultiFilterObj.firstNode.selectVal =
          this.graphMultiFilterObj.firstNode.resultArray[0];
      });
  }

  graphMultiAddOrSearchAccessCount: number = 0;
  graphSettingWidth: number = 0;
  graphMultiAddOrSearch(param: string) {
    this.graphMultiAddOrSearchAccessCount++;
    // 확장 상태 기본으로 바꾸기
    if (this.graphMultiAddOrSearchAccessCount == 1) {
      this.graphSettingWidth =
        this.graphSearchSetting.nativeElement.offsetWidth;
    }
    this.graphSettingStyle = {
      position: 'relative',
      width: this.graphSettingWidth,
      transform: `translate(0px,0px)`,
      'background-color': '#F7F7F7',
    };
    this.graphSettingLowStyle = {
      'margin-top': '0px',
    };
    this.graphSettingIconClass = 'fa-solid fa-caret-left';
    this.isGraphSettingExtend = false;

    // 객체의 모든 키를 배열로 가져옵니다.
    const keys = Object.keys(this.graphMultiFilterObj);
    console.log(this.graphMultiFilterObj.firstNode);

    let queryString = '';
    let queryWhere = '';
    let depthCount = 0;
    // 각 키를 반복하여 출력합니다.
    keys.forEach((key) => {
      console.log(key, this.graphMultiFilterObj[key].selectVal);
      if (
        this.graphMultiFilterObj[key].selectVal &&
        (key == 'firstNode' ||
          key == 'secondNode' ||
          key == 'thirdNode' ||
          key == 'fourthNode')
      ) {
        if (
          this.graphMultiFilterObj[key].inputText &&
          this.graphMultiFilterObj[key].selectVal
        ) {
          depthCount++;
          if (key == 'firstNode') {
            queryString += `(${key}:${this.graphMultiFilterObj[key].selectVal})`;
            queryWhere += ` where ${key}.name contains "${this.graphMultiFilterObj[key].inputText}"`;
          } else {
            queryString += `-(${key}:${this.graphMultiFilterObj[key].selectVal})`;
            if (queryWhere == '') {
              queryWhere += ` where ${key}.name contains "${this.graphMultiFilterObj[key].inputText}"`;
            } else if (queryWhere != '') {
              queryWhere += ` and ${key}.name contains "${this.graphMultiFilterObj[key].inputText}"`;
            }
          }
        } else if (this.graphMultiFilterObj[key].selectVal) {
          depthCount++;
          if (key == 'firstNode') {
            queryString += `(${key}:${this.graphMultiFilterObj[key].selectVal})`;
          } else {
            queryString += `-(${key}:${this.graphMultiFilterObj[key].selectVal})`;
          }
        }
      } else {
        if (
          this.graphMultiFilterObj[key].inputText &&
          this.graphMultiFilterObj[key].selectVal
        ) {
          depthCount++;

          queryString += `-[${key}:${this.graphMultiFilterObj[key].selectVal}]`;
          queryWhere += ` and ${key}.name="${this.graphMultiFilterObj[key].inputText}"`;
        } else if (this.graphMultiFilterObj[key].selectVal) {
          depthCount++;

          queryString += `-[${key}:${this.graphMultiFilterObj[key].selectVal}]`;
        }
      }
    });

    if (depthCount == 0) {
      this.alarmOn('쿼리 완성 후 검색하시오');
      return;
    }

    console.log(queryString, '//', queryWhere, '총 카운트::', depthCount);
    let query = '';

    if (param == 'search' && (depthCount % 2 == 0 || depthCount == 1)) {
      this.alarmOn('쿼리 완성 후 검색하시오');
      return;
    }

    if (param == 'add') {
      if (depthCount % 2 == 0) {
        //짝수
        queryString = queryString + '-(target)';
        query =
          queryString +
          queryWhere +
          ' RETURN DISTINCT target.type as labelType';
      } else {
        // 홀수
        queryString = queryString + '-[target]-()';
        query =
          queryString +
          queryWhere +
          ' RETURN DISTINCT type(target) as relationshipType';
      }
      const reqObj = {
        depth: depthCount,
        query: query,
      };

      console.log(query);
      this.grapMultiAddApiReq(reqObj);
    } else if (param == 'search') {
      if (depthCount % 2 == 0) {
        //짝수
        queryString = queryString;
        query =
          // 'path=' + queryString + '-()' + queryWhere + ' RETURN path limit 20';
          'path=' + queryString + '-()' + queryWhere + ' RETURN path';
      } else {
        // 홀수
        queryString = queryString;
        // query = 'path=' + queryString + queryWhere + ' RETURN path limit 20';
        query = 'path=' + queryString + queryWhere + ' RETURN path';
      }
      const reqObj = {
        depth: depthCount,
        query: query,
      };

      console.log(query);
      this.grapMultiSearchApiReq(reqObj);
    }
  }

  graphMultiDisplayCount = 20;

  onLoadMore() {
    this.graphMultiDisplayCount += 20;
  }

  multiGraphSettingExtendCheck = () => {
    // 스크롤을 가져와 확장 아이콘 표시 여부 결정하기
    const scrollWidth = this.graphSearchSetting.nativeElement.scrollWidth;
    console.log(this.graphSettingWidth, scrollWidth);
    if (scrollWidth > this.graphSettingWidth) {
      this.isScrollExist = true;
    } else if (scrollWidth == this.graphSettingWidth) {
      this.isScrollExist = false;
      // 확장 상태 기본으로 바꾸기
      this.graphSettingStyle = {
        position: 'relative',
        width: this.graphSettingWidth,
        transform: `translate(0px,0px)`,
        'background-color': '#F7F7F7',
      };
      this.graphSettingLowStyle = {
        'margin-top': '0px',
      };
      this.graphSettingIconClass = 'fa-solid fa-caret-left';
      this.isGraphSettingExtend = false;
    }
  };

  grapMultiSearchApiReqResultClick(param: number) {
    console.log(this.graphMultiResult[param]);
    const findResult = this.graphMultiResult[param].segments;
    for (let i = 0; i < findResult.length; i++) {
      // if (i == findResult.length - 1) {
      console.log(findResult[i]);
      const key = Object.keys(findResult[i]);
      for (let k of key) {
        if (k != 'relationship') {
          const rawId = findResult[i][k].identity.low;
          const rawName = findResult[i][k].properties.name;
          const rawType = findResult[i][k].properties.type;
          const rawProperties = findResult[i][k].properties;
          if (this.viz.network.body.data.nodes.get(rawId) && k == 'end') {
            // this.focusNode(rawId);
            continue;
          } else if (this.viz.network.body.data.nodes.get(rawId)) {
            console.log('이미 있는 노드');
            // this.focusNode(rawId);
            continue;
          }
          this.viz.network.body.data.nodes.add({
            id: rawId,
            label: this.labelReform(rawName),
            title: rawName,
            group: rawType,
            // type: rawName,
            shape: 'image',
            image: `../assets/images/${rawType}/${rawType}_4.png`,
            raw: { properties: rawProperties },
            visConfig: {
              nodes: {
                size: 55,
                font: {
                  color: '#343434',
                  size: this.nodeFontSize,
                  face: 'pretendard',
                  strokeWidth: 2,
                },
              },

              edges: {
                arrows: {
                  to: { enabled: true },
                },
                font: {
                  // background: 'black',
                  color: '#343434',
                  size: this.edgeFontSize, // px
                  face: 'pretendard',
                  strokeWidth: 2, // px
                  // strokeColor: "blue",
                },
              },
            },
          });
        } else if (k == 'relationship') {
          const edgeLabel = findResult[i][k].type;
          const start = findResult[i][k].start.low;
          const end = findResult[i][k].end.low;
          if (this.viz.network.body.data.edges.get(start + '_from_' + end)) {
            console.log('이미 있는 edge');
            continue;
          }
          //그룹노드와 원본노드 엣지 추가
          this.viz.network.body.data.edges.add({
            label: edgeLabel,
            id: start + '_from_' + end,
            from: start,
            to: end,
          });
        }
      }
      // }
    }
  }

  grapMultiSearchApiReqResult: any[] = [];
  grapMultiSearchResultLabel: any = {
    firstNode: '',
    firstRel: '',
    secondNode: '',
    secondRel: '',
    thirdNode: '',
    thirdRel: '',
    fourthNode: '',
  };
  grapMultiSearchApiReq(params: any) {
    const depth = params.depth;
    this.searchLoadingOn();
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/graph/multi/search`,
        params
      )
      .subscribe(
        (response: any) => {
          if (response.length == 0) {
            this.searchLoadingOff();
            this.alarmOn('검색 결과가 없습니다');
            return;
          }
          this.graphMultiResult = [];
          response.forEach((element: any) => {
            this.graphMultiResult.push(element._fields[0]);
          });

          this.graphMultiResultLength = this.graphMultiResult.length;
          console.log(this.graphMultiResult);
          this.searchLoadingOff();
          const keys = Object.keys(this.graphMultiFilterObj);
          keys.forEach((key) => {
            console.log(key, this.graphMultiFilterObj[key].selectVal);
            this.grapMultiSearchResultLabel[key] =
              this.graphMultiFilterObj[key].selectVal;
          });
          console.log(this.grapMultiSearchResultLabel);
        },
        (error: any) => {
          this.searchLoadingOff();
          this.alarmOn('결과 값이 너무 많거나 유효하지 않습니다.');
        }
      );
  }
  graphMultiResult: any[] = [];
  graphMultiResultLength: number = 0;

  depth: number = 0;

  graphMultiDel() {
    if (this.depth == 0) {
      this.alarmOn('조건을 완성하시오');
      return;
    } else if (this.depth == 6) {
      this.graphMultiFilterObj.fourthNode = {
        resultArray: [],
        selectVal: '',
        inputText: '',
      };
    } else if (this.depth == 5) {
      this.graphMultiFilterObj.thirdRel = {
        resultArray: [],
        selectVal: '',
        inputText: '',
      };
    } else if (this.depth == 4) {
      this.graphMultiFilterObj.thirdNode = {
        resultArray: [],
        selectVal: '',
        inputText: '',
      };
    } else if (this.depth == 3) {
      this.graphMultiFilterObj.secondRel = {
        resultArray: [],
        selectVal: '',
        inputText: '',
      };
    } else if (this.depth == 2) {
      this.graphMultiFilterObj.secondNode = {
        resultArray: [],
        selectVal: '',
        inputText: '',
      };
    } else if (this.depth == 1) {
      this.graphMultiFilterObj.firstRel = {
        resultArray: [],
        selectVal: '',
        inputText: '',
      };
    }
    this.depth--;
    // 변경 감지 수행
    this.cdr.detectChanges();
    // 확장 상태 기본으로 바꾸기
    this.graphSettingStyle = {
      position: 'relative',
      width: this.graphSettingWidth,
      transform: `translate(0px,0px)`,
      'background-color': '#F7F7F7',
    };
    this.graphSettingLowStyle = {
      'margin-top': '0px',
    };
    this.graphSettingIconClass = 'fa-solid fa-caret-left';
    this.isGraphSettingExtend = false;
    // 스크롤 확인 함수 호출
    this.multiGraphSettingExtendCheck();
  }

  graphMultiInit() {
    // 확장 상태 기본으로 바꾸기
    this.graphSettingStyle = {
      position: 'relative',
      width: this.graphSettingWidth,
      transform: `translate(0px,0px)`,
      'background-color': '#F7F7F7',
    };
    this.isScrollExist = false;
    this.graphSettingLowStyle = {
      'margin-top': '0px',
    };
    this.graphSettingIconClass = 'fa-solid fa-caret-left';
    this.isGraphSettingExtend = false;

    this.graphMultiFilterObj = {
      firstNode: {
        resultArray: this.graphMultiFilterObj.firstNode.resultArray,
        selectVal: '',
        inputText: '',
      },
      firstRel: { resultArray: [], selectVal: '', inputText: '' },
      secondNode: { resultArray: [], selectVal: '', inputText: '' },
      secondRel: { resultArray: [], selectVal: '', inputText: '' },
      thirdNode: { resultArray: [], selectVal: '', inputText: '' },
      thirdRel: { resultArray: [], selectVal: '', inputText: '' },
      fourthNode: { resultArray: [], selectVal: '', inputText: '' },
    };
    this.depth = 0;
    this.graphMultiFilterObj.firstNode.selectVal =
      this.graphMultiFilterObj.firstNode.resultArray[0];
  }

  grapMultiAddApiReq(params: any) {
    const depth = params.depth;
    this.searchLoadingOn();
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/graph/multi/add`,
        params
      )
      .subscribe((response: any) => {
        console.log(response);
        if (response.length == 0) {
          this.searchLoadingOff();
          this.alarmOn('결과가 없습니다');
          return;
        }
        this.depth++;
        const resultArray: any = [];
        response.forEach((element: any) => {
          if (element._fields[0] == 'ipv4-addr') {
            element._fields[0] = 'ipv4_addr';
          }
          resultArray.push(element._fields[0]);
        });
        if (depth == 1) {
          this.graphMultiFilterObj.firstRel.resultArray = resultArray;
          this.graphMultiFilterObj.firstRel.selectVal = resultArray[0];
        } else if (depth == 2) {
          this.graphMultiFilterObj.secondNode.resultArray = resultArray;
          this.graphMultiFilterObj.secondNode.selectVal = resultArray[0];
        } else if (depth == 3) {
          this.graphMultiFilterObj.secondRel.resultArray = resultArray;
          this.graphMultiFilterObj.secondRel.selectVal = resultArray[0];
        } else if (depth == 4) {
          this.graphMultiFilterObj.thirdNode.resultArray = resultArray;
          this.graphMultiFilterObj.thirdNode.selectVal = resultArray[0];
        } else if (depth == 5) {
          this.graphMultiFilterObj.thirdRel.resultArray = resultArray;
          this.graphMultiFilterObj.thirdRel.selectVal = resultArray[0];
        } else if (depth == 6) {
          this.graphMultiFilterObj.fourthNode.resultArray = resultArray;
          this.graphMultiFilterObj.fourthNode.selectVal = resultArray[0];
        }
        this.searchLoadingOff();
        // 변경 감지 수행
        this.cdr.detectChanges();
        // 스크롤 확인 함수 호출
        this.multiGraphSettingExtendCheck();
      });
  }

  wikiDisplay: string = 'none';
  aiDisplay: string = 'none';

  wikiToggle = () => {
    this.aiDisplay = 'none';
    if (this.wikiDisplay == 'none') {
      this.wikiDisplay = 'flex';
    } else if (this.wikiDisplay == 'flex') {
      this.wikiDisplay = 'none';
    }
  };

  aiToggle = () => {
    this.wikiDisplay = 'none';
    if (this.aiDisplay == 'none') {
      this.aiDisplay = 'flex';
    } else if (this.aiDisplay == 'flex') {
      this.aiDisplay = 'none';
    }
  };
}

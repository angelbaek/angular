import { AfterViewInit, Component, OnInit } from '@angular/core';
import { AngularFaviconService } from 'angular-favicon';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LabelConfig, Nodeimage } from './labelConfig';
import { Neo4jConfig } from './neo4jConfig';
import { Neo4jService } from './neo4j.service';
import { RealtionshipConfig } from './relationConfig';
import { ActivatedRoute } from '@angular/router';

import NeoVis from 'neovis.js';

//인터페이스
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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  angularIp: string = '192.168.32.22'; // 앵귤러 프로젝트 ip
  backendNodeExpressPort: string = '3000'; // 노드 익스프레스 ip
  neo4jPort: string = '7687';
  visibility: string = 'hidden'; // 기본값은 hidden으로 설정
  loadingVisibility: string = 'visible'; // 로딩 애니메이션
  currentUrl: string = ''; // 현재 브라우저 URL을 저장할 속성
  viz: any; // 그래프
  selectedNodeData: any; // 선택한 노드정보 객체
  cyperQueryRel: string = ''; // 쿼리 릴레이션 문자열
  initialCypher: string = ''; // 사이퍼쿼리 문자열
  user: string = '';
  nodeFontSize: number = 25;
  edgeFontSize: number = 15;
  /**
   * URL 쿼리 문자열
   */
  apiData: any = [];
  targetWord: string = '';
  clickOff: any;

  groupedNodes = new Map<string, { rawid: any; name: any }[]>();
  selectedGroup: string = ''; // 사용자가 선택한 그룹 이름
  groupKeys: string[] = [];

  isRelatedNodeClicked: boolean = false;

  public chartOptions: any;
  public chartSeries: any[] = [];

  constructor(
    // 생성자
    private http: HttpClient,
    private router: Router,
    private ngxFavicon: AngularFaviconService,
    private neo4jService: Neo4jService,
    private route: ActivatedRoute
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.route.queryParams.subscribe((params) => {
          this.user = params['user'];
          // ... 기타 코드
          for (let key in params) {
            console.log(key);
            // keyword or main_name 타겟워드 대입
            if (key == 'keyword' || key == 'main_name') {
              this.targetWord = params[key];
              console.log('타겟워드:', this.targetWord);
            }

            if (params.hasOwnProperty(key)) {
              this.apiData.push({ key: key, value: params[key] });
            }
          }
          console.log(this.apiData);
          this.apiRequest(this.apiData);
        });
      });
  }

  // 초기화
  ngOnInit(): void {
    this.draw();
    this.ngxFavicon.setFavicon('../assets/images/favicon.ico');
  }
  setupNodeEventListeners() {
    // 노드가 추가될 때의 이벤트 핸들러
  }

  // 챠트 로딩 보이기 객체
  chartLoadingVisibility: string = 'visible';

  // 챠트 그래프
  chart() {
    const nodesData = this.viz.network.body.data.nodes.get(); // 모든 노드 데이터 가져오기

    // console.log(nodesData);
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
      return; // 이후의 로직을 실행하지 않고 함수를 종료
    }

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
        stacked: true, // 스택 설정
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
          },
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 2,
          columnWidth: '60%',
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
          // color: colors.gridBorder,
        },
        axisTicks: {
          // color: colors.gridBorder,
        },
      },
      grid: {
        padding: {
          bottom: -4,
        },
        borderColor: colors.gridBorder,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
      legend: {
        show: true,

        position: 'top',
        horizontalAlign: 'center',
        fontFamily: 'pretendard, sans-serif',
        itemMargin: {
          horizontal: 8,
          vertical: 0,
        },
      },
      stroke: {
        width: 0,
      },

      theme: {
        mode: 'light', // 테마 설정
      },
      tooltip: {
        theme: 'light', // 툴팁 테마 설정
      },
    };

    this.chartSeries = [
      {
        // color: '#143c7540',
        color: colors.primary, // 기본 색상 설정
        name: 'Node Count',
        data: Object.values(dataCount),
      },
    ];
  }

  compareCreated: string = '';
  countCreatedClick: number = 0;
  showNodesByYear(year: string) {
    const nodes = this.viz.network.body.data.nodes;

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
          nodes.update([{ id: node.id, hidden: false }]);
        }
      });
      return;
    }
    this.countCreatedClick = 0;
    this.compareCreated = year;
    console.log(year, '를 받음');
    // NeoVis를 사용하여 해당 년도의 `created` 값을 포함하는 노드만 표시합니다.
    // 모든 노드 데이터를 가져옵니다.

    // 먼저, 모든 노드를 숨깁니다.
    nodes.forEach((node: any) => {
      node.hidden = true;
    });

    // 연도를 포함하는 노드만 표시합니다.
    nodes.forEach((node: any) => {
      if (
        node.raw &&
        node.raw.properties &&
        node.raw.properties.created &&
        node.raw.properties.created.startsWith(year)
      ) {
        nodes.update([{ id: node.id, hidden: false }]);
      } else {
        nodes.update([{ id: node.id, hidden: true }]);
      }
    });

    // 변경사항을 반영하기 위해 네트워크를 다시 그립니다.
    this.viz.network.redraw();
  }

  draw() {
    const config: any = {
      containerId: 'viz',

      neo4j: {
        ...Neo4jConfig,
        serverUrl: `bolt://${this.angularIp}:${this.neo4jPort}`,
      },
      labels: {
        ...LabelConfig,
      },

      visConfig: {
        nodes: {
          hidden: false,
          size: 30,
          font: {
            color: '#343434',
            size: 20, // px
            face: 'pretendard',
            strokeWidth: 2, // px
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
        // 여기에 배경색을 설정합니다
        interaction: {
          hover: true,
          // navigationButtons: true,
        },
        configure: {
          enabled: false,
        },
        manipulation: {
          enabled: false,
        },
      },
      relationships: {
        ...RealtionshipConfig,
      },
      initialCypher: 'MATCH (n) RETURN * LIMIT 1',
    };

    this.viz = new NeoVis(config);
    this.viz.render();

    // 결과 배열 초기화
    const result: string[] = [];

    this.viz.registerOnEvent('completed', () => {
      /**
       * 노드를 선택했을때 이벤트
       */
      this.viz.network.on('selectNode', (properties: any) => {
        /**
         *  Related Node 메소드 구현....
         */

        // 클릭된 노드의 ID
        const clickedNodeId = properties.nodes[0];
        this.clickOff = clickedNodeId;

        // 2. 연관된 노드 찾기
        const connectedNodes =
          this.viz.network.getConnectedNodes(clickedNodeId);

        // 원본 노드 이미지 변경
        const nodeImageChange =
          this.viz.network.body.data.nodes.get(clickedNodeId);
        if (nodeImageChange.image && nodeImageChange.image.endsWith('_4.png')) {
          console.log('노드 이미지 찾음:', nodeImageChange.image);
          const updatedImage = nodeImageChange.image.replace(
            '_4.png',
            '_3.png'
          ); // 이미지 주소 변경
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

        // 결과 확인
        this.groupedNodes.forEach((values, key) => {
          console.log(`Group: ${key}, Values:`, values);
        });

        const edgeLength: number = properties.edges.length;
        console.log('Edge 길이:::', edgeLength);
        const edgeNumber: any = [];
        if (edgeLength == 1) {
          edgeNumber.push(properties.edges[0]);
        } else {
          properties.edges.forEach((edge: any) => {
            edgeNumber.push(edge);
          });
        }
        console.log('Edge 결과물:::', edgeNumber);

        const selectedNodeId = properties.nodes[0]; // 선택된 노드의 ID
        console.log('노드 ', properties);

        //아이디 문자열 (그룹노드) 일때 예외처리
        if (typeof selectedNodeId !== 'number') {
          console.log('그룹노드:::', selectedNodeId);
          return;
        }

        const selectedNode =
          this.viz.network.body.data.nodes.get(selectedNodeId);

        console.log('선택된 노드::', selectedNode);

        // 노드 정보 표출하기
        this.onNodeClick(selectedNode);

        // 인접노드 관계정보 가져오기
        this.logAdjacentNodesAndRelationships(selectedNodeId);
      });

      //노드 선택 해제 시
      this.viz.network.on('deselectNode', (params: any) => {
        const nodeId = this.clickOff;
        const connectedNodes = this.viz.network.getConnectedNodes(nodeId);

        // 원본 노드 이미지 변경
        const nodeImageChange = this.viz.network.body.data.nodes.get(nodeId);
        if (nodeImageChange.image && nodeImageChange.image.endsWith('_3.png')) {
          console.log('노드 이미지 찾음:', nodeImageChange.image);
          const updatedImage = nodeImageChange.image.replace(
            '_3.png',
            '_4.png'
          ); // 이미지 주소 변경
          nodeImageChange.image = updatedImage;
          this.viz.network.body.data.nodes.update(nodeImageChange);
        }

        connectedNodes.forEach((connectedNodeId: any) => {
          const node = this.viz.network.body.data.nodes.get(connectedNodeId);

          if (node.image && node.image.endsWith('_3.png')) {
            const updatedImage = node.image.replace('_3.png', '_4.png');
            node.image = updatedImage;
            this.viz.network.body.data.nodes.update(node);
          }
        });
      });

      // 더블클릭 event
      this.viz.network.on('doubleClick', (properties: any) => {
        const clickedNodeIds = properties.nodes;
        console.log(clickedNodeIds);
        if (clickedNodeIds[0] == 'keyword') {
          console.log('키워드 더블클릭');
          return;
        }
        const clickedNodeEdgesInfo = properties.edges;
        const clickedNodeEdgesLength = properties.edges.length;
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
        } else {
          console.log('노드를 향해 더블클릭 하시오');
        }

        const typeEdgeToObj = typeof edgeToObj;

        if (clickedNodeIds.length > 0) {
          const clickedNodeId = clickedNodeIds[0];
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
              if (parentLabel == 'keyword') {
                // 엣지 갯수 가져오기 test
                console.log(clickedNodeId);
                // console.log(
                //   this.viz.network.body.data.edges.get(clickedNodeId)
                // );
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

                if (count == 0 || count >= 10) {
                  // 보낼 객체 type과 target 보내기
                  const reqObj: any = {
                    type: clickedNodeId,
                    word: this.targetWord,
                    limit: count,
                  };
                  console.log('자 count 보낸다', count);
                  this.apiKeywordFromGroupNode(reqObj);
                }
              } else {
                // 여기부터 다시 하위 그룹노드 만들기

                // 엣지 갯수 가져오기 test
                console.log(clickedNodeId);
                console.log(
                  this.viz.network.body.data.edges.get(clickedNodeId)
                );
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
                // if (count == 0 || count >= 10) { // 좌측 노드 클릭 후 더블클릭 시 안되 잠시 주석처리
                //   // 보낼 객체 type과 target 보내기
                //   const reqObj: any = {
                //     type: clickedNodeId,
                //     word: this.targetWord,
                //     limit: count,
                //   };
                //   console.log('자 count 보낸다', count);
                //   this.apiLowGroupNodeAddFromGroupNode(reqObj, clickedNodeId);
                // }
                if (count == 0 || count >= 1) {
                  // 좌측 노드 클릭 후 더블클릭 시 안되 잠시 주석처리
                  // 보낼 객체 type과 target 보내기
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
            const findNode =
              this.viz.network.body.data.nodes.get(clickedNodeId);
            const findNodeType = findNode.raw.properties.type;
            console.log('타입찾자:', findNode);
            const reqObj: any = {
              type: findNodeType,
              id: clickedNodeId,
              word: this.targetWord,
            };

            // 이곳부터 새로운 하위노드 생성
            this.apiAllNodeGet(reqObj);
          }
        }
      });
    });
  }

  selectedGroups: string[] = []; // 선택된 그룹들을 저장하는 배열

  toggleFullScreen() {
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

  zoomIn() {
    const scale = this.viz.network.getScale();
    this.viz.network.moveTo({
      scale: scale * 1.2,
    });
  }

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

  focusCount: number = 0;
  focusNode(nodeId: any) {
    this.focusCount++;
    // 연속으로 추가 한 경우 그 전에 있던 노드 비활성화 처리
    if (this.focusCount >= 2) {
      // 전의 노드 이미지 변경
      const nodeImageChange = this.viz.network.body.data.nodes.get(
        this.clickOff
      );
      if (nodeImageChange.image && nodeImageChange.image.endsWith('_3.png')) {
        console.log('노드 이미지 찾음:', nodeImageChange.image);
        const updatedImage = nodeImageChange.image.replace('_3.png', '_4.png'); // 이미지 주소 변경
        nodeImageChange.image = updatedImage;
        this.viz.network.body.data.nodes.update(nodeImageChange);
        // 변경 후 비활성화 시 담을 노드 아이디
        this.clickOff = nodeId;
      }
    } else {
      this.clickOff = nodeId;
    }
    this.viz.network.focus(nodeId, {
      scale: 1.0, // 원하는 스케일로 설정
      animation: {
        duration: 1000,
        easingFunction: 'easeInOutQuad',
      },
    });

    // 해당 노드 선택하기
    this.viz.network.selectNodes([nodeId]);

    // 원본 노드 이미지 변경
    const nodeImageChange = this.viz.network.body.data.nodes.get(nodeId);
    if (nodeImageChange.image && nodeImageChange.image.endsWith('_4.png')) {
      console.log('노드 이미지 찾음:', nodeImageChange.image);
      const updatedImage = nodeImageChange.image.replace('_4.png', '_3.png'); // 이미지 주소 변경
      nodeImageChange.image = updatedImage;
      this.viz.network.body.data.nodes.update(nodeImageChange);
    }
  }

  // 더보기 버튼
  // shouldShowMoreButton(relatedNode: any): boolean {
  //   return (
  //     relatedNode &&
  //     relatedNode['value'] &&
  //     relatedNode['value'].combined &&
  //     relatedNode['value'].combined.length > 10
  //   );
  // }
  shouldShowMoreButton(relatedNode: any): boolean {
    const currentCount = this.displayedItemsCount[relatedNode.key] || 0; // 현재 표시된 항목 수
    const totalCount = relatedNode?.['value']?.combined?.length || 0; // 전체 항목 수
    return currentCount < totalCount;
  }

  displayedItemsCount: { [key: string]: number } = {};
  //더 보기
  increaseDisplayedItems(key: string) {
    if (!this.displayedItemsCount[key]) {
      this.displayedItemsCount[key] = 10; // 처음에 10개 항목을 표시
    } else {
      this.displayedItemsCount[key] += 10; // 클릭할 때마다 10개씩 증가
    }
  }

  apiKeywordFromGroupNode(params: any) {
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/hnkgd`,
        params
      )
      .subscribe((response: any) => {
        console.log(response);
        response.forEach((element: any) => {
          const rawId = element.m.identity.low;
          const rawName = element.m.properties.name;
          const rawProperties = element.m.properties;
          let rawType = element.m.properties.type;
          if (rawType == 'windows-registry-key') {
            rawType = 'registry';
          }
          const edgeLabel = element.relationshipTypes[0];
          const nodeId = params.type;
          // 만약 기존에 이미 노드가 추가되어있을 경우 relation만 추가
          if (this.viz.network.body.data.nodes.get(rawId)) {
            //그룹노드와 원본노드 엣지 추가
            this.viz.network.body.data.edges.add({
              label: edgeLabel,
              // id: rawId,
              from: nodeId,
              to: rawId,
            });
          } else {
            this.viz.network.body.data.nodes.add({
              id: rawId,
              label: rawName,
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
              // id: rawId,
              from: nodeId,
              to: rawId,
            });
            this.chart();
          }
        });
      });
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
            let groupLabel = response.data.mTypes[i];
            if (groupLabel == 'email') {
              groupLabel = 'Email';
            } else if (groupLabel == 'windows-registry-key') {
              groupLabel = 'registry';
            }
            let rawId = params.id;
            // 만약 그룹 노드가 이미 있을 경우
            let findGroupNodeId = groupLabel + '_from_' + rawId;
            if (this.viz.network.body.data.nodes.get(findGroupNodeId)) {
              console.log('그룹노드가 이미 있으니 해당 그룹노드 추가는 건너뜀');
            } else {
              this.viz.network.body.data.nodes.add({
                id: groupLabel + '_from_' + rawId,
                label: groupLabel,
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
      });
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
      });
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
        const label = response.groupLabel;
        const relationLabel = response.relationLabel;
        // 이미 있는 그룹노드인지 확인
        const findGroupNodeId = label + '_from_' + rawId;
        if (this.viz.network.body.data.nodes.get(findGroupNodeId)) {
          console.log('해당 노드는 이미 존재하니 건너뜀');
        } else {
          this.viz.network.body.data.nodes.add({
            id: label + '_from_' + rawId,
            label: label,
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
            // id: rawId,
            label: relationLabel,
            from: rawId,
            to: label + '_from_' + rawId,
          });
        }
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
            let groupLabel = element['m.type'];
            // if (groupLabel == 'domain-name') {
            //   groupLabel = 'domain_name';
            // }
            this.viz.network.body.data.nodes.add({
              id: groupLabel + '_from_' + rawId,
              label: groupLabel,
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
          const lowType = response.data[0]['m.type'];
          const highGroupNode =
            this.viz.network.body.data.edges.get(nodeId).from;
          if (lowType != highGroupNode) {
            //서로 다른 노드일때 그룹노드 생성
            this.viz.network.body.data.nodes.add({
              id: lowType + '_from_' + rawId,
              label: lowType,
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
        response.forEach((element: any) => {
          console.log('1068 찾아보자', element);
          const rawId = element.m.identity.low;
          const rawName = element.m.properties.name;
          const rawType = element.m.properties.type;
          const rawProperties = element.m.properties;
          const edgeLabel = element.rels[0].type;

          // ID가 이미 존재하는지 확인
          if (!this.viz.network.body.data.nodes.get(rawId)) {
            this.viz.network.body.data.nodes.add({
              id: rawId,
              label: rawName,
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
              // id: rawId,
              from: nodeId,
              to: rawId,
            });
            this.chart();
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
                // id: rawId,
                from: nodeId,
                to: rawId,
                // from: rawId,
                // to: nodeId,
              });
            }
          }
        });
      });
  }

  onNodeClick(nodeData: any) {
    console.log('Selected node :', nodeData);
    console.log('Selected node label:', nodeData.label);
    // 선택된 노드의 데이터를 컴포넌트의 상태로 설정합니다.
    this.selectedNodeData = nodeData;
  }

  // 선택된 노드 데이터를 키-값 쌍의 배열로 변환합니다.
  get nodeDataArray() {
    // `selectedNodeData.raw.properties` 객체를 기준으로 키-값 쌍 배열을 생성합니다.
    return this.selectedNodeData
      ? Object.keys(this.selectedNodeData.raw.properties).map((key) => ({
          key,
          value: this.selectedNodeData.raw.properties[key],
        }))
      : [];
  }

  /**
   *
   * 첫 진입시 그래프 생성 api
   */
  apiRequest(params: any) {
    this.http
      .post(
        `http://${this.angularIp}:${this.backendNodeExpressPort}/api/data`,
        params
      )
      .subscribe((response: any) => {
        // console.log(response);
        if (response.label == 'keyword') {
          this.firstGraphKeyword(response);
        } else if (response.label == 'name') {
          this.firstGraphName(response);
        }
        this.loadingVisibility = 'hidden';
        this.visibility = 'visible';
        // this.chart();
      });
  }

  firstGraphName(response: any) {
    this.viz.network.setData({ nodes: [], edges: [] });
    console.log('네임 노드 상위그룹노드 생성', response);
    let name = response.data[0].n.labels[0];
    this.viz.network.body.data.nodes.add({
      id: name,
      label: name,
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
    let rawId = parseInt(response.data[0].n.elementId);
    let rawLabel = response.data[0].n.labels[0];
    let rawProperties = response.data[0].n.properties;
    console.log(this.viz.network.body.data.nodes);
    console.log('결과물:::', rawId, rawLabel);
    console.log('rawProperties:', rawProperties);
    this.viz.network.body.data.nodes.add({
      id: rawId,
      label: rawProperties.name,
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
    //그룹노드와 원본노드 엣지 추가
    this.viz.network.body.data.edges.add({
      id: name + '_Group',
      from: name,
      to: rawId,
    });
    this.chart();
  }

  firstGraphKeyword(response: any) {
    this.viz.network.setData({ nodes: [], edges: [] });
    console.log('키워드 노드 생성 및 하위 그룹노드 생성', response);
    // 키워드 노드
    this.viz.network.body.data.nodes.add({
      id: 'keyword',
      label: 'keyword',
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
      console.log(element['n.type']);
      let type = element['n.type'];
      this.viz.network.body.data.nodes.add({
        id: type,
        label: type,
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
    });
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
        const rawType = response[0].n.properties.type;
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
          const groupLabel = rawType;
          if (!this.viz.network.body.data.nodes.get(word)) {
            console.log(this.viz.network.body.data.nodes.get(word));
            console.log('그룹노드 없음');
            this.viz.network.body.data.nodes.add({
              // id: groupLabel + '_from_' + rawId,
              id: word,
              label: groupLabel,
              shape: 'image',
              title: groupLabel,
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
            label: rawName,
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
              label: rType,
              from: highNodeId,
              to: rawId,
            });
          } else {
            this.viz.network.body.data.edges.add({
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
        } else {
          console.log('포커스 이벤트 발동');
          this.focusNode(rawId);
        }
      });
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

  async logAdjacentNodesAndRelationships(nodeId: any) {
    const query = `
    MATCH (n)-[r]-(m)
    WHERE ID(n) = ${nodeId}
    RETURN n, r, m    
  `;
    console.log(nodeId, '로 관계정보 탐색중...');
    try {
      const result = await this.neo4jService.runQuery(query);

      console.log('결과값::', result);

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

      console.log('Query Result Length:', result.length);
      // console.log('Query Result:', result);
      // console.log(`Adjacent nodes and relationships for node ${nodeId}:`);
      const highNodeId = nodeId;
      result.forEach((record: any) => {
        const [node, relationship, relatedNode] = record._fields;
        const relType = relationship.type;
        const relatedNodeType = relatedNode.properties.type;
        const nodeName = relatedNode.properties.name;
        const nodeId = relatedNode.identity.low;
        const highNodeIdValue = highNodeId;
        // console.log(nodeId);

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
        // return { type: key, data: this.menuData[key] };
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
      console.log('Type Info:', typeInfo);
      console.log('구조 확인::', this.menuDataArray);
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

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

// 타입 인터페이스를 정의합니다.
interface RelatedNodeType {
  count: number;
  values: string[];
  isExpanded?: boolean; // 추가된 속성
}

interface RelationshipType {
  count: number;
  relatedNodeTypes: {
    [key: string]: RelatedNodeType;
  };
}

interface MenuItem {
  type: string;
  data: {
    count: number;
    relatedNodeTypes: { [key: string]: RelatedNodeType };
  };
  isExpanded?: boolean; // isExpanded 속성 추가
}

interface RelatedNodeType {
  count: number;
  values: string[];
  isExpanded?: boolean; // isExpanded 속성 추가
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  url: string = 'http://localhost:3000/api/greet';
  message: string = ''; // api 테스트
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

  constructor(
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
    this.getMessage();
  }

  // 초기화
  ngOnInit(): void {
    this.draw();
    this.ngxFavicon.setFavicon('../assets/images/favicon.ico');
  }

  draw() {
    const config: any = {
      containerId: 'viz',

      neo4j: {
        ...Neo4jConfig,
      },
      labels: {
        ...LabelConfig,
      },
      visConfig: {
        nodes: {
          size: 30,
          font: {
            color: '#343434',
            size: 20, // px
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
            size: 15, // px
            face: 'pretendard',
            strokeWidth: 2, // px
            // strokeColor: "blue",
          },
        },
      },
      relationships: {
        ...RealtionshipConfig,
      },
      initialCypher: 'MATCH (m)-[r]->(n) RETURN * LIMIT 1',
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
        // console.log('선택된 노드의 ID:', properties.nodes[0]);
        // console.log('모든 노드:', this.viz.network.body.data.nodes.get());
        // console.log('Edge::', properties.edges);
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

        // edgeNumber.forEach((edge: any) => {
        //   console.log(edge);
        //   console.log(this.viz.network.body.data.edges.get(edge));
        //   const edgeLabel = this.viz.network.body.data.edges.get(edge).from;
        //   const selectedNodeLabel = properties.nodes[0];
        //   console.log(edgeLabel);
        //   console.log(selectedNodeLabel);
        //   // from이 자신의 label이 아닐경우
        //   if (selectedNodeLabel != edgeLabel) {
        //     console.log('from이 자신의 label이 아닐경우');
        //     const findNode = this.viz.network.body.data.nodes.get(edgeLabel);
        //     console.log(findNode);
        //   }
        // });
        /**
         * 깊이 탐색
         */
        // console.log('깊이탐색중....', properties);
        // const dfsId = properties.nodes;
        // const dfsnode = this.viz.network.body.data.nodes.get(dfsId);
        // const dfsedge = this.viz.network.body.data.edges.get(dfsId);
        // console.log(dfsnode, dfsedge);
        // if (dfsedge) {
        //   const deepdfsdge = this.viz.network.body.data.edges.get(dfsedge.from);
        //   console.log('깊은탐색 타겟:::', dfsedge.from);

        //   console.log('깊은 탐색중...', deepdfsdge);
        // }
        /**
         * 노드 정보, 관계정보 메소드
         */
        // const selectedNodeId = properties.nodes[0];

        const selectedNodeId = properties.nodes[0]; // 선택된 노드의 ID
        console.log('노드 ', properties);

        // if (selectedNodeId) {
        //   const connectedEdges =
        //     this.viz.network.getConnectedEdges(selectedNodeId); // 선택된 노드와 연결된 엣지 가져오기

        //   let parentNodes: any = [];

        //   connectedEdges.forEach((edgeId: any) => {
        //     const edge = this.viz.network.body.data.edges.get(edgeId);

        //     if (edge.to === selectedNodeId) {
        //       parentNodes.push(edge.from); // 'from' 노드는 부모 노드로 간주
        //     }
        //   });

        //   console.log('Parent Nodes:', parentNodes);
        // }
        if (selectedNodeId) {
          const allParentNodes = this.findParentNodes(selectedNodeId);
          console.log('All Parent Nodes:', allParentNodes);
        }

        //아이디 문자열 (그룹노드) 일때 예외처리
        if (typeof selectedNodeId !== 'number') {
          console.log('그룹노드:::', selectedNodeId);
          return;
        }

        // if(properties.nodes[0])
        // const selectedNode = this.viz.nodes.get(selectedNodeId);
        const selectedNode =
          this.viz.network.body.data.nodes.get(selectedNodeId);

        console.log('선택된 노드::', selectedNode);

        // 노드 정보 표출하기
        this.onNodeClick(selectedNode);

        // 인접노드 관계정보 가져오기
        this.logAdjacentNodesAndRelationships(selectedNodeId);
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
        const edgeToObj = clickedNodeEdgesInfoDetail[0].to;
        const typeEdgeToObj = typeof edgeToObj;
        // console.log('to 확인:::', edgeToObj);
        // console.log('더블클릭한 노드의 edge 정보:', clickedNodeEdgesInfo);
        // console.log('더블클릭한 노드의 edge 길이:', clickedNodeEdgesLength);
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
              // 여기부터 다시 하위 그룹노드 만들기
              // 보낼 객체 type과 target 보내기
              const reqObj: any = {
                type: clickedNodeId,
                word: this.targetWord,
              };
              this.apiLowGroupNodeAddFromGroupNode(reqObj, clickedNodeId);
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
            // this.apiLowGroupNodeAddFromLowNode(reqObj, clickedNodeId);

            // 이곳부터 새로운 하위노드 생성
            this.apiAllNodeGet(reqObj);
          }
        }
      });
    });
  }

  apiAllNodeGet(params: any) {
    this.http
      .post('http://localhost:3000/api/all/node', params)
      .subscribe((response: any) => {
        console.log(response);
        const multiBoolean = response.multi;
        if (multiBoolean) {
          console.log('다중노드 발견');
          console.log('더블클릭 한 노드 id:', params.id);
          response.data.forEach((element: any) => {
            console.log(element);
            let groupLabel = element;
            let rawId = params.id;
            // if (groupLabel == 'domain-name') {
            //   groupLabel = 'domain_name';
            // }
            this.viz.network.body.data.nodes.add({
              id: groupLabel + '_from_' + rawId,
              label: groupLabel,
              shape: 'image',
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
              label: response.rel[0],
              from: rawId,
              to: groupLabel + '_from_' + rawId,
            });
          });
        } else if (!multiBoolean) {
          console.log('다중노드 아니고 상위 노드와 같은지 비교 로직 필요');
          console.log(response.data[0]);
          const connEdge = this.viz.network.getConnectedEdges(params.id);
          // let edge:any;
          let connEdgeLabel;
          console.log(connEdge);
          connEdge.forEach((edgeId: any) => {
            const edge = this.viz.network.body.data.edges.get(edgeId);
            console.log(edge);
            connEdgeLabel = edge.from.replace(/_from_\d+$/, '');
            console.log(connEdgeLabel); // "vulnerability"가 출력됩니다.
          });
          if (response.data[0] == connEdgeLabel) {
            console.log(
              '서로 같은 라벨 노드그룹 만들필요 없이 바로 하위 노드 연결 로직 필요'
            );
          } else if (response.data[0] != connEdgeLabel) {
            console.log('서로 다른 라벨 노드그룹 만들필요 로직');
            const req = {
              type: response.data[0],
              id: params.id,
            };
            this.anotherLabelAddNodeGroup(req);
          }
        }
      });
  }

  //서로 다른 라벨 노드그룹 만들기
  anotherLabelAddNodeGroup(req: any) {
    const rawId = req.id;
    this.http
      .post('http://localhost:3000/api/other/ng', req)
      .subscribe((response: any) => {
        console.log(response);
        const label = response.groupLabel;
        const relationLabel = response.relationLabel;
        this.viz.network.body.data.nodes.add({
          id: label + '_from_' + rawId,
          label: label,
          shape: 'image',
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
      .post('http://localhost:3000/api/lgnafln', params)
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
              shape: 'image',
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
              shape: 'image',
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
      .post('http://localhost:3000/api/lgnafgn', params)
      .subscribe((response: any) => {
        console.log(response);
        console.log('응답 노드 갯수:::', response.data.length);
        let count = 0;
        response.data.forEach((element: any) => {
          console.log(element);
          // 값들
          const rawId = parseInt(element.n?.elementId || element.m?.elementId);
          const rawProperties = element.n?.properties || element.m?.properties;
          const rawName =
            element.n?.properties.name || element.m?.properties.name;
          const rawType =
            element.n?.properties.type || element.m?.properties.type;

          this.viz.network.body.data.nodes.add({
            id: rawId,
            label: rawName,
            shape: 'image',
            image: `../assets/images/${rawType}/${rawType}_3.png`,
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
            id: rawId,
            from: nodeId,
            to: rawId,
          });
          count++;
          if (count == 10) return;
        });
      });
  }

  // groupNodeAdd() {
  //   this.viz.network.body.data.nodes.add({
  //     id: 'Report',
  //     label: 'Report',
  //     visConfig: {
  //       nodes: {
  //         size: 55,
  //         font: {
  //           // background: 'black',
  //           color: '#343434',
  //           size: 30, // px
  //           face: 'pretendard',
  //           strokeWidth: 2, // px
  //           // strokeColor: "blue",
  //         },
  //       },
  //       edges: {
  //         arrows: {
  //           to: { enabled: true },
  //         },
  //         font: {
  //           // background: 'black',
  //           color: '#343434',
  //           size: 30, // px
  //           face: 'pretendard',
  //           strokeWidth: 2, // px
  //           // strokeColor: "blue",
  //         },
  //       },
  //     },
  //   });
  // }

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

  // getCurrentUrl(): void {
  //   this.router.events
  //     .pipe(filter((event) => event instanceof NavigationEnd))
  //     .subscribe(() => {
  //       this.currentUrl = this.router.url;
  //       console.log('Now Address: ', this.currentUrl);
  //     });
  // }

  /**
   *
   * 첫 진입시 그래프 생성 api
   */
  apiRequest(params: any) {
    this.http
      .post('http://localhost:3000/api/data', params)
      .subscribe((response: any) => {
        // console.log(response);
        if (response.label == 'keyword') {
          this.firstGraphKeyword(response);
        } else if (response.label == 'name') {
          this.firstGraphName(response);
        }
      });
  }

  firstGraphName(response: any) {
    this.viz.network.setData({ nodes: [], edges: [] });
    console.log('네임 노드 상위그룹노드 생성', response);
    let name = response.data[0].n.labels[0];
    this.viz.network.body.data.nodes.add({
      id: name,
      label: name,
      shape: 'image',
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
      shape: 'image',
      image: `../assets/images/${rawLabel}/${rawLabel}_3.png`,
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
  }

  firstGraphKeyword(response: any) {
    this.viz.network.setData({ nodes: [], edges: [] });
    console.log('키워드 노드 생성 및 하위 그룹노드 생성', response);
    // 키워드 노드
    this.viz.network.body.data.nodes.add({
      id: 'keyword',
      label: 'keyword',
      shape: 'image',
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
        image: `../assets/images/${type}/${type}_1.png`,
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
      //엣지 추가
      this.viz.network.body.data.edges.add({
        id: type + '_Group',
        from: 'keyword',
        to: type,
      });
    });
  }

  menuData: { [key: string]: RelationshipType } = {};
  menuDataArray: MenuItem[] = [];

  toggleMenu(index: number): void {
    // 모든 메뉴 항목의 isExpanded 상태를 false로 설정
    this.menuDataArray.forEach((item) => (item.isExpanded = false));
    // 클릭된 메뉴 항목의 isExpanded 상태를 토글
    this.menuDataArray[index].isExpanded =
      !this.menuDataArray[index].isExpanded;
  }

  toggleSubMenu(i: number, key: string): void {
    // 모든 두 번째 메뉴 항목의 isExpanded 상태를 false로 설정
    Object.values(this.menuDataArray[i].data.relatedNodeTypes).forEach(
      (item: RelatedNodeType) => (item.isExpanded = false)
    );

    // 클릭된 두 번째 메뉴 항목의 isExpanded 상태를 토글
    this.menuDataArray[i].data.relatedNodeTypes[key].isExpanded =
      !this.menuDataArray[i].data.relatedNodeTypes[key].isExpanded;
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

      // 데이터를 정리하는 객체를 초기화합니다.
      const typeInfo: {
        [relType: string]: {
          count: number;
          relatedNodeTypes: {
            [relatedNodeType: string]: {
              count: number;
              values: string[];
            };
          };
        };
      } = {};

      console.log('Query Result Length:', result.length);
      // console.log('Query Result:', result);
      // console.log('Query Result:', result);
      // console.log(`Adjacent nodes and relationships for node ${nodeId}:`);

      result.forEach((record: any) => {
        const [node, relationship, relatedNode] = record._fields;

        const relType = relationship.type;
        const relatedNodeType = relatedNode.properties.type;
        const nodeName = relatedNode.properties.name;

        // 콘솔에 로깅
        // console.log('Node:', node.properties);
        // console.log('Relationship:', {
        //   type: relationship.type,
        //   startNodeElementId: relationship.startNodeElementId,
        //   endNodeElementId: relationship.endNodeElementId,
        //   properties: relationship.properties,
        // });
        // console.log('Related Node:', relatedNode.properties);

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
          };
        }

        // 해당 관련 노드 타입의 count를 증가시킵니다.
        typeInfo[relType].relatedNodeTypes[relatedNodeType].count += 1;

        // 노드의 이름을 추가합니다.
        typeInfo[relType].relatedNodeTypes[relatedNodeType].values.push(
          nodeName
        );

        // 해당 관계 타입의 count를 증가시킵니다.
        typeInfo[relType].count += 1;
      });

      this.menuData = typeInfo;
      this.menuDataArray = Object.keys(this.menuData).map((key) => {
        return { type: key, data: this.menuData[key] };
      });
      console.log('Type Info:', typeInfo);
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

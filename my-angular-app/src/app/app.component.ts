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
  visibility: string = 'hidden'; // 기본값은 hidden으로 설정
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
  clickOff: any;
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
          // hidden: true,
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
      initialCypher: 'MATCH (n) RETURN * LIMIT 1',
    };

    this.viz = new NeoVis(config);
    this.viz.render();
    // 선택 해제 시 넘겨주기 위한 노드 아이디

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

        // 클릭된 노드의 ID
        const clickedNodeId = properties.nodes[0];
        this.clickOff = clickedNodeId;
        // 2. 연관된 노드 찾기
        const connectedNodes =
          this.viz.network.getConnectedNodes(clickedNodeId);

        // 3. 이미지 변경
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
        //   const allParentNodes = this.findParentNodes(selectedNodeId);
        //   console.log('All Parent Nodes:', allParentNodes);
        // }

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
        // console.log('선택 해제:', params);
        // const nodeId = params.previousSelection.nodes[0];
        const nodeId = this.clickOff;
        const connectedNodes = this.viz.network.getConnectedNodes(nodeId);

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
                // console.log('keyword 하위 노드라 다른 api 접근 처리 로직 필요');
                // const reqObj: any = {
                //   type: clickedNodeId,
                //   word: this.targetWord,
                // };
                // this.apiKeywordFromGroupNode(reqObj);

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
                if (count == 0 || count >= 10) {
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
            // this.apiLowGroupNodeAddFromLowNode(reqObj, clickedNodeId);

            // 이곳부터 새로운 하위노드 생성
            this.apiAllNodeGet(reqObj);
          }
        }
      });
    });
  }

  apiKeywordFromGroupNode(params: any) {
    this.http
      .post('http://localhost:3000/api/hnkgd', params)
      .subscribe((response: any) => {
        console.log(response);
        response.forEach((element: any) => {
          const rawId = element.m.identity.low;
          const rawName = element.m.properties.name;
          const rawProperties = element.m.properties;
          const rawType = element.m.properties.type;
          const edgeLabel = element.relationshipTypes[0];
          const nodeId = params.type;
          this.viz.network.body.data.nodes.add({
            id: rawId,
            label: rawName,
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
          for (var i = 0; i < response.data.mTypes.length; i++) {
            let groupLabel = response.data.mTypes[i];
            if (groupLabel == 'email') groupLabel = 'Email';
            let rawId = params.id;
            this.viz.network.body.data.nodes.add({
              id: groupLabel + '_from_' + rawId,
              label: groupLabel,
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
        } else if (!multiBoolean) {
          console.log('다중노드 아니고 상위 노드와 같은지 비교 로직 필요');
          console.log(response.data);
          const connEdge = this.viz.network.getConnectedEdges(params.id);
          let connEdgeLabel;
          console.log(connEdge);
          connEdge.forEach((edgeId: any) => {
            const edge = this.viz.network.body.data.edges.get(edgeId);
            console.log(edge);
            connEdgeLabel = edge.from.replace(/_from_\d+$/, '');
            console.log(connEdgeLabel);
          });
          if (response.data[0] == connEdgeLabel) {
            console.log(
              '서로 같은 라벨 노드그룹 만들필요 없이 바로 하위 노드 연결 로직 필요'
            );
          } else if (response.data[0] != connEdgeLabel) {
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
    console.log(updatedImage); // 예상 결과: "../assets/images/url12/url_2.png"
    // this.viz.network.body.data.nodes.get(nodeId).image = updatedImage;
    const updatedNode = { ...node, image: updatedImage };
    this.viz.network.body.data.nodes.update(updatedNode);
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
        response.forEach((element: any) => {
          console.log(element);
          const rawId = element.m.identity.low;
          const rawName = element.m.properties.name;
          const rawType = element.m.properties.type;
          const rawProperties = element.m.properties;
          const edgeLabel = element.r.type;

          // ID가 이미 존재하는지 확인
          if (!this.viz.network.body.data.nodes.get(rawId)) {
            this.viz.network.body.data.nodes.add({
              id: rawId,
              label: rawName,
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
          } else {
            console.warn(`Node with ID ${rawId} already exists!`);
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
        this.visibility = 'visible';
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

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
  /**
   * URL 쿼리 문자열
   */
  apiData: any = [];

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
          console.log(params);
          // ... 기타 코드
          for (let key in params) {
            if (params.hasOwnProperty(key)) {
              this.apiData.push({ key: key, value: params[key] });
            }
          }
          console.log(this.apiData);
          this.apiRequest(this.apiData);
        });
      });
    this.getMessage();
    // this.getCurrentUrl();
  }

  // 초기화
  ngOnInit(): void {
    this.cyperQueryRel = 'refers_to';
    // this.initialCypher = `MATCH (n)-[r:${this.cyperQueryRel}]->(m) RETURN n,r,m LIMIT 100`;
    this.initialCypher =
      'MATCH (n)-[r]->(m) RETURN n, r, m, TYPE(r) AS type LIMIT 10';
    this.draw();
    this.ngxFavicon.setFavicon('../assets/images/favicon.ico');
    this.neo4jService
      .runQuery('MATCH (n)-[r]->(m) RETURN n, r, m, type(r) LIMIT 10')
      .then((records) => {
        console.log('Query result:', records);
      });
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
          size: 55,
          font: {
            // background: 'black',
            color: '#343434',
            size: 30, // px
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
            size: 30, // px
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
    // console.log('viz result:::', this.viz);

    this.viz.render();
    // this.viz.network.setData({ nodes: [], edges: [] });

    // 결과 배열 초기화
    const result: string[] = [];
    this.viz.registerOnEvent('completed', () => {
      // this.groupNodeAdd();
      // console.log(this.viz._network); // Now, it should be available.
      console.log(this.viz.network);
      // Nodeimage 설정을 가져옵니다.
      // const nodeImages = Nodeimage;

      // 모든 노드를 순회합니다.
      // this.viz.nodes.forEach((node: any) => {
      //   console.log(node, '노드라벨', node.label);
      //   // 노드의 라벨을 확인합니다.
      //   const label = node.group; // 노드의 첫 번째 라벨을 가져옵니다.
      //   if (label == 'report') {
      //     // node.hidden = true;
      //     console.log('리포트 노드 확인');
      //     this.viz.network.body.data.edges.add({
      //       id: 'report_' + node.label,
      //       from: 'Report',
      //       to: node.id,
      //     });
      //   } else if (node.id == 'Report') {
      //     console.log('그룹노드 찾음');
      //     node.shape = 'image';
      //     node.image = '../assets/images/report/report_2.png';
      //   }

      //   // 라벨에 맞는 이미지를 찾습니다.
      //   const imageUrl = nodeImages[label];

      //   // 이미지 URL이 있으면, 노드의 이미지를 업데이트합니다.
      //   if (imageUrl) {
      //     // console.log('이미지 찾음');
      //     node.shape = 'image';
      //     node.image = imageUrl;
      //   }
      //   this.viz.network.setData({
      //     nodes: this.viz.network.body.data.nodes,
      //     edges: this.viz.network.body.data.edges,
      //   });
      // });

      /**
       * 노드를 선택했을때 이벤트
       */
      this.viz.network.on('selectNode', (properties: any) => {
        /**
         *  Related Node 메소드 구현....
         */
        console.log('선택된 노드의 ID:', properties.nodes[0]);
        console.log('모든 노드:', this.viz.network.body.data.nodes.get());
        const edgeLength: number = properties.edges.length;
        console.log('Edge::', properties.edges);
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
        edgeNumber.forEach((edge: any) => {
          console.log(this.viz.network.body.data.edges.get(edge));
        });

        /**
         * 노드 정보, 관계정보 메소드
         */
        const selectedNodeId = properties.nodes[0];
        console.log('노드 ', properties);

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

      // 더블클릭
      this.viz.network.on('doubleClick', function (properties: any) {
        const clickedNodeIds = properties.nodes;
        if (clickedNodeIds.length > 0) {
          const clickedNodeId = clickedNodeIds[0];
          // 여기서 원하는 작업 수행
          console.log('노드가 더블클릭됨:', clickedNodeId);
        }
      });
    });
  }

  groupNodeAdd() {
    this.viz.network.body.data.nodes.add({
      id: 'Report',
      label: 'Report',
      visConfig: {
        nodes: {
          size: 55,
          font: {
            // background: 'black',
            color: '#343434',
            size: 30, // px
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
            size: 30, // px
            face: 'pretendard',
            strokeWidth: 2, // px
            // strokeColor: "blue",
          },
        },
      },
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
            size: 30, // px
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
            size: 30, // px
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
            size: 30, // px
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
            size: 30, // px
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
            size: 30, // px
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
            size: 30, // px
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
              size: 30, // px
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
              size: 30, // px
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

  target: number = 10;

  async logAdjacentNodesAndRelationships(nodeId: any) {
    const query = `
    MATCH (n)-[r]-(m)
    WHERE id(n) = ${nodeId}
    RETURN n, r, m
    limit ${this.target}
  `;

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

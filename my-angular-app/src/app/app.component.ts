import { Component, OnInit } from '@angular/core';
import { AngularFaviconService } from 'angular-favicon';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LabelConfig, Nodeimage } from './labelConfig';
import { Neo4jConfig } from './neo4jConfig';
import { Neo4jService } from './neo4j.service';
import NeoVis from 'neovis.js';

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

  constructor(
    private http: HttpClient,
    private router: Router,
    private ngxFavicon: AngularFaviconService,
    private neo4jService: Neo4jService
  ) {
    this.getMessage();
    this.getCurrentUrl();
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
        const nodesData: any = [];
        const edgesData: any = [];

        // records.forEach((record: any) => {
        //   const node_n = record.get('n');
        //   const node_m = record.get('m');
        //   const edge_r = record.get('r');
        //   const edge_type = record.get('type(r)');

        //   // Check if node_n and node_m are already in nodesData to avoid duplicate ids
        //   if (!nodesData.some((node: any) => node.id === node_n.identity.low)) {
        //     nodesData.push({
        //       id: node_n.identity.low,
        //       label: node_n.properties.name,
        //     });
        //   }
        //   if (!nodesData.some((node: any) => node.id === node_m.identity.low)) {
        //     nodesData.push({
        //       id: node_m.identity.low,
        //       label: node_m.properties.name,
        //     });
        //   }

        //   // Edge ids should also be unique. We might create a unique id by concatenating the ids of the connected nodes.
        //   const edgeId = `${node_n.identity.low}-${node_m.identity.low}`;
        //   if (!edgesData.some((edge: any) => edge.id === edgeId)) {
        //     edgesData.push({
        //       id: edgeId,
        //       from: node_n.identity.low,
        //       to: node_m.identity.low,
        //       label: edge_type,
        //     });
        //   }
        // });

        // console.log(nodesData);
        // console.log(edgesData);
        // // Move the clear and setData calls outside of the loop
        // // this.viz.clearNetwork();
        // this.viz.network.setData({
        //   nodes: nodesData,
        //   edges: edgesData,
        // });
        // console.log(this.viz.nodes.get());
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
        refers_to: {
          // title: 'type',
          // label: 'type',
          // thickness: 'weight',
        },
      },
      // initialCypher: this.initialCypher,
      initialCypher: 'match (n)-[r]->(m) return n,r,m limit 100',
    };

    this.viz = new NeoVis(config);
    console.log('viz result:::', this.viz);

    this.viz.render();

    this.viz.registerOnEvent('completed', () => {
      // console.log(this.viz._network); // Now, it should be available.
      console.log(this.viz.network);
      // Nodeimage 설정을 가져옵니다.
      const nodeImages = Nodeimage;

      // 모든 노드를 순회합니다.
      this.viz.nodes.forEach((node: any) => {
        console.log(node);
        // 노드의 라벨을 확인합니다.
        const label = node.group; // 노드의 첫 번째 라벨을 가져옵니다.

        // 라벨에 맞는 이미지를 찾습니다.
        const imageUrl = nodeImages[label];

        // 이미지 URL이 있으면, 노드의 이미지를 업데이트합니다.
        if (imageUrl) {
          // console.log('이미지 찾음');
          node.shape = 'image';
          node.image = imageUrl;
        }
        this.viz.network.setData({
          nodes: this.viz.network.body.data.nodes,
          edges: this.viz.network.body.data.edges,
        });
      });

      // 노드를 선택했을때 이벤트
      this.viz.network.on('selectNode', (properties: any) => {
        const selectedNodeId = properties.nodes[0];
        const selectedNode = this.viz.nodes.get(selectedNodeId);
        // 노드 정보 표출하기
        this.onNodeClick(selectedNode);

        // 인접노드 관계정보 가져오기
        this.logAdjacentNodesAndRelationships(selectedNodeId);
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

  getCurrentUrl(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl = this.router.url;
        console.log('Now Address: ', this.currentUrl);
      });
  }

  menuData: any;

  async logAdjacentNodesAndRelationships(nodeId: any) {
    const query = `
    MATCH (n)-[r]-(m)
    WHERE id(n) = ${nodeId}
    RETURN n, r, m
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

      console.log('Query Result:', result);
      console.log(`Adjacent nodes and relationships for node ${nodeId}:`);

      result.forEach((record: any) => {
        const [node, relationship, relatedNode] = record._fields;

        const relType = relationship.type;
        const relatedNodeType = relatedNode.properties.type;
        const nodeName = relatedNode.properties.name;

        // 콘솔에 로깅
        console.log('Node:', node.properties);
        console.log('Relationship:', {
          type: relationship.type,
          startNodeElementId: relationship.startNodeElementId,
          endNodeElementId: relationship.endNodeElementId,
          properties: relationship.properties,
        });
        console.log('Related Node:', relatedNode.properties);

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

      console.log('Type Info:', typeInfo);
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

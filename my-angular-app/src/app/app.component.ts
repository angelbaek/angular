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
  styleUrls: [
    './app.component.css',
    // '../assets/css/aos.css',
    // '../assets/css/basicClass.css',
    // '../assets/css/basicStyle.css',
    // '../assets/css/bootstrap.min.css',
    // '../assets/css/formStyle.css',
    // '../assets/css/swiper-bundle.css',
  ],
})
export class AppComponent implements OnInit {
  url: string = 'http://localhost:3000/api/greet';
  message: string = ''; // api 테스트
  currentUrl: string = ''; // 현재 브라우저 URL을 저장할 속성
  viz: any; // 그래프
  /**
   * 노드 인포 관련 객체
   */
  nodeInfoCreated: string = '';
  nodeInfoName: string = '';
  nodeInfoModified: string = '';
  nodeInfo: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private ngxFavicon: AngularFaviconService,
    private neo4jService: Neo4jService
  ) {
    this.getMessage();
    this.getCurrentUrl();
  }

  ngOnInit(): void {
    this.draw();
    this.ngxFavicon.setFavicon('../assets/images/favicon.ico');
    this.neo4jService
      .runQuery('MATCH (n)-[r:refers_to]->(m) RETURN n,r,m LIMIT 5')
      .then((records) => {
        console.log('Query result:', records);
      });
  }
  selectedNodeData: any;
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
          // shape: 'image',
          // image: '../assets/images/Email/Email_3.png',
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
          label: 'refers_to',
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
          // value: 'weight',
          thickness: '2',
          color: 'blue',
        },
      },
      // initialCypher: 'MATCH (n) RETURN n, labels(n)[0] as nodeLabel LIMIT 25',
      initialCypher: 'MATCH (n)-[r:refers_to]->(m) RETURN n,r,m LIMIT 100',
      // initialCypher: 'MATCH (n:Technique) RETURN n LIMIT 25',
    };

    this.viz = new NeoVis(config);
    console.log(this.viz);

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

  async logAdjacentNodesAndRelationships(nodeId: any) {
    const query = `
      MATCH (n)-[r]-(m)
      WHERE id(n) = ${nodeId}
      RETURN n, r, m
    `;

    try {
      const result = await this.neo4jService.runQuery(query);
      console.log('Query Result:', result);
      console.log('레코드', result[0]);
      console.log(`Adjacent nodes and relationships for node ${nodeId}:`);
      // result를 직접 순회합니다.
      result.forEach((record: any, index: any) => {
        const [node, relationship, relatedNode] = record._fields;

        // 콘솔에 로깅
        console.log(`Record ${index + 1}:`);
        console.log('Node:', node.properties);
        console.log('Relationship:', {
          type: relationship.type,
          startNodeElementId: relationship.startNodeElementId,
          endNodeElementId: relationship.endNodeElementId,
          properties: relationship.properties,
        });
        console.log('Related Node:', relatedNode.properties);
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

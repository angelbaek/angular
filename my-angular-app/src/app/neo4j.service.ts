import { Injectable } from '@angular/core';
import * as neo4j from 'neo4j-driver';
import { Neo4jConfig } from './neo4jConfig';

@Injectable({
  providedIn: 'root',
})
export class Neo4jService {
  private driver: any;

  constructor() {
    // Neo4j 드라이버 설정.
    // 'neo4j://your-neo4j-server-address' 를 실제 Neo4j 서버 주소로 교체하세요.
    // 'your-username' 과 'your-password' 를 실제 Neo4j 사용자 이름과 비밀번호로 교체하세요.
    this.driver = neo4j.driver(
      `neo4j://192.168.32.22`,
      neo4j.auth.basic('neo4j', 'root')
    );
  }

  // Cypher 쿼리를 실행하는 메서드
  async runQuery(query: string) {
    const session = this.driver.session();
    try {
      const result = await session.run(query);
      return result.records;
    } catch (error) {
      console.error('Error running query:', error);
    } finally {
      await session.close();
    }
  }
}

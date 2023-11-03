// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const neo4j = require("neo4j-driver");
const app = express();

const specificIp = "192.168.32.22";
const neo4jIp = "192.168.32.22";
const port = 3000;

//neo4j
const driver = neo4j.driver(
  `bolt://${neo4jIp}`,
  neo4j.auth.basic("neo4j", "root")
);

// CORS 미들웨어 사용
app.use(cors());
// JSON 요청 본문 파싱
app.use(bodyParser.json());

// 좌측 Relation Info api
app.post("/api/getAdjacentNodes", async (req, res) => {
  console.log("Relation Info api requests!");
  const nodeId = req.body.id;
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (n)-[r]-(m)
      WHERE ID(n) = ${nodeId}
      RETURN n, r, m
    `);
    console.log("Relation Info api res success!");
    res.json(result.records);
  } catch (error) {
    console.log("Relation Info api res failed!");
    res
      .status(500)
      .send({ error: "An error occurred while fetching data from Neo4j." });
  }
});

// 좌측 탭 클릭 노드 추가
app.post("/api/lsna", async (req, res) => {
  console.log(req.body);
  let id = req.body.id;
  const session = driver.session();
  try {
    const result = await session.run(
      // "match (n)-[r]-(m) where id(n) = $findId and m.type=$findType return m.type, r",
      "match (n)-[r]-(m) where id(n)=$findId return n,r limit 1",
      {
        findId: id,
      }
    );
    console.log("match (n)-[r]-(m) where id(n)=$findId return n,r limit 1", {
      findId: id,
    });
    const records = result.records.map((record) => record.toObject());
    console.log(records);
    records.forEach((element) => {
      if (element.n.properties.type == "windows-registry-key") {
        element.n.properties.type = "registry";
      }
    });
    res.json(records);
  } catch (error) {
    console.error(error); // 에러 로그 출력
    res.status(500).send(error.message);
  } finally {
    session.close();
  }
});

//하위노드 확장 시 다중그룹이 아닌 api

//상위 노드가 keyword인 그룹노드 더블클릭 시 api
app.post("/api/hnkgd", async (req, res) => {
  console.log("상위 노드가 keyword인 그룹노드 API req");
  let type = req.body.type;
  if (type == "registry") {
    type = "windows-registry-key";
  } else if (type == "Email") {
    type = "email";
  }
  const word = req.body.word;
  let limitValue = Number(req.body.limit);
  if (isNaN(limitValue)) {
    limitValue = 0; // or any default value you want
  }

  let limit = parseInt(limitValue + 10);
  let skip = parseInt(limitValue);
  const session = driver.session();
  try {
    const result = await session.run(
      // "match (n)-[r]-(m) where id(n) = $findId and m.type=$findType return m.type, r",
      // "MATCH (n)-[r]-(m) WHERE m.name CONTAINS $findWord AND m.type=$findType WITH m, COLLECT(DISTINCT type(r)) AS relationshipTypes RETURN m, relationshipTypes SKIP $findSkip LIMIT $findLimit",
      "MATCH (n)-[r]-(m) WHERE m.name CONTAINS $findWord AND m.type=$findType WITH m, COLLECT(DISTINCT type(r)) AS relationshipTypes RETURN m, relationshipTypes SKIP $findSkip LIMIT 10",
      {
        findType: type,
        findWord: word,
        findSkip: neo4j.int(skip),
        // findLimit: neo4j.int(limit),
      }
    );
    console.log(
      // "MATCH (n)-[r]-(m) WHERE m.name CONTAINS $findWord AND m.type=$findType WITH m, COLLECT(DISTINCT type(r)) AS relationshipTypes RETURN m, relationshipTypes SKIP $findSkip LIMIT $findLimit",
      "MATCH (n)-[r]-(m) WHERE m.name CONTAINS $findWord AND m.type=$findType WITH m, COLLECT(DISTINCT type(r)) AS relationshipTypes RETURN m, relationshipTypes SKIP $findSkip LIMIT 10",
      {
        findType: type,
        findWord: word,
        findSkip: neo4j.int(skip),
        // findLimit: neo4j.int(limit),
      }
    );
    const records = result.records.map((record) => record.toObject());
    records.forEach((element) => {
      if (element.m.properties.type == "registry") {
        element.m.properties.type = "windows-registry-key";
      } else if (element.m.properties.type == "email") {
        element.m.properties.type = "Email";
      }
    });
    console.log("상위 노드가 keyword인 그룹노드 API response");
    // console.log(records);
    res.json(records);
  } catch (error) {
    console.error(error); // 에러 로그 출력
    res.status(500).send(error.message);
  } finally {
    session.close();
  }
});

//api/other/ng
app.post("/api/other/ng", async (req, res) => {
  console.log(req.body);
  const id = req.body.id;
  const type = req.body.type.mTypes[0];
  const session = driver.session();
  try {
    const result = await session.run(
      "match (n)-[r]-(m) where id(n) = $findId and m.type=$findType return m.type, r",
      { findId: id, findType: type }
    );
    console.log(
      "match (n)-[r]-(m) where id(n) = $findId and m.type=$findType return m.type, r",
      { findId: id, findType: type }
    );
    const records = result.records.map((record) => record.toObject());
    let uniqueMTypes = new Set();
    let uniqueRTypes = new Set();

    records.forEach((record) => {
      uniqueMTypes.add(record["m.type"]);
      uniqueRTypes.add(record.r.type);
    });

    uniqueMTypes = [...uniqueMTypes]; // Set을 배열로 변환
    uniqueRTypes = [...uniqueRTypes]; // Set을 배열로 변환

    console.log(uniqueMTypes); // 중복이 제거된 m.type 값들의 배열
    console.log(uniqueRTypes); // 중복이 제거된 r.type 값들의 배열
    const resData = {
      groupLabel: uniqueMTypes[0],
      relationLabel: uniqueRTypes[0],
    };
    res.json(resData);
    // console.log(records);
  } catch (error) {
    console.error(error); // 에러 로그 출력
    res.status(500).send(error.message);
  } finally {
    session.close();
  }
});

app.post("/api/all/node", async (req, res) => {
  let id = req.body.id;
  console.log("새로운 전체 데이터 수집 id:", id);
  const session = driver.session();
  try {
    const result = await session.run(
      "MATCH (n)-[r]-(m) WHERE ID(n) = $findId WITH COLLECT(type(r)) as rTypes, COLLECT(m.type) as mTypes RETURN rTypes, mTypes",
      { findId: id }
      // "MATCH (n)-[r]-(m) WHERE ID(n) = $findId WITH COLLECT(DISTINCT type(r)) as rTypes, COLLECT(DISTINCT m.type) as mTypes RETURN rTypes, mTypes",
      // { findId: id }
    );
    console.log(
      "MATCH (n)-[r]-(m) WHERE ID(n) = $findId WITH COLLECT(type(r)) as rTypes, COLLECT(m.type) as mTypes RETURN rTypes, mTypes",
      { findId: id }
      // "MATCH (n)-[r]-(m) WHERE ID(n) = $findId WITH COLLECT(DISTINCT type(r)) as rTypes, COLLECT(DISTINCT m.type) as mTypes RETURN rTypes, mTypes",
      // { findId: id }
    );
    const records = result.records.map((record) => record.toObject());

    console.log(records);
    let rTypes = records[0].rTypes;
    let mTypes = records[0].mTypes;
    // mTypes.forEach((element) => {
    //   if (element == "ipv4_addr") {
    //     console.log(element);
    //     element = "ipv4-addr";
    //   }
    // });
    for (let i = 0; i < mTypes.length; i++) {
      if (mTypes[i] == "ipv4_addr") {
        mTypes[i] = "ipv4-addr";
      } else if (mTypes[i] == "windows-registry-key") {
        mTypes[i] = "registry";
      } else if (mTypes[i] == "tool") {
        mTypes[i] = "Software";
      } else if (mTypes[i] == "attack-pattern") {
        mTypes[i] = "Technique";
      } else if (mTypes[i] == "intrusion-set") {
        mTypes[i] = "Group";
      }
    }
    let uniqueMTyps = [...new Set(mTypes)];
    let uniqueRTyps = uniqueMTyps.map((mType) => rTypes[mTypes.indexOf(mType)]);
    const uniqueTypeLength = uniqueMTyps.length;
    console.log("새로운타입:::", uniqueMTyps);
    console.log("새로운타입:::", uniqueRTyps);
    console.log(uniqueTypeLength);
    const responseObj = {
      mTypes: uniqueMTyps,
      rTypes: uniqueRTyps,
    };

    // console.log(records[0]);
    // console.log(records[0].mTypes.length);
    // const uniqueTypeLength = records[0].mTypes.length;
    // const uniqueRelLength = records[0].rTypes.length;
    // 다중 그룹일때
    if (uniqueTypeLength > 1) {
      const response = {
        multi: true,
        data: responseObj,
      };
      res.json(response);
    } else if (uniqueTypeLength == 1) {
      const response = {
        multi: false,
        data: responseObj,
      };
      res.json(response);
    }
    //작업중....

    // let uniqueMTypes = new Set();
    // let uniqueRTypes = new Set();

    // records.forEach((record) => {
    //   uniqueMTypes.add(record["m.type"]);
    //   uniqueRTypes.add(record.r.type);
    // });

    // uniqueMTypes = [...uniqueMTypes]; // Set을 배열로 변환
    // uniqueRTypes = [...uniqueRTypes]; // Set을 배열로 변환

    // console.log(uniqueMTypes, "길이:", uniqueMTypes.length);
    // // 다중 그룹일때
    // if (uniqueMTypes.length > 1) {
    //   const response = {
    //     multi: true,
    //     data: uniqueMTypes,
    //     rel: uniqueRTypes,
    //   };
    //   res.json(response);
    // } else if (uniqueMTypes.length == 1) {
    //   const response = {
    //     multi: false,
    //     data: uniqueMTypes,
    //     rel: uniqueRTypes,
    //   };
    //   res.json(response);
    // }
    // console.log(records);
  } catch (error) {
    console.error(error); // 에러 로그 출력
    res.status(500).send(error.message);
  } finally {
    session.close();
  }
  // res.json(req.body);
});

// 상위 그룹노드가 있는 원본노드 더블클릭 시 하위 노드 만들기
app.post("/api/lgnafln", async (req, res) => {
  console.log(req.body);
  let type = req.body.type;
  let word = req.body.word;
  let id = req.body.id;
  const session = driver.session();
  try {
    const result = await session.run(
      //"MATCH (n) WHERE tolower(n.name) = tolower($name) RETURN n"
      "MATCH (n)-[r]-(m) WHERE ID(n) = $findId and n.type=$findType RETURN distinct m.type",
      { findId: id, findType: type }
    );
    console.log(
      // "match (n) where n.type=$typeName and n.name contains $wordName return n limit 10",
      // { typeName: type, wordName: word }
      "MATCH (n)-[r]-(m) WHERE ID(n) = $findId and n.type=$findType RETURN distinct m.type",
      { findId: id, findType: type }
    );
    const records = result.records.map((record) => record.toObject());
    console.log(records, "길이:", records.length);
    // 다중 그룹일때
    if (records.length > 1) {
      const response = {
        multi: true,
        data: records,
      };
      res.json(response);
    } else if (records.length == 1) {
      const response = {
        multi: false,
        data: records,
      };
      res.json(response);
    }
    // console.log(records);
  } catch (error) {
    console.error(error); // 에러 로그 출력
    res.status(500).send(error.message);
  } finally {
    session.close();
  }
});

// 상위 노드가 있는 그룹노드 더블클릭 시 하위 노드 만들기
app.post("/api/lgnafgn", async (req, res) => {
  console.log("그룹노드 파생 하위 그룹노드 생성");

  let type = req.body.type;
  let word = req.body.word;
  let limitValue = Number(req.body.limit);
  if (isNaN(limitValue)) {
    limitValue = 0; // or any default value you want
  }

  let limit = parseInt(limitValue + 10);
  let skip = parseInt(limitValue);
  // console.log("새로운 기능 테스트중", limit, skip);

  if (type.includes("_from_")) {
    console.log("'_from_' is included in the input.");
    let parts = type.split("_from_");

    let typePart = parts[0]; // "Software"
    let idPart = parseInt(parts[1]); // "410699"
    if (typePart == "registry") {
      console.log("레지스트리 확인");
      typePart = "windows-registry-key";
    }
    // else if (typePart == "domain_name") {
    //   typePart = "domain-name";
    // }
    console.log("파생 노드 확인!!!", typePart, idPart);
    console.log("findSkip:", skip, typeof skip);
    console.log("findLimit:", limit, typeof limit);

    const session = driver.session();
    try {
      const result = await session.run(
        // "MATCH (n)-[r]-(m) WHERE ID(n) = $findID and m.type=$findType RETURN r,m skip $findSkip limit $findLimit",
        // "MATCH (n)-[r]-(m) WHERE ID(n) = $findID and m.type=$findType WITH DISTINCT m, COLLECT(r) as rels RETURN rels,m skip $findSkip limit $findLimit",
        // {
        //   findType: typePart,
        //   findID: idPart,
        //   findSkip: neo4j.int(skip),
        //   findLimit: neo4j.int(limit),
        // }
        "MATCH (n)-[r]-(m) WHERE ID(n) = $findID and m.type=$findType WITH DISTINCT m, COLLECT(r) as rels RETURN rels,m skip $findSkip limit 10",
        {
          findType: typePart,
          findID: idPart,
          findSkip: neo4j.int(skip),
        }
        // "MATCH (n)-[r]-(m) WHERE ID(n) = $findID and m.type=$findType RETURN r,m skip 0 limit 10",
        // { findType: typePart, findID: idPart }

        // "MATCH (n)-[r]-(m) WHERE ID(n) = $findID and m.type=$findType and tolower(n.name) contains tolower($content) RETURN m limit 10",
        // { findType: typePart, findID: idPart, content: word }
      );
      console.log(
        // "MATCH (n)-[r]-(m) WHERE ID(n) = $findID and m.type=$findType RETURN r,m skip $findSkip limit $findLimit",
        // { findType: typePart, findID: idPart, findSkip: skip, findLimit: limit }
        "MATCH (n)-[r]-(m) WHERE ID(n) = $findID and m.type=$findType RETURN r,m skip $findSkip limit 10",
        { findType: typePart, findID: idPart, findSkip: skip }
        // "MATCH (n)-[r]-(m) WHERE ID(n) = $findID and m.type=$findType RETURN r,m skip 0 limit 10",
        // { findType: typePart, findID: idPart }
        // "MATCH (n)-[r]-(m) WHERE ID(n) = $findID and m.type=$findType and tolower(n.name) contains tolower($content) RETURN m limit 10",
        // { findType: typePart, findID: idPart, content: word }
      );
      const records = result.records.map((record) => record.toObject());
      console.log(records);
      records.forEach((element) => {
        // console.log("탐색중", element);
        if (element.m.properties.type == "windows-registry-key") {
          element.m.properties.type = "registry";
          console.log("바뀜");
        }
      });

      res.json(records);
      // let typeLength=[];
      // let typeLengthSet = new Set(); // Set 객체 생성
      // records.forEach((element) => {
      //   console.log(element);
      //   console.log(element.m.properties);
      //   if (element.m.properties.type == "windows-registry-key") {
      //     element.m.properties.type = "registry";
      //   }
      //   // console.log(element.n);
      //   if (element.m.labels) {
      //     element.m.labels.forEach((label) => {
      //       typeLengthSet.add(label); // Set에 label 추가 (중복은 자동으로 제거됨)
      //       console.log("라벨::::", label);
      //     });
      //   }
      // });

      // let typeLength = [...typeLengthSet]; // Set을 배열로 변환
      // console.log(typeLength);
      // if (typeLength.length == 1) {
      //   const response = {
      //     // node: records.n,
      //     // edge: records.r,
      //     data: records,
      //   };
      //   res.json(response);
      // } else {
      //   console.log("다중 노드그룹 확인!!!!! 추가 로직 필요");
      //   console.log(typeLength.length);
      //   res.json(response);
      // }
      // console.log(records);
    } catch (error) {
      console.error(error); // 에러 로그 출력
      res.status(500).send(error.message);
    } finally {
      session.close();
    }
    return;
  }

  if (type == "registry") {
    console.log("레지스트리 확인");
    type = "windows-registry-key";
  }
  // else if (typePart == "domain_name") {
  //   typePart = "domain-name";
  // }

  console.log(type, word);
  const session = driver.session();
  try {
    const result = await session.run(
      //"MATCH (n) WHERE tolower(n.name) = tolower($name) RETURN n"
      "match (n) where n.type=$typeName and n.name contains $wordName return n limit 10",
      { typeName: type, wordName: word }
    );
    console.log(
      "match (n) where n.type=$typeName and n.name contains $wordName return n limit 10",
      { typeName: type, wordName: word }
    );
    const records = result.records.map((record) => record.toObject());
    console.log(records);
    // let typeLength=[];
    let typeLengthSet = new Set(); // Set 객체 생성
    records.forEach((element) => {
      console.log(element);
      console.log(element.n.properties);
      if (element.n.properties.type == "windows-registry-key") {
        element.n.properties.type = "registry";
      }
      // console.log(element.n);
      if (element.n.labels) {
        element.n.labels.forEach((label) => {
          typeLengthSet.add(label); // Set에 label 추가 (중복은 자동으로 제거됨)
          console.log("라벨::::", label);
        });
      }
    });

    let typeLength = [...typeLengthSet]; // Set을 배열로 변환
    console.log(typeLength);
    if (typeLength.length == 1) {
      const response = {
        // node: records.n,
        // edge: records.r,
        data: records,
      };
      res.json(response);
    } else {
      console.log("다중 노드그룹 확인!!!!! 추가 로직 필요");

      console.log(typeLength.length);
    }
    // console.log(records);
  } catch (error) {
    console.error(error); // 에러 로그 출력
    res.status(500).send(error.message);
  } finally {
    session.close();
  }
  // req.body.forEach((item) => {
  //   console.log(item);
  // });
});

// 우측 그래프 검색결과 노드 추가 api
app.post("/api/graphResultNodeAdd", async (req, res) => {
  console.log(req.body);
  const id = req.body.id;
  const name = req.body.name;
  const session = driver.session();
  try {
    const result = await session.run(
      // match (n) where Id(n)=1061772 and n.name = '65c6deded268392e0f5c0003479d1999' return n
      "match (n) where Id(n)=$findId and n.name = $findName return n",
      { findId: id, findName: name }
    );
    console.log(
      "match (n) where Id(n)=$findId and n.name = $findName return n",
      { findId: id, findName: name }
    );
    const records = result.records.map((record) => record.toObject());

    if (records[0].n.properties.type == "windows-registry-key") {
      records[0].n.properties.type = "registry";
    }
    console.log(records);
    res.json(records);
  } catch (error) {
    console.error(error); // 에러 로그 출력
    res.status(500).send(error.message);
  } finally {
    session.close();
  }
});

app.post("/api/rnenmg", async (req, res) => {
  console.log(req.body);
  const type = req.body.type.mTypes[0];
  const rType = req.body.type.rTypes;
  const id = req.body.id;
  const session = driver.session();
  try {
    const result = await session.run(
      // match (n)-[r]-(m) where id(n)=1875231 and m.type="report" return m
      "match (n)-[r]-(m) where id(n)=$findId and m.type=$findType return m",
      { findId: id, findType: type }
    );
    console.log(
      "match (n)-[r]-(m) where id(n)=$findId and m.type=$findType return m",
      { findId: id, findType: type }
    );
    const records = result.records.map((record) => record.toObject());
    console.log(records);
    res.json(records);
  } catch (error) {
    console.error(error); // 에러 로그 출력
    res.status(500).send(error.message);
  } finally {
    session.close();
  }
});

//api/graphResult
app.post("/api/graphResult", async (req, res) => {
  const session = driver.session();
  let targetQuery;
  let mainName, metaName, user;
  let keyword;

  // 각 키에 대한 값을 추출
  req.body.forEach((item) => {
    if (item.key === "main_name") {
      mainName = item.value;
    } else if (item.key === "meta_name") {
      metaName = item.value;
    } else if (item.key === "user") {
      user = item.value;
    } else if (item.key === "keyword") {
      keyword = item.value;
    }
  });

  // mainName이나 metaName 값을 targetQuery에 할당 (원하는 로직에 따라 조정 가능)
  if (mainName) {
    targetQuery = mainName;
    try {
      const result = await session.run(
        // MATCH (n)-[r]-(m) WHERE tolower(n.name) = tolower("65c6deded268392e0f5c0003479d1999") RETURN r,m
        "MATCH (n)-[r]-(m) WHERE tolower(n.name) = tolower($name)  return  distinct n",
        { name: targetQuery }
      );
      console.log(
        "MATCH (n)-[r]-(m) WHERE tolower(n.name) = tolower($name)  return  distinct n",
        {
          name: targetQuery,
        }
      );
      const records = result.records.map((record) => record.toObject());
      const responsDataGraph = {};
      records.forEach((element) => {
        // console.log("노드::", element.m, " 관계::", element.r.type);
        let type = element.n.properties.type;
        const id = element.n.identity.low;
        const name = element.n.properties.name;
        // const relationship = element.r.type; // 이 부분은 가정한 내용입니다.

        // 레지스트리 값으로 변경
        if (type == "windows-registry-key") {
          type = "registry";
        }

        // responsDataGraph에 해당 type 키가 없으면 초기화
        if (!responsDataGraph[type]) {
          responsDataGraph[type] = [];
        }

        // 해당 type의 배열에 정보 객체를 추가
        responsDataGraph[type].push({
          id: id,
          name: name,
          // relationship: relationship,
        });
      });
      // console.log("그래프 결과값:", responsDataGraph);
      res.json(responsDataGraph);
    } catch (error) {
      console.error(error); // 에러 로그 출력
      res.status(500).send(error.message);
    } finally {
      session.close();
    }
  } else if (keyword) {
    targetQuery = keyword;
    try {
      const result = await session.run(
        //MATCH (n)-[r]-(m) WHERE n.name CONTAINS "north korea" RETURN DISTINCT r,m
        "MATCH (n)-[r]-(m) WHERE n.name CONTAINS $keyword RETURN Distinct n",
        { keyword: targetQuery }
      );
      const records = result.records.map((record) => record.toObject());
      const responsDataGraph = {};
      records.forEach((element) => {
        // console.log("노드::", element.m, " 관계::", element.r.type);
        let type = element.n.properties.type;
        const id = element.n.identity.low;
        const name = element.n.properties.name;
        // const relationship = element.r.type; // 이 부분은 가정한 내용입니다.

        // 레지스트리 값으로 변경
        if (type == "windows-registry-key") {
          type = "registry";
        }

        // responsDataGraph에 해당 type 키가 없으면 초기화
        if (!responsDataGraph[type]) {
          responsDataGraph[type] = [];
        }

        // 해당 type의 배열에 정보 객체를 추가
        responsDataGraph[type].push({
          id: id,
          name: name,
          // relationship: relationship,
        });
      });
      // console.log("그래프 결과값:", responsDataGraph);
      res.json(responsDataGraph);
    } catch (error) {
      console.error(error); // 에러 로그 출력
      res.status(500).send(error.message);
    } finally {
      session.close();
    }
  }
  console.log(targetQuery);
});

// 첫 그래프 진입 쿼리스트링 받아서 neo4j 접근
app.post("/api/data", async (req, res) => {
  const session = driver.session();
  // console.log(req.body);
  // res.json({ message: "Data received!" });
  // main_name or keyword 탐색
  let targetQuery;
  let mainName, metaName, user;
  let keyword;

  // 각 키에 대한 값을 추출
  req.body.forEach((item) => {
    if (item.key === "main_name") {
      mainName = item.value;
    } else if (item.key === "meta_name") {
      metaName = item.value;
    } else if (item.key === "user") {
      user = item.value;
    } else if (item.key === "keyword") {
      keyword = item.value;
    }
  });

  // mainName이나 metaName 값을 targetQuery에 할당 (원하는 로직에 따라 조정 가능)
  if (mainName) {
    targetQuery = mainName;
    console.log("main_name으로 검색...");
    try {
      const result = await session.run(
        "MATCH (n) WHERE tolower(n.name) = tolower($name) RETURN n",
        { name: targetQuery }
      );
      console.log("MATCH (n) WHERE tolower(n.name) = tolower($name) RETURN n", {
        name: targetQuery,
      });
      const records = result.records.map((record) => record.toObject());
      records.forEach((element) => {
        console.log(element);
      });
      console.log("그래프 첫 진입 결과값:::", records);
      const response = {
        label: "name",
        data: records,
      };
      res.json(response);
    } catch (error) {
      console.error(error); // 에러 로그 출력
      res.status(500).send(error.message);
    } finally {
      session.close();
    }
  } else if (keyword) {
    targetQuery = keyword;
    console.log("keyword로 검색...");
    try {
      const result = await session.run(
        "MATCH (n) WHERE n.name CONTAINS $keyword RETURN DISTINCT n.type",
        { keyword: targetQuery }
      );
      const records = result.records.map((record) => record.toObject());
      // console.log(records);
      records.forEach((element) => {
        console.log(element);
        if (element["n.type"] == "windows-registry-key") {
          element["n.type"] = "registry";
        } else if (element["n.type"] == "email") {
          element["n.type"] = "Email";
        }
      });
      const response = {
        label: "keyword",
        data: records,
      };
      res.json(response);
    } catch (error) {
      console.error(error); // 에러 로그 출력
      res.status(500).send(error.message);
    } finally {
      session.close();
    }
  }
  console.log(targetQuery);
});

app.listen(port, specificIp, () => {
  console.log(`Server is running on http://${specificIp}:${port}`);
});

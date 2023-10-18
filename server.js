// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const neo4j = require("neo4j-driver");
const app = express();
const port = 3000;

//neo4j
const driver = neo4j.driver(
  "bolt://localhost",
  neo4j.auth.basic("neo4j", "root")
);

// CORS 미들웨어 사용
app.use(cors());
// JSON 요청 본문 파싱
app.use(bodyParser.json());

app.get("/api/greet", (req, res) => {
  res.json({ message: "TIKA project Migrationing..." });
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
      "match (n) where n.type=$typeName and n.name contains $wordName return n limit 10",
      { typeName: type, wordName: word }
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
// 상위 그룹노드가 있는 그룹노드 더블클릭 시 하위 노드 만들기
app.post("/api/lgnafgn", async (req, res) => {
  console.log("그룹노드 파생 하위 그룹노드 생성");

  let type = req.body.type;
  let word = req.body.word;

  if (type.includes("_from_")) {
    console.log("'_from_' is included in the input.");
    let parts = type.split("_from_");

    let typePart = parts[0]; // "Software"
    let idPart = parseInt(parts[1]); // "410699"
    if (typePart == "registry") {
      console.log("레지스트리 확인");
      typePart = "windows-registry-key";
    }
    console.log("파생 노드 확인!!!", typePart, idPart);
    const session = driver.session();
    try {
      const result = await session.run(
        "MATCH (n)-[r]-(m) WHERE ID(n) = $findID and m.type=$findType and tolower(n.name) contains tolower($content) RETURN m",
        { findType: typePart, findID: idPart, content: word }
      );
      console.log(
        "MATCH (n)-[r]-(m) WHERE ID(n) = $findID and m.type=$findType and tolower(n.name) contains tolower($content) RETURN m",
        { findType: typePart, findID: idPart, content: word }
      );
      const records = result.records.map((record) => record.toObject());
      console.log(records);
      // let typeLength=[];
      let typeLengthSet = new Set(); // Set 객체 생성
      records.forEach((element) => {
        console.log(element);
        console.log(element.m.properties);
        if (element.m.properties.type == "windows-registry-key") {
          element.m.properties.type = "registry";
        }
        // console.log(element.n);
        if (element.m.labels) {
          element.m.labels.forEach((label) => {
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
    return;
  }

  if (type == "registry") {
    console.log("레지스트리 확인");
    type = "windows-registry-key";
  }

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
    try {
      const result = await session.run(
        "MATCH (n) WHERE tolower(n.name) = tolower($name) RETURN n",
        { name: targetQuery }
      );
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

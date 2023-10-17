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
      console.log(records);
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

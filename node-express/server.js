// server.js
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const neo4j = require("neo4j-driver");
const fs = require("fs");
const path = require("path");
const app = express();
const serverConfig = require("./serverConfig.js");
const specificIp = serverConfig.specificIp;
const neo4jIp = serverConfig.neo4jIp;
const port = serverConfig.port;
const id = serverConfig.neo4jId;
const pwd = serverConfig.neo4jPwd;

//neo4j
const driver = neo4j.driver(`bolt://${neo4jIp}`, neo4j.auth.basic(id, pwd));

// CORS 미들웨어 사용
// app.use(cors());
app.use(
  cors({
    // origin: `http://192.168.32.22:4200`, // Angular 애플리케이션의 URL
    origin: `http://192.168.34.118:4200`, // Angular 애플리케이션의 URL
    credentials: true, // 쿠키를 통한 인증을 허용
  })
);
// JSON 요청 본문 파싱
app.use(bodyParser.json());
// 세션 설정
app.use(
  session({
    secret: "qwet4qweeqweasASDqwesadGWEWQdfsSDFzdvGHFJERwekasdRTWEWERGFDGk", // 세션 암호화 키
    resave: false, // 세션을 항상 저장할 지 여부
    saveUninitialized: true, // 초기화되지 않은 세션을 저장할지 여부
    cookie: {
      secure: false, // HTTPS를 사용하는 경우 true로 설정
      maxAge: 1000 * 60 * 60 * 2, // 쿠키 유효 시간
    },
  })
);

// 세션 요청
app.get("/get-session-data", (req, res) => {
  if (req.session.userInput) {
    console.log(req.session.userInput);
    res.json({ storedSessionData: req.session.userInput });
  } else {
    res.status(404).json({ message: "세션 데이터가 없습니다." });
  }
});

// 세션 생성
app.post("/api/session/val", (req, res) => {
  req.session.userInput = req.body.value; // 클라이언트에서 전송된 값을 세션에 저장
  res.json({ message: "세션 저장 성공", sessionData: req.session.userInput });
});

// 다중 검색
app.post("/api/graph/multi/search", async (req, res) => {
  console.log(req.body);

  // const depth = req.body.depth;
  const query = req.body.query;

  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH ${query}
      `);
    res.json(result.records);
  } catch (error) {
    res
      .status(500)
      .send({ error: "An error occurred while fetching data from Neo4j." });
  }
});

// 그래프 다중검색 추가 버튼 API
app.post("/api/graph/multi/add", async (req, res) => {
  console.log(req.body);

  const depth = req.body.depth;
  const query = req.body.query;

  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH ${query}
      `);
    res.json(result.records);
  } catch (error) {
    res
      .status(500)
      .send({ error: "An error occurred while fetching data from Neo4j." });
  }
});

// 그래프 다중검색 첫 label 가져오기
app.get("/api/graph/multi", async (req, res) => {
  console.log("다중진입");
  const session = driver.session();
  try {
    const result = await session.run(`
    MATCH (n)
UNWIND labels(n) AS label
RETURN DISTINCT label
    `);

    res.json(result.records);
  } catch (error) {
    res
      .status(500)
      .send({ error: "An error occurred while fetching data from Neo4j." });
  }
});

// 저장된 그래프파일 가져오기
app.post("/api/graph/load", async (req, res) => {
  const userId = req.body.user;
  const title = req.body.title;
  console.log(userId, title);

  // 경로 구성
  const filePath = path.join("/app/save", userId, `${title}.json`);

  // 파일 존재 여부 확인
  if (fs.existsSync(filePath)) {
    // 파일 읽기
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading the file.", err);
        return res.status(500).send("Error reading the file.");
      }
      // 파일 내용을 JSON 형태로 파싱하여 전송
      try {
        const jsonData = JSON.parse(data);
        res.send(jsonData);
      } catch (parseErr) {
        console.error("Error parsing the file.", parseErr);
        res.status(500).send("Error parsing the file.");
      }
    });
  } else {
    // 파일이 존재하지 않는 경우
    res.status(404).send("File not found.");
  }
});

// 그래프 리스트 불러오기
app.post("/api/graph/list/load", async (req, res) => {
  const userId = req.body.user;
  console.log(userId);

  const userDirectoryPath = path.join("/app/save", userId);

  // 존재하는지
  if (!fs.existsSync(userDirectoryPath)) {
    return res.status(404).send("User directory not found");
  }

  fs.readdir(userDirectoryPath, (err, files) => {
    if (err) {
      console.error("An error occurred while reading the directory.", err);
      res.status(500).send("Unable to read directory");
      return;
    }

    // .json 확장자 제거
    const filenamesWithoutExtension = files.map((file) =>
      file.replace(".json", "")
    );
    // files는 해당 디렉토리의 모든 파일 이름의 배열입니다.
    console.log(filenamesWithoutExtension);

    // 파일 내용 대신 파일 이름을 클라이언트로 전송합니다.
    // 파일 내용을 읽으려면 각 파일에 대해 fs.readFile을 사용해야 합니다.
    res.send(filenamesWithoutExtension);
  });
});

// 그래프 다른이름으로 저장
app.post("/api/graph/save/rename", async (req, res) => {
  // console.log(req.body.data);
  const userId = req.body.data.user;
  const targetKey = Object.keys(req.body.data.key);
  const targetValue = req.body.data.key[targetKey];
  const data = { data: req.body.data.data, key: { [targetKey]: targetValue } };
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  // 추출한 부분을 원하는 형식의 문자열로 조합합니다.
  const formattedDate = `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분 ${seconds}초`;
  // console.log("파일 저장 객체", userId, targetKey, targetValue);
  // 파일 이름을 요청에서 추출
  const fileName = req.body.data.fileName;

  // 객체 저장
  // JSON으로 변환
  const jsonContent = JSON.stringify(data, null, 2);

  // 상대 경로를 사용하여 특정 폴더(예: 'data' 폴더)에 저장 - 최상위 루트 폴더
  // const rootDirectoryPath = path.join(__dirname, "save");
  const rootDirectoryPath = "/app/save";

  // 'data' 디렉토리가 없으면 생성
  if (!fs.existsSync(rootDirectoryPath)) {
    fs.mkdirSync(rootDirectoryPath, { recursive: true });
  }

  // 유저별 경로 설정
  const userDirectoryPath = path.join(rootDirectoryPath, userId);
  if (!fs.existsSync(userDirectoryPath)) {
    fs.mkdirSync(userDirectoryPath, { recursive: true });
  }

  const filePath = path.join(userDirectoryPath, `${fileName}.json`);

  // 파일에 쓰기
  fs.writeFile(filePath, jsonContent, "utf8", (err) => {
    if (err) {
      console.log("An error occured while writing JSON Object to File.");
      res.send("Failed");
      return console.log(err);
    }
    console.log("JSON file has been saved.");
  });
  res.send("Success");
});

// 그래프 저장
app.post("/api/graph/save", async (req, res) => {
  // console.log(req.body.data);
  const userId = req.body.data.user;
  const targetKey = Object.keys(req.body.data.key);
  const targetValue = req.body.data.key[targetKey];
  const data = { data: req.body.data.data, key: { [targetKey]: targetValue } };
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  // 추출한 부분을 원하는 형식의 문자열로 조합합니다.
  const formattedDate = `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분 ${seconds}초`;
  // console.log("파일 저장 객체", userId, targetKey, targetValue);

  // 객체 저장
  // JSON으로 변환
  const jsonContent = JSON.stringify(data, null, 2);

  // 상대 경로를 사용하여 특정 폴더(예: 'data' 폴더)에 저장 - 최상위 루트 폴더
  // const rootDirectoryPath = path.join(__dirname, "save");
  const rootDirectoryPath = "/app/save";

  // 'data' 디렉토리가 없으면 생성
  if (!fs.existsSync(rootDirectoryPath)) {
    fs.mkdirSync(rootDirectoryPath, { recursive: true });
  }

  // 유저별 경로 설정
  const userDirectoryPath = path.join(rootDirectoryPath, userId);
  if (!fs.existsSync(userDirectoryPath)) {
    fs.mkdirSync(userDirectoryPath, { recursive: true });
  }

  const filePath = path.join(userDirectoryPath, `${formattedDate}.json`);

  // 파일에 쓰기
  fs.writeFile(filePath, jsonContent, "utf8", (err) => {
    if (err) {
      console.log("An error occured while writing JSON Object to File.");
      res.send("Failed");
      return console.log(err);
    }
    console.log("JSON file has been saved.");
  });
  res.send("Success");
});

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
  }

  const word = req.body.word;
  let limitValue = Number(req.body.limit);
  if (isNaN(limitValue)) {
    limitValue = 0; // 기본값 설정
  }

  let limit = parseInt(limitValue + 10);
  let skip = parseInt(limitValue);
  const session = driver.session();

  try {
    let retry = true;
    let records = [];
    let one = 0;
    while (retry || one == 1) {
      const result = await session.run(
        "MATCH (n)-[r]-(m) WHERE m.name CONTAINS $findWord AND m.type=$findType WITH m, COLLECT(DISTINCT type(r)) AS relationshipTypes RETURN m, relationshipTypes SKIP $findSkip LIMIT 10",
        {
          findType: type,
          findWord: word,
          findSkip: neo4j.int(skip),
        }
      );
      console.log(
        "MATCH (n)-[r]-(m) WHERE m.name CONTAINS $findWord AND m.type=$findType WITH m, COLLECT(DISTINCT type(r)) AS relationshipTypes RETURN m, relationshipTypes SKIP $findSkip LIMIT 10",
        {
          findType: type,
          findWord: word,
          findSkip: neo4j.int(skip),
        }
      );
      records = result.records.map((record) => record.toObject());

      if (records.length == 0 && retry) {
        console.log(records, records.length, retry);
        one++;
        if (type == "Technique") {
          type = "attack-pattern";
        } else if (type == "Software") {
          type = "tool";
        } else if (type == "Group") {
          type = "Group";
        } else if (type == "ipv4_addr") {
          type = "intrusion-set";
        } else if (type == "registry") {
          type = "windows-registry-key";
        }
        console.log("No records found, retrying once...");
        retry = false; // 재시도 플래그 해제
        // 필요하다면 skip 값을 조정하거나 다른 로직을 적용하세요.
      } else {
        break; // 결과가 있거나 이미 재시도한 경우 반복문 탈출
      }
    }
    console.log("상위 노드가 keyword인 그룹노드 API response");
    res.json(records);
  } catch (error) {
    console.error(error); // 에러 로그 출력
    res.status(500).send(error.message);
  } finally {
    session.close();
  }
});
// app.post("/api/hnkgd", async (req, res) => {
//   console.log("상위 노드가 keyword인 그룹노드 API req");
//   let type = req.body.type;

//   if (type == "registry") {
//     type = "windows-registry-key";
//   }

//   const word = req.body.word;
//   let limitValue = Number(req.body.limit);
//   if (isNaN(limitValue)) {
//     limitValue = 0; // or any default value you want
//   }

//   let limit = parseInt(limitValue + 10);
//   let skip = parseInt(limitValue);
//   const session = driver.session();
//   try {
//     const result = await session.run(
//       // "MATCH (n)-[r]-(m) WHERE m.name CONTAINS $findWord AND m.type=$findType WITH m, COLLECT(DISTINCT type(r)) AS relationshipTypes RETURN m, relationshipTypes SKIP $findSkip LIMIT $findLimit",
//       "MATCH (n)-[r]-(m) WHERE m.name CONTAINS $findWord AND m.type=$findType WITH m, COLLECT(DISTINCT type(r)) AS relationshipTypes RETURN m, relationshipTypes SKIP $findSkip LIMIT 10",
//       {
//         findType: type,
//         findWord: word,
//         findSkip: neo4j.int(skip),
//         // findLimit: neo4j.int(limit),
//       }
//     );
//     console.log(
//       // "MATCH (n)-[r]-(m) WHERE m.name CONTAINS $findWord AND m.type=$findType WITH m, COLLECT(DISTINCT type(r)) AS relationshipTypes RETURN m, relationshipTypes SKIP $findSkip LIMIT $findLimit",
//       "MATCH (n)-[r]-(m) WHERE m.name CONTAINS $findWord AND m.type=$findType WITH m, COLLECT(DISTINCT type(r)) AS relationshipTypes RETURN m, relationshipTypes SKIP $findSkip LIMIT 10",
//       {
//         findType: type,
//         findWord: word,
//         findSkip: neo4j.int(skip),
//         // findLimit: neo4j.int(limit),
//       }
//     );
//     const records = result.records.map((record) => record.toObject());
//     console.log(records.length);
//     console.log("상위 노드가 keyword인 그룹노드 API response");
//     // console.log(records);
//     res.json(records);
//   } catch (error) {
//     console.error(error); // 에러 로그 출력
//     res.status(500).send(error.message);
//   } finally {
//     session.close();
//   }
// });

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
    // console.log("'_from_' is included in the input.");
    let parts = type.split("_from_");

    let typePart = parts[0]; // "Software"
    if (typePart == "registry") {
      typePart = "windows-registry-key";
    }
    let idPart = parseInt(parts[1]); // "410699"

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
      // console.log(records);

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
  console.log(req.body);
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
      console.log(response);
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
        "MATCH (n) WHERE n.name CONTAINS tolower($keyword) RETURN DISTINCT n.type",
        { keyword: targetQuery }
      );
      const records = result.records.map((record) => record.toObject());
      console.log(
        "MATCH (n) WHERE n.name CONTAINS tolower($keyword) RETURN DISTINCT n.type",
        { keyword: targetQuery }
      );
      const response = {
        label: "keyword",
        data: records,
      };
      console.log(response);
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

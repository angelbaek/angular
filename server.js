// server.js
const express = require("express");
const cors = require("cors");
const neo4j = require("neo4j-driver");
const app = express();
const port = 8000;

// neo4j 연결 및 세션 초기화
const driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "root"));
const session = driver.session();


// CORS 미들웨어 사용
app.use(cors());

app.get("/api/greet", (req, res) => {
  res.json({ message: "TIKA project Migrationing..." });
});

// neo4j test
app.get("/api/data", async (req, res) => {
  try {
    const result = await session.run("MATCH (n) RETURN n LIMIT 10");
    const records = result.records.map(record => record.get(0).properties);
    res.json(records);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

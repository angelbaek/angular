// server.js
const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

// CORS 미들웨어 사용
app.use(cors());

app.get("/api/greet", (req, res) => {
  res.json({ message: "TIKA project Migrationing..." });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

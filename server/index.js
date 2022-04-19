const express = require("express");

const app = express();

const port = process.env.PORT || 5001;

const start = () => {
  app.post("/upload", async (req, res) => {
    let byteCount = 0;

    req.on("data", (chunk) => {
      byteCount += Buffer.from(chunk).length;
    });

    req.on("end", () => {
      if (process.env.DEBUG) {
        console.log(`request size: ${byteCount}Bytes - ${byteCount * 8}bits `);
      }
      res.status(200);
      res.end();
    });
  });

  app.get("/status", async (_req, res) => {
    res.status(200);
    res.write("Upload test server is up");
    res.end();
  });

  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log(`App is listening on port ${port}.`);
      resolve();
    });
  });
};

(async () => {
  await start();
})();

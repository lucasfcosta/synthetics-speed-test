const express = require('express');
const ngrok = require('ngrok');

const app = express();

const port = process.env.PORT || 3000;

const start = () => {
    return new Promise(resolve => {
        app.get('/results', async (req, res) => {
            const avgUpload = `Average Upload: ${req.query.avgUpload}`;
            const allUploadsMbps = `All Upload MBPs: ${req.query.allUploadMBps}`;
            const body = [avgUpload, allUploadsMbps].join("\n");
            res.write(body);
            res.end()
        });

        app.post('/upload', async (req, res) => {
            let byteCount = 0

            req.on('data', (chunk) => {
                byteCount += Buffer.from(chunk).length
            })

            req.on("end", () => {
                res.status(200)
                res.end()
            })
        });

        app.listen(port, () => {
            console.log(`App is listening on port ${port}.`)
            resolve()
        });
    });
}

(async () => {
  await start();
  const ngrokUrl = await ngrok.connect(port);
  console.log("Upload server ready. Use the following url for your monitor: ")
  console.log(ngrokUrl)
})();

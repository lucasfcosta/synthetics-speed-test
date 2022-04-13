const express = require('express');

const app = express();

const port = process.env.PORT || 3000;

const start = () => {
    return new Promise(resolve => {

        app.post('/upload', async (req, res) => {
            let byteCount = 0

            req.on('data', (chunk) => {
                byteCount += Buffer.from(chunk).length
            })

            req.on("end", () => {
                console.log(`Request size: ${byteCount/1000}MB`);
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

start();

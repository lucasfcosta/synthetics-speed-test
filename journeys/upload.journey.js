const { journey, step } = require('@elastic/synthetics');
const http = require("http");

const TEST_N = 20;
const TEST_SIZE_MEGABYTES = 20;

const chars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()_+`-=[]{}|;':,./<>?";

const generateRandomPayload = (megabytesCount) => {
    const byteCount = megabytesCount * 1000; let payload = '';
    for (let i = 0; i < byteCount; i++) {
        payload += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return payload;
}

const getUploadSpeed = (httpOpts, uploadSizeMegaBytes) => {
    const payload = JSON.stringify({ data: generateRandomPayload(uploadSizeMegaBytes) });
    return new Promise((resolve, reject) => {
        let startTime;
        let req = http.request(httpOpts, res => {
            res.setEncoding("utf8");
            res.on('data', () => {});
            res.on("end", () => {
                const endTime = new Date().getTime();
                const durationInSeconds = (endTime - startTime) / 1000;
                const mBps = uploadSizeMegaBytes / durationInSeconds
                resolve({ mBps });
            });
        });
        req.on('error', reject);

        startTime = new Date().getTime();

        req.write(payload)
        req.end()
    })
}

journey("test upload speed", ({ params }) => {
    step("get upload speed", async () => {
        const options = {
            hostname: params.host,
            port: 3000,
            path: '/upload',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        let results = [];
        for (let i = 0; i < TEST_N; i++) {
            results[i] = await getUploadSpeed(options, TEST_SIZE_MEGABYTES)
        }

        const avg = average(results);
        await page.goto(`${params.protocol}://${params.host}:${params.port}/results?avg=${avg}`)
    });
})

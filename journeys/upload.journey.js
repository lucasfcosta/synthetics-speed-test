const { journey, step } = require('@elastic/synthetics');
const http = require("http");

const DUMMY_URL = "http://localhost:3000";
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

const getUploadSpeed = async (page, uploadSizeMegaBytes) => {
    const payload = JSON.stringify({ data: generateRandomPayload(uploadSizeMegaBytes) });
    const startTime = new Date().getTime();
    await page.evaluate(({ u, p }) => {
        return new Promise(resolve => {
            fetch(new Request(`${u}/upload`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: p,
                mode: "no-cors"
            })).then(resolve);
        });
    }, { u: DUMMY_URL, p: payload });
    const endTime = new Date().getTime();
    const durationInSeconds = (endTime - startTime) / 1000;
    const mBps = uploadSizeMegaBytes / durationInSeconds
    return mBps;
}

const average = (arr) => {
    const sum = arr.reduce((sum, n) => sum + n , 0);
    return sum / arr.length
}

journey("test upload speed", ({ page }) => {
    step("get upload speed", async () => {
        let results = [];
        for (let i = 0; i < TEST_N; i++) {
            results[i] = await getUploadSpeed(page, TEST_SIZE_MEGABYTES)
        }

        const avg = average(results);
        await page.goto(`${DUMMY_URL}/results?avgUpload=${avg}&allUploadMBps=${results.join(",")}`)
    });

    step("finish test", async () => {
        await page.waitForTimeout(5000);
    });
})

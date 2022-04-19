const { journey, step } = require("@elastic/synthetics");

const DUMMY_URL = "http://1213-80-6-62-180.ngrok.io";
const TEST_N = 20;
const TEST_SIZE_MEGABYTES = 20;

const chars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()_+`-=[]{}|;':,./<>?";

const generateRandomPayload = (megabytesCount) => {
  const byteCount = megabytesCount * 1000;
  let payload = "";
  for (let i = 0; i < byteCount; i++) {
    payload += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return payload;
};

const getUploadSpeed = async (page, uploadSizeMegaBytes) => {
  const payload = JSON.stringify({
    data: generateRandomPayload(uploadSizeMegaBytes),
  });
  const startTime = new Date().getTime();
  await page.evaluate(
    ({ u, p }) => {
      return new Promise((resolve) => {
        fetch(
          new Request(`${u}/upload`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: p,
            mode: "no-cors",
          })
        ).then(resolve);
      });
    },
    { u: DUMMY_URL, p: payload }
  );
  const endTime = new Date().getTime();
  const durationInSeconds = (endTime - startTime) / 1000;
  const mBps = uploadSizeMegaBytes / durationInSeconds;
  return mBps;
};

const average = (arr) => {
  const sum = arr.reduce((sum, n) => sum + n, 0);
  return sum / arr.length;
};

function median(arr) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const middleIndex = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middleIndex - 1] + sorted[middleIndex]) / 2
    : sorted[middleIndex];
}

journey("test upload speed", ({ page }) => {
  let results = [];

  step("do upload speed tests", async () => {
    await page.evaluate(() => {
      const loadingText = document.createElement("p");
      loadingText.id = "loading-text";
      loadingText.innerText = `Please wait, calculating upload speed...`;
      document.body.appendChild(loadingText);
    });

    for (let i = 0; i < TEST_N; i++) {
      results[i] = await getUploadSpeed(page, TEST_SIZE_MEGABYTES);
    }
  });

  step("calculate results", async () => {
    const avg = average(results);
    const m = median(results);

    await page.evaluate(
      ({ avg, m, results }) => {
        document.getElementById("loading-text").remove();
        const uploadAvg = document.createElement("p");
        const uploadValues = document.createElement("p");
        uploadAvg.innerText = `Average Upload: ${avg}MBps`;
        uploadAvg.innerText = `Median Upload: ${median}MBps`;
        uploadValues.innerText = `All Uploads: ${results
          .map((r) => r.toFixed(2))
          .join("MBps, ")}`;

        document.body.appendChild(uploadAvg);
        document.body.appendChild(uploadValues);
      },
      { avg, m, results }
    );
  });

  step("finish test", async () => {
    await page.waitForTimeout(5000);
  });
});

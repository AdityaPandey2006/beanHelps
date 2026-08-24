const http = require("http");
const https = require("https");

const REQUEST_TIMEOUT_MS = 30_000;

const ping = (url) =>
  new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const request = client.get(url, (response) => {
      response.resume();

      response.on("end", () => {
        if (response.statusCode >= 200 && response.statusCode < 400) {
          resolve(response.statusCode);
          return;
        }

        reject(new Error(`Health request returned HTTP ${response.statusCode}`));
      });
    });

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error("Health request timed out"));
    });
    request.on("error", reject);
  });

const startSelfPing = ({ url, intervalMs }) => {
  if (!url) {
    return null;
  }

  let healthUrl;
  try {
    healthUrl = new URL(url);
  } catch {
    console.error(`Self-ping disabled: invalid URL "${url}"`);
    return null;
  }

  if (!["http:", "https:"].includes(healthUrl.protocol)) {
    console.error("Self-ping disabled: URL must use HTTP or HTTPS");
    return null;
  }

  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    console.error("Self-ping disabled: interval must be a positive number");
    return null;
  }

  let requestInProgress = false;
  const timer = setInterval(async () => {
    if (requestInProgress) return;

    requestInProgress = true;
    try {
      const statusCode = await ping(healthUrl);
      console.log(`Self-ping succeeded with HTTP ${statusCode}`);
    } catch (error) {
      console.error(`Self-ping failed: ${error.message}`);
    } finally {
      requestInProgress = false;
    }
  }, intervalMs);

  timer.unref();
  console.log(`Self-ping enabled every ${intervalMs}ms: ${healthUrl.href}`);
  return timer;
};

module.exports = startSelfPing;

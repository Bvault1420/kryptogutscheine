import { logger } from './logger.js';

const DEFAULT_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 15000;
const BASE_DELAY_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(status) {
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

/**
 * Fetch with timeout, retry logic and exponential backoff.
 */
export async function fetchWithRetry(url, options = {}, config = {}) {
  const retries = config.retries ?? DEFAULT_RETRIES;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok && isRetryable(response.status) && attempt < retries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        logger.warn(`Retryable HTTP ${response.status}, attempt ${attempt + 1}/${retries}`, { url });
        await sleep(delay);
        continue;
      }

      return response;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;

      if (err.name === 'AbortError') {
        lastError = new Error(`Request timeout after ${timeoutMs}ms`);
      }

      if (attempt < retries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        logger.warn(`Fetch failed, retry ${attempt + 1}/${retries}`, { url, error: lastError.message });
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError;
}

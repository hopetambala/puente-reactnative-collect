const generateRandomID = () => Math.random().toString(20).substr(2, 12);
const isEmpty = (str) =>
  !str || str === undefined || str.length === 0 || !/\S/.test(str);

/**
 * Executes a task with a time limit and returns a structured result
 * @param {number} timeLimit - timeout in milliseconds
 * @param {Promise} task - the async task to execute
 * @param {any} failureValue - value to return on timeout
 * @returns {Promise<{timedOut: boolean, value: any, error?: any}>}
 */
const fulfillWithTimeLimit = async (timeLimit, task, failureValue) => {
  let timeout;
  const timeoutPromise = new Promise((resolve) => {
    timeout = setTimeout(() => {
      resolve({ timedOut: true, value: failureValue });
    }, timeLimit);
  });

  const safeTask = Promise.resolve(task)
    .then((value) => ({ timedOut: false, value }))
    .catch((error) => ({ timedOut: false, value: failureValue, error }));

  const response = await Promise.race([safeTask, timeoutPromise]);
  if (timeout) {
    clearTimeout(timeout);
  }
  return response;
};

async function withTimeoutAbort(asyncFn, timeoutMs, fallbackValue) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await asyncFn(controller.signal);
  } catch (err) {
    if (err.name === "AbortError") {
      console.warn("Operation aborted due to timeout");
      return fallbackValue;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export { fulfillWithTimeLimit, generateRandomID, isEmpty, withTimeoutAbort };

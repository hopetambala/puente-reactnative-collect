const generateRandomID = () => Math.random().toString(20).substr(2, 12);
const isEmpty = (str) =>
  !str || str === undefined || str.length === 0 || !/\S/.test(str);
const fulfillWithTimeLimit = async (timeLimit, task, failureValue) => {
  let timeout;
  const timeoutPromise = new Promise((resolve) => {
    timeout = setTimeout(() => {
      resolve(failureValue);
    }, timeLimit);
  });
  const response = await Promise.race([task, timeoutPromise]);
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

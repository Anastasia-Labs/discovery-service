import timerPromise from "timers/promises";
import { timeoutAsyncFunction } from "./misc.js";

const resolveInTwoSeconds = () => {
  return timerPromise.setTimeout(2000, 2);
};

const resolveInThreeSeconds = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(3), 3000);
  });
};

const resolveInFiveSeconds = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(5), 5000);
  });
};

(async function () {
  const asyncFunctions = [
    resolveInTwoSeconds(),
    resolveInThreeSeconds(),
    resolveInFiveSeconds(),
  ];
  const results = await timeoutAsyncFunction(resolveInTwoSeconds, null, 3000);
  // outputs `[2, 3, 5]` after five seconds
  console.log(results);
})();

export default (minSeconds = 5, maxSeconds = 12) => {
  const ms = Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
  return new Promise((resolve) => setTimeout(resolve, ms));
};
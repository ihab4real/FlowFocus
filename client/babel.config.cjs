/** @type {import('@babel/core').ConfigFunction} */
module.exports = {
  presets: [
    "@babel/preset-env",
    ["@babel/preset-react", { runtime: "automatic" }], // Use automatic runtime
  ],
};

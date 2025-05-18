/** @type {import('@babel/core').ConfigFunction} */
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }], // Ensure preset-env targets Node for Jest
    ["@babel/preset-react", { runtime: "automatic" }], // Use automatic runtime
    [
      "babel-preset-vite",
      {
        env: true, // This enables the transformation for import.meta.env
        glob: false, // Optional: set to true if you use import.meta.glob
      },
    ],
  ],
};

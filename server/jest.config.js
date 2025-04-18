/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node", // Specify the Node.js environment
  testMatch: ["**/__tests__/**/*.test.js"], // Pattern to find test files
  setupFilesAfterEnv: ["./__tests__/setup/db.js"], // Run setup after env is ready
  clearMocks: true, // Automatically clear mock calls and instances between every test
};

export default config;

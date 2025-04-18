/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jest-environment-jsdom", // Use jsdom for browser-like environment
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], // Run setup file after env is ready
  moduleNameMapper: {
    // Mock file assets like images or svgs
    "\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
    // Handle path aliases
    "^@/(.*)$": "<rootDir>/src/$1",
    // Add any other mappings if necessary (e.g., specific libraries)
  },
  transform: {
    // Use babel-jest to transpile tests with Babel configuration
    "^.+\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    // You might need to adjust this based on dependencies that need transpilation
    "/node_modules/",
  ],
  // Babel config should be picked up automatically by babel-jest
};

export default config;

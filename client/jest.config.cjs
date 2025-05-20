/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    // Use babel-jest to transpile tests with Babel
    // ESM note: babel-jest should transform ESM in your source files to CommonJS that Jest can run.
    "^.+\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  moduleNameMapper: {
    // Handle CSS imports by mocking them
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
    // Mock file assets like images or svgs
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
    // Handle path aliases
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Updated to exclude react-dnd and related packages that use ES modules
  transformIgnorePatterns: [
    "/node_modules/(?!(react-dnd|react-dnd-html5-backend|dnd-core|@react-dnd)/).*/",
  ],
  // Ignore utility files in __tests__ that are not actual tests
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/src/features/authentication/__tests__/setup/testUtils.jsx",
    "<rootDir>/src/features/Tasks/__tests__/setup/testUtils.jsx",
  ],
  // If your package.json has "type": "module", Jest's ESM support via --experimental-vm-modules
  // might require specific handling or ensuring Babel outputs compatible code.
  // For now, relying on babel-jest to convert ESM to CJS.
};

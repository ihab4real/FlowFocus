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
    // Handle CSS module mocks (if you were to use them)
    // "\\.module\\.css$": "identity-obj-proxy",
    // Mock file assets like images or svgs
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
    // Handle path aliases
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Default is ["/node_modules/"], meaning files in src/ ARE transformed.
  // If specific node_modules are ESM and need transformation, adjust this.
  // e.g., transformIgnorePatterns: ['/node_modules/(?!some-es-module-package).+\.js$'],
  transformIgnorePatterns: ["/node_modules/"],
  // Ignore utility files in __tests__ that are not actual tests
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/src/features/authentication/__tests__/setup/testUtils.jsx",
  ],
  // If your package.json has "type": "module", Jest's ESM support via --experimental-vm-modules
  // might require specific handling or ensuring Babel outputs compatible code.
  // For now, relying on babel-jest to convert ESM to CJS.
};

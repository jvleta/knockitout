module.exports = {
  testEnvironment: "jsdom",
  transform: {},
  moduleNameMapper: {
    "\\.(gif)$": "<rootDir>/src/__mocks__/fileMock.js",
  },
  clearMocks: true,
};

module.exports = {
  testEnvironment: "jsdom",
  transform: {},
  moduleNameMapper: {
    "\\.(gif)$": "<rootDir>/test/__mocks__/fileMock.js",
  },
  clearMocks: true,
};

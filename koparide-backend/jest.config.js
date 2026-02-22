// jest.config.js

module.exports = {
  // Tells Jest to use a Node-like environment (no browser APIs)
  testEnvironment: 'node',
  testEnvironmentOptions: {
    customExportConditions: ["node", "require", "default"]
  },


  // Tells Jest where your test files live
  testMatch: ['**/tests/**/*.test.js'],

  // THIS is where you add your setup file
  // Jest will run this file BEFORE any tests start
  setupFiles: ['<rootDir>/tests/setup/test-env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],

};

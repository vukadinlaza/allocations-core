module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: { "^.+\\.(ts|tsx)$": "ts-jest" },
  testTimeout: 10000,
  setupFiles: ["./test/service/test-helpers.ts"],
};

import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@upstash/redis$": "<rootDir>/__mocks__/@upstash/redis.js",
  },
  moduleDirectories: ["node_modules", "src"],
};

export default config;

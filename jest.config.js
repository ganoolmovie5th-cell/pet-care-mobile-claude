module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  // backend/ and admin/ are separate Node projects with their own jest configs
  // and tsconfigs. Without this, jest-expo tries to run their suites too.
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/__tests__/e2e/',
    // Hits a real backend over HTTP; returns 403 without a live server.
    '\\.e2e\\.ts$',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
      },
    },
  },
};

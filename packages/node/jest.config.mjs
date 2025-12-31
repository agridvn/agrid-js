export default {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/src/__tests__/utils/*', '<rootDir>/src/__tests__/setup.ts'],
  collectCoverage: true,
  clearMocks: true,
  fakeTimers: { enableGlobally: true },
  coverageDirectory: 'coverage',
  silent: true,
  verbose: false,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',
  },
}

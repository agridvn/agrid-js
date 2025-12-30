module.exports = {
  collectCoverage: true,
  clearMocks: true,
  coverageDirectory: 'coverage',
  silent: true,
  verbose: false,
  moduleNameMapper: {
    '^posthog-node$': '<rootDir>/tests/__mocks__/posthog-node.ts',
  },
}

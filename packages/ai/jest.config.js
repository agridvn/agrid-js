module.exports = {
  collectCoverage: true,
  clearMocks: true,
  coverageDirectory: 'coverage',
  silent: true,
  verbose: false,
  moduleNameMapper: {
    '^agrid-node$': '<rootDir>/tests/__mocks__/agrid-node.ts',
  },
}

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^../../commonjs/wrappers/cbor2Wrapper.js(.*)$': '<rootDir>/src/wrappers/cbor2Wrapper$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },  
  testPathIgnorePatterns: [
    '/node_modules/',
    'old_tests/'
  ],
};
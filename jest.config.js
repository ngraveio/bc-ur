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
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
};
// trueque_web/jest.config.js
module.exports = {
  projects: [
    // Backend / existing project (keeps your original config)
    {
      displayName: 'backend',
      preset: 'ts-jest',
      testEnvironment: 'node',
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
      },
      moduleNameMapper: {
        '^vitest$': '<rootDir>/trueque_web/tests/vitest-shim.cjs'
      },
      testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
      transformIgnorePatterns: ['/node_modules/']
    },

    // Frontend project for React/Next UI tests
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      rootDir: '.',
      testMatch: ['<rootDir>/tests/frontend/**/?(*.)+(spec|test).+(js|ts|tsx)'],
      setupFilesAfterEnv: ['<rootDir>/tests/frontend/jest/setupTests.ts'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
      },
      moduleDirectories: ['node_modules', 'src'],
      // Uncomment and adjust if you need to mock CSS or static imports
      // moduleNameMapper: { '\\.(css|less|scss)$': 'identity-obj-proxy' }
    }
  ]
};
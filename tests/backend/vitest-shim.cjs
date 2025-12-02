// trueque_web/tests/vitest-shim.cjs
const jestExpect = global.expect;
module.exports = {
  describe: global.describe,
  it: global.it,
  test: global.test,
  expect: jestExpect,
  beforeEach: global.beforeEach,
  afterEach: global.afterEach,
  beforeAll: global.beforeAll,
  afterAll: global.afterAll,
  vi: {
    fn: (...args) => jest.fn(...args),
    spyOn: (...args) => jest.spyOn(...args),
    mock: () => {},
    clearAllMocks: () => jest.clearAllMocks(),
  },
};
require('chai').should();
const expect = require('chai').expect;
const util = require('../src/util');

describe('Util', function () {
  it('Test util functions', () => {
    expect(util._eqIgnoreCase('asdf', 'ASdf')).is.equal(true);
    expect(util._eqIgnoreCase('asdf', 'ssdf')).is.equal(false);
    expect(util._validateJS('var a = 1;')).is.equal(true);
  });
});

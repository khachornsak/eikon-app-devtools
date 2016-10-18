'use strict';

let expect = require('chai').expect;

let server = require('../src/server');

describe('Server', () => {
  describe('General', () => {
    it('should not throw an error', () => {
      expect(() => { server(); }, 'default config')
        .to.not.throw(Error);
    });
  });
});

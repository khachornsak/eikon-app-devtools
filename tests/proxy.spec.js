const { expect } = require('chai');

const proxy = require('../src/proxy');

describe('Modules', () => {
  describe('Proxy', () => {
    it('setHTTPResponseHeaders', () => {
      let headers = {};
      let response = { setHeader(a, b) { headers[a] = b; } };
      proxy.setHTTPResponseHeaders(response, {
        'access-control-allow-origin': '*',
        'cache-control': 'private, no-cache',
        'content-type': 'json',
      });

      expect(Object.keys(headers).length, 'should set 1 header')
        .to.equal(1);
      expect(headers['cache-control'], 'should set cache-control if exists')
        .to.equal('private, no-cache');
    });
  });
});

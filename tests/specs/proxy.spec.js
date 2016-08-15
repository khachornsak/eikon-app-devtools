var _ = require('lodash');

var proxy = require('../../src/proxy');

describe('Modules', function () {
  describe('Proxy', function () {
    it('setHTTPResponseHeaders', function () {
      var headers = {};
      var response = { setHeader: function (a, b) { headers[a] = b; } };
      proxy.setHTTPResponseHeaders(response, {
        'access-control-allow-origin': '*',
        'cache-control': 'private, no-cache',
        'content-type': 'json',
      });

      expect(_.keys(headers).length, 'should set 1 header')
        .to.equal(1);
      expect(headers['cache-control'], 'should set cache-control if exists')
        .to.equal('private, no-cache');
    });
  });
});

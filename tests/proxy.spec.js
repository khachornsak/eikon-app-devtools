const { expect } = require('chai')

const proxy = require('../src/proxy')

describe('Modules', () => {
  describe('Proxy', () => {
    it('setHTTPResponseHeaders', () => {
      let headers = {}
      let response = { setHeader(a, b) { headers[a] = b } }
      proxy.setHTTPResponseHeaders(response, {
        'access-control-allow-origin': '*',
        'cache-control': 'private, no-cache',
        'content-type': 'json',
      })

      expect(Object.keys(headers)).to.have.lengthOf(1)
      expect(headers['cache-control']).to.equal('private, no-cache')
    })
  })
})

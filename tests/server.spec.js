const { expect } = require('chai')

const server = require('../src/server')

describe('Server', () => {
  describe('General', () => {
    it('should not throw an error', () => {
      expect(() => { server() }).to.not.throw(Error)
    })
  })
})

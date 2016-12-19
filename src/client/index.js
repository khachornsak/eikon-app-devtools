/* globals __resourceQuery */

const config = require('../config')
const jetmock = require('./jet-mock')
const Socket = require('./socket')

let url
if (typeof __resourceQuery === 'string' && __resourceQuery) {
  url = __resourceQuery.substr(1)
}

jetmock(new Socket(url || config.defaultSocketUrl))

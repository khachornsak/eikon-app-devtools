/* globals __resourceQuery */

let config = require('../config');
let jetmock = require('./jet-mock');
let Socket = require('./socket');

let url;
if (typeof __resourceQuery === 'string' && __resourceQuery) {
  url = __resourceQuery.substr(1);
}

jetmock(new Socket(url || config.defaultSocketUrl));

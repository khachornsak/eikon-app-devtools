/* eslint-disable
  func-names,
  no-console,
  no-var,
  object-shorthand,
  prefer-arrow-callback,
  prefer-template
*/

var _ = require('lodash');
var socketClient = require('socket.io-client');
var socket;

var responseMap = {};
var onResponse = function (id, headers, response) {
  var res = responseMap[id];
  if (!res) return;
  delete responseMap[id];
  _(headers)
    .omit(function (v, k) { return /^access/.test(k); })
    .forEach(headers, function (v, k) {
      res.setHeader(k, v);
    });
  res.end(JSON.stringify(response));
};

module.exports = function (options) {
  options = options || {};
  socket = socketClient.connect(options.socketUrl || 'http://localhost:3000');
  socket.on('udf-response', onResponse);
  socket.on('proxy-response', onResponse);

  return function (req, res, next) {
    var id;
    if (req.url.toLowerCase() === '/apps/udf/msf') {
      id = _.uniqueId('udf');
      responseMap[id] = res;
      socket.emit('udf-request', id, req.headers, req.body, _.get(options, 'udf') || null);
      return;
    }

    if (/service/i.test(req.url) ||
      /^\/ta/i.test(req.url) ||
      /^\/Explorer/.test(req.url) ||
      /AjaxHandler/i.test(req.url)) {
      id = _.uniqueId('service');
      responseMap[id] = res;
      if (req.method === 'POST') {
        socket.emit('proxy-request-post', id, req.url, req.headers, req.body);
      } else {
        socket.emit('proxy-request-get', id, req.url, req.headers, req.query);
      }
      return;
    }

    next();
  };
};

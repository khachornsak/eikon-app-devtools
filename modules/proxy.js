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
    .omit(function (v, k) { return /^access|^content/i.test(k); })
    .forEach(function (v, k) {
      res.setHeader(k, v);
    });

  if (res.send) {
    res.send(response);
  } else {
    res.end(JSON.stringify(response));
  }
};

module.exports = function (options) {
  var customUrlRegExp;

  socket = socketClient.connect(options.socketUrl || 'http://localhost:3000');
  socket.on('udf-response', onResponse);
  socket.on('proxy-response', onResponse);

  customUrlRegExp = _.get(options, 'customUrlRegExp');
  if (!_.isString(customUrlRegExp)) customUrlRegExp = null;

  return function (req, res, next) {
    var url = req.url;
    var id;

    if (_.startsWith(url.toLowerCase(), '/apps/udf/msf')) {
      id = _.uniqueId('udf');
      responseMap[id] = res;
      socket.emit('udf-request', id, req.headers, req.body, _.get(options, 'udf') || null);
      return;
    }

    if (/service/i.test(url) ||
      /^\/ta/i.test(url) ||
      /^\/Explorer/.test(url) ||
      /contentmenubar/i.test(url) ||
      /AjaxHandler/i.test(url) ||
      (customUrlRegExp && customUrlRegExp.test(url))) {
      id = _.uniqueId('service');
      responseMap[id] = res;
      if (req.method === 'POST') {
        socket.emit('proxy-request-post', id, url, req.headers, req.body);
      } else {
        socket.emit('proxy-request-get', id, url, req.headers, req.query);
      }
      return;
    }

    next();
  };
};

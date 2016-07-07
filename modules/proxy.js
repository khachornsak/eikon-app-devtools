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
var onResponse = function (options, id, headers, response) {
  var res = responseMap[id];
  if (!res) return;
  delete responseMap[id];

  if (_.get(options, 'headers') !== false) {
    _(headers)
      .omitBy(function (v, k) { return /^access|^content/i.test(k); })
      .forEach(function (v, k) {
        res.setHeader(k, v);
      });
  }

  if (res.send) {
    res.send(response);
  } else {
    res.end(JSON.stringify(response));
  }
};

module.exports = function (options) {
  var customUrlRegExp;

  socket = socketClient.connect(options.socketUrl || 'http://localhost:3000');
  socket.on('udf-response', _.partial(onResponse, options));
  socket.on('proxy-response', _.partial(onResponse, options));

  customUrlRegExp = _.get(options, 'customUrlRegExp');
  if (!_.isRegExp(customUrlRegExp)) customUrlRegExp = null;

  return function (req, res, next) {
    var url = req.url;
    var id;

    var lurl = url.toLowerCase();
    if (/\.js$/.test(url)) {
      next();
      return;
    }

    if (_.startsWith(lurl, '/apps/udf/msf')) {
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
      /\.ashx/i.test(url) ||
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

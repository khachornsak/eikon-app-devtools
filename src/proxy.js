var _ = require('lodash');
var chalk = require('chalk');
var socketClient = require('socket.io-client');

var responseMap = {};

function checkQuiet(options) {
  return _.get(options, 'quiet') !== false;
}

function setHTTPResponseHeaders(response, headers) {
  _.chain(headers)
    .omitBy(function (v, k) { return /^access|^content/i.test(k); })
    .forEach(function (v, k) {
      response.setHeader(k, v);
    })
    .commit();
}

function log(type, msg, shouldNotLog) {
  if (!shouldNotLog) {
    console.log(chalk.green('EAD'), type, msg);
  }
}

function onResponse(options, id, headers, response) {
  var isQuiet = checkQuiet(options);
  var reqres = responseMap[id];
  var req;
  var res;

  if (!reqres) return;
  delete responseMap[id];

  req = reqres.req;
  res = reqres.res;

  if (_.get(options, 'headers') !== false) {
    setHTTPResponseHeaders(res, headers);
  }

  log('res', req.url, isQuiet);

  if (res.send) {
    res.send(response);
  } else {
    res.end(_.isString(response) ? response : JSON.stringify(response));
  }
}

module.exports = function (options) {
  var isQuiet = checkQuiet(options);
  var customUrlRegExp;
  var socket;

  socket = socketClient.connect(_.get(options, 'socketUrl') || 'http://localhost:3000');
  socket.on('udf-response', _.partial(onResponse, options));
  socket.on('proxy-response', _.partial(onResponse, options));

  customUrlRegExp = _.get(options, 'customUrlRegExp');
  if (!_.isRegExp(customUrlRegExp)) customUrlRegExp = null;

  return function (req, res, next) {
    var body = req.body;
    var headers = req.headers;
    var method = req.method;
    var query = req.query;
    var url = req.url;

    var id;
    var errorMessage;
    var regExps;
    var testRegExp;

    var lurl = url.toLowerCase();
    if (/\.js$/.test(url)) {
      next();
      return;
    }

    if (_.startsWith(lurl, '/apps/udf/msf')) {
      if (!body || _.isEmpty(body)) {
        errorMessage = 'EAD: Body of MSF request is empty. Forget to config "body-parser"?';
        console.warn(chalk.red(errorMessage));
        next();
        return;
      }

      id = _.uniqueId('udf');
      responseMap[id] = { req: req, res: res };
      log('req', req.url, isQuiet);
      socket.emit('udf-request', {
        id: id,
        url: url,
        headers: headers,
        data: body,
        options: _.get(options, 'udf') || null,
      });
      return;
    }

    regExps = [
      /service/i,
      /^\/ta/i,
      /^\/Explorer/,
      /contentmenubar/i,
      /AjaxHandler/i,
      /\.ashx/i,
    ];
    testRegExp = function (reg) {
      return reg.test(url);
    };

    if (_.some(regExps, testRegExp) || (customUrlRegExp && customUrlRegExp.test(url))) {
      id = _.uniqueId('service');
      responseMap[id] = { req: req, res: res };
      log('req', req.url, isQuiet);
      if (method === 'POST') {
        socket.emit('proxy-request-post', { id: id, url: url, headers: headers, data: body });
      } else {
        socket.emit('proxy-request-get', { id: id, url: url, headers: headers, data: query });
      }
      return;
    }

    next();
  };
};

module.exports.setHTTPResponseHeaders = setHTTPResponseHeaders;

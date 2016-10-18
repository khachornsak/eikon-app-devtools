'use strict';

let _ = require('lodash');
let chalk = require('chalk');
let socketClient = require('socket.io-client');

let responseMap = {};

function checkQuiet(options) {
  return _.get(options, 'quiet') !== false;
}

function setHTTPResponseHeaders(response, headers) {
  _.chain(headers)
    .omitBy((v, k) => /^access|^content/i.test(k))
    .forEach((v, k) => {
      response.setHeader(k, v);
    })
    .commit();
}

function log(type, msg, shouldNotLog) {
  if (!shouldNotLog) {
    /* eslint-disable no-console */
    console.log(chalk.green('EAD'), type, msg);
    /* eslint-enable */
  }
}

function onResponse(options, id, headers, response) {
  let isQuiet = checkQuiet(options);
  let reqres = responseMap[id];

  if (!reqres) return;
  delete responseMap[id];

  let req = reqres.req;
  let res = reqres.res;

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

module.exports = (opts) => {
  const options = opts || {};

  let urlMapping = options.urlMapping;
  let customUrlRegExp = options.customUrlRegExp;

  let isQuiet = checkQuiet(options);
  let socket;
  let eventName;
  urlMapping = _.isArray(urlMapping) ? urlMapping : [];
  urlMapping = _.chain(urlMapping)
    .filter(m => _.isArray(m))
    .filter(m => m[0] && (_.isRegExp(m[0]) || _.isString(m[0])))
    .filter(m => _.isString(m[1]))
    .value();

  socket = socketClient.connect(options.socketUrl || 'http://localhost:3000');
  socket.on('udf-response', _.partial(onResponse, options));
  socket.on('proxy-response', _.partial(onResponse, options));

  if (!_.isRegExp(customUrlRegExp)) customUrlRegExp = null;

  return (req, res, next) => {
    let body = req.body;
    let headers = req.headers;
    let method = req.method;
    let query = req.query;
    let url = req.url;

    let lurl = url.toLowerCase();
    if (/\.js$/.test(url)) {
      next();
      return;
    }

    if (lurl.startsWith('/apps/udf/msf')) {
      if (!body || _.isEmpty(body)) {
        let errorMessage = 'EAD: Body of MSF request is empty. Forget to config "body-parser"?';
        console.warn(chalk.red(errorMessage));
        next();
        return;
      }

      let id = _.uniqueId('udf');
      responseMap[id] = { req, res };
      log('req', req.url, isQuiet);
      socket.emit('udf-request', {
        id,
        url,
        headers,
        data: body,
        options: options.udf || null,
      });
      return;
    }

    let regExps = [
      /service/i,
      /^\/ta/i,
      /^\/Explorer/,
      /contentmenubar/i,
      /AjaxHandler/i,
      /\.ashx/i,
    ];
    let testRegExp = reg => reg.test(url);

    if (_.some(regExps, testRegExp) || (customUrlRegExp && customUrlRegExp.test(url))) {
      let id = _.uniqueId('service');
      responseMap[id] = { req, res };
      log('req', url, isQuiet);

      let match = _.find(urlMapping, m => (_.isRegExp(m[0]) ? m[0].test(url) : url.includes(m[0])));

      if (match) {
        url = url.replace(match[0], match[1]);
      }

      eventName = method === 'POST' ? 'proxy-request-post' : 'proxy-request-get';
      let params = { id, url, headers };
      params.data = method === 'POST' ? body : query;
      socket.emit(eventName, params);
      return;
    }

    next();
  };
};

module.exports.setHTTPResponseHeaders = setHTTPResponseHeaders;

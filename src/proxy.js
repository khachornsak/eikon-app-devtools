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
  let req;
  let res;

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

module.exports = (options) => {
  let isQuiet = checkQuiet(options);
  let customUrlRegExp;
  let socket;
  let eventName;
  let params;
  let urlMapping = (options && options.urlMapping) || [];
  urlMapping = _.isArray(urlMapping) ? urlMapping : [];
  urlMapping = _.chain(urlMapping)
    .filter(m => _.isArray(m))
    .filter(m => _.isRegExp(m[0]) || (_.isString(m[0]) && m[0]))
    .filter(m => _.isString(m[1]))
    .value();

  socket = socketClient.connect(_.get(options, 'socketUrl') || 'http://localhost:3000');
  socket.on('udf-response', _.partial(onResponse, options));
  socket.on('proxy-response', _.partial(onResponse, options));

  customUrlRegExp = _.get(options, 'customUrlRegExp');
  if (!_.isRegExp(customUrlRegExp)) customUrlRegExp = null;

  return (req, res, next) => {
    let body = req.body;
    let headers = req.headers;
    let method = req.method;
    let query = req.query;
    let url = req.url;

    let id;
    let errorMessage;
    let regExps;
    let testRegExp;
    let match;

    let lurl = url.toLowerCase();
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
      responseMap[id] = { req, res };
      log('req', req.url, isQuiet);
      socket.emit('udf-request', {
        id,
        url,
        headers,
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
    testRegExp = reg => reg.test(url);

    if (_.some(regExps, testRegExp) || (customUrlRegExp && customUrlRegExp.test(url))) {
      id = _.uniqueId('service');
      responseMap[id] = { req, res };
      log('req', url, isQuiet);

      match = _.find(urlMapping, (m) => {
        let matcher = m[0];
        return _.isRegExp(matcher) ? matcher.test(url) : _.includes(url, matcher);
      });

      if (match) {
        url = url.replace(match[0], match[1]);
      }

      eventName = method === 'POST' ? 'proxy-request-post' : 'proxy-request-get';
      params = { id, url, headers };
      params.data = method === 'POST' ? body : query;
      socket.emit(eventName, params);
      return;
    }

    next();
  };
};

module.exports.setHTTPResponseHeaders = setHTTPResponseHeaders;

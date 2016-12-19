const _ = require('lodash')
const chalk = require('chalk')
const socketClient = require('socket.io-client')

const config = require('./config')

let responseMap = {}

function checkQuiet(options) {
  return !options || options.quiet !== false
}

function setHTTPResponseHeaders(response, headers) {
  Object.keys(headers)
    .filter(key => !/^access|^content/i.test(key))
    .forEach((key) => {
      response.setHeader(key, headers[key])
    })
}

function log(type, msg, shouldNotLog) {
  if (!shouldNotLog) {
    console.log(chalk.green('EAD'), type, msg) // eslint-disable-line
  }
}

function onResponse(options, id, headers, response) {
  let isQuiet = checkQuiet(options)
  let reqres = responseMap[id]

  if (!reqres) return
  delete responseMap[id]

  let { req, res } = reqres

  if (!options || options.headers !== false) {
    setHTTPResponseHeaders(res, headers)
  }

  log('res', req.url, isQuiet)

  if (res.send) {
    res.send(response)
  } else {
    res.end(_.isString(response) ? response : JSON.stringify(response))
  }
}

module.exports = (opts) => {
  const options = opts || {}

  let { socketUrl, urlMapping, customUrlRegExp } = options

  let isQuiet = checkQuiet(options)
  urlMapping = Array.isArray(urlMapping) ? urlMapping : []
  urlMapping = urlMapping
    .filter(m => Array.isArray(m) && m.length > 1)
    .filter(([pattern]) => _.isRegExp(pattern) || _.isString(pattern))
    .filter(m => _.isString(m[1]))

  let socket = socketClient.connect(socketUrl || config.defaultSocketUrl)
  socket.on('udf-response', _.partial(onResponse, options))
  socket.on('proxy-response', _.partial(onResponse, options))

  if (!_.isRegExp(customUrlRegExp)) customUrlRegExp = null

  return (req, res, next) => {
    let { body, headers, method, query, url } = req

    let lurl = url.toLowerCase()
    if (/\.js$/.test(url)) {
      next()
      return
    }

    if (lurl.startsWith('/apps/udf/msf')) {
      if (!body || _.isEmpty(body)) {
        let errorMessage = 'EAD: Body of MSF request is empty. Forget to config "body-parser"?'
        console.warn(chalk.red(errorMessage))
        next()
        return
      }

      let id = _.uniqueId('udf')
      responseMap[id] = { req, res }
      log('req', req.url, isQuiet)
      socket.emit('udf-request', {
        id,
        url,
        headers,
        data: body,
        options: options.udf || null,
      })
      return
    }

    let regExps = [
      /service/i,
      /^\/ta/i,
      /^\/Explorer/,
      /contentmenubar/i,
      /AjaxHandler/i,
      /\.ashx/i,
    ]

    if (regExps.some(reg => reg.test(url)) || (customUrlRegExp && customUrlRegExp.test(url))) {
      let id = _.uniqueId('service')
      responseMap[id] = { req, res }
      log('req', url, isQuiet)

      let match = urlMapping.find(([p]) => (_.isRegExp(p) ? p.test(url) : url.includes(p)))

      if (match) {
        url = url.replace(match[0], match[1])
      }

      let eventName = method === 'POST' ? 'proxy-request-post' : 'proxy-request-get'
      let params = { id, url, headers, data: method === 'POST' ? body : query }
      socket.emit(eventName, params)
      return
    }

    next()
  }
}

module.exports.setHTTPResponseHeaders = setHTTPResponseHeaders

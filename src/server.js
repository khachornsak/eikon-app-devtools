const chalk = require('chalk')
const http = require('http')
const https = require('https')
const pem = require('pem')
const socketio = require('socket.io')

const config = require('./config')

const events = [
  'download',
  'context-change',
  'quotes-reset',
  'quotes-create',
  'quotes-rics',
  'quotes-chain',
  'quotes-filter',
  'quotes-rawFields',
  'quotes-formattedFields',
  'quotes-start',
  'quotes-stop',
  'quotes-onNewRow',
  'quotes-onUpdate',
  'quotes-onRemoveRow',
  'settings-read',
  'settings-read-success',
  'navigate',
  'publish',
  'subscribe',
  'subscribe-success',
  'udf-request',
  'udf-response',
  'proxy-request-get',
  'proxy-request-post',
  'proxy-response',
]

module.exports = (options = {}) => {
  let { port, sslPort } = options
  if (!Number.isInteger(port)) port = config.defaultPort
  if (!Number.isInteger(sslPort)) sslPort = config.defaultSslPort

  pem.createCertificate({ days: 3, selfSigned: true }, (err, keys) => {
    let servers = [
      [port, new http.Server()],
      [sslPort, https.createServer({ key: keys.serviceKey, cert: keys.certificate })],
    ]

    servers.forEach(([p, server]) => {
      let io = socketio(server)

      server.listen(p)
      server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
          console.error(chalk.red('EAD: another instance of EAD may be currently in use'))
          return
        }

        throw e
      })

      io.on('connection', (socket) => {
        events.forEach((e) => {
          socket.on(e, (...args) => {
            socket.broadcast.emit(e, ...args)
          })
        })
      })
    })
  })
}

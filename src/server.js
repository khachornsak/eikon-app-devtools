'use strict';

let chalk = require('chalk');
let http = require('http');
let socketio = require('socket.io');

module.exports = (opts) => {
  let options = opts || {};
  let server = new http.Server();
  let io = socketio(server);
  let defaultPort = 3000;
  let port = options.port;
  if (!Number.isInteger(port)) port = defaultPort;

  server.listen(port);
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(chalk.red('EAD: another instance of EAD may be currently in use'));
      return;
    }

    throw e;
  });

  let events = [
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
  ];

  io.on('connection', (socket) => {
    events.forEach((e) => {
      socket.on(e, (...args) => {
        socket.broadcast.emit(e, ...args);
      });
    });
  });
};

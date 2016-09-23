'use strict';

let _ = require('lodash');
let chalk = require('chalk');
let http = require('http');
let socketio = require('socket.io');

module.exports = (options) => {
  let events;
  let server = new http.Server();
  let io = socketio(server);
  let defaultPort = 3000;
  let port = _.get(options, 'port');
  if (!Number.isInteger(port)) port = defaultPort;

  server.listen(port);
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      if (port === defaultPort) {
        console.error(chalk.red('EAD: another instance of EAD maybe is in use, please close it first or try to use other port'));
      } else {
        console.error(chalk.red(`EAD: port ${port} is in use, try other port`));
      }

      return;
    }

    throw e;
  });

  events = [
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
    _.forEach(events, (e) => {
      socket.on(e, (p1, p2, p3, p4, p5) => {
        socket.broadcast.emit(e, p1, p2, p3, p4, p5);
      });
    });
  });
};

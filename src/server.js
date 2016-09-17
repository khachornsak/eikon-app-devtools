'use strict';

let _ = require('lodash');
let http = require('http');
let socketio = require('socket.io');

module.exports = (options) => {
  let events;
  let server = new http.Server();
  let io = socketio(server);
  let port = _.get(options, 'port') || 3000;

  server.listen(port);

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

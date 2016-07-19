var _ = require('lodash');
var http = require('http');
var socketio = require('socket.io');

module.exports = function () {
  var events;
  var server = new http.Server();
  var io = socketio(server);
  var port = 3000;

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

  io.on('connection', function (socket) {
    _.forEach(events, function (e) {
      socket.on(e, function (p1, p2, p3, p4, p5) {
        socket.broadcast.emit(e, p1, p2, p3, p4, p5);
      });
    });
  });
};

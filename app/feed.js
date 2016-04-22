const moment = require('moment');

let $head;
let $display;

const feed = {
  init(socket) {
    $head = $('#feed-head');
    $display = $('#feed-display');

    feed.createHeader();

    socket.on('publish', (channel, data) => {
      feed.addRow('publish', channel, data);
      JET.publish(channel, data);
    });

    socket.on('subscribe', (channel) => {
      JET.subscribe(channel, (result) => {
        feed.addRow('subscribe', channel, result);
        socket.emit('subscribe-success', channel, result);
      });
    });
  },

  createHeader() {
    let $tr = $('<tr>');
    $tr.append('<th>time</th>');
    $tr.append('<th>event</th>');
    $tr.append('<th>channel</th>');
    $tr.append('<th>data</th>');
    $head.append($tr);
  },

  addRow(event, channel, data = '') {
    let $tr = $('<tr>');
    $tr.append(`<td>${moment().format('HH:mm:ss.SSS')}</td>`);
    $tr.append(`<td>${event}</td>`);
    $tr.append(`<td>${channel}</td>`);
    $tr.append(`<td>${data}</td>`);
    $display.prepend($tr);
  },
};

export default feed;

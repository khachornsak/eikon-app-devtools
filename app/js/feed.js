import $ from 'jquery';
import moment from 'moment';

import { addHeader, createRow } from './utils/dom';

let $display;

const eventClasses = {
  publish: 'info',
  subscribe: 'success',
};

const columns = [
  { name: '', field: 'timestamp' },
  { name: 'Event', field: 'eventName' },
  { name: 'Channel', field: 'channel' },
  { name: 'Data', field: 'data', classNames: 'word-break' },
];

const feed = {
  init(socket) {
    $display = $('#feed-display');

    addHeader('feed-head', columns);

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

  addRow(eventName, channel, data = '') {
    let params = {
      timestamp: moment().format('HH:mm:ss.SSS'),
      eventName,
      channel,
      data,
    };

    let $tr = $(createRow(columns, params))
      .addClass(eventClasses[eventName] || '');
    $display.prepend($tr);
  },
};

export default feed;

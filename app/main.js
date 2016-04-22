require('babel-polyfill');
require('./style.scss');

const socket = require('socket.io-client')('http://localhost:3000');

import route from './route';
import quotes from './quotes';
import feed from './feed';
import udf from './udf';
import proxy from './proxy';

JET.init({ ID: 'a' });

route.init();
quotes.init(socket);
feed.init(socket);
udf.init(socket);
proxy.init(socket);

socket.on('context-change', (context) => {
  JET.contextChange(context);
});

socket.on('navigate', (obj) => {
  JET.navigate(obj);
});

socket.on('download', (filename, data) => {
  saveAs(new Blob([new Buffer(data, 'base64')], { type: 'application/octet-stream' }), filename);
});

$('#site').text(require('../modules/env'));

import $ from 'jquery';

import route from './route';
import quotes from './quotes';
import feed from './feed';
import udf from './udf';
import proxy from './proxy';

require('babel-polyfill');
require('../styles/style.scss');

window.$ = $;
window.jQuery = $;
require('../../bower_components/AdminLTE/bootstrap/js/bootstrap.js');
require('../../bower_components/AdminLTE/dist/js/app.js');
require('../../bower_components/file-saver/FileSaver.js');

const socket = require('socket.io-client')('http://localhost:3000');

JET.init({ ID: 'a' });

route.init();
quotes.init(socket);
feed.init(socket);
udf.init(socket);
proxy.init(socket);

const statusEl = $('#app-status');
const setStatus = (text, textClass) =>
  statusEl.html(`<span class="fa fa-circle text-${textClass}"></span> ${text}`);

socket.on('connect', () => { setStatus('Connected', 'success'); });
socket.on('disconnect', () => { setStatus('Disconnected', 'danger'); });
socket.on('context-change', (context) => { JET.contextChange(context); });
socket.on('navigate', (obj) => { JET.navigate(obj); });

socket.on('download', (filename, data) => {
  saveAs(new Blob([new Buffer(data, 'base64')], { type: 'application/octet-stream' }), filename);
});

$('#app-site').text(require('../../modules/env'));
$('#app-feedback').click(() => {
  let to = 'pirasis.leelatanon@thomsonreuters.com';
  let subject = 'Feedback on Eikon App Devtools';
  window.location.href = `mailto:${to}?Subject=${subject}`;
});

window.top.document.title = 'Eikon App Devtools';

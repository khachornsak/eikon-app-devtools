import $ from 'jquery';
import moment from 'moment';

import forEach from 'lodash/forEach';

let socket;

const host = window.location.hostname === 'localhost' ?
  'http://emea.apps.cp.thomsonreuters.com' : '';

const $display = $('#proxy-display');
const rows = {};

const getHeaders = (responseHeadersString) => {
  const rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg;
  let match;
  let responseHeaders = {};
  while ((match = rheaders.exec(responseHeadersString))) {
    responseHeaders[match[1]] = match[2];
  }

  return responseHeaders;
};

const columns = [
  { name: '', field: 'timestamp' },
  { name: '', field: 'method', className: 'text-uppercase' },
  { name: 'Path', field: 'path', className: 'word-break' },
  { name: 'Content Type', field: 'contentType' },
  { name: 'Time', field: 'timeSpent' },
  { name: 'Size', field: 'contentLength' },
];

$('<tr></tr>')
  .append(columns.map(({ name }) => `<th>${name}</th>`))
  .appendTo($('#proxy-head'));

const updateRow = (id, data) => {
  let row = rows[id];
  let d = row.data;
  Object.assign(d, data);

  if (d.start && d.stop) d.timeSpent = `${d.stop - d.start}ms`;
  if (d.size) d.contentLength = `${d.size}bytes`;

  forEach(row.el.children(), (el, i) => {
    let col = columns[i] || {};
    $(el).text(d[col.field] || '');
  });
};

const addRow = (id) => {
  let tds = columns.map(({ className }) => `<td class="${className}"></td>`);
  let $row = $(`<tr>${tds.join('')}</tr>`);
  $display.prepend($row);
  rows[id] = { el: $row, data: {} };
  updateRow(id);
};

const proxy = {
  init(_socket) {
    socket = _socket;

    socket.on('proxy-request-get', (id, path, headers, data) => {
      proxy.call(id, path, 'get', headers, null, data);
    });

    socket.on('proxy-request-post', (id, path, headers, data) => {
      proxy.call(id, path, 'post', headers, 'application/json', JSON.stringify(data));
    });
  },

  call(id, path, method, headers, contentType, data) {
    addRow(id);
    updateRow(id, {
      timestamp: moment().format('HH:mm:ss.SSS'),
      start: new Date().getTime(),
      method,
      path,
    });

    let dataType = null;

    if (/contentmenubar/.test(path)) dataType = 'text';
    if (method === 'get') data = null;

    $.ajax({
      url: `${host}${path}`,
      method,
      contentType,
      dataType,
      data,
    })
    .then((response, status, xhr) => {
      let resHeaders = getHeaders(xhr.getAllResponseHeaders());
      updateRow(id, {
        stop: new Date().getTime(),
        contentType: (resHeaders['content-type'] || '').split(';')[0],
        size: resHeaders['content-length'],
      });
      socket.emit('proxy-response', id, resHeaders, response);
    })
    .fail((xhr) => {
      if (xhr.responseText) {
        try {
          /* eslint-disable no-eval */
          let response = eval(xhr.responseText);
          /* eslint-enable no-eval */
          let resHeaders = getHeaders(xhr.getAllResponseHeaders());
          updateRow(id, {
            stop: new Date().getTime(),
            size: resHeaders['content-length'],
          });
          socket.emit('proxy-response', id, resHeaders, response);
        } catch (e) {
          // do nothing
        }
      }
    });
  },
};

export default proxy;

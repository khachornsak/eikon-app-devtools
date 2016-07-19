import $ from 'jquery';
import moment from 'moment';

import isObject from 'lodash/isObject';

import { addHeader, createRow } from './utils/dom';

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
  { name: '', field: 'method', classNames: 'text-uppercase' },
  { name: 'URL', field: 'url', classNames: 'word-break' },
  { name: 'Content Type', field: 'contentType' },
  { name: 'Time', headerTooltip: 'in milliseconds', field: 'timeSpent', classNames: 'text-right' },
  { name: 'Size', headerTooltip: 'in bytes', field: 'size', classNames: 'text-right' },
];

addHeader('proxy-head', columns);

const updateRow = (id, data) => {
  let row = rows[id];
  let d = row.data;
  Object.assign(d, data);

  if (d.start && d.stop) d.timeSpent = d.stop - d.start;

  row.el.children().toArray().forEach((el, i) => {
    let col = columns[i] || {};
    $(el).text(d[col.field] || '');
  });
};

const addRow = (id) => {
  let $row = $(createRow(columns));
  $display.prepend($row);
  rows[id] = { el: $row, data: {} };
  updateRow(id);
};

const proxy = {
  init(_socket) {
    socket = _socket;

    socket.on('proxy-request-get', (args, url, headers, data) => {
      let id = args;

      // params from v0.1.0
      if (isObject(args)) {
        id = args.id;
        url = args.url;
        headers = args.headers;
        data = args.data;
      }
      proxy.call(id, url, 'get', headers, null, data);
    });

    socket.on('proxy-request-post', (args, url, headers, data) => {
      let id = args;

      // params from v0.1.0
      if (isObject(args)) {
        id = args.id;
        url = args.url;
        headers = args.headers;
        data = args.data;
      }
      proxy.call(id, url, 'post', headers, 'application/json', JSON.stringify(data));
    });
  },

  call(id, url, method, headers, contentType, data) {
    addRow(id);
    updateRow(id, {
      timestamp: moment().format('HH:mm:ss.SSS'),
      start: new Date().getTime(),
      method,
      url,
    });

    let dataType = null;

    if (/contentmenubar/.test(url)) dataType = 'text';
    if (method === 'get') data = null;

    $.ajax({
      url: `${host}${url}`,
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

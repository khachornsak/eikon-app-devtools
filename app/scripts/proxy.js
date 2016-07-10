import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';

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

const updateRow = (id, data) => {
  let row = rows[id];
  let d = row.data;
  _.assign(d, data);
  let $td = row.el.children();
  $($td.get(0)).text(d.time);
  $($td.get(1)).text(d.path);
  if (d.start && d.stop) $($td.get(2)).text(`${d.stop - d.start}ms`);
  if (d.size) $($td.get(3)).text(`${d.size}bytes`);
};

const addRow = (id) => {
  let $row = $('<tr><td></td><td></td><td></td><td></td></tr>');
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
      time: moment().format('HH:mm:ss.SSS'),
      start: new Date().getTime(),
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

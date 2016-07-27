import _ from 'lodash';
import $ from 'jquery';
import md5 from 'md5';
import moment from 'moment';

import { addHeader, createRow } from './utils/dom';

const host = window.location.hostname === 'localhost' ?
  'http://emea.apps.cp.thomsonreuters.com' : '';
const url = `${host}/apps/udf/msf`;

let socket;

const $display = $('#udf-display');
const rows = {};
const cache = {};

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
  { name: 'Service', field: 'serviceName' },
  { name: 'Transaction ID', field: 'transactionId' },
  { name: 'Backend', field: 'backend' },
  { name: 'Time', headerTooltip: 'in milliseconds', field: 'timeSpent', classNames: 'text-right' },
  { name: 'Size', headerTooltip: 'in bytes', field: 'size', classNames: 'text-right' },
];

addHeader('udf-head', columns);

const updateRow = (id, data) => {
  let row = rows[id];
  let d = row.data;
  Object.assign(d, data);
  let $td = row.el.children();

  if (d.start && d.stop) d.timeSpent = d.stop - d.start;

  columns.forEach((col, i) => {
    $($td.get(i)).text(d[col.field] || '');
  });

  if (d.cache) $($td.get(2)).html('<i>send cache</i>');
};

const addRow = (id) => {
  let $row = $(createRow(columns));
  $display.prepend($row);
  rows[id] = { el: $row, data: {} };
  updateRow(id);
};

const udf = {
  init(_socket) {
    socket = _socket;

    socket.on('udf-request', (args, headers, data, options) => {
      let id = args;
      // let reqUrl;

      // params from v0.1.0
      if (_.isObject(args)) {
        id = args.id;
        // reqUrl = args.url;
        headers = args.headers;
        data = args.data;
        options = args.options;
      }


      let useCache = _.get(options, 'cache');
      let cacheKey;
      let serviceName = data.entity || data.Entity || {};
      serviceName = serviceName.e || serviceName.E || 'batch';

      addRow(id);
      updateRow(id, {
        timestamp: moment().format('HH:mm:ss.SSS'),
        serviceName,
        start: new Date().getTime(),
      });

      if (useCache && /dapsfile/i.test(serviceName)) {
        useCache = false;
      }

      if (useCache) {
        cacheKey = md5(JSON.stringify(data));
        if (cache[cacheKey]) {
          let { headers: resHeaders, data: cacheData } = cache[cacheKey];
          updateRow(id, { cache: true });
          setTimeout(() => {
            socket.emit('udf-response', id, resHeaders, cacheData);
          }, 300);
          return;
        }
      }

      $.ajax({
        url,
        method: 'post',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(data),
        headers: {
          'X-Tr-Applicationid': 'test',
        },
      })
      .then((responseData, status, xhr) => {
        let resHeaders = getHeaders(xhr.getAllResponseHeaders());
        updateRow(id, {
          stop: new Date().getTime(),
          size: resHeaders['content-length'],
          backend: resHeaders['x-tr-backend'],
          transactionId: resHeaders['x-tr-udf-transactionid'],
        });
        if (useCache) {
          cache[cacheKey] = {
            headers: resHeaders,
            data: responseData,
          };
        }
        socket.emit('udf-response', id, resHeaders, responseData);
      });
    });
  },
};

export default udf;

import $ from 'jquery';
import moment from 'moment';

import forEach from 'lodash/forEach';
import random from 'lodash/random';
import transform from 'lodash/transform';

let socket;

const $table = $('#quotes-table');
const $head = $('#quotes-head');
const $display = $('#quotes-display');

let ricFilter = '';
const rows = [];
let discardAllUpdates = false;
let tableFrozen = false;

JET.init({ ID: 'a' });

// fixed columns
const columns = [
  { fid: 'CF_LAST', name: 'last' },
  { fid: 'PRIMACT_1', name: 'bid' },
  { fid: 'SEC_ACT_1', name: 'ask' },
  { fid: 'CF_NETCHNG', name: 'chng', color: true },
  { fid: 'NETCHNG_1', name: 'chng', color: true },
  { fid: 'PCTCHNG', name: '%chng', color: true },
  { fid: 'ACVOL_1', name: 'vol' },
  { fid: 'TURNOVER', name: 'trnovr' },
  { fid: 'VWAP', name: 'vwap' },
  { fid: 'CF_YIELD', name: 'yld' },
  { fid: 'RT_YIELD_1', name: 'b yld' },
  { fid: 'SEC_YLD_1', name: 'a yld' },
  { fid: 'YLD_NETCHG', name: 'yld ch', color: true },
  { fid: 'BMK_SPD', name: 'bmk sp' },
  { fid: 'SWAP_SPRD', name: 'sw sp' },
  { fid: 'AST_SWPSPD', name: 'asw sp' },
  { fid: 'OAS_BID', name: 'oas' },
  { fid: 'NOMINAL', name: 'nomi' },
  { fid: 'MOD_DURTN', name: 'mod dur' },
  { fid: 'VALUE_DT1', name: 'date', width: 80 },
  { fid: 'TRADE_DATE', name: 'date', width: 80 },
  { fid: 'VALUE_TS1', name: 'time', width: 50 },
  { fid: 'TRDTIM_1', name: 'time', width: 50 },
];

let sheet;
let cssEl = window.document.createElement('style');
cssEl.type = 'text/css';
window.document.head.appendChild(cssEl);
sheet = cssEl.sheet;

columns.forEach(({ fid, width, align, active }) => {
  if (!active) sheet.addRule(`.col_${fid}`, 'display: none !important;');
  let rules = [];
  if (align) rules.push(`text-align: ${align};`);
  if (width) rules.push(`width: ${width}px;`);
  if (rules.length) sheet.addRule(`.col_${fid}`, rules.join(''));
});
let removeCssRule = (fid) => {
  let index = Array.from(sheet.rules).findIndex((rule) =>
    rule.selectorText.endsWith(fid) && rule.style[0] === 'display');
  if (index >= 0) {
    sheet.removeRule(index);
  }
};

const fids = columns.map(c => c.fid);

let subscriptions = {};

function check(ric) {
  if (ricFilter && !ric.toLowerCase().startsWith(ricFilter)) {
    return false;
  }

  return true;
}

function createRow(row) {
  let $td;
  const $tr = $('<tr></tr>');
  const data = row.data;

  $tr.append(`<td>${row.time}</td>`);
  $tr.append('<td><a class="ric" href="#"></a></td>');
  $tr.find('.ric').attr('ric', row.ric).text(row.ric);

  let html = columns.map(({ fid, color, active }, i) => {
    let value = data[fid];
    let classNames = `col-data col_${fid}`;

    if (value) {
      const { raw, formatted } = value;
      if (formatted === null) {
        classNames += ' is-null';
        return `<td class="${classNames}">null</td>`;
      }

      if (color) {
        if (raw < 0) {
          classNames += ' change-down';
        } else if (raw > 0) {
          classNames += ' change-up';
        }
      }

      if (!active) {
        columns[i].active = true;
        removeCssRule(fid);
      }

      return `<td class="${classNames}">${formatted}</td>`;
    }

    return `<td class="${classNames}"></td>`;
  });

  $tr.append(html);
  $tr.css('background-color', row.color);

  const v = transform(data, (r, vv, f) => {
    if (!Array.includes(fids, f) && !Array.includes(['X_RIC_NAME'], f)) {
      r[f] = vv.formatted;
    }
  }, {});
  $td = $('<td></td>');
  $td.html(JSON.stringify(v).slice(1, -1));
  $tr.append($td);

  return $tr;
}

function log(id, event, ric, data, time, color) {
  let row;

  rows.unshift(row = { id, event, ric, data, time, color });

  if (!tableFrozen && check(ric)) {
    $display.prepend(createRow(row));
  }
}

const callbacks = {
  onNewRow(subscription, ric, data, rowN) {
    if (discardAllUpdates) return;

    socket.emit('quotes-onNewRow', subscription.id, ric, data, rowN);
    const timestamp = moment().format('HH:mm:ss.SSS');
    log(subscription.id, 'n', ric, data, timestamp);
  },

  onUpdate(subscription, rawUpdates, status) {
    if (discardAllUpdates) return;

    socket.emit('quotes-onUpdate', subscription.id, rawUpdates, status);
    let color = `rgba(${random(255)}, ${random(255)}, ${random(255)}, 0.08)`;
    const timestamp = moment().format('HH:mm:ss.SSS');

    let updates;

    if (status) {
      updates = [[rawUpdates, status]];
      color = '';
    } else {
      updates = rawUpdates;
    }

    updates.forEach(([ric, data]) => {
      log(subscription.id, 'u', ric, data, timestamp, color);
    });
  },

  onRemoveRow(subscription, ric, data, rowN) {
    if (discardAllUpdates) return;

    socket.emit('quotes-onRemoveRow', subscription.id, ric, data, rowN);
    const timestamp = moment().format('HH:mm:ss.SSS');
    log(subscription.id, 'r', ric, data, timestamp);
  },
};

function updateTable() {
  $display.empty();

  const pass = rows.filter(row => check(row.ric));

  pass.forEach(row => { $display.append(createRow(row)); });
}

function setContext(context) {
  JET.contextChange(context);
}

$('#filter-ric').on('change keyup', (e) => {
  ricFilter = ($(e.target).val() || '').toLowerCase();
  updateTable();
});

$('#btn-reset').click(() => {
  $('#filter-ric').val('').change();
});

$('<tr></tr>')
  .append('<th style="width:80px;"></th><th>RIC</th>')
  .append(columns.map(({ fid, name }) => `<th class="col-data col_${fid}">${name}</th>`))
  .append('<th></th>')
  .appendTo($head);

setInterval(() => {
  if (rows.length > 500) {
    rows.length = 100;
    updateTable();
  }
}, 5 * 1000);

$(window.document).on('click', '.ric', (e) => {
  setContext([{ RIC: $(e.target).attr('ric') }]);
  return false;
});

$('#btn-batch').click((e) => {
  let batch = $(e.target).hasClass('active');
  $table.toggleClass('hide-batch', batch);
});

$('#btn-freeze').click((e) => {
  tableFrozen = !$(e.target).hasClass('active');
  if (!tableFrozen) updateTable();
});

$('#btn-pause').click((e) => {
  discardAllUpdates = !$(e.target).hasClass('active');
});

// const fids1 = [...fids, 'X_RIC_NAME'];
// JET.Quotes.create()
//   .rics(['EUR=', 'GBP=', 'JPY=', 'CHF=', 'AUD=', 'NZD=', 'CNY=', 'THB='])
//   .rics(['IBM.N', 'VOD.L'])
//   .rics(['US10YT=RR', 'GB10YT=RR'])
//   .rawFields(fids1)
//   .formattedFields(fids1)
//   .onUpdate(callbacks.onUpdate, true)
//   .start();

const quotes = {
  init(_socket) {
    socket = _socket;

    socket.on('quotes-reset', () => {
      forEach(subscriptions, subscription => { subscription.stop(); });

      subscriptions = {};
    });

    socket.on('quotes-create', (key) => {
      const subscription = JET.Quotes.create(key);
      subscription
        .onNewRow(callbacks.onNewRow)
        .onUpdate(callbacks.onUpdate, true)
        .onRemoveRow(callbacks.onRemoveRow);
      subscriptions[key] = subscription;
    });

    socket.on('quotes-rics', (key, data) => {
      subscriptions[key].rics(data);
    });

    socket.on('quotes-chain', (key, data) => {
      subscriptions[key].chain(data);
    });

    socket.on('quotes-filter', (key, first, last) => {
      subscriptions[key].filter(first, last);
    });

    socket.on('quotes-rawFields', (key, data) => {
      subscriptions[key].rawFields(data);
    });

    socket.on('quotes-formattedFields', (key, data, n) => {
      if (n) {
        subscriptions[key].formattedFields(data, n);
      } else {
        subscriptions[key].formattedFields(data);
      }
    });

    socket.on('quotes-start', (key) => {
      subscriptions[key].start();
    });

    socket.on('quotes-stop', (key) => {
      subscriptions[key].stop();
    });
  },
};

export default quotes;

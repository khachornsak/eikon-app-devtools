const _ = require('lodash');
const moment = require('moment');

const fieldTypes = {
  time: ['VALUE_DT1', 'VALUE_TS1'],
  change: ['NETCHNG_1', 'PCTCHNG', 'YLD_NETCHG'],
  name: ['X_RIC_NAME'],
  delay: ['PRC_QL2'],
  large: ['PRIMACT_1', 'SEC_ACT_1'],
};

const randomDelay = () => _.random(400, 800);
const getMoment = (date) => {
  const t = date || moment();
  const d = t.clone().startOf('day');
  return {
    VALUE_DT1: {
      raw: d.unix(),
      formatted: t.format('DD MMM YYYY'),
    },
    VALUE_TS1: {
      raw: t.unix() - d.unix(),
      formatted: t.format('HH:mm'),
    },
  };
};
const getRandomChange = () => {
  const c = _.random(-5, 5, true);
  return {
    raw: c,
    formatted: `${c > 0 ? '+' : ''}${c.toFixed(4)}`,
  };
};
const getRandomNumber = (min, max, fixed) => {
  const c = _.random(min, max, true);
  return {
    raw: c,
    formatted: `${c.toFixed(fixed)}`,
  };
};

const Quotes = {
  create(id) {
    const subscription = { id };
    let ricList = new Set();
    let fieldList = [];
    let isRunning = false;
    let updateCallback = () => 0;

    const mockStatus = () => {
      ricList.forEach((r) => {
        updateCallback(subscription, r, { STATUS: { formatted: 'OK', raw: 1 } });
      });
    };

    const mockStream = (all = false) => {
      if (!isRunning) return;

      const updatedRics = new Set();
      const bound = Math.min(0.05 * ricList.size, 20);
      const max = all ? ricList.size : _.random(0.2 * bound, bound);
      const ricArray = Array.from(ricList);
      const data = [];

      _.forEach(_.range(max), () => {
        const ric = _.pullAt(ricArray, _.random(ricArray.length - 1))[0];
        if (updatedRics.has(ric)) return;
        updatedRics.add(ric);

        const updatedData = getMoment();
        _.forEach(fieldList, (f) => {
          if (_.includes(fieldTypes.time, f)) return;
          else if (_.includes(fieldTypes.change, f)) updatedData[f] = getRandomChange();
          else if (_.includes(fieldTypes.name, f)) updatedData[f] = { raw: ric, formatted: ric };
          else if (_.includes(fieldTypes.delay, f)) updatedData[f] = { raw: '', formatted: '' };
          else if (_.includes(fieldTypes.large, f)) updatedData[f] = getRandomNumber(85, 120, 2);
          else updatedData[f] = getRandomNumber(0, 9.99, 3);
        });

        data.push([ric, updatedData]);
      });

      updateCallback(subscription, data);

      if (!all) _.delay(mockStream, randomDelay());
    };

    _.assign(subscription, {
      rics(rics) {
        ricList = new Set(rics);
        return subscription;
      },

      rawFields(fields) {
        fieldList = fields;
        return subscription;
      },

      formattedFields(fields) {
        fieldList = fields;
        return subscription;
      },

      onNewRow() {
        return subscription;
      },

      onUpdate(fn) {
        if (_.isFunction(fn)) updateCallback = fn;
        return subscription;
      },

      onRemoveRow() {
        return subscription;
      },

      start() {
        isRunning = true;
        mockStatus();
        _.delay(_.bind(mockStream, null, true), 100);
        _.delay(mockStream, 1000);
        return subscription;
      },

      stop() {
        isRunning = false;
        return subscription;
      },
    });

    return subscription;
  },
};

export default Quotes;

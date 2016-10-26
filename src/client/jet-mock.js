/* eslint-disable
  no-console,
*/

function jetmock(socket) {
  if (navigator.userAgent.indexOf('EikonViewer') === -1) {
    socket.emit('quotes-reset');

    Object.assign(window.JET, {
      Initialized: true,

      onLoad(fn) {
        fn.apply(null);
      },

      contextChange(context) {
        console.log('Context changes to', ...context.map(c => c.RIC));
        let activeRic = context.find(c => c.SelectionNS);
        if (activeRic) console.log('Active ric changes to', activeRic.RIC);
        socket.emit('context-change', context);
      },

      navigate(obj) {
        console.log(`Navigate to ${obj.name} with`, obj.entities);
        socket.emit('navigate', obj);
      },

      publish(channel, obj) {
        socket.emit('publish', channel, obj);
      },

      subscribe(channel, fn) {
        (function wrapCallback(s, f) {
          socket.on('subscribe-success', (name, result) => {
            if (name === s) {
              f(result, name);
            }
          });
        }(channel, fn));
        socket.emit('subscribe', channel);
      },

      unsubscribe() {},

      appHit() {},

      Quotes: {
        create() {
          let id = `${parseInt(Math.random() * 1000, 10)}_${Date.now()}`;
          socket.emit('quotes-create', id);

          let cache = {};
          let subscription = {
            start() {
              socket.emit('quotes-start', id);
              return subscription;
            },

            stop() {
              socket.emit('quotes-stop', id);
              return subscription;
            },

            destroy() {},

            rics(rics) {
              socket.emit('quotes-rics', id, rics);
              return subscription;
            },

            formattedFields(f, v) {
              socket.emit('quotes-formattedFields', id, f, v);
              return subscription;
            },

            getFieldsValues(ric) {
              return cache[ric];
            },

            rawFields(f) {
              socket.emit('quotes-rawFields', id, f);
              return subscription;
            },

            onNewRow() {
              return subscription;
            },

            onUpdate(f) {
              socket.on('quotes-onUpdate', (key, data, values) => {
                if (key === id) {
                  let array = values ? [[data, values]] : data;
                  array.forEach((v) => {
                    if (!cache[v[0]]) cache[v[0]] = {};
                    Object.assign(cache[v[0]], v[1]);
                    f(subscription, v[0], v[1], v[2]);
                  });
                }
              });
              return subscription;
            },

            onRemoveRow() {
              return subscription;
            },

            pauseOnDeactivate() {
              return subscription;
            },
          };

          return subscription;
        },
      },

      QuickTips: {
        create() {
          const qt = {
            tips() {
              return qt;
            },

            start() {
              return qt;
            },
          };

          return qt;
        },

        tipsAvailable() {},

        onQuickTipRequest() {},
      },
    });
  }
}

module.exports = jetmock;

/* eslint-disable
  no-console
*/

function jetmock(socket) {
  if (navigator.userAgent.indexOf('EikonViewer') === -1) {
    socket.emit('quotes-reset');
    Object.assign(window.JET, {
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

      appHit() {
        return;
      },

      Quotes: {
        create() {
          let id;
          let subscription;

          id = `${parseInt(Math.random() * 1000, 10)}_${Date.now()}`;
          socket.emit('quotes-create', id);
          subscription = {
            start() {
              socket.emit('quotes-start', id);
              return subscription;
            },

            stop() {
              socket.emit('quotes-stop', id);
              return subscription;
            },

            destroy() {
            },

            rics(rics) {
              socket.emit('quotes-rics', id, rics);
              return subscription;
            },

            formattedFields(f) {
              socket.emit('quotes-formattedFields', id, f);
              return subscription;
            },

            rawFields(f) {
              socket.emit('quotes-rawFields', id, f);
              return subscription;
            },

            onUpdate(f) {
              socket.on('quotes-onUpdate', (key, updates, status) => {
                if (key === id) {
                  f(subscription, updates, status);
                }
              });
              return subscription;
            },
          };

          return subscription;
        },
      },

      QuickTips: {
        create() {
          // console.log('quicktip', 'create quicktip');
          const qt = {};
          Object.assign(qt, {
            tips() {
              // console.log('quicktip', 'set tips');
              return qt;
            },
            start() {
              // console.log('quicktip', 'start');
              return qt;
            },
          });

          return qt;
        },
        tipsAvailable() {
          // console.log('quicktip', 'set tip available');
        },
        onQuickTipRequest() {
          // console.log('quicktip', 'request quicktip');
          // callback();
        },
      },
    });
  }
}

module.exports = jetmock;

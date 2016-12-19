/* eslint-disable
  no-console,
*/

function jetmock(socket) {
  if (!navigator.userAgent.includes('EikonViewer')) {
    socket.emit('quotes-reset')

    Object.assign(window.JET, {
      Initialized: true,

      onLoad(fn) {
        fn.apply(null)
      },

      contextChange(context) {
        console.log('Context changes to', ...context.map(c => c.RIC))
        let activeRic = context.find(c => c.SelectionNS)
        if (activeRic) console.log('Active ric changes to', activeRic.RIC)
        socket.emit('context-change', context)
      },

      navigate(obj) {
        console.log(`Navigate to ${obj.name} with`, obj.entities)
        socket.emit('navigate', obj)
      },

      publish(channel, obj) {
        socket.emit('publish', channel, obj)
      },

      subscribe(channel, fn) {
        socket.on('subscribe-success', (name, result) => {
          if (name === channel) {
            fn(result, name)
          }
        })
        socket.emit('subscribe', channel)
      },

      unsubscribe() {},

      appHit() {},

      Quotes: {
        create() {
          let id = `${parseInt(Math.random() * 1000, 10)}_${Date.now()}`
          socket.emit('quotes-create', id)

          let cache = {}
          let subscription = {
            start() {
              socket.emit('quotes-start', id)
              return subscription
            },

            stop() {
              socket.emit('quotes-stop', id)
              return subscription
            },

            destroy() {},

            rics(rics) {
              socket.emit('quotes-rics', id, rics)
              return subscription
            },

            formattedFields(f, v) {
              socket.emit('quotes-formattedFields', id, f, v)
              return subscription
            },

            getFieldsValues(ric) {
              return cache[ric]
            },

            rawFields(f) {
              socket.emit('quotes-rawFields', id, f)
              return subscription
            },

            onNewRow() {
              return subscription
            },

            onUpdate(fn, batch = false) {
              socket.on('quotes-onUpdate', (key, data, values) => {
                if (key === id) {
                  let array = values ? [[data, values]] : data
                  array.forEach(([ric, updates, rowN]) => {
                    if (!cache[ric]) cache[ric] = {}
                    Object.assign(cache[ric], updates)
                    if (!batch) fn(subscription, ric, updates, rowN)
                  })
                  if (batch) fn(subscription, data, values)
                }
              })
              return subscription
            },

            onRemoveRow() {
              return subscription
            },

            pauseOnDeactivate() {
              return subscription
            },
          }

          return subscription
        },
      },

      QuickTips: {
        create() {
          const qt = {
            tips() {
              return qt
            },

            start() {
              return qt
            },
          }

          return qt
        },

        tipsAvailable() {},

        onQuickTipRequest() {},
      },
    })
  }
}

module.exports = jetmock

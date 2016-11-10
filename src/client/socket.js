const SocketClient = require('socket.io-client');

let instance = null;

class socket {
  constructor(url) {
    instance = new SocketClient(url, {
      connectionAttempts: 10,
      reconnectionDelayMax: 10 * 1000,
    });
  }

  emit(...args) {
    instance.emit(...args);
  }

  on(...args) {
    instance.on(...args);
  }
}

module.exports = socket;

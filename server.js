const _ = require('lodash');
const express = require('express');
const http = require('http');

const webpack = require('webpack');
const webpackConfig = require('./webpack.config');
const compiler = webpack(webpackConfig);

const app = express();
app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: webpackConfig.output.publicPath,
}));

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});
app.use(express.static('app'));
app.use('/bower_components', express.static('./bower_components'));

const server = new http.Server(app);
const io = require('socket.io')(server);

const port = process.env.PORT || 3000;

server.listen(port);

const events = [
  'download',
  'context-change',
  'quotes-reset',
  'quotes-create',
  'quotes-rics',
  'quotes-chain',
  'quotes-filter',
  'quotes-rawFields',
  'quotes-formattedFields',
  'quotes-start',
  'quotes-stop',
  'quotes-onNewRow',
  'quotes-onUpdate',
  'quotes-onRemoveRow',
  'settings-read',
  'settings-read-success',
  'navigate',
  'publish',
  'subscribe',
  'subscribe-success',
  'udf-request',
  'udf-response',
  'proxy-request-get',
  'proxy-request-post',
  'proxy-response',
];

io.on('connection', (socket) => {
  _.forEach(events, (e) => {
    socket.on(e, (p1, p2, p3, p4) => {
      socket.broadcast.emit(e, p1, p2, p3, p4);
    });
  });
});

const webpack = require('webpack');
let config = require('./webpack.config.js');

config.devtool = 'source-map';
config.plugins = [
  new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  new webpack.optimize.UglifyJsPlugin({
    compressor: {
      warnings: false,
      screw_ie8: true,
    },
  }),
];

module.exports = config;

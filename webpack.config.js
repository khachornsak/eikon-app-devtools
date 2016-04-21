const path = require('path');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const webpack = require('webpack');

module.exports = {
  context: __dirname,
  entry: './app/main.js',
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/',
    filename: 'bundle.js',
  },
  recordsOutputPath: path.join(__dirname, 'records.json'),
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
    ],
  },
  devtool: 'source-map',
  devServer: {
    contentBase: './dist',
    hot: true,
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new LiveReloadPlugin({ port: 35728 }),
  ],
};

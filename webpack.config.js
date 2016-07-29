const path = require('path');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const webpack = require('webpack');

module.exports = {
  context: __dirname,
  entry: './app/js/main.js',
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/',
    filename: 'bundle.js',
  },
  recordsOutputPath: path.join(__dirname, 'records.json'),
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules|bower_components/, loader: 'babel-loader' },
      { test: /\.scss$/, loaders: ['style', 'css', 'sass'] },
      { test: /\.(eot|svg|ttf|woff|woff2)/, loader: 'file?name=public/fonts/[name].[ext]' },
      { test: /\.(png|jpg)$/, loader: 'url?limit=8192' },
    ],
  },
  devtool: 'eval-source-map',
  devServer: {
    contentBase: './dist',
    hot: true,
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new LiveReloadPlugin({ port: 35728 }),
  ],
};

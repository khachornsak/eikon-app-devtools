/* eslint-disable
  strict,
*/

'use strict';

let path = require('path');

let babelConfig = { presets: ['es2015'] };

module.exports = function karmaConfig(config) {
  config.set({
    basePath: '',

    frameworks: ['mocha'],

    files: [
      'tests/test-init.js',
      'tests/specs/*.js',
    ],

    preprocessors: {
      'tests/test-init.js': 'webpack',
      'tests/specs/*.js': 'webpack',
    },

    webpack: {
      babel: babelConfig,
      isparta: {
        embedSource: true,
        noAutoWrap: true,
        babel: babelConfig,
      },
      module: {
        preLoaders: [
          {
            test: /\.js$/,
            exclude: [
              path.resolve('app/scripts/'),
              path.resolve('node_modules/'),
            ],
            loader: 'babel',
          },
          {
            test: /\.js$/,
            include: path.resolve('app/scripts/'),
            loader: 'isparta',
          },
        ],
      },
    },
    webpackMiddleware: { stats: { colors: true }, quiet: true },

    reporters: ['dots', 'html', 'coverage'],

    coverageReporter: {
      reporters: [
        { type: 'html', subdir: '' },
        { type: 'text-summary', subdir: '.' },
        { type: 'lcovonly', subdir: '.' },
      ],
    },

    htmlReporter: {
      outputFile: 'tests/reports/unit-tests.html',

      groupSuites: true,
      useCompactStyle: true,
    },

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,

    browsers: ['PhantomJS'],
  });
};

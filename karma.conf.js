/* eslint-disable
  strict,
*/

'use strict';

const istanbul = require('browserify-istanbul');

module.exports = function (config) {
  config.set({
    basePath: '',

    frameworks: ['browserify', 'mocha'],

    files: [
      'tests/specs/*.js',
    ],

    preprocessors: {
      'tests/specs/*.js': 'browserify',
    },

    browserify: {
      debug: true,
      transform: [
        [istanbul, { ignore: ['**/node_modules/**', '**/tests/**'] }],
      ],
    },

    reporters: ['dots', 'html', 'coverage'],

    htmlReporter: {
      outputFile: 'tests/reports/unit-tests.html',

      groupSuites: true,
      useCompactStyle: true,
    },

    coverageReporter: {
      type: 'html',
      dir: 'coverage/',
    },

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,

    browsers: ['PhantomJS'],
  });
};

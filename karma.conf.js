/* eslint-disable
  strict,
*/

'use strict';

module.exports = function (config) {
  config.set({
    basePath: '',

    frameworks: ['browserify', 'mocha', 'chai'],

    files: [
      'tests/specs/*.js',
    ],

    preprocessors: {
      'tests/specs/*.js': 'browserify',
    },

    reporters: ['dots', 'html'],

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

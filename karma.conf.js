/*
used with mocha and chai so they can use WEBRTC
*/

module.exports = function(config) {
  config.set({
    frameworks: [ 'mocha'  ],
    preprocessors: {
      'test/index.js': [ 'webpack' ]
    },


    files: ['test/index.js'],
    reporters: ['progress'],
    port: 9876,  // karma web server port
    colors: true,
    logLevel: config.LOG_DEBUG, //LOG_INFO
    browsers: ['ChromeHeadless'],
    autoWatch: false,
    // singleRun: false, // Karma captures browsers, runs the tests and exits
    concurrency: Infinity,
    webpack: configureWebpack()
  })
  function configureWebpack(webpackConfigFunction) {
       var webpackConfig = require('./karma.webpack.config');
       webpackConfig.entry = undefined; // karma will pass the proper argument for entry
       return webpackConfig;
   }

}

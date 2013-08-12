var http = require('http'),
    noop = require("./noop");

/**
 * Pass through wrapper used for application authentication (i.e. no http handshake). Not to be instantiated directly.
 * @constructor
 */
var PassThroughWrapper = function() {
  this.configure();
};

/**
 * Configures the wrapper
 */
PassThroughWrapper.prototype.configure = function(username,password,logger) {
  // don't save username or password
};

/**
 * Performs a http request to the server
 */
PassThroughWrapper.prototype.request = function(options,callback_opt) {
    
    // contentType header usage
    if (undefined != options.contentType) {
      options.headers["Content-type"] = options.contentType;
    }
  return http.request(options,(callback_opt || noop));
};

/**
 * Performs a http get to the server
 */
PassThroughWrapper.prototype.get = function(options,callback_opt) {
    
    // contentType header usage
    if (undefined != options.contentType) {
      options.headers["Content-type"] = options.contentType;
    }
  return http.get(options,(callback_opt || noop));
};
  
module.exports = function() {return new PassThroughWrapper()};

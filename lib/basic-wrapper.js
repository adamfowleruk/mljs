var http = require('http'),
    noop = require("./noop");

/**
 * Creates a new HTTP Basic Auth wrapper. Not to be created directly.
 * @constructor
 */
var BasicWrapper = function() {
  this.configure();
};

/**
 * Configures the basic wrapper
 */
BasicWrapper.prototype.configure = function(username,password,logger) {
  this.username = username;
  this.password = password;
  this.logger = logger;
};

/**
 * Handles a http request to the server
 */
BasicWrapper.prototype.request = function(options,callback_opt) {
    
    // contentType header usage
    if (undefined != options.contentType) {
      options.headers["Content-type"] = options.contentType;
    }
  // add http auth header
  options.headers["Authorization"] = "Basic " + new Buffer(this.username + ':' + this.password).toString('base64');
  return http.request(options,(callback_opt || noop));
};

/**
 * Performs a http get to the server
 */
BasicWrapper.prototype.get = function(options,callback_opt) {
    
    // contentType header usage
    if (undefined != options.contentType) {
      options.headers["Content-type"] = options.contentType;
    }
  // add http auth header
  options.headers["Authorization"] = "Basic " + new Buffer(this.username + ':' + this.password).toString('base64');
  return http.get(options,(callback_opt || noop));
};
  
module.exports = function() {return new BasicWrapper()};

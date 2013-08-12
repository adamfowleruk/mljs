/*
Copyright 2012 MarkLogic Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
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

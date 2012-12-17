var http = require('http'),
    noop = require("./noop");

var BasicWrapper = function() {
  this.configure();
};

BasicWrapper.prototype.configure = function(username,password,logger) {
  this.username = username;
  this.password = password;
  this.logger = logger;
};
BasicWrapper.prototype.request = function(options,callback_opt) {
  // add http auth header
  options.headers["Authorization"] = "Basic " + new Buffer(this.username + ':' + this.password).toString('base64');
  return http.request(options,(callback_opt || noop));
};
BasicWrapper.prototype.get = function(options,callback_opt) {
  // add http auth header
  options.headers["Authorization"] = "Basic " + new Buffer(this.username + ':' + this.password).toString('base64');
  return http.get(options,(callback_opt || noop));
};
  
module.exports = function() {return new BasicWrapper()};

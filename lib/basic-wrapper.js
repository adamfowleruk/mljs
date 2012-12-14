var http = require('http'),
    noop = require("./noop");

var BasicWrapper = function(username,password) {
  this.request = function(options,callback_opt) {
    // add http auth header
    options.headers["Authorization"] = "Basic " + new Buffer(username + ':' + password).toString('base64');
    http.get(options,(callback_opt || noop));
  };
};
module.exports.init = function(user,pass) {
  return new BasicWrapper(user,pass);
};

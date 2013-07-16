var mljs = require("../../mljs"),
    tests = exports,
    assert = require('assert'),
    winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.File({ filename: 'logs/001-do.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/001-do.log' })
  ]
});

describe("001-do",function() {
  it("Should complete entirely",function(done){
  var db = new mljs(); // default options
  db.setLogger(logger);
  
  var options = {
    path: "/v1/search?q=squirrel&format=json",
    method: "GET"
  };
  
  db.do(options,function(result) {
    assert(!result.inError,"result should not be in error: " + JSON.stringify(result.error));
    done();
  });
});});
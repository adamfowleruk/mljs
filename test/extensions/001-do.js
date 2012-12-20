var mldb = require("../../mldb"),
    tests = exports,
    ensure = require('ensure'), 
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

tests.do = function(callback) {
  var db = new mldb(); // default options
  db.setLogger(logger);
  
  var options = {
    path: "/v1/search?q=squirrel&format=json",
    method: "GET"
  };
  
  db.do(options,function(result) {
    assert(!result.inError,"result should not be in error: " + JSON.stringify(result.error));
    callback(!result.inError);
  });
          
};

tests.do_ok = function(t) {
  assert.ok(t);
};

ensure(__filename, tests, module,process.argv[2]);

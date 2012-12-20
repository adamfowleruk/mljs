var mldb = require("../../mldb"),
    tests = exports,
    ensure = require('ensure'), 
    assert = require('assert'),
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
         new winston.transports.File({ filename: 'logs/008-exists.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/008-exists.log' })
       ]
     });

tests.exists = function(callback) {
  var db = new mldb(); // default options
  db.setLogger(logger);
  
  // assume db exists before this test
  db.exists(function(result) {
    assert(!result.inError,"Error checking if db exists");
    logger.debug("TEST: EXISTS: exists result: " + JSON.stringify(result));
    assert(true==result.exists,"Database exists, but reports it does not");
    callback(true);
  });
};

tests.exists_ok = function(t) {
  assert.ok(t);
};

ensure(__filename, tests, module,process.argv[2]);
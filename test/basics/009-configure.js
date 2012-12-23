var mldb = require("../../mldb"),
    tests = exports,
    ensure = require('ensure'), 
    assert = require('assert'),
    winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.File({ filename: 'logs/009-configure.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/009-configure.log' })
  ]
});

tests.configure = function(callback) {
  var db = new mldb(); // default options
  db.setLogger(logger);
  
  var config = {database: "configtest",port: 9095};
  db.configure(config);
  
  db.create(function(result) {
    assert(!result.inError,"Create should not be in error");
    db.destroy(function(result) {
      assert(!result.inError,"Destroy should not be in error");
      callback(!result.inError);
    });
  });
};

tests.configure_ok = function(t) {
  assert.ok(t);
};

ensure(__filename, tests, module,process.argv[2]);

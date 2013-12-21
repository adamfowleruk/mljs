var mljs = require("../../mljs"),
    tests = exports,
    configurator = require('../../testconfig'),
    assert = require('chai').assert,
    winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.File({ filename: 'logs/009-configure.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/009-configure.log' })
  ]
});

describe("009-configure",function() {
  it("Should complete entirely",function(done){
  var db = new mljs(); // default options
  configurator.configure(db);
  db.setLogger(logger);
  
  var config = {database: "configtest",port: 9095};
  db.configure(config);
  
  db.create(function(result) {
    logger.debug("****** Error: " + JSON.stringify(result.doc));
    assert(!result.inError,"Create should not be in error");
    db.destroy(function(result) {
    logger.debug("****** Error: " + JSON.stringify(result.doc));
      assert(!result.inError,"Destroy should not be in error");
      done();
    });
  });
  
});});
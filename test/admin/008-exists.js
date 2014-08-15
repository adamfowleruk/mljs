var mljs = require("mljs"),
    tests = exports,
    configurator = require('../../testconfig'),
    assert = require('chai').assert,
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
         new winston.transports.File({ filename: 'logs/008-exists.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/008-exists.log' })
       ]
     });

describe("008-exists",function() {
  it("Should complete entirely",function(done){
  var db = new mljs(); // default options
  configurator.configure(db);
  db.setLogger(logger);

  // assume db exists before this test
  db.exists(function(result) {
    assert.equal(false,result.inError,"Error checking if db exists");
    logger.debug("TEST: EXISTS: exists result: " + JSON.stringify(result));
    assert.equal(true,result.exists,"Database exists, but reports it does not");
    done();
  });

});
});

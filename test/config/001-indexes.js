var mljs = require("mljs"),
    tests = exports,
    configurator = require('../../testconfig'),
    assert = require('chai').assert,
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/001-indexes.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/001-indexes.log' })
       ]
     });

describe("001-indexes",function() {

  describe("#indexes()", function(){

    it("Should complete entirely",function(done){
      var db = new mljs(); // default options
  configurator.configure(db);
      db.setLogger(logger);

      db.indexes(function(result) {
        if (result.inError) logger.debug("ERROR: " + JSON.stringify(result));
        assert.equal(result.inError,false,"indexes() should not be in error: " + JSON.stringify(result));

        var summaries = result.doc["index-summaries"];
        assert(undefined != summaries,"index-summaries should not be undefined in result");
        if (undefined != summaries ) {
          var summary = summaries["index-summary"];
          assert(undefined != summary,"summary should not be undefined in index-summaries");
          var indexCount = summaries["index-count"];
          assert(undefined != indexCount,"index-count should not be undefined in index-summaries");
          var complete = summaries.complete;
          assert(undefined != complete,"complete should not be undefined in index-summaries");
          assert(("false"==complete || "true"==complete),"complete should be true or false");
        }

        done();
      });

    }); // it
  });// describe plain

});

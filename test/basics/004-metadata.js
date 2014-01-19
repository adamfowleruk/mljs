var mljs = require("../../mljs"),
    tests = exports,
    configurator = require('../../testconfig'),
    assert = require('chai').assert,
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/004-metadata.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/004-metadata.log' })
       ]
     });

describe("004-metadata",function() {
  it("Should complete entirely",function(done){
  var db = new mljs(); // default options
  configurator.configure(db);
  db.setLogger(logger);
  
  logger.debug("****** Creating doc");
  db.save({from: "test", to: "all", body: "wibble"},"/meta/1", {collection: "metatest"},function(result) {
    assert(!result.inError,"Save should not be in error: " + JSON.stringify(result.error));
    // now fetch it
    logger.debug("****** Doc created. Fetching doc.");
    db.metadata("/meta/1", function(result) {
      logger.debug("TEST: METADATA: " + JSON.stringify(result));
      assert(!result.inError,"Metadata should not be in error: " + JSON.stringify(result.error));
      // now print it
      logger.debug("****** Doc content: " + JSON.stringify(result.doc));
      
      assert("metatest"==result.doc.collections[0],"Collection should be metatest");
      
      // now delete it
      logger.debug("****** deleting doc");
      db.delete("/meta/1", function(result) {
        assert(!result.inError,"Delete should not be in error: " + JSON.stringify(result.error));
        logger.debug("****** Doc deleted");
        //assert.isNull(result.doc);
        done();
      });
    });
  });
  
});});
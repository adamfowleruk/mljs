var mljs = require("mljs"),
    tests = exports,
    configurator = require('../../testconfig'),
    assert = require('chai').assert,
    winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
     new winston.transports.File({ filename: 'logs/003-save-load-equal.log' })
  ],
  exceptionHandlers: [
     new winston.transports.File({ filename: 'logs/003-save-load-equal.log' })
  ]
});


describe("003-save-load-equal",function() {
  it("Should complete entirely",function(done){

  var db = new mljs(); // default options
  configurator.configure(db);
  db.setLogger(logger);

  logger.debug("Testing basic json equal");

  var json = {first: 1, second: "two", third: 0.2345};

  db.save(json,"/equal/1.json", function(result) {
    db.get("/equal/1.json", function(result) {
      // now print it
      logger.debug("Doc content: " + JSON.stringify(result.doc));
      logger.debug("JSON content: " + JSON.stringify(json));
      //assert.equal(undefined,result.doc,"/messages/1 exists, should not be found in DB.");
      assert.equal(JSON.stringify(json),JSON.stringify(result.doc),"JSON objects should be equal");


 logger.debug("Testing basic json equal");

 json = {first: 1, second: "two", third: 0.2345, fourth: ["1","2","3"], fifth: { fivedotone: 9, fivedottwo: 8}};

 db.save(json,"/equal/2.json", function(result) {
   db.get("/equal/2.json", function(result) {
     // now print it
     logger.debug("Doc content: " + JSON.stringify(result.doc));
      logger.debug("JSON content: " + JSON.stringify(json));
     //assert.equal(undefined,result.doc,"/messages/1 exists, should not be found in DB.");
     assert.equal(JSON.stringify(json),JSON.stringify(result.doc),"JSON objects should be equal 2");

     done();
   });
 });


    });
  });


});});

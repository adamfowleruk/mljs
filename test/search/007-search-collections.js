var mljs = require("mljs"),
    tests = exports,
    configurator = require('../../testconfig'),
    assert = require('chai').assert,
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/007-search-collections.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/007-search-collections.log' })
       ]
     });

describe("007-search-collections",function() {


  var col = {collection: "testcol", contentType: "application/json"};
  var uris = ["/collections/1","/collections/2","/collections/3"];

  var db = new mljs(); // default options
  configurator.configure(db);
  db.setLogger(logger);


before(function(done) {
  // This is where global DB setup happens

  db.save({name:"first"},uris[0],col,function(result) {
    assert(!result.inError,"Error saving doc 1");
    db.save({name:"second"},uris[1],col,function(result) {
      assert(!result.inError,"Error saving doc 2");
      db.save({name:"third"},uris[2],col,function(result) {
        assert(!result.inError,"Error saving doc 3");
    done();
  });});});
});

after(function(done){
  // this is where global clean up happens
              // now remove docs in collection
              db.delete(uris[0],function(result) {
                assert(!result.inError,"Error deleting doc 1");
                db.delete(uris[1],function(result) {
                  assert(!result.inError,"Error deleting doc 2");
                  db.delete(uris[2],function(result) {
                    assert(!result.inError,"Error deleting doc 3");

                    done();
                  });
                  });
                  });
});

  describe("#searchCollection()", function(){

    it("Should complete entirely",function(done){
      //var db = new mljs(); // default options
      //db.setLogger(logger);

      // requires global.js before() to be called
      db.searchCollection("testcol","","all",null,function(result) {
        logger.debug("JSON result: " + JSON.stringify(result));
        assert.equal(result.inError,false,"searchCollection() should not be in error");

        var results = result.doc;

        assert(undefined != results,"Search results JSON object should not be undefined");
        logger.debug("JSON result total: " + JSON.stringify(results.total));

        if (undefined != results) {
          assert(undefined != results.total,"results.total should not be undefined");
          if (undefined != results.total) {
            //assert(results.total > 0,"Should be at least one document result for 'testcol' and word 'third'");
          }
        }

        done();
      });

    }); // it
  });// describe plain

});

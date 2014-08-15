var mljs = require("mljs"),
    tests = exports,
    configurator = require('../../testconfig'),
    assert = require('chai').assert,
    winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.File({ filename: 'logs/001-keyvalue.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/001-keyvalue.log' })
  ]
});

describe("001-keyvalue",function() {
  it("Should complete entirely",function(done){
  var db = new mljs(); // default options
  configurator.configure(db);
  db.setLogger(logger);

  // add three docs to the collection
  var col = {collection: "kvcol",contentType: "application/json"};
  var uris = ["/kv/1","/kv/2","/kv/3"];
  db.save({name:"first whippet"},uris[0],col,function(result) {
    assert(!result.inError,"Error saving doc 1: " + JSON.stringify(result));
    db.save({name:"second squirrel"},uris[1],col,function(result) {
      assert(!result.inError,"Error saving doc 2: " + JSON.stringify(result));
      db.save({name:"third wolf"},uris[2],col,function(result) {
        assert(!result.inError,"Error saving doc 3: " + JSON.stringify(result));

        logger.debug("TEST: KEYVALUE: Third save complete. Results object: " + JSON.stringify(result));
        // get docs in collection
        db.keyvalue("name","third wolf",function(result) {
          // ensure there are 3
          logger.debug("TEST: KEYVALUE results object: " + JSON.stringify(result));
          if (undefined == result.doc) {
            callback(false);
          } else {
            var isOne = (1==result.doc.total);
            assert(isOne,"There should only be one document with name='third wolf' in " + col.collection + ", result: " + JSON.stringify(result));

            if (isOne){
              // now remove docs in collection
              db.delete(uris[0],function(result) {
                assert(!result.inError,"Error deleting doc 1: " + JSON.stringify(result));
                db.delete(uris[1],function(result) {
                  assert(!result.inError,"Error deleting doc 2: " + JSON.stringify(result));
                  db.delete(uris[2],function(result) {
                    assert(!result.inError,"Error deleting doc 3: " + JSON.stringify(result));
                    logger.debug("TEST: SEARCH returning true for success");
                    done();
                  });
                });
              });
            }
          }
        });
      });
    });
  });

});});

var mldb = require("../../mldb"),
    tests = exports,
    assert = require('assert'),
    winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.File({ filename: 'logs/001-key-value.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/001-key-value.log' })
  ]
});

describe("001-keyvalue",function() {
  it("Should complete entirely",function(done){
  var db = new mldb(); // default options
  db.setLogger(logger);
  
  // add three docs to the collection
  var col = {collection: "kvcol"};
  var uris = ["/kv/1","/kv/2","/kv/3"];
  db.save({name:"first whippet"},uris[0],col,function(result) {
    assert(!result.inError,"Error saving doc 1");
    db.save({name:"second squirrel"},uris[1],col,function(result) {
      assert(!result.inError,"Error saving doc 2");
      db.save({name:"third wolf"},uris[2],col,function(result) {
        assert(!result.inError,"Error saving doc 3");
        
        logger.debug("TEST: KEYVALUE: Third save complete. Results object: " + JSON.stringify(result));
        // get docs in collection
        db.keyvalue("name","third wolf",function(result) {
          // ensure there are 3
          logger.debug("TEST: KEYVALUE results object: " + JSON.stringify(result));
          if (undefined == result.doc) {
            callback(false);
          } else {
            var isOne = (1==result.doc.total);
            assert(isOne,"There should only be one document with name='third wolf' in " + col.collection);
          
            if (isOne){
              // now remove docs in collection
              db.delete(uris[0],function(result) {
                assert(!result.inError,"Error deleting doc 1");
                db.delete(uris[1],function(result) {
                  assert(!result.inError,"Error deleting doc 2");
                  db.delete(uris[2],function(result) {
                    assert(!result.inError,"Error deleting doc 3");
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
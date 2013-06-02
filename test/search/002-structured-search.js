var mldb = require("../../mldb"),
    tests = exports,
    assert = require('assert'),
    winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.File({ filename: 'logs/002-structured-query.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/002-structured-query.log' })
  ]
});

describe("002-structured-search",function() {
  it("Should complete entirely",function(done){
  var db = new mldb(); // default options
  db.setLogger(logger);
  
  // add three docs to the collection
  var col = {collection: "ssearchcol"};
  
  var query = {"query":
    {"term-query":
      {"text":
        ["rhino"]
      }
    }
  }
  var uris = ["/ssearch/1","/ssearch/2","/ssearch/3"];
  db.save({name:"first elephant"},uris[0],col,function(result) {
    assert(!result.inError,"Error saving doc 1");
    db.save({name:"second rhino"},uris[1],col,function(result) {
      assert(!result.inError,"Error saving doc 2");
      db.save({name:"third penguin"},uris[2],col,function(result) {
        assert(!result.inError,"Error saving doc 3");
        
        logger.debug("TEST: STRUCTUREDSEARCH: Third save complete. Results object: " + JSON.stringify(result));
        // get docs in collection
        db.structuredSearch(query,function(result) {
          // ensure there are 3
          logger.debug("TEST: STRUCTUREDSEARCH results object: " + JSON.stringify(result));
          if (undefined == result.doc) {
            callback(false);
          } else {
            var isOne = (1==result.doc.total);
            assert(isOne,"There should only be one document with rhino in " + col.collection);
          
            if (isOne){
              // now remove docs in collection
              db.delete(uris[0],function(result) {
                assert(!result.inError,"Error deleting doc 1");
                db.delete(uris[1],function(result) {
                  assert(!result.inError,"Error deleting doc 2");
                  db.delete(uris[2],function(result) {
                    assert(!result.inError,"Error deleting doc 3");
                    logger.debug("TEST: STRUCTUREDSEARCH returning true for success");
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
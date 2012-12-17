var mldb = require("../../mldb"),
    tests = exports,
    ensure = require('ensure'), 
    assert = require('assert'),
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
         new winston.transports.File({ filename: '../test-logs.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: '../test-logs.log' })
       ]
     });

tests.createDestroy = function(callback) {
  var db = new mldb(); // default options
  db.setLogger(logger);
  var dodestroy = function() {
    db.destroy(function(result) {
      assert(!result.inError,"Destroy should not be in error.");
      // try a get (error)
      if (!result.inError) {
        var uri = "/messages/1";
        
        db.get(uri,function(result) {
          assert(result.inError,"Should not be able to retrieve document if db is destroyed.");
          db.create(function(result) {
            assert(!result.inError,"Create should not be in error");
            db.save({first: "isfirst"},uri,function(result) {
              assert(result.inError,"Should not be able to save new document if db is destroyed.");
              callback(true);
            });
          });
        });
      }
    });
  };
  db.exists(function(result) {
    if (result) {
      // destroy then create
      dodestroy();
    } else {
      // create then destroy
      db.create(function(result) {
        assert(!result.inError,"Should be able to create db");
        dodestroy();
      });
    }
  });
};

  tests.createDestroy_ok = function(t) {
    assert.ok(t);
  };

ensure(__filename, tests, module,process.argv[2]);

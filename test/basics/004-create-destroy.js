var mldb = require("../../mldb"),
    tests = exports,
    ensure = require('ensure'), 
    assert = require('assert'),
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
         new winston.transports.File({ filename: '../004-create-destroy.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: '../004-create-destroy.log' })
       ]
     });

tests.createDestroy = function(callback) {
  var db = new mldb(); // default options
  db.setLogger(logger);
  var dodestroy = function() {
    logger.debug("TEST: doDestroy()");
    db.destroy(function(result) {
      assert(!result.inError,"Destroy should not be in error.");
      
      // WARNING destroy forces app server restart (for some reason), so pause here a while
      logger.debug("TEST: Sleeping for 20 seconds for server restart");
      var sleep = require('sleep');
      sleep.sleep(20);
      
      // try a get (error)
      if (!result.inError) {
        logger.debug("TEST: Calling exists post destroy");
        
        // try exists again
        db.exists(function(result) {
          assert(!result.inError,"db.exists should not be in error if db destroyed");
          assert(result.exists,"db.exists should be false if db destroyed");
          
          if (!result.inError) {
            // incase exists() returns 'true', with no error, but it actually doesn't exist
            
            var uri = "/messages/1";
            logger.debug("TEST: Calling get post destroy and exists");

            db.get(uri,function(result) {
              assert(result.inError,"Should not be able to retrieve document if db is destroyed.");
              
              logger.debug("TEST: Calling create");
              db.create(function(result) {
                assert(!result.inError,"Create should not be in error");
                
                logger.debug("TEST: Sleeping for 20 seconds for server restart");
                var sleep = require('sleep');
                sleep.sleep(20);
                
                logger.debug("TEST: Calling save post create");

                db.save({first: "isfirst"},uri,function(result) {
                  assert(result.inError,"Should not be able to save new document if db is destroyed.");
                  callback(true);
                });
              });
            });
          }
        });
        
      }
    });
  };  
  logger.debug("TEST: Calling exists the first time");
  db.exists(function(result) {
    assert(!result.inError,"Should not have error from db.exists: " + JSON.stringify(result));
    if (!result.inError) {
      if (result.exists) {
        // destroy then create
        dodestroy();
      } else {
        // ensure it is definitely not there - try a save
        var uri = "/messages/1";
        logger.debug("TEST: Calling save after exists()->false");
        db.save({first: "isfirst"},uri,function(result) {
          assert(result.inError,"Should not be able to save new document if db is destroyed.");
        
          logger.debug("TEST: Calling create after exists()->false");
          // create then destroy
          db.create(function(result) {
            assert(!result.inError,"Should be able to create db: " + result.error);
            dodestroy();
          });
        });
      }
    }
  });
};

  tests.createDestroy_ok = function(t) {
    assert.ok(t);
  };

ensure(__filename, tests, module,process.argv[2]);

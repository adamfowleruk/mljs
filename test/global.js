var mljs = require("mljs"),
    tests = exports,
    configurator = require('../testconfig'),
    assert = require('assert'),
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/global.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/global.log' })
       ]
     });

  var db = new mljs(); // default options
  configurator.configure(db);
  db.setLogger(logger);

  var options = db.createOptions();

before(function(done) {
  // This is where global DB setup happens

  db.saveSearchOptions("all",options.toJson(),function(result) {
    if (result.inError) {
      console.log(result);
      throw new Error(result);
    }
    done();
  });
});

after(function(done){
  // this is where global clean up happens
  done();
});

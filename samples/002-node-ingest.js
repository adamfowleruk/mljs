var mldb = require("../../mldb"),
    tests = exports,
    ensure = require('ensure'), 
    assert = require('assert'),
    winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.File({ filename: 'logs/s002-node-ingest.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/s002-node-ingest.log' })
  ]
});

/**
 * This sample shows how to make the most readable coding style when using MLDB's event driven mechanism
 */

/**
 * Utility function to throw an exception on error - reduces the if (result.inError) code required
 */
var err = function(result,cb) {
  if (result.inError) {
    throw new Exception(result.error);
  } else {
    cb(result);
  }
};

/**
 * Creates a handler function based on res. Reduces number of } and ) in main code
 */
var cf = function(func) {
  return function(res) {err(res,func)};
};

try {
  var db = new mldb(); // defaults
  db.setLogger(logger);
  //db.configure({database: "restingest",port: 9094}); // don't need this, I use it so I don't interefere with my test db
  console.log("mldb configured");
  
    // begin transaction
    db.beginTransaction(function (result) {
      var txid = result.txid; // don't need to use this - handled by mldb
      
      console.log("within transaction");
    
    // grab all files within the specified ingest directory
    //var walk    = require('walk');
//var files   = new Array();


    var fs = require('fs');
fs.readdir('./samples/test-ingest/', function(err, files) {
    files.forEach(function(file) { fs.readFile(file, 'utf-8', function(err, contents) {
           console.log("CONTENT: " + contents);
           ingestFile(file,contents);
         })})});

/*
// Walker options
var walker  = walk.walk('./samples/test-ingest', { followLinks: false });

walker.on('file', function(root, stat, next) {
  var fn = root + '/' + stat.name;
  console.log("found walked file: " + fn);
    // Add this file to the list of files
    files.push(fn);
    next();
});*/

var saves = {};
saves.count = 0;
saves.increment = function() {
  console.log("increment");
  saves.count++;
};

var ingestFile = function(name,data) {
  
        console.log("finished reading file: " + name);
        //filedata[i] = data;
        db.save(name,JSON.parse(data),function(result) {
          console.log("db.save finished on: " + name);
          if (result.inError) {
            saves.error = result.doc;
            console.log("ERROR on save: " + JSON.stringify(result));
          }
          saves.increment();
        });
};


  var sleep = require('sleep');
/*
walker.on('end', function() {
    console.log("Got all files. Adding: " + files.length);
    
    var filedata = new Array();
    for (var i = 0;i < files.length;i++) {
      console.log("I: " + i);
      fs.readFile(files[i], function(err, data) {
        ingestFile(files[i],"");
      });
    }
    
    
    // leave DB alone so you can go and manually inspect it
});
  */
  
  sleep.sleep(10);
    
    // commit transaction once all saves are called
    if (undefined != saves.error) {
      // error and rollback
      console.log("Error encountered, Rolling back: " + JSON.stringify(saves.error));
      db.rollbackTransaction();
    } else {
      db.commitTransaction();
    }
  
  
  });
} catch (err) {
  logger.info(err.message);
}
 
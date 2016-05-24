#!/usr/bin/env node

var mljs = require("mljs");
var Q = require("q");
var fs = require("fs");


var db = new mljs();
db.configure({"host":"192.168.123.4","port": "7011" /*, "proxyhost": "127.0.0.1", "proxyport": "8888"*/});
//db.configure({"host":"127.0.0.1","port": "5001"}); // proxied through mljsserve

var files = [
  "../medicaldeviceperformance/data/initial/journal-articles/Yuasa.pdf",
  "../medicaldeviceperformance/data/initial/journal-articles/McLawhorn.pdf"
  /*
  ,
  "../medicaldeviceperformance/data/initial/journal-articles/Grosser-J Surgery-2013.pdf",
  "../medicaldeviceperformance/data/initial/journal-articles/Ettinger_Nanos.pdf",
  "../medicaldeviceperformance/data/initial/journal-articles/Dramis-Hip Int-2014.pdf",
  "../medicaldeviceperformance/data/initial/journal-articles/Clement-Int Orthop-2013.pdf",
  "../medicaldeviceperformance/data/initial/journal-articles/Bagsby-Orthopedics-2014.pdf",
  "../medicaldeviceperformance/data/initial/journal-articles/Bourne Orthopedics 2008.pdf",
  "../medicaldeviceperformance/data/initial/journal-articles/Civinini JBJS Br 2008.pdf",
  "../medicaldeviceperformance/data/initial/journal-articles/Banerjee-J Arthroplasty-2014.pdf",
  "../medicaldeviceperformance/data/initial/journal-articles/Brown-Orthopedics 2008.pdf"
  */
];

// get Blobs and URIs for files
var prefix = "/journal-articles/"; // hardcoded URI prefix for testing

/*
var loadFile = function(file) {
  var deferred = Q.defer();

  // process file itself
  // generate URI
  var uri = prefix + escape(file.substring(file.lastIndexOf("/") + 1) );
  console.log("URI: " + uri);
  // read file as Blobs
  fs.readFile(file, 'utf8', function(err, content) {
        if (err) {
          crapout(err);
        }
  // call deferred.resolve with result

  return deferred;
};
*/

//var promises = new Array();
var doc_array = new Array();
var uri_array = new Array();
var mime_array = new Array();

for (var f = 0,fl;f < files.length;f++) {
  fl = files[f];
  var uri = prefix + escape(fl.substring(fl.lastIndexOf("/") + 1) );
  console.log("URI: " + uri);
  uri_array.push(uri);
  doc_array.push(fs.createReadStream(fl));
  mime_array.push("application/pdf"); // hardcoded for our test
//  promises.push(loadFile(fl));
}

//Q.all(promises).then(function(params) {
  db.saveAllParallel(doc_array,uri_array,mime_array,3,3,{collections: "originals"},function callback(result) {
    if (result.inError) {
      console.log("ERROR");
      console.log(result.details);
      process.exit(1);
    } else {
      console.log("All files saved");
      console.log("result.docuris: " + result.docuris);
      process.exit(0);
    }
  },function progress(percentage) {
    console.log("Progress is " + percentage + "%");
  });

//});

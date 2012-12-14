var mldb = require("../mldb");

var db = new mldb(); // default options

console.log("Testing digest get");

  var doc = db.get("/messages/1", function(result) {
    // now print it
    console.log("Doc content: " + JSON.stringify(result.doc));
    
  });

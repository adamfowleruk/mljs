var mldb = require("../mldb");

var db = new mldb(); // default options

console.log("Creating doc");
db.save({from: "test", to: "all", body: "wibble"},"/messages/1", {collection: "messages"},function(result) {
  // now fetch it
  console.log("Doc created. Fetching doc.");
  var doc = db.get("/messages/1", function(result) {
    // now print it
    console.log("Doc content: " + JSON.stringify(result.doc));
    
    // now delete it
    console.log("deleting doc");
    db.delete("/messages/1", function(result) {
      console.log("Doc deleted");
    });
  });
});

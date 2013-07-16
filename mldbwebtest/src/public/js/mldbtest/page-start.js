
$(document).ready(function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  
  // save then get doc
  var doc = {title: "test doc", summary: "Penguins are awesome"};
  var uri = "/documents/1";
  
  db.save(doc,uri,function(result) {
    if (result.inError) {
      $("#log").html("Save Error: " + result.error);
    } else {
      // fetch doc and display content as string
      db.get(uri,function(result2) {
        if (result2.inError) {
          $("#log").html("Get Error: " + result2.error);
        } else {
          $("#log").html("Get Result: " + JSON.stringify(result2.doc));
          
          // delete doc
          db.delete(uri,function(result) {
            if (result.inError) {
              $("#log").html("Get Error: " + result.error);
            } else {
              $("#log").html("Document successfully deleted");
            }
          });
        }
      });
    }
  });
});
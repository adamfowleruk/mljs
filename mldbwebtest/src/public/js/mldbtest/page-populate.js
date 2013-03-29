
$(document).ready(function() {
  // initialise MLDB
  var db = new mldb(); // calls default configure
  
  // save then get doc
  var docs = [
    {title: "test doc 1", summary: "Penguins are awesome", animal: "penguin", family: "bird"},
    {title: "test doc 2", summary: "Dogs are cool", animal: "dog", family: "pet"},
    {title: "test doc 3", summary: "Cats are boring", animal: "cat", family: "pet"},
    {title: "test doc 4", summary: "Adam has no imagination", animal: "homosapien", family: "marklogician"}
  ];
  
  db.saveAll(docs,function(result) {
    if (result.inError) {
      $("#log").html("Save All Error: " + result.error);
    } else {
      // done
      $("#log").html("Save All done: ");
    }
  });
});
$(document).ready(function() {
  // initialise MLDB
  var db = new mldb(); // calls default configure
  
  var wgt = new com.marklogic.widgets.collectionuris("collections");
  wgt.list("/");
});
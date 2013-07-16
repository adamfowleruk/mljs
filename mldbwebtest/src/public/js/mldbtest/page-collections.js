$(document).ready(function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  
  var wgt = new com.marklogic.widgets.collectionuris("collections");
  wgt.list("/");
});
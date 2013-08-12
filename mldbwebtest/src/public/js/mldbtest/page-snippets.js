
$(document).ready(function() {
  var db = new mljs(); 
  
  var wgt = new com.marklogic.widgets.searchpage("search-page");
  
  var ob = new db.options();
  ob.defaultCollation("http://marklogic.com/collation/en")
    .collectionConstraint() // default constraint name of 'collection' 
    .rangeConstraint("animal",["item-order"]) // constraint name defaults to that of the range element name 
    .rangeConstraint("family",["item-frequency"]) // constraint name defaults to that of the range element name 
    .rangeConstraint("actor",["item-frequency"],"http://marklogic.com/collation/")
    .rangeConstraint("year",["item-order"],"http://marklogic.com/collation/")
    .rangeConstraint("city",["item-order"],"http://marklogic.com/collation/")
    .rangeConstraint("month",["item-order"],"http://marklogic.com/collation/")
    .snippet();
  var options = ob.toJson();
  
  wgt.setOptions("mljstest-page-search-options",options);
  wgt.execute();
  
});
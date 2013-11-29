
window.onload = function() {
  var db = new mljs(); 
  
  var wgt = new com.marklogic.widgets.searchpage("search-page");
  
  var ob = db.createOptions();
  ob.defaultCollation("http://marklogic.com/collation/en")
    .collectionConstraint() // default constraint name of 'collection' 
    .rangeConstraint("Animal","animal",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"]) // constraint name defaults to that of the range element name 
    .rangeConstraint("Family","family",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-frequency"]) // constraint name defaults to that of the range element name 
    .rangeConstraint("Actor","actor",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-frequency"])
    .rangeConstraint("Year","year",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"])
    .rangeConstraint("City","city",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"])
    .rangeConstraint("Month","month",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"])
    .snippet();
  
  wgt.setOptions("mljstest-page-search-options",ob);
  wgt.execute();
  
};
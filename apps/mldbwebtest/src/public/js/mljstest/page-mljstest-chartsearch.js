
window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
  var optionsName = "page-charts-search";
  
  var tempspline = new com.marklogic.widgets.highcharts("splineline");
  tempspline.addErrorListener(error.updateError);
  tempspline.setSeriesSources("#Animals","animal","age");
  tempspline.setAggregateFunction("mean");
  tempspline.setAutoCategories(true);
  // now for highcharts object configuration
  tempspline.spline().title("Average animal age").subtitle("Years").yTitle("Years");
  
  var tempcolumn = new com.marklogic.widgets.highcharts("column");
  tempcolumn.addErrorListener(error.updateError);
  tempcolumn.setSeriesSources("#Animals","animal","animal");
  tempcolumn.setAggregateFunction("count");
  tempcolumn.setAutoCategories(true);
  tempcolumn.column().title("Animal Popularity").subtitle("").yTitle("Count");
    
  var familypie = new com.marklogic.widgets.highcharts("pie");
  familypie.addErrorListener(error.updateError);
  familypie.setSeriesSources("#Family","!family",null);
  familypie.setAggregateFunction("none");
  familypie.setAutoCategories(true);
  familypie.pie().title("Animal Family").subtitle("");
  
  var ob = db.createOptions();
  ob.defaultCollation("http://marklogic.com/collation/en")
    .pageLength(100)
    .collectionConstraint() // default constraint name of 'collection' 
    .jsonRangeConstraint("animal",["item-order"]) // constraint name defaults to that of the range element name 
    .jsonRangeConstraint("family",["item-frequency"]); // constraint name defaults to that of the range element name 
  
  var context = db.createSearchContext();
  
  var bar = new com.marklogic.widgets.searchbar("cs-bar");
  context.register(bar);
  context.register(tempspline);
  context.register(tempcolumn);
  context.register(familypie);
  context.setOptions(optionsName,ob);
  context.setCollection("animals,testdata"); // restrict all search results
  
  context.addErrorListener(error.updateError);
  
  context.doSimpleQuery();
  
  } catch (err) {
    error.show(err.message);
  }
};
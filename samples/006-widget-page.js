
window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
    // 1. Create widgets
    //   E.g. Create a highcharts widget
    var tempspline = new com.marklogic.widgets.highcharts("splineline");
    tempspline.addErrorListener(error.updateError);
    tempspline.setSeriesSources("#Animals","animal","age");
    tempspline.setAggregateFunction("mean");
    tempspline.setAutoCategories(true);
    // now for highcharts object configuration
    tempspline.spline().title("Average animal age").subtitle("Years").yTitle("Years");
    
    // 2. Create Contexts and register widgets
    //    E.g. A Search Context
    var context = db.createSearchContext();
    
    context.register(tempspline);
    
    // 3. Configure page / contexts
    //    E.g. link context to page error display widget
    context.addErrorListener(error.updateError);
    
    //    E.g. set search options
    var optionsName = "widget-example-page";
  
    var ob = db.createOptions();
    ob.defaultCollation("http://marklogic.com/collation/en")
      .pageLength(100)
      .collectionConstraint() // default constraint name of 'collection' 
      .jsonRangeConstraint("animal",["item-order"]) // constraint name defaults to that of the range element name 
      .jsonRangeConstraint("family",["item-frequency"]); // constraint name defaults to that of the range element name 
  
    context.setOptions(ob); // uses Options Builder rather than REST API JSON format - enables advanced features
    
    // 4. Perform any initial operations
    //    E.g. perform initial (blank) query
    context.doSimpleQuery();
  
  } catch (err) {
    error.show(err.message);
  }
};
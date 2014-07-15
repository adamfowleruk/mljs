window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");

  var error = new com.marklogic.widgets.error("errors");

  try {

  var optionsName = "page-steven-search";
  var ob = db.createOptions();
  ob.defaultCollation("http://marklogic.com/collation/en")
    .pageLength(10)
    .collectionConstraint() // default constraint name of 'collection'
    .jsonRangeConstraint("animal",["item-order"]) // constraint name defaults to that of the range element name
    .jsonRangeConstraint("family",["item-frequency"]); // constraint name defaults to that of the range element name

  var context = db.createSearchContext();

  var bar = new com.marklogic.widgets.searchbar("cs-bar");
  var metrics = new com.marklogic.widgets.searchmetrics("metrics");
  var results = new com.marklogic.widgets.searchresults("results");
  context.register(bar);
  context.register(metrics);
  context.register(results);

  context.setOptions(optionsName,ob);
  //context.setCollection("animals,testdata"); // restrict all search results

  context.addErrorListener(error.updateError);

  //context.doSimpleQuery();

  } catch (err) {
    error.show(err.message);
  }
};


$(document).ready(function() {
  var db = new mljs();
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
  var semctx = new db.semanticcontext();
  var contentctx = new db.searchcontext();
  semctx.setContentContext(contentctx);
 
  var wgt = new com.marklogic.widgets.searchresults("search-content");
  contentctx.register(wgt);
  //wgt.addErrorListener(error.updateError);
  //wgt.bar.setTransform("redaction");
  //wgt.bar.setFormat("xml"); // redaction transform will convert to JSON
  
  var tripResults = new com.marklogic.widgets.sparqlresults("triple-content");
  semctx.register(tripResults);
  //tripResults.addErrorListener(error.updateError);
  
  var trip = new com.marklogic.widgets.sparqlbar("query");
  semctx.register(trip);
  //trip.addErrorListener(error.updateError);
  //trip.addResultsListener(function(res) {tripResults.updateResults(res)});
  
  var info = new com.marklogic.widgets.entityfacts("facts");
  semctx.register(info);
  //info.addErrorListener(error.updateError);
  tripResults.iriHandler(function(iri) {info.updateEntity(iri)});
  info.iriHandler(function(iri){info.updateEntity(iri)});
  //info.setProvenanceWidget(wgt);
  
  var ob = new db.options();
  ob.defaultCollation("http://marklogic.com/collation/en")
    .collectionConstraint() // default constraint name of 'collection' 
    .rangeConstraint("animal",["item-order"]) // constraint name defaults to that of the range element name 
    .rangeConstraint("family",["item-frequency"]) // constraint name defaults to that of the range element name 
    .rangeConstraint("actor",["item-frequency"],"http://marklogic.com/collation/")
    .rangeConstraint("year",["item-order"],"http://marklogic.com/collation/")
    .rangeConstraint("city",["item-order"],"http://marklogic.com/collation/")
    .rangeConstraint("month",["item-order"],"http://marklogic.com/collation/");
  var options = ob.toJson();
  
  contentctx.setOptions("mljstest-page-search-options",options);
  
    //var wgt = new com.marklogic.widgets.sparqlbar("sparqlbar");
    //wgt.addErrorListener(error.updateError);
  
  } catch (err) {
    error.show(err.message);
  }
});
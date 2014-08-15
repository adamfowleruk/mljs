
window.onload = function() {
  var db = new mljs();
  db.logger.setLogLevel("debug");

  var error = new com.marklogic.widgets.error("errors");

  try {

  var semctx = db.createSemanticContext();
  var contentctx = db.createSearchContext();
  semctx.setContentContext(contentctx);

  semctx.getTripleConfiguration().addTest(); // now done via semantic config builder functions

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
  info.setProvenanceSparqlMentioned();
  semctx.register(info);
  //info.addErrorListener(error.updateError);
  tripResults.iriHandler(function(iri) {info.updateEntity(iri)});
  info.iriHandler(function(iri){info.updateEntity(iri)});
  //info.setProvenanceWidget(wgt);

  var ob = db.createOptions();
  ob.collectionConstraint() // default constraint name of 'collection'
    .jsonRangeConstraint("animal","xs:string","http://marklogic.com/collation/en",["item-order"]) // constraint name defaults to that of the range element name
    .jsonRangeConstraint("family","xs:string","http://marklogic.com/collation/en",["item-frequency"]) // constraint name defaults to that of the range element name
    .jsonRangeConstraint("actor",["item-frequency"])
    .jsonRangeConstraint("year",["item-order"])
    .jsonRangeConstraint("city",["item-order"])
    .jsonRangeConstraint("month",["item-order"]);

  contentctx.setOptions("mljstest-page-search-options",ob);

    //var wgt = new com.marklogic.widgets.sparqlbar("sparqlbar");
    //wgt.addErrorListener(error.updateError);

  } catch (err) {
    error.show(err.message);
  }
};

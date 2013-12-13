
window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  db.forceVersion("6.0.2"); // disabled combined query
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
  var optsName = "actor-genre-year";

  var ob = db.createOptions();
  ob.tuples("actor-genre","actor","genre"); // first is tuple name. defaults to string, json namespace
  //ob.jsonRangeConstraint("actor",["item-frequency"])
  //  .jsonRangeConstraint("year",["item-order"])
  //  .jsonRangeConstraint("genre",["item-order"]);
  ob.tuples("actor-year","actor","year"); // first is tuple name. defaults to string, json namespace
  ob.tuples("actor-genre-year","actor","genre","year");
  
  // FOLLOWING MUST BE HERE TO RECEIVE ANY CO-OCCURENCE RESULTS! Disabled by default
  ob.returnValues(true).returnResults(false).returnFacets(false);
  
  var opts = ob.toJson();
  
  var coag = new com.marklogic.widgets.cooccurence("coag");
  coag.addErrorListener(error.updateError);
  coag.title = "Actor vs. Movie Genre";
  coag.setTupleConstraints(["actor","genre"]);
  
  var coay = new com.marklogic.widgets.cooccurence("coay");
  coay.addErrorListener(error.updateError);
  coay.title = "Actor vs. Movie Year";
  coay.setTupleConstraints(["actor","year"]);
  
  var coagy = new com.marklogic.widgets.cooccurence("coagy");
  coagy.addErrorListener(error.updateError);
  coagy.title = "Actor vs. Genre vs. Year";
  coagy.setTupleConstraints(["actor","genre","year"]);
  
  var qb = db.createQuery();
  var colQuery = qb.collection("movies");
  
  // SEARCH CONTEXT METHOD
  
  //var query = qb.toJson();
  
  //var sc = db.createSearchContext();
  //sc.register(coag);
  //sc.register(coay);
  
  //sc.setOptions(optsName,opts);
  //sc.contributeStructuredQuery("base",colQuery);
  
  // VALUES METHODS
  db.saveSearchOptions(optsName,opts, function(result) {
    db.values(qb.toJson(),"actor-genre",optsName,null,function(result) {
      coag.updateValues(result.doc);
    });
    db.values(qb.toJson(),"actor-year",optsName,null,function(result) {
      coay.updateValues(result.doc);
    });
    db.values(qb.toJson(),"actor-genre-year",optsName,null,function(result) {
      coagy.updateValues(result.doc);
    });
  });
  
  } catch (err) {
    error.show(err.message);
  }
};
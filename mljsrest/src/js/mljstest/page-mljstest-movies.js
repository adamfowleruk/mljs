
window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
  var optsName = "actor-genre-year";

  var ob = db.createOptions();
  ob.tuples("actor-genre","actor","genre"); // first is tuple name. defaults to string, json namespace
  ob.jsonRangeConstraint("actor",["item-frequency"])
    .jsonRangeConstraint("year",["item-order"])
    .jsonRangeConstraint("genre",["item-order"]);
  ob.tuples("actor-year","actor","year"); // first is tuple name. defaults to string, json namespace
  var opts = ob.toJson();
  
  var coag = new com.marklogic.widgets.cooccurence("coag");
  coag.addErrorListener(error.updateError);
  coag.title = "Actor vs. Movie Genre";
  coag.setTupleConstraints(["actor","genre"]);
  
  var coay = new com.marklogic.widgets.cooccurence("coay");
  coay.addErrorListener(error.updateError);
  coay.title = "Actor vs. Movie Year";
  coay.setTupleConstraints(["actor","year"]);
  
  var qb = db.createQuery();
  qb.query(qb.collection("movies"));
  var query = qb.toJson();
  
  var sc = db.createSearchContext();
  sc.register(coag);
  sc.register(coay);
  
  sc.setOptions(optsName,opts);
  sc.contributeStructuredQuery("base",query);
  
  } catch (err) {
    error.show(err.message);
  }
};
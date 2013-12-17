
window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
    var ob = db.createOptions();
    ob.jsonRangeConstraint("actor",["item-frequency"])
      .jsonRangeConstraint("genre",["item-frequency"])
      .jsonRangeConstraint("year",["item-frequency"])
      .returnResults(false); // only want facets
      
    var qb = db.createQuery();
    qb.query(qb.collection("movies"));
    var query = qb.toJson();
    
    var ctx = db.createSearchContext();
    ctx.setOptions("mljs-testpage-tagcloud-options",ob);
    
    var actor = new com.marklogic.widgets.tagcloud("actor");
    actor.setFacet("actor");
    ctx.register(actor);
    
    var genre = new com.marklogic.widgets.tagcloud("genre");
    genre.setFacet("genre");
    ctx.register(genre);
    
    var year = new com.marklogic.widgets.tagcloud("year");
    year.setFacet("year");
    ctx.register(year);
    
    ctx.doStructuredQuery(query);
  
  } catch (err) {
    error.show(err);
  }
};
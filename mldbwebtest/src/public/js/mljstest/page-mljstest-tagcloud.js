
window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
    var ob = db.createOptions();
    ob.rangeConstraint("actor",["item-frequency"],"http://marklogic.com/collation/")
      .rangeConstraint("genre",["item-frequency"],"http://marklogic.com/collation/")
      .rangeConstraint("year",["item-frequency"],"http://marklogic.com/collation/")
      .returnResults(false); // only want facets
    var options = ob.toJson();
      
    var qb = db.createQuery();
    qb.query(qb.collection("movies"));
    var query = qb.toJson();
    
    var ctx = db.createSearchContext();
    ctx.setOptions("mljs-testpage-tagcloud-options",options);
    
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
    error.show(err.message);
  }
};
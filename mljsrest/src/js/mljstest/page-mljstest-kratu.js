
window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
  var ob = db.createOptions();
  ob.pageLength(100);
  var optionsName = "page-kratu";
  
  var wgt = new com.marklogic.widgets.kratu("el-kratu");
  wgt.addErrorListener(error.updateError);
  
  var wgtp = new com.marklogic.widgets.kratu("el-kratu-props");
  wgtp.render("properties");
  wgtp.addErrorListener(error.updateError);
  
  var qb = db.createQuery();
  var query = qb.query(qb.collection("animals")).toJson();
  /*
  var query = {
    query: {
      "collection-query": {
        "uri": ["animals"]
      }
    }
  };*/
  
  var ctx = db.createSearchContext();
  ctx.register(wgt);
  ctx.register(wgtp);
  
  ctx.setOptions(optionsName,ob);
  ctx.doStructuredQuery(query,1);
  
  } catch (err) {
    error.show(err.message);
  }
  
};
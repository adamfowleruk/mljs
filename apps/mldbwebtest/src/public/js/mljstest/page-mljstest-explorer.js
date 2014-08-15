

window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");

  var error = new com.marklogic.widgets.error("errors");

  try {
    var semctx = db.createSemanticContext();
    semctx.getTripleConfiguration().addTest();

    var docctx = db.createDocumentContext();

    var explorer = new com.marklogic.widgets.graphexplorer("explorer");
    semctx.register(explorer);
    docctx.register(explorer);

    explorer.setSearchOptionsName("mljstest-page-search-options");
    explorer.drawSubject("http://marklogic.com/semantic/targets/people/adam",null,1,1);


  } catch (err) {
    console.log(err);
    error.show(err.message);
  }
};

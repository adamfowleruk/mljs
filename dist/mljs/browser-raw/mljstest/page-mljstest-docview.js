

window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
    var docctx = db.createDocumentContext();
    docctx.addAllowableProperty({name: "keywords", title: "Keywords", cardinality: "*", join: ", "});
    
    var docprops = new com.marklogic.widgets.docproperties("docprops");
    docctx.register(docprops);
    var dochead = new com.marklogic.widgets.docheadviewer("dochead");
    docctx.register(dochead);
    var doccontent = new com.marklogic.widgets.docviewer("doccontent");  
    docctx.register(doccontent);
    
    // now load an XHTML document
    
    var docuri = "/mixed/4";
    
    docctx.getContent(docuri);
    docctx.getProperties(docuri);
    
  } catch (err) {
    console.log(err);
    error.show(err.message);
  }
};


window.onload = function() {
  // initialise mljs
  var db = new mljs(); 
  /*
  var classes = new Array();
  classes.push("unclassified");
  classes.push("protect");
  classes.push("restricted");
  classes.push("confidential");
  classes.push("secret");
  classes.push("topsecret");*/
  
  var wgt = new com.marklogic.widgets.create("upload");
  wgt.uriprefix("/widgets/create/")
     .collectionUser() /* Adds to a collection of the current user. E.g. user-afowler */
     .collection("uploads")
     .horizontal()
     .dnd()
     //.permissions(false,classes,"Classification")
     .endRow()
     .bar()
     .save("Upload")
     .endBar()
     .endRow();
  
  wgt.addCompleteListener(function(evt) {
    document.getElementById("upload").innerHTML = "<p>Created doc with uri: " + evt + "</p>";
  });
  
  mljs.defaultconnection.logger.debug("Done widget initialisation");
};
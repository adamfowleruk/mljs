

window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");

  var error = new com.marklogic.widgets.error("errors");

  try {
    var doccontext = db.createDocumentContext();
    var ns = {
      h: "http://www.w3.org/1999/xhtml"
    };
    //doccontext.namespaces(ns);
    doccontext.setTemplate(textToXML(
      "<html xmlns='http://www.w3.org/1999/xhtml'><head><title></title></head><body><h1></h1><div id='summary' /><h2></h2><div id='main'></div></body></html>"
    ));

    var docedit = new com.marklogic.widgets.create("docedit");
    doccontext.register(docedit);

    // set up widget form
    docedit.uriprefix("/widgets/create/")
           .mode("xml")
           .collectionUser() /* Adds to a collection of the current user. E.g. user-afowler */
           .collection("uploads")
           //.horizontal()
           .text({path: "/h:html/h:head/h:title",namespaces: ns})
           .text({path: "/h:html/h:body/h:h1[1]",namespaces: ns})
           .largeText({path: "/h:html/h:body/h:div[@id='summary']", title: "Summary",namespaces: ns})
           .text({path: "/h:html/h:body/h:h2[1]",namespaces: ns})
           .largeHTML({path: "/h:html/h:body/h:div[@id='main']",title: "Body HTML",namespaces: ns})
           //.dnd()
           //.permissions(false,classes,"Classification")
           .endRow()
           .bar()
           .save("Save")
           .endBar()
           .endRow();


  } catch (err) {
    error.show(err.message);
  }
};

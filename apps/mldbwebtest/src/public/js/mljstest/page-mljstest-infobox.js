
window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");

  var error = new com.marklogic.widgets.error("errors");

  try {

  var optionsName = "page-infobox";

  var ob = db.createOptions();
  ob.defaultCollation("http://marklogic.com/collation/en")
    .pageLength(10)
    .collectionConstraint() // default constraint name of 'collection'
    .rangeConstraint("Title","title","http://www.w3.org/1999/xhtml","xs:string","http://marklogic.com/collation/",true,["item-order"])
    .rangeConstraint("Heading","h1","http://www.w3.org/1999/xhtml","xs:string","http://marklogic.com/collation/",true,["item-order"])
    ;

  var searchcontext = db.createSearchContext();
  searchcontext.setOptions(optionsName,ob);
  searchcontext.setCollection("mixed"); // restrict all search results

  var semanticcontext = db.createSemanticContext();
  semanticcontext.getTripleConfiguration().addTest();
  semanticcontext.setContentContext(searchcontext);
  //semanticcontext.addDocument(); // done auto by tripleconfig

  var bar = new com.marklogic.widgets.searchbar("cs-bar");
  var results = new com.marklogic.widgets.searchresults("results");
  results.setSelectionModeReplace();

  var facts = new com.marklogic.widgets.entityfacts("infobox");
  facts.setModeAllMentioned();
  facts.explorerLink("/explorer.html?iri=#IRI#");

  semanticcontext.register(facts);

  searchcontext.register(bar);
  searchcontext.register(results);
  searchcontext.register(facts);

  searchcontext.addErrorListener(error.updateError);

  searchcontext.doSimpleQuery();

  } catch (err) {
    error.show(err.message);
  }
};


window.onload = function() {
  var db = new mljs();

  /**
   * WARNING: This page uses the convenience searchpage() widget. If you need changes to the position or number of widgets shown
   *          then DO NOT edit that widget, but instead use the same HTML as in the widget-search.js' searchpage() constructor directly
   *          in your page. You are then free to edit, in your page, whatever you like. searchpage is purely for convenience when
   *          you do not want to create this HTML manually.
   */

  var sc = db.createSearchContext();

  var results = new com.marklogic.widgets.searchresults("results");
  var facets = new com.marklogic.widgets.searchfacets("facets");
  var sorter = new com.marklogic.widgets.searchsort("sorter");
  var pager = new com.marklogic.widgets.searchpager("pager");
  var bar = new com.marklogic.widgets.searchbar("searchbar");

  sc.register(results);
  sc.register(facets);
  sc.register(sorter);
  sc.register(pager);
  sc.register(bar);


  var ob = db.createOptions();
  ob.defaultCollation("http://marklogic.com/collation/en")
    .collectionConstraint() // default constraint name of 'collection'
    .rangeConstraint("Animal","animal",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"]) // constraint name defaults to that of the range element name
    .rangeConstraint("Family","family",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-frequency"]) // constraint name defaults to that of the range element name
    .rangeConstraint("Actor","actor",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-frequency"])
    .rangeConstraint("Year","year",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"])
    .rangeConstraint("City","city",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"])
    .rangeConstraint("Month","month",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"])
    .snippet();

  sc.setOptions("mljstest-page-search-options",ob);
  sc.doSimpleQuery(); // uses search context directly

};

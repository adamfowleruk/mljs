
$(document).ready(function() {
  // initialise MLDB
  var db = new mldb(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var wgt = new com.marklogic.widgets.searchpage("search-page");
  
  /*for (var name in ob) {
    console.log("ob member: " + name + ", type: " + (typeof ob[name]));
  }*/
  
  var ob = new com.marklogic.widgets.options();
  ob.defaultCollation("http://marklogic.com/collation/en")
    //.defaultType("xs:string"); // default: 
    //.defaultNamespace("http://marklogic.com/xdmp/json/basic") // default: 
    //.defaultSortDirection("ascending") // this should be the default anyway 
    //.sortOrderScore() // default: 
    //.sortOrder("family") // defaults to a json-key, type string, default collation, direction ascending. Creating a range constraint also creates a sort order config item
    //.sortOrder("animal") // defaults to a json-key, type string, default collation, direction ascending. Creating a range constraint also creates a sort order config item
    .collectionConstraint() // default constraint name of 'collection' 
    .rangeConstraint("animal",["item-order"]) // constraint name defaults to that of the range element name 
    .rangeConstraint("family",["item-frequency"]) // constraint name defaults to that of the range element name 
    .rangeConstraint("actor",["item-frequency"],"http://marklogic.com/collation/")
    .rangeConstraint("year",["item-order"],"http://marklogic.com/collation/")
    .rangeConstraint("city",["item-order"],"http://marklogic.com/collation/")
    .rangeConstraint("month",["item-order"],"http://marklogic.com/collation/");
  var options = ob.toJson();
  db.logger.debug("Created options: " + JSON.stringify(options));
    /*
  var options = 
  { options: {
        "return-results": true,
        "page-length": 10,
        "transform-results": {
          apply: "raw"
        },
      "sort-order": [
      {
        "direction": "descending",
        "score": null
      },
      {
        "direction": "ascending",
        "type": "xs:string",
        "json-key": "family",
        "collation": "http://marklogic.com/collation/en"
      },
      {
        "direction": "ascending",
        "type": "xs:string",
        "json-key": "animal",
        "collation": "http://marklogic.com/collation/en"
      }
      ],
        constraint: [
          {
            "name": "collection",
            "collection": {
              "prefix": "",
              "facet-option": "limit=10"
            }
          } // other constraints here
          ,
          {
            "name": "animal",
            range: {
              type: "xs:string",
              facet: true,
              collation: "http://marklogic.com/collation/en",
          "facet-option": [
            "item-order","ascending"
          ],
              element: {
                ns: "http://marklogic.com/xdmp/json/basic",
                name: "animal"
              }
            }
          }
          ,
          {
            "name": "family",
            range: {
              type: "xs:string",
              facet: true,
              collation: "http://marklogic.com/collation/en",
          "facet-option": [
            "item-frequency","ascending"
          ],
              element: {
                ns: "http://marklogic.com/xdmp/json/basic",
                name: "family"
              }
            }
          }
        ]
    }
  };*/
  wgt.bar.setOptionsName("mldbtest-page-search-options");
  wgt.bar.setOptions(options);
  wgt.sort.setOptions(options);
  
  wgt.bar.execute();
  
});

$(document).ready(function() {
  // initialise MLDB
  var db = new mldb(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var wgt = new com.marklogic.widgets.searchpage("search-page");
  
  wgt.bar.setOptionsName("mldbtest-page-search-options");
  wgt.bar.setOptions(
    {
      options: {
        "return-results": true,
        "page-length": 10,
        "transform-results": {
          apply: "raw"/*, ns: "http://marklogic.com/rest-api/transform/transformresultsjson", at: "/modules/transform-results-json.xqy"*/
        },
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
    }
  );
  
});
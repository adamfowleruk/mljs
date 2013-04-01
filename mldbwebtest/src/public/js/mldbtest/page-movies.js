$(document).ready(function() {
  // initialise MLDB
  var db = new mldb(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var agName = "actor-genre";
  var ayName = "actor-year";

  var ag = {
    "options": {
      "tuples": [
        {
          "name": agName,
          "range": [
            {
              "type": "xs:string",
              "element": {
                "ns": "http://marklogic.com/xdmp/json/basic",
                "name": "actor"
              }
            },
            {
              "type": "xs:string",
              "element": {
                "ns": "http://marklogic.com/xdmp/json/basic",
                "name": "genre"
              }
            }
          ]
        }
      ]
    }
  };

  var coag = new com.marklogic.widgets.cooccurence("coag");
  coag.title = "Actor vs. Movie Genre";
  coag.setOptions(ag);

  var ay = {
    "options": {
      "tuples": [
        {
          "name": ayName,
          "range": [
            {
              "type": "xs:string",
              "element": {
                "ns": "http://marklogic.com/xdmp/json/basic",
                "name": "actor"
              }
            },
            {
              "type": "xs:string",
              "element": {
                "ns": "http://marklogic.com/xdmp/json/basic",
                "name": "year"
              }
            }
          ]
        }
      ]
    }
  };

  var coay = new com.marklogic.widgets.cooccurence("coay");
  coay.title = "Actor vs. Movie Year";
  coay.setOptions(ag);
  
  var query = {
    query: {
      "collection-query": {
        "uri": ["movies"]
      }
    }
  };

  db.saveSearchOptions("actor-genre",ag,function(result) {
    db.saveSearchOptions("actor-year",ay,function(result) {
      db.values(query,agName,agName,function(result) {
        var values = result.doc;
        coag.updateValues(values);
      });
      db.values(query,ayName,ayName,function(result) {
        var values = result.doc;
        coay.updateValues(values);
      });
    });
  });
});
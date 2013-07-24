$(document).ready(function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
  var agName = "actor-genre";
  var ayName = "actor-year";

  var ob = new db.options();
  ob.tuples(agName,"actor","genre"); // first is tuple name. defaults to string, json namespace
  var ag = ob.toJson();
  var ob2 = new db.options();
  ob2.tuples(ayName,"actor","year"); // first is tuple name. defaults to string, json namespace
  var ay = ob2.toJson();
  /*
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
*/
  var coag = new com.marklogic.widgets.cooccurence("coag");
  coag.addErrorListener(error.updateError);
  coag.title = "Actor vs. Movie Genre";
  //coag.setOptions(ag);
/*
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
  };*/

  var coay = new com.marklogic.widgets.cooccurence("coay");
  coay.addErrorListener(error.updateError);
  coay.title = "Actor vs. Movie Year";
  //coay.setOptions(ag);
  
  var query = {
    query: {
      "collection-query": {
        "uri": ["movies"]
      }
    }
  };

  db.saveSearchOptions(agName,ag,function(result) {
    if (result.inError) {
      error.show(result.details);
    } else {
    db.saveSearchOptions(ayName,ay,function(result) {
    if (result.inError) {
      error.show(result.details);
    } else {
      db.values(query,agName,agName,function(result) {
    if (result.inError) {
      error.show(result.details);
    } else {
        var values = result.doc;
        coag.updateValues(values);
      }
      });
      db.values(query,ayName,ayName,function(result) {
    if (result.inError) {
      error.show(result.details);
    } else {
        var values = result.doc;
        coay.updateValues(values);
      }
      });
    }
    });
  }
  });
  
  } catch (err) {
    error.show(err.message);
  }
});
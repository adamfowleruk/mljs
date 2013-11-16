
window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
  var agName = "actor-genre";
  var ayName = "actor-year";

  var ob = db.createOptions();
  ob.tuples(agName,"actor","genre"); // first is tuple name. defaults to string, json namespace
  ob.rangeConstraint("actor",["item-frequency"],"http://marklogic.com/collation/")
    .rangeConstraint("year",["item-order"],"http://marklogic.com/collation/")
    .rangeConstraint("genre",["item-order"],"http://marklogic.com/collation/");
  var ag = ob.toJson();
  var ob2 = db.createOptions();
  ob2.rangeConstraint("actor",["item-frequency"],"http://marklogic.com/collation/")
    .rangeConstraint("year",["item-order"],"http://marklogic.com/collation/")
    .rangeConstraint("genre",["item-order"],"http://marklogic.com/collation/");
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
  coag.setTupleConstraints(["actor","genre"]);
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
  coay.setTupleConstraints(["actor","year"]);
  //coay.setOptions(ag);
  
  /*
  var query = {
    query: {
      "collection-query": {
        "uri": ["movies"]
      }
    }
  };*/
  var qb = db.createQuery();
  qb.query(qb.collection("movies"));
  var query = qb.toJson();
  
  var updateCoag = function() {
    db.values(query,agName,agName,function(result) {
      if (result.inError) {
        error.show(result.details);
      } else {
        var values = result.doc;
        coag.updateValues(values);
      }
    });
  };
  
  var updateCoay = function() {
    db.values(query,ayName,ayName,function(result) {
      if (result.inError) {
        error.show(result.details);
      } else {
        var values = result.doc;
        coay.updateValues(values);
      }
    });
  };
  
  var lis = function(newsel) {
    qb = db.createQuery();
    qb.query(qb.and([
      qb.collection("movies"),
      qb.range(newsel[0].name,newsel[0].value)
    ]));
    query = qb.toJson();
    
    updateCoag();
    updateCoay();
  };
  coag.addFacetSelectionListener(lis);
  coay.addFacetSelectionListener(lis);

  db.saveSearchOptions(agName,ag,function(result) {
    if (result.inError) {
      error.show(result.details);
    } else {
    db.saveSearchOptions(ayName,ay,function(result) {
    if (result.inError) {
      error.show(result.details);
    } else {
      updateCoag();
      
      updateCoay();
    }
    });
  }
  });
  
  } catch (err) {
    error.show(err.message);
  }
};
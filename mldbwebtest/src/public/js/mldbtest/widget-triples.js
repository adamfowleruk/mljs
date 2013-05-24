// global variable definitions
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};

/**
 * Holds configuration for object to triple mappings
 * 
 * @constructor
 */
com.marklogic.widgets.tripleconfig = function() {
  // TODO drastically simplify this data model
  
  this.entities = new Array();
  
  this.validTriples = new Array();
  
  this._predicates = new Array();
  
  // own extensions - need ontology somewhere for this!
  
  this._predicatesShort = new Array();
  
  this._iriPatterns = new Array();
  
  this._rdfTypes = new Array();
  
  this._rdfTypesShort = new Array();
  
  this._commonNamePredicates = new Array();
  
  this._properties = new Array(); // TODO other common properties, alpha order by name value
  
  // ANYTHING PAST THIS POINT IS REFACTORED AND AWESOME
  
  this._newentities = new Array(); // [name] => {name: "person", prefix: "http://xmlns.com/foaf/0.1/", iriPattern:, rdfTypeIri: , rdfTypeIriShort: , commonNamePredicate: 
  // ..., properties: [{},{}, ...] }
  
  this._newPredicates = new Array(); // [commonname] => {iri: , iriShort: }
  
  // also keep _validTriples as-is
  
  // defaults
  this.addFoaf();
  this.addPlaces();
  this.addFoafPlaces();
};

com.marklogic.widgets.tripleconfig.prototype.addPlaces = function() {
  this.entities.push("placename");
  
  this.validTriples.push({subjectType: "placename", objectType: "placename", predicateArray: ["located_within","contains_location"]}); 
  
  this._predicates["studies_at"] = "http://www.marklogic.com/ontology/0.1/studies_at";
  this._predicates["affiliated_with"] = "http://www.marklogic.com/ontology/0.1/affiliated_with";
  this._predicates["has_meetings_near"] = "http://www.marklogic.com/ontology/0.1/has_meetings_near";
  this._predicates["located_within"] = "http://www.marklogic.com/ontology/0.1/located_within";
  this._predicates["contains_location"] = "http://www.marklogic.com/ontology/0.1/contains_location";
  
  this._iriPatterns["placename"] = "http://marklogic.com/semantic/targets/placename/#VALUE#";
  this._rdfTypes["placename"] = "http://schema.org/Place"; // geonames features are an extension of Place
  this._rdfTypesShort["placename"] = "so:Place"; // geonames features are an extension of Place
  this._commonNamePredicates["placename"] = "http://www.geonames.org/ontology#name";
  this._properties["placename"] = [{name: "name", iri: "http://www.geonames.org/ontology#name", shortiri: "geonames:name"}];
};

com.marklogic.widgets.tripleconfig.prototype.addFoafPlaces = function() {
  this.validTriples.push({subjectType: "person", objectType: "placename", predicateArray: ["based_near"]}); //NB based_near may not be a valid relationship class - may be lon/lat instead
  this.validTriples.push({subjectType: "organisation", objectType: "placename", predicateArray: ["based_near","has_meetings_near"]}); 
};

com.marklogic.widgets.tripleconfig.prototype.addFoaf = function() {
  this.validTriples.push({subjectType: "person", objectType: "person", predicateArray: ["knows","friendOf","enemyOf","childOf","parentOf","fundedBy"]});
  this.validTriples.push({subjectType: "person", objectType: "organisation", predicateArray: ["member","studies_at"]});
  this.validTriples.push({subjectType: "organisation", objectType: "organisation", predicateArray: ["member","parentOf","affiliated_with","fundedBy"]});
  
  this._predicates["knows"] = "http://xmlns.com/foaf/0.1/knows";
  this._predicates["friendOf"] = "http://xmlns.com/foaf/0.1/friendOf";
  this._predicates["enemyOf"] = "http://xmlns.com/foaf/0.1/enemyOf";
  this._predicates["childOf"] = "http://xmlns.com/foaf/0.1/childOf";
  this._predicates["parentOf"] = "http://xmlns.com/foaf/0.1/parentOf";
  this._predicates["fundedBy"] = "http://xmlns.com/foaf/0.1/fundedBy";
  this._predicates["member"] = "http://xmlns.com/foaf/0.1/member";
  this._predicates["based_near"] = "http://xmlns.com/foaf/0.1/based_near";
  this._predicatesShort["knows"] = "foaf:knows";
  this._predicatesShort["friendOf"] = "foaf:friendOf";
  this._predicatesShort["enemyOf"] = "foaf:enemyOf";
  this._predicatesShort["childOf"] = "foaf:childOf";
  this._predicatesShort["parentOf"] = "foaf:parentOf";
  this._predicatesShort["fundedBy"] = "foaf:fundedBy";
  this._predicatesShort["member"] = "foaf:member";
  this._predicatesShort["based_near"] = "foaf:based_near";
  
  // DELETE THE FOLLOWING
  this.entities.push("person");
  this.entities.push("organisation");
  this._iriPatterns["person"] = "http://marklogic.com/semantic/targets/person/#VALUE#";
  this._iriPatterns["organisation"] = "http://marklogic.com/semantic/targets/organisation/#VALUE#";
  this._rdfTypes["person"] = "http://xmlns.com/foaf/0.1/Person";
  this._rdfTypes["organisation"] = "http://xmlns.com/foaf/0.1/Organization";
  this._rdfTypesShort["person"] = "foaf:Person";
  this._rdfTypesShort["organisation"] = "foaf:Organization";
  this._commonNamePredicates["person"] = "http://xmlns.com/foaf/0.1/name";
  this._commonNamePredicates["organisation"] = "http://xmlns.com/foaf/0.1/name";
  
  this._properties["person"] = [{name: "name", iri: "http://xmlns.com/foaf/0.1/name", shortiri: "foaf:name"}];
  this._properties["organisation"] = [{name: "name", iri: "http://xmlns.com/foaf/0.1/name", shortiri: "foaf:name"}];
  // END DELETE
  
  this._newentities["person"] = {name: "person", title: "Person",prefix: "http://xmlns.com/foaf/0.1/", iriPattern: "http://marklogic.com/semantic/targets/person/#VALUE#", 
    rdfTypeIri: "http://xmlns.com/foaf/0.1/Person", rdfTypeIriShort: "foaf:Person", commonNamePredicate: "http://xmlns.com/foaf/0.1/name",
    properties: [{name: "name", iri: "http://xmlns.com/foaf/0.1/name", shortiri: "foaf:name"}]};
    
  this._newentities["organisation"] = {name: "organisation", title: "Organisation", prefix: "http://xmlns.com/foaf/0.1/", iriPattern: "http://marklogic.com/semantic/targets/organisation/#VALUE#", 
    rdfTypeIri: "http://xmlns.com/foaf/0.1/Organization", rdfTypeIriShort: "foaf:Organization", commonNamePredicate: "http://xmlns.com/foaf/0.1/name",
    properties: [{name: "name", iri: "http://xmlns.com/foaf/0.1/name", shortiri: "foaf:name"}]};
  
  
};

com.marklogic.widgets.tripleconfig.prototype.getValidPredicates = function(from,to) {
  for (var i = 0;i < this.validTriples.length;i++) {
    if (this.validTriples[i].subjectType == from && this.validTriples[i].objectType == to) {
      return this.validTriples[i].predicateArray;
    }
  }
  return new Array();
};











/**
 * An interactive Sparql query builder
 * 
 * @constructor
 * @param {string} container - The HTML ID of the element to place this widget's content within.
 */
com.marklogic.widgets.sparqlbar = function(container) {
  this.container = container;
  
  this.terms = 0;
  
  this._config = new com.marklogic.widgets.tripleconfig();
  
  this._hierarchy = new Array(); // [{tid: 1, children: [{tid: 2, children:[]}, ...]}, ....]
  this._allterms = new Array(); // plain array, [tid] => JSON as above
  this._parentterms = new Array(); // [childid] = parentid
  
  this.refresh();
};

/**
 * Refreshes the entire widget UI - useful if you've provided your own triple configuration.
 */
com.marklogic.widgets.sparqlbar.prototype.refresh = function() {
  var s = "";
  s += "<div id='" + this.container + "-sparqlbar' class='sparqlbar'>";
  // what to retrieve
  s += "  <div class='sparqlbar-for'>Search for: ";
  s += "    <select class='sparqlbar-for-what' id='" + this.container + "-sparqlbar-what'>";
  s += "      <option value='_content'>All Content</option>";
  s += "      <option value='_entities'>All Entities</option>";
  s += "      <option value='_facts'>All Facts</option>";
  s += "      <option value='_graphs'>All Graphs</option>";
  for (var i = 0;i < this._config.entities.length;i++) {
    s += "    <option value='" + this._config.entities[i] + "'";
    if (0 == i) {
      s += " selected='selected'";
    }
   s += ">" + this._config.entities[i] + "</option>";
  }
  s += "</select> which <span class='sparqlbar-add'>[<a class='sparqlbar-add-link' id='" + this.container + "-sparqlbar-add-link' href='#'>+</a>]</span></div>";
  
  // criteria
  //  - predicate list
  //  - interactive IRI suggestion list (base on what searching for and predicate value selected)
  // include general 'has a relationship with type'
  
  s += "<div id='" + this.container + "-sparqlbar-terms' class='sparqlbar-terms'></div>";
  
  s += "<div><input type='submit' value='Search'  class='sparqlbar-button' id='" + this.container + "-sparqlbar-button'/></div>";
  
  /*
  s += "<div class='sparqlbar-results' id='" + this.container + "-sparqlbar-results'><i>No results</i></div>";
  */
  s += "</div>";
  document.getElementById(this.container).innerHTML = s;
  
  // TODO add event handlers
  var self = this;
  document.getElementById(this.container + "-sparqlbar-button").onclick = function() {
    self._doQuery();
    return false;
  }
  
  // + child handler
  document.getElementById(this.container + "-sparqlbar-add-link").onclick = function() {
    self._addTerm();
  }
  
  // add first term
  this._addTerm();
};

com.marklogic.widgets.sparqlbar.prototype._addTerm = function(parentid) {
  // TODO support adding within a specified object ID
  
  var tid = this.terms++;
  
  var json = {tid: tid,children: []};
  if (undefined == parentid) {
    this._hierarchy.push(json);
  } else {
    this._allterms[parentid].children.push(json);
    this._parentterms[tid] = parentid;
  }
  this._allterms[tid] = json;
  
  var s = "<div class='sparqlbar-term' id='" + this.container + "-sparqlbar-term-" + tid + "'>";
  s += "<select class='sparqlbar-term' id='" + this.container + "-sparqlbar-term-what-" + tid + "'><option selected='selected' value='*'>Are related to</option><option value='='>Have property</option></select>";
  s += "<select class='sparqlbar-term-relatedtype' id='" + this.container + "-sparqlbar-term-relatedtype-" + tid + "'>";
  // generate related object options
  for (var i = 0;i < this._config.entities.length;i++) {
    s += "<option value='" + this._config.entities[i] + "'";
    if (0 == i) {
      s += " selected='selected'";
    }
    s += ">" + this._config.entities[i] + "</option>";
  }
  s += " [+]</select> ";
  s += "<span id='" + this.container + "-sparqlbar-term-asa-" + tid + "'>as a </span>";
  s += "<select class='sparqlbar-term-relationship' id='" + this.container + "-sparqlbar-term-relationship-" + tid + "'>";
  
  // call updateRel later
  
  s += "</select> ";
  s += "<span id='" + this.container + "-sparqlbar-term-rel-" + tid + "'>relationship</span>";
  
  // properties list for this object
  s += "<span class='hidden' id='" + this.container + "-sparqlbar-term-prop-" + tid + "'>with property </span>";
  s += "<select id='" + this.container + "-sparqlbar-term-properties-" + tid + "' class='hidden'>";
  s += "</select>";
  s += "<span class='hidden' id='" + this.container + "-sparqlbar-term-eq-" + tid + "'> equal to </span>";
  s += "<input type='text' length='20'  class='sparqlbar-term-value hidden' id='" + this.container + "-sparqlbar-term-value-" + tid  + "'/>";
  
  s += "<span class='sparlbar-term-and hidden' id='" + this.container + "-sparqlbar-term-" + tid + "-and'>; AND</span>";
  s += " [<a href='#' id='" + this.container + "-sparqlbar-term-" + tid + "-remove'>-</a>] ";
  s += "<span id='" + this.container + "-sparqlbar-term-" + tid + "-addspan'>[<a href='#' id='" + this.container + "-sparqlbar-term-" + tid + "-addchild'>+ Child</a>]</span>";
  s += "<div id='" + this.container + "-sparqlbar-term-" + tid + "-children' class='sparqlbar-term'></div>";
  s += "</div>";
  
  console.log("Adding html: " + s);
  
  if (undefined == parentid) {
    document.getElementById(this.container + "-sparqlbar-terms").innerHTML += s;
  } else {
    document.getElementById(this.container + "-sparqlbar-term-" + parentid + "-children").innerHTML += s;
  }
  
  this._updateRelationships(tid);
  this._updateProperties(tid);
  
  var self = this;
  // TODO remove event handler
  // selection event handlers
  document.getElementById(this.container + "-sparqlbar-term-what-" + tid).onchange = function (el) {
    self._updateTerm(tid);
    self._updateRelationships(tid);
    self._updateProperties(tid);
  }
  document.getElementById(this.container + "-sparqlbar-term-relatedtype-" + tid).onchange = function (el) {
    self._updateRelationships(tid);
  }
  
  // TODO - term handler
  
  // + child handler
  document.getElementById(this.container + "-sparqlbar-term-" + tid + "-addchild").onclick = function() {
    self._addTerm(tid);
  }
  document.getElementById(this.container + "-sparqlbar-term-" + tid + "-remove").onclick = function() {
    self._removeTerm(tid);
  }
  
  // TODO check for previous term in this container, and remove 'hidden' class from ;AND span
};

com.marklogic.widgets.sparqlbar.prototype._hidden = function(el,isHidden) {
  if (isHidden) {
    var found = false;
    var attr = el.getAttribute("class");
    if (undefined != attr) {
      var attrs = attr.split(" ");
      for (var i = 0;!found && i < attrs.length;i++) {
        found = ("hidden" == attrs[i]);
      }
    }
    if (!found) {
      el.setAttribute("class",attr + " hidden");
    }
  } else {
    var attr = el.getAttribute("class");
    var newClass = "";
    if (undefined != attr) {
      var attrs = attr.split(" ");
      for (var i = 0;!found && i < attrs.length;i++) {
        if ("hidden" != attrs[i]) {
          newClass += attrs[i] + " ";
        }
      }
    }
    el.setAttribute("class",newClass);
  }
};

com.marklogic.widgets.sparqlbar.prototype._updateRelationships = function(tid) {
  // get from and to and determine valid set of relationship classes
  var parentType = this._getParentType(tid);
  
  var s = "";
  var me = document.getElementById(this.container + "-sparqlbar-term-relatedtype-" + tid).value;
  console.log("*** RELATING PARENT: " + parentType + " TO ME: " + me);
  var rels = this._config.getValidPredicates(parentType,me);
  for (var i = 0; i < rels.length;i++) {
    s += "<option value='" + rels[i] + "'";
    if (0 == i) {
      s += " selected='selected'";
    }
    s += ">" + rels[i] + "</option>";
  }
  
  document.getElementById(this.container + "-sparqlbar-term-relationship-" + tid).innerHTML = s;
};

com.marklogic.widgets.sparqlbar.prototype._updateProperties = function(tid) {
  // get from and to and determine valid set of properties
  var parentType = this._getParentType(tid);
  
  var s = "";
  var props = this._config._properties[parentType];
  for (var i = 0; i < props.length;i++) {
    s += "<option value='" + props[i].name + "'";
    if (0 == i) {
      s += " selected='selected'";
    }
    s += ">" + props[i].name + "</option>";
  }
  
  document.getElementById(this.container + "-sparqlbar-term-properties-" + tid).innerHTML = s;
};

com.marklogic.widgets.sparqlbar.prototype._getParentType = function(tid) {
  var top = null;
  // Find parent term object type
  var parent = this._parentterms[tid];
  if (null != parent && undefined != parent) {
    top = document.getElementById(this.container + "-sparqlbar-term-relatedtype-" + parent).value;
  }
  if (null == top) {
    top = document.getElementById(this.container + "-sparqlbar-what").value;
  }
  return top;
};

com.marklogic.widgets.sparqlbar.prototype._removeTerm = function(tid) {
  // find any children, and remove recursively
  var children = this._allterms[tid].children;
  for (var c = 0;c < children.length;c++) {
    this._removeTerm(children[c].tid);
  }
  
  // remove ourselves from our parent
  var parentid = this._parentterms[tid];
  if (undefined != parentid) {
    var newc = new Array();
    var childs = this._allterms[parentid].children;
    for (var nc = 0;nc < childs.length;nc++) {
      if (childs[nc].tid != tid) {
        newc.push(childs[nc]);
      }
      this._allterms[parentid].children = newc;
    }
  }
  
  // remove this term
  // html
  var el = document.getElementById(this.container + "-sparqlbar-term-" + tid);
  el.parentNode.removeChild(el);
  
  // data
  this._allterms[tid] = undefined;
  this._parentterms[tid] = undefined;
  
};

com.marklogic.widgets.sparqlbar.prototype._updateTerm = function(termid) {
  var what = document.getElementById(this.container + "-sparqlbar-term-what-" + termid).value;
  if ("*" == what) {
    // refresh and show relationships
    var rel = document.getElementById(this.container + "-sparqlbar-term-relationship-" + termid);
    this._hidden(rel,false);
    var rel = document.getElementById(this.container + "-sparqlbar-term-relatedtype-" + termid);
    this._hidden(rel,false);
    var rel = document.getElementById(this.container + "-sparqlbar-term-asa-" + termid);
    this._hidden(rel,false);
    var rel = document.getElementById(this.container + "-sparqlbar-term-rel-" + termid);
    this._hidden(rel,false);
    var addterm = document.getElementById(this.container + "-sparqlbar-term-" + termid + "-addspan");
    this._hidden(addterm,false);
    var val = document.getElementById(this.container + "-sparqlbar-term-value-" + termid);
    // hide value
    this._hidden(val,true); // - may need value box for IRI too
    var val = document.getElementById(this.container + "-sparqlbar-term-properties-" + termid);
    this._hidden(val,true);
    var val = document.getElementById(this.container + "-sparqlbar-term-prop-" + termid);
    this._hidden(val,true);
    var val = document.getElementById(this.container + "-sparqlbar-term-eq-" + termid);
    this._hidden(val,true);
  } else {
    // "="
    // show value, hide relationships
    var rel = document.getElementById(this.container + "-sparqlbar-term-relationship-" + termid);
    this._hidden(rel,true);
    var rel = document.getElementById(this.container + "-sparqlbar-term-relatedtype-" + termid);
    this._hidden(rel,true);
    var rel = document.getElementById(this.container + "-sparqlbar-term-asa-" + termid);
    this._hidden(rel,true);
    var rel = document.getElementById(this.container + "-sparqlbar-term-rel-" + termid);
    this._hidden(rel,true);
    var addterm = document.getElementById(this.container + "-sparqlbar-term-" + termid + "-addspan");
    this._hidden(addterm,true);
    var val = document.getElementById(this.container + "-sparqlbar-term-value-" + termid);
    this._hidden(val,false);
    var val = document.getElementById(this.container + "-sparqlbar-term-properties-" + termid);
    this._hidden(val,false);
    var val = document.getElementById(this.container + "-sparqlbar-term-prop-" + termid);
    this._hidden(val,false);
    var val = document.getElementById(this.container + "-sparqlbar-term-eq-" + termid);
    this._hidden(val,false);
  }
};

com.marklogic.widgets.sparqlbar.prototype._buildQuery = function() {
  var s = "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\nPREFIX rdfs: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\nPREFIX so: <http://www.schema.org/>\n";
  
  // TODO loop through config to get Prefixes to import
  // TODO only include the ones we need in this query
  
  var what = document.getElementById(this.container + "-sparqlbar-what").value;
  // TODO logic around the 'what' (i.e. not just object types, but facts, graph, etc)
  s += "SELECT ?" + what + " WHERE {\n" + "  ?" + what + "\n    rdfs:type " + this._config._rdfTypesShort[what] + ";\n";
  
  // build out top level terms
  s += this._buildTerms(this._hierarchy,"",{tc: 1});
  
  s += "} LIMIT 10"; // TODO remove/change limit
  
  mldb.defaultconnection.logger.debug("Generated SPARQL: " + s);
  return s;
};

com.marklogic.widgets.sparqlbar.prototype._buildTerms = function(termArray,padding,counterObject) {
  var s = "";
  for (var i = 0;i < termArray.length;i++) {
    var tjson = termArray[i];
    // TODO support deleted terms (try catch)
    var termWhat = document.getElementById(this.container + "-sparqlbar-term-what-" + tjson.tid).value;
    
    if ("*" == termWhat) {
      var termType = document.getElementById(this.container + "-sparqlbar-term-relatedtype-" + tjson.tid).value;
      var termRel = document.getElementById(this.container + "-sparqlbar-term-relationship-" + tjson.tid).value;
      var c = counterObject.tc++;
      s += padding + "    " + this._config._predicatesShort[termRel] + " ?" + termType + c + " {\n" ;
      s += padding + "      ?" + termType + c + " rdfs:type " + this._config._rdfTypesShort[termType] + ";\n";
      
      // TODO process child terms here
      if (tjson.children.length > 0) {
        s += this._buildTerms(tjson.children,padding + "  ",counterObject);
      }
      
      s += padding + "    } ";
    } else {
      // TODO property (=)
      var propname = document.getElementById(this.container + "-sparqlbar-term-properties-" + tjson.tid).value;
      var propvalue = document.getElementById(this.container + "-sparqlbar-term-value-" + tjson.tid).value;
      var proplist = this._config._properties[this._getParentType(tjson.tid)];
      // find our prop json
      var propiri = null;
      for (var p = 0;null == propiri && p < proplist.length;p++) {
        if (proplist[p].name == propname) {
          propiri = proplist[p].shortiri;
        }
      }
      s += padding + "    " + propiri + " '" + propvalue + "'@en "; // TODO support I18N
    }
    
    if ((termArray.length - 1) == i) {
      s += " .\n";
    } else {
      s += ";\n";
    }
  }
  
  return s;
};

com.marklogic.widgets.sparqlbar.prototype._doQuery = function() {
  var sparql = this._buildQuery();
  mldb.defaultconnection.sparql(sparql,function(result) {
    mldb.defaultconnection.logger.debug("RESPONSE: " + JSON.stringify(result.doc));
  });
};

com.marklogic.widgets.sparqlbar.prototype.addResultsListener = function(lis) {
  // TODO add results listener
};

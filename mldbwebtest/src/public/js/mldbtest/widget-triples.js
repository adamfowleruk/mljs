/*
Copyright 2012 MarkLogic Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
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
  this.errorPublisher = new com.marklogic.events.Publisher();
  
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

/**
 * Adds an error listener to this widget
 * 
 * @param {function(error)} fl - The error listener to add
 */
com.marklogic.widgets.tripleconfig.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 * 
 * @param {function(error)} fl - The error listener to remove
 */
com.marklogic.widgets.tripleconfig.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
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
  
  
  this._newentities["place"] = {name: "place", title: "Place", prefix: "http://www.geonames.org/ontology#", iriPattern: "http://marklogic.com/semantic/targets/organisation/#VALUE#", 
    rdfTypeIri: "http://schema.org/Place", rdfTypeIriShort: "foaf:Organization", commonNamePredicate: "http://www.geonames.org/ontology#name",
    properties: [{name: "name", iri: "http://www.geonames.org/ontology#name", shortiri: "geonames:name"}]};
  
  this._newPredicates["studies_at"] = {name: "studies_at", title: "Studies at", iri: "http://www.marklogic.com/ontology/0.1/studies_at", shortiri: "ml:studies_at"};
  this._newPredicates["affiliated_with"] = {name: "affiliated_with", title: "Affiliated with", iri: "http://www.marklogic.com/ontology/0.1/affiliated_with", shortiri: "ml:affiliated_with"};
  this._newPredicates["has_meetings_near"] = {name: "has_meetings_near", title: "Meets near", iri: "http://www.marklogic.com/ontology/0.1/has_meetings_near", shortiri: "ml:has_meetings_near"};
  this._newPredicates["located_within"] = {name: "located_within", title: "Located within", iri: "http://www.marklogic.com/ontology/0.1/located_within", shortiri: "ml:located_within"};
  this._newPredicates["contains_location"] = {name: "contains_location", title: "Contains", iri: "http://www.marklogic.com/ontology/0.1/contains_location", shortiri: "ml:contains_location"};
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
  
  this._newPredicates["knows"] = {name: "knows", title: "Knows", iri: "http://xmlns.com/foaf/0.1/knows", shortiri: "foaf:knows"};
  this._newPredicates["friendOf"] = {name: "friendOf", title: "Friend", iri: "http://xmlns.com/foaf/0.1/friendOf", shortiri: "foaf:friendOf"};
  this._newPredicates["enemyOf"] = {name: "enemyOf", title: "Enemy", iri: "http://xmlns.com/foaf/0.1/enemyOf", shortiri: "foaf:enemyOf"};
  this._newPredicates["childOf"] = {name: "childOf", title: "Is a child of", iri: "http://xmlns.com/foaf/0.1/childOf", shortiri: "foaf:childOf"};
  this._newPredicates["parentOf"] = {name: "parentOf", title: "Is a parent of", iri: "http://xmlns.com/foaf/0.1/parentOf", shortiri: "foaf:parentOf"};
  this._newPredicates["fundedBy"] = {name: "fundedBy", title: "Funded by", iri: "http://xmlns.com/foaf/0.1/fundedBy", shortiri: "foaf:fundedBy"};
  this._newPredicates["member"] = {name: "member", title: "Is a member of", iri: "http://xmlns.com/foaf/0.1/member", shortiri: "foaf:member"};
  this._newPredicates["based_near"] = {name: "based_near", title: "Is based near", iri: "http://xmlns.com/foaf/0.1/based_near", shortiri: "foaf:based_near"};
  
};

com.marklogic.widgets.tripleconfig.prototype.getValidPredicates = function(from,to) {
  for (var i = 0;i < this.validTriples.length;i++) {
    if (this.validTriples[i].subjectType == from && this.validTriples[i].objectType == to) {
      return this.validTriples[i].predicateArray;
    }
  }
  return new Array();
};

com.marklogic.widgets.tripleconfig.prototype.getNameProperty = function(entity) {
  mljs.defaultconnection.logger.debug("getNameProperty: entity=" + entity);
  for (var i = 0;i < this._newentities[entity].properties.length;i++) {
    if ("name" == this._newentities[entity].properties[i].name) {
      return this._newentities[entity].properties[i];
    }
  }
};

com.marklogic.widgets.tripleconfig.prototype.getEntityFromIRI = function(iri) {
  for (var cn in this._newentities) {
    var p = this._newentities[cn];
    if (p.rdfTypeIri == iri) {
      return p;
    }
  }
};

com.marklogic.widgets.tripleconfig.prototype.getPredicateFromIRI = function(iri) {
  for (var cn in this._newPredicates) {
    var p = this._newPredicates[cn];
    if (p.iri == iri) {
      return p;
    }
  }
};

com.marklogic.widgets.tripleconfig.prototype.summariseInto = function(iri,elid,iriHandler) {
  var self = this;
  // load type IRI for entity
  var ts = "SELECT ?rdftype WHERE {<" + iri + "> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?rdftype . } LIMIT 1";
  mljs.defaultconnection.logger.debug("TS: " + ts);
  mljs.defaultconnection.sparql(ts,function(result) {
    if (result.inError) {
      // TODO publish error
    } else {
      // load common name for this type
      var entityinfo = self.getEntityFromIRI(result.doc.results.bindings[0].rdftype.value);
      var ns = "SELECT ?name WHERE {<" + iri + "> <" + self.getNameProperty(entityinfo.name).iri  + "> ?name . } LIMIT 1";
      mljs.defaultconnection.logger.debug("NS: " + ns);
      
      mljs.defaultconnection.sparql(ns,function(result) {
        if (result.inError) {
          // TODO publish error
        } else {
          var cn = result.doc.results.bindings[0].name.value;
          // display in appropriate element
          var s = "";
          if (null != iriHandler) {
            s += "<a href='#' id='" + elid + "-link'>";
          }
          s += cn + " (" + entityinfo.title + ")";
          
          if (null != iriHandler) {
            s += "</a>";
          }
          document.getElementById(elid).innerHTML = s;
          
          // add click handler function here to elid-link
          if (null != iriHandler) {
            var addClickHandler = function(el,iri) {
              el.onclick = function(event) {
                iriHandler(iri);
              }
            }
            var el = document.getElementById(elid + "-link");
            addClickHandler(el,iri);
          }
        }
      });
    }
  });
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
  
  this.resultsPublisher = new com.marklogic.events.Publisher();
  this.errorPublisher = new com.marklogic.events.Publisher();
  
  this.refresh();
};

/**
 * Refreshes the entire widget UI - useful if you've provided your own triple configuration.
 */
com.marklogic.widgets.sparqlbar.prototype.refresh = function() {
  var s = "";
  s += "<div id='" + this.container + "-sparqlbar' class='sparqlbar'><div class='sparqlbar-inner'>";
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
  s += "</div></div>";
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
  s += "SELECT ?" + what + " WHERE {\n" + "  ?" + what + " rdfs:type " + this._config._rdfTypesShort[what] + ".\n";
  
  // build out top level terms
  s += this._buildTerms(what,this._hierarchy,"",{tc: 1});
  
  s += "} LIMIT 20"; // TODO remove/change limit
  
  mljs.defaultconnection.logger.debug("Generated SPARQL: " + s);
  return s;
};

com.marklogic.widgets.sparqlbar.prototype._buildTerms = function(what,termArray,padding,counterObject) {
  var s = "";
  for (var i = 0;i < termArray.length;i++) {
    var tjson = termArray[i];
    // TODO support deleted terms (try catch)
    var termWhat = document.getElementById(this.container + "-sparqlbar-term-what-" + tjson.tid).value;
    
    if ("*" == termWhat) {
      var termType = document.getElementById(this.container + "-sparqlbar-term-relatedtype-" + tjson.tid).value;
      var termRel = document.getElementById(this.container + "-sparqlbar-term-relationship-" + tjson.tid).value;
      console.log("termType: " + termType + ", termRel: " + termRel);
      if (undefined != termRel) {
      var termPred = this._config._predicatesShort[termRel];
      if (undefined != termPred) {
      var c = counterObject.tc++;
      s += padding + "    ?" + what + " " + termPred + " ?" + termType + c + " .\n" ;
      s += padding + "      ?" + termType + c + " rdfs:type " + this._config._rdfTypesShort[termType] + ".\n";
      
      // TODO process child terms here
      if (tjson.children.length > 0) {
        s += this._buildTerms(termType + c,tjson.children,padding + "  ",counterObject);
      }
      
      s += padding /*+ "    } "*/;
        }
      }
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
      s += padding + "    ?" + what + " " + propiri + " '" + propvalue + "'@en .\n"; // TODO support I18N
    }
    /*
    if ((termArray.length - 1) == i) {
      s += " .\n";
    } else {
      s += ";\n";
    }*/
  }
  
  return s;
};

com.marklogic.widgets.sparqlbar.prototype._doQuery = function() {
  self.resultsPublisher.publish(true);
  var sparql = this._buildQuery();
  var self = this;
  mljs.defaultconnection.sparql(sparql,function(result) {
    mljs.defaultconnection.logger.debug("RESPONSE: " + JSON.stringify(result.doc));
    if (result.inError) {
      self.resultsPublisher.publish(false);
      self.errorPublisher.publish(result.error);
    } else {
      self.resultsPublisher.publish(result.doc);
    }
  });
};

/**
 * Adds a function as a results listener
 * 
 * @param {function} lis - The function handler. Passed the JSON results object.
 **/
com.marklogic.widgets.sparqlbar.prototype.addResultsListener = function(lis) {
  // add results listener
  this.resultsPublisher.subscribe(lis);
};

/**
 * Removes a results listener function
 * 
 * @param {function} lis - The function handler. 
 **/
com.marklogic.widgets.sparqlbar.prototype.removeResultsListener = function(lis) {
  // remove results listener
  this.resultsPublisher.unsubscribe(lis);
};


/**
 * Adds a function as an error listener
 * 
 * @param {function} lis - The function handler. Passed the JSON results object.
 **/
com.marklogic.widgets.sparqlbar.prototype.addErrorListener = function(lis) {
  // add results listener
  this.errorPublisher.subscribe(lis);
};

/**
 * Removes an error listener function
 * 
 * @param {function} lis - The function handler. 
 **/
com.marklogic.widgets.sparqlbar.prototype.removeErrorListener = function(lis) {
  // remove results listener
  this.errorPublisher.unsubscribe(lis);
};










// SPARQL RESULTS widget
/**
 * Lists results from a SPARQL results JSON object.
 * 
 * @constructor
 * @param {string} container - The ID of the HTML element this widget draws itself within
 **/
com.marklogic.widgets.sparqlresults = function(container) {
  this.container = container;
  this.errorPublisher = new com.marklogic.events.Publisher();
  
  this.results = null; // JSON results object:- 
  // {"head":{"vars":["person"]},"results":{"bindings":[
  //    {"person":{"type":"uri","value":"http://marklogic.com/semantic/targets/person/Nathan%20Olavsky"}},
  //    {"person":{"type":"uri","value":"http://marklogic.com/semantic/targets/person/Abraham%20Troublemaker"}}
  // ]}}
  
  this._iriHandler = null;
  
  this._config = new com.marklogic.widgets.tripleconfig();
  
  this._refresh();
};

/**
 * Provides a function that receives a string iri of the clicked on result.
 * 
 * @param {function} handler - The event handler function
 **/
com.marklogic.widgets.sparqlresults.prototype.iriHandler = function(handler) {
  this._iriHandler = handler;
};

com.marklogic.widgets.sparqlresults.prototype._refresh = function() {
  var s = "<div id='" + this.container + "-sparqlresults' class='sparqlresults'>";
  s += "<h2 class='sparqlresults-title'>Fact Search Results</h2>";
  
  var irilinks = new Array();
  
  if (undefined != this.results) {
    
  if (typeof this.results == "boolean" ) {
    // TODO show/hide refresh image based on value of this.results (true|false)
    if (true == this.results) {
      s += com.marklogic.widgets.bits.loading(this.container + "-loading");
    } else {
      s += com.marklogic.widgets.bits.failure(this.container + "-failure");
    }
    return;
  } else {
   if (undefined != this.results.head && undefined != this.results.head.vars && undefined != this.results.results) {
    // get list of entities returned in search
    var entities = this.results.head.vars; // E.g. person, organisation - these are the returned variable bindings from the query
    
    // process results, showing common information where appropriate
      // title - get name eventually
      for (var b = 0;b < this.results.results.bindings.length;b++) {
        s += "<div id='" + this.container + "-sparqlresults-result-" + b + "' class='sparqlresults";
        if (null != this._iriHandler) {
          s += " sparqlresults-navigable";
        }
        s += "'><h3>" + (b + 1) + ". ";
        for (var et = 0;et < entities.length;et++) {
          var entityValue = this.results.results.bindings[b][entities[et]];
          //s += entities[et] + " (" + entityValue.type + "): " + entityValue.value;
          s += "<span id='" + this.container + "-sparqlresults-result-" + b + "-summary'><i>Loading...</i></span>";
          irilinks.push({iri: entityValue.value, elid: this.container + "-sparqlresults-result-" + b + "-summary"});
        }
        s += "</h3></div>";
      }
    }
   }
  } else {
    s += "<i>No results</i>";
  }
  
  s += "</div>";
  
  document.getElementById(this.container).innerHTML = s;
  
  // click handlers
  for (var i = 0; i < irilinks.length;i++) {
    var link = irilinks[i];
    this._config.summariseInto(link.iri,link.elid,this._iriHandler);
  }
};

/**
 * Event target. Receives the SPARQL JSON results object from a linked SPARQLBAR (or other) widget.
 *
 * @param {JSON} results - The JSON SPARQL results object
 */
com.marklogic.widgets.sparqlresults.prototype.updateResults = function(results) {
  this.results = results;
  
  this._refresh();
};

/**
 * Adds an error listener to this widget
 * 
 * @param {function(error)} fl - The error listener to add
 */
com.marklogic.widgets.sparqlresults.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 * 
 * @param {function(error)} fl - The error listener to remove
 */
com.marklogic.widgets.sparqlresults.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};












// fact listing widget for an IRI
/**
 * Lists facts about an IRI from the triple store. Provides links to other related IRIs.
 * 
 * @constructor
 * @param {string} container - The HTML ID of this widgets container
 **/
com.marklogic.widgets.entityfacts = function(container) {
  this.container = container;
  
  this.loading = false;
  
  this.results = null;
  
  this._options = "";
  
  this._config = new com.marklogic.widgets.tripleconfig();
  
  this._iriHandler = null;
  
  this._contentWidget = null; // JS content results widget to update with fact provenance content
  
  this.reverse = false;
  
  this._refresh();
};

/**
 * Provides a function that receives a string iri of the clicked on related IRI object. (Could be linked to this widget's own updateEntity function)
 * 
 * @param {function} handler - The event handler function
 **/
com.marklogic.widgets.entityfacts.prototype.iriHandler = function(handler) {
  this._iriHandler = handler;
};

com.marklogic.widgets.entityfacts.prototype._toggle = function() {
  this.reverse = !this.reverse;
  this._refresh();
};

com.marklogic.widgets.entityfacts.prototype._refresh = function() {
  var s = "<div id='" + this.container + "-entityfacts' class='entityfacts'>";
  if (this.reverse) {
    s += "<h2 class='entityfacts-title'>Entity Links</h2>";
    s += "<div id='" + this.container + "-entityfacts-facts'>";
  } else {
    s += "<h2 class='entityfacts-title'>Entity Facts</h2>";
    s += "<div id='" + this.container + "-entityfacts-facts'>";
  }
  if (this.loading == true) {
    s += com.marklogic.widgets.bits.loading(this.container + "-loading");
  }
  
  var irilinks = new Array();
  
  if (this.results != null && this.results != undefined) {
    // get type: http://www.w3.org/1999/02/22-rdf-syntax-ns#type
    var type = null;
    for (var b = 0;(null == type) && (b < this.results.results.bindings.length);b++) {
      var predicate = this.results.results.bindings[b].predicate;
      var object = this.results.results.bindings[b].object;
      
      if (predicate.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
        type = object.value;
      }
    }
    mljs.defaultconnection.logger.debug("Got type: " + type);
    
    var entityInfo = null;
    var entityName = null;
    for (var entname in this._config._newentities) {
      if (this._config._newentities[entname].rdfTypeIri == type) {
        // found our entity
        entityInfo = this._config._newentities[entname];
        entityName = entname;
      }
    }
    mljs.defaultconnection.logger.debug("Got entity name: " + entityName);
    
    // get common name from config
    var namepredicate = this._config.getNameProperty(entityName).iri;
    mljs.defaultconnection.logger.debug("Got name predicate: " + namepredicate);
    var namevalue = null;
    for (var b = 0;(null == namevalue) && (b < this.results.results.bindings.length);b++) {
      var predicate = this.results.results.bindings[b].predicate;
      var object = this.results.results.bindings[b].object;
      
      if (predicate.value == namepredicate) {
        namevalue = object.value;
      }
    }
    mljs.defaultconnection.logger.debug("Got name value: " + namevalue);
    
    var objectinfo = this._config.getEntityFromIRI(type);
    s += "<h3>" + objectinfo.title + ": " + namevalue + "</h3>";
    
    if (null != this._contentWidget) {
      s += "<p><a href='#' id='" + this.container + "-contentlink'>Load source content</a></p>";
    }
    
    // TODO publish non IRIs first
    // TODO publish IRIs as links
    for (var b = 0;(b < this.results.results.bindings.length);b++) {
      var predicate = this.results.results.bindings[b].predicate;
      var pinfo = this._config.getPredicateFromIRI(predicate.value);
      var obj = this.results.results.bindings[b].object;
      
      if (predicate.value != namepredicate && predicate.value != "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
        s += "<p><b>" + pinfo.title + ":</b> ";
        // TODO replace the following entirely
        if (undefined != obj["xml:lang"] /*|| null == this._iriHandler*/) {
          // string literal
          s += obj.value;
        } else {
          irilinks.push({iri: obj.value, elid: this.container + "-entityfacts-fact-" + b + "-summary"});
          s += "<span id='" + this.container + "-entityfacts-fact-" + b + "-summary'><i>Loading...</i></span>";
        }
        
        s += "</p>";
      }
    }
  }
  s += "</div>";
  
  document.getElementById(this.container).innerHTML = s;
  
  // event handlers and lazy loading
  // lazy load related entity summaries
  for (var i = 0;i < irilinks.length ;i++) {
    this._summariseInto(irilinks[i].iri,irilinks[i].elid);
  }
  
  if (null != this._contentWidget) {
    var self = this;
    var el = document.getElementById(this.container + "-contentlink");
    if (null != el) {
      el.onclick = function() {self._provenance();};
    }
  }
};

com.marklogic.widgets.entityfacts.prototype._summariseInto = function(iri,elid) {
  this._config.summariseInto(iri,elid,this._iriHandler);
};

/**
 * Updates the information shown about the entity with the specified IRI (executes a SPARQL query)
 *
 * @param {string} iri - The IRI of the object to show facts about
 **/
com.marklogic.widgets.entityfacts.prototype.updateEntity = function(iri) {
  this.iri = iri;
  this.loading = true;
  this._refresh();
  
  var self = this;
  
  var sparql = "SELECT * WHERE {<" + iri + "> ?predicate ?object .}";
  
  // fetch info and refresh again
  mljs.defaultconnection.sparql(sparql,function(result) {
    mljs.defaultconnection.logger.debug("RESPONSE: " + JSON.stringify(result.doc));
    self.loading = false;
    if (result.inError) {
      // TODO publish error
    } else {
      self.results = result.doc;
    }
    self._refresh();
  });
  
  this.errorPublisher = new com.marklogic.events.Publisher();
};

com.marklogic.widgets.entityfacts.prototype.setProvenanceWidget = function (wgt) {
  this._contentWidget = wgt;
};

com.marklogic.widgets.entityfacts.prototype.setOptions = function(options) {
  this._options = options;
};


/**
 * Adds a function as an error listener
 * 
 * @param {function} lis - The function handler. Passed the JSON results object.
 **/
com.marklogic.widgets.entityfacts.prototype.addErrorListener = function(lis) {
  // add results listener
  this.errorPublisher.subscribe(lis);
};

/**
 * Removes an error listener function
 * 
 * @param {function} lis - The function handler. 
 **/
com.marklogic.widgets.entityfacts.prototype.removeErrorListener = function(lis) {
  // remove results listener
  this.errorPublisher.unsubscribe(lis);
};


com.marklogic.widgets.entityfacts.prototype._provenance = function() {
  // execute sparql for all facts  to do with current entity
  var self = this;
  if (null != this._contentWidget) {
    self._contentWidget.updateResults(true);
    
    var sparql = "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\nPREFIX rdfs: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" + 
      "SELECT ?docuri {\n  GRAPH ?graph {\n    ";
    if (self.reverse) {
      sparql += "?obj ?pred <" + self.iri + "> .";
    } else {
      sparql += "<" + self.iri + "> ?pred ?obj .";
    }
    
    sparql += "\n  }\n  ?graph <http://marklogic.com/semantics/ontology/derived_from> ?docuri .\n" + 
      "} LIMIT 10";
    mljs.defaultconnection.sparql(sparql,function(result) {
        if (result.inError) {
          self._contentWidget.updateResults(false);
          self.errorPublisher.publish(result.error);
        } else {
      // use docuris as a shotgun or structured search
      var qb = new mljs.defaultconnection.query();
      var uris = new Array();
      for (var b = 0;b < result.doc.results.bindings.length;b++) {
        var res = result.doc.results.bindings[b];
        uris.push(res.docuri.value);
      }
      qb.query(qb.uris("uris",uris));
      var queryjson = qb.toJson();
      
      mljs.defaultconnection.structuredSearch(queryjson,self._options,function(result) {
        if (result.inError) {
          self._contentWidget.updateResults(false);
          self.errorPublisher.publish(result.error);
        } else {
          self._contentWidget.updateResults(result.doc);
        }
      });
    }
    });
  }
};


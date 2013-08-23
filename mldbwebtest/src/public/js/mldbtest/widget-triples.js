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





com.marklogic.widgets.semantichelper = {};

com.marklogic.widgets.semantichelper.summariseInto = function(ctx,iri,elid,iriHandler) {
  mljs.defaultconnection.logger.debug("semantichelper.summariseInto: IRI: " + iri + ", elid: " + elid);
  var self = ctx;
  // load type IRI for entity
  var ts = "SELECT ?rdftype WHERE {<" + iri + "> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?rdftype . } LIMIT 1";
  mljs.defaultconnection.logger.debug("TS: " + ts);
  mljs.defaultconnection.sparql(ts,function(result) {
    if (result.inError) {
      // TODO publish error
    } else {
      var entityinfo = self.getEntityFromIRI(result.doc.results.bindings[0].rdftype.value); // TODO check for no rdftype
      var nameprop = self.getNameProperty(entityinfo.name).iri;
      if (undefined == nameprop) {
        document.getElementById(elid).innerHTML = iri;
      } else {
      // load common name for this type
      var ns = "SELECT ?name WHERE {<" + iri + "> <" + nameprop  + "> ?name . } LIMIT 1";
      mljs.defaultconnection.logger.debug("NS: " + ns);
      
      mljs.defaultconnection.sparql(ns,function(result2) {
        if (result2.inError) {
          // TODO publish error
        } else {
          if (undefined != result2.doc.results && undefined != result2.doc.results.bindings && result2.doc.results.bindings.length > 0) {
            var el = document.getElementById(elid);
            if (undefined != el) {
          var cn = result2.doc.results.bindings[0].name.value;
          // display in appropriate element
          var s = "";
          if (null != iriHandler) {
            s += "<a href='#' id='" + elid + "-link'>";
          }
          s += cn + " (" + entityinfo.title + ")";
          
          if (null != iriHandler) {
            s += "</a>";
          }
          el.innerHTML = s;
          
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
        } // end if element is defined
        } else {
          mljs.defaultconnection.logger.debug("This query returns no bindings (results): " + ts);
          mljs.defaultconnection.logger.debug("Result instead: " + JSON.stringify(result2.doc));
        } // end if bindings undefined / empty
        }
      });
    } // end if else nameprop has property map
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
  
  this.semanticcontext = new mljs.defaultconnection.semanticcontext();
  
  // These are so we only update with the suggestions we care about
  this._suggestionsEnabled = true;
  this._suggestionMinimumCharacters = 3;
  this._suggestionRdfTypeIri = null;
  this._suggestionPredicateIri = null;
  this._suggestionDestinationElementId = null;
  
  this.terms = 0;
  
  //this._config = new com.marklogic.semantic.tripleconfig();
  
  this._hierarchy = new Array(); // [{tid: 1, children: [{tid: 2, children:[]}, ...]}, ....]
  this._allterms = new Array(); // plain array, [tid] => JSON as above
  this._parentterms = new Array(); // [childid] = parentid
  
  //this.resultsPublisher = new com.marklogic.events.Publisher();
  this.errorPublisher = new com.marklogic.events.Publisher();
  
  this.refresh();
};

com.marklogic.widgets.sparqlbar.prototype.setSemanticContext = function(sc) {
  this.semanticcontext = sc;
};

com.marklogic.widgets.sparqlbar.prototype.updateSuggestions = function(suggestions) {
  if (undefined != suggestions && suggestions.rdfTypeIri == this._suggestionRdfTypeIri && suggestions.predicate == this._suggestionPredicateIri) {
    // We need to show these suggestions
    var el = document.getElementById(this.container + "-sparqlbar-suggestions");
    var arr = suggestions.suggestions.results.bindings;
    var s = "";
    var links = new Array();
    for (var b = 0;b < arr.length;b++) {
      var link = {index: b, suggestion: b.suggestion.value};
      links.push(link);
      
      s += "<p class='sparqlbar-suggestion' id='" + this.container + "-sparqlbar-suggestion-" + b + "'>" + link.suggestion + "</p>";
    }
    if ("" == s) {
      s = "<i>No Suggestions</i>";
    }
    el.innerHTML = s;
    
    // remove hidden class
    self._hidden(el,false);
    
    // now do click handlers
    var self = this;
    var addClickHandler = function(el,suggestion) {
      el.onclick = function(event) {
        document.getElementById(self._suggestionDestinationElementId).value = suggestion;
        // hide suggestions box
        self._hidden(el,true);
        
        // disable suggestions
        self._suggestionRdfTypeIri = null;
        self._suggestionPredicateIri = null;
        self._suggestionDestinationElementId = null;
      }
    };
    for (var l = 0;l < links.length;l++) {
      addClickHandler(document.getElementById(this.container + "-sparqlbar-suggestion-" + links[l].index),links[l].suggestion);
    }
  }
};

/**
 * Refreshes the entire widget UI - useful if you've provided your own triple configuration.
 */
com.marklogic.widgets.sparqlbar.prototype.refresh = function() {
  var s = "";
  s += "<div id='" + this.container + "-sparqlbar' class='sparqlbar'><div class='sparqlbar-inner'>";
  // hidden, moveable suggestions drop down
  s += "  <div id='" + this.container + "-sparqlbar-suggestions' class='sparqlbar-suggestions hidden'><i>None</i></div>";
  // what to retrieve
  s += "  <div class='sparqlbar-for'>Search for: ";
  s += "    <select class='sparqlbar-for-what' id='" + this.container + "-sparqlbar-what'>";
  //s += "      <option value='_content'>All Content</option>";
  s += "      <option value='_entities'>All Subjects</option>";
  //s += "      <option value='_facts'>All Facts</option>";
  //s += "      <option value='_graphs'>All Graphs</option>";
  var first = true;
  for (var nom in this.semanticcontext.getConfiguration()._newentities) {
    var ent = this.semanticcontext.getConfiguration()._newentities[nom];
    if (undefined != ent && "function" != typeof ent) { // fix for array function members
      s += "    <option value='" + this.semanticcontext.getConfiguration()._newentities[nom].name + "'";
      if (first) {
        s += " selected='selected'";
        first = false;
      }
      s += ">" + this.semanticcontext.getConfiguration()._newentities[nom].title + "</option>";
    }
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
  var first = true;
  for (var nom in this.semanticcontext.getConfiguration()._newentities) {
    var ent = this.semanticcontext.getConfiguration()._newentities[nom];
    if (undefined != ent && "function" != typeof ent) { // fix for array function members
      s += "<option value='" + this.semanticcontext.getConfiguration()._newentities[nom].name + "'";
      if (first) {
        s += " selected='selected'";
        first = false;
      }
      s += ">" + this.semanticcontext.getConfiguration()._newentities[nom].title + "</option>";
    }
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
  };
  document.getElementById(this.container + "-sparqlbar-term-relatedtype-" + tid).onchange = function (el) {
    self._updateRelationships(tid);
  };
  document.getElementById(this.container + "-sparqlbar-term-value-" + tid).onchange = function(el) {
    self._suggest(el);
  };
  
  // TODO - term handler
  
  // + child handler
  document.getElementById(this.container + "-sparqlbar-term-" + tid + "-addchild").onclick = function() {
    self._addTerm(tid);
  };
  document.getElementById(this.container + "-sparqlbar-term-" + tid + "-remove").onclick = function() {
    self._removeTerm(tid);
  };
  
  // TODO check for previous term in this container, and remove 'hidden' class from ;AND span
};

com.marklogic.widgets.sparqlbar.prototype._suggest = function(el) {
  // check value, if 3 (by config) or more, ensure we're linked to this field, and perform suggest
  var value = el.value;
  if (value.length >= this._suggestionMinimumCharacters) {
    this._suggestionDestinationElementId = el.getAttribute("id");
  }
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
  var rels = this.semanticcontext.getConfiguration().getValidPredicates(parentType,me);
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
  if (parentType.indexOf("_") == 0) {
    // no search output selected
    return;
  }
  var parentInfo = this.semanticcontext.getConfiguration().getEntityFromName(parentType);
  
  var s = "";
  var props = parentInfo.properties; // this._config._properties[parentType];
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
  if ("_content" == what) {
    s += "SELECT distinct ?s, ?g {\n  GRAPH ?g {\n    ";
    s += this._buildTerms("s",this._hierarchy,"",{tc: 1}); // TODO check this works
    s += "\n  }\n  ?g <http://marklogic.com/semantics/ontology/derived_from> ?docuri .\n}"; 
    
  } else if ("_entities" == what) {
    s += " SELECT distinct ?s WHERE {\n";
    s += "  ?s ?p ?o . \n";
    s += this._buildTerms("s",this._hierarchy,"",{tc: 1});
    s += "}";
    
  } else if ("_facts" == what) {
    s += " SELECT ?s, ?p, ?o WHERE {\n?s ?p ?o .\n";
    s += this._buildTerms("s",this._hierarchy,"",{tc: 1});
    s += "}";
    
  } else if ("_graphs" == what) {
    s += "SELECT distinct ?g { GRAPH ?g {}}";
  
  } else {
    var entity = this.semanticcontext.getConfiguration().getEntityFromName(what);
    s += "SELECT distinct ?" + what + " WHERE {\n" + "  ?" + what + " rdfs:type <" + entity.rdfTypeIri + "> .\n";
    
    // build out top level terms
    s += this._buildTerms(what,this._hierarchy,"",{tc: 1});
    
    s += "}";
  }
  //s += " LIMIT 20";
  mljs.defaultconnection.logger.debug("Generated SPARQL: " + s);
  return s;
};

com.marklogic.widgets.sparqlbar.prototype._buildTerms = function(what,termArray,padding,counterObject) {
  var s = "";
  for (var i = 0;i < termArray.length;i++) {
    var tjson = termArray[i];
    // TODO support deleted terms (try catch)
    var twel = document.getElementById(this.container + "-sparqlbar-term-what-" + tjson.tid);
    if (undefined != twel) {
      var termWhat = twel.value;
      
      if ("*" == termWhat) {
        var termType = document.getElementById(this.container + "-sparqlbar-term-relatedtype-" + tjson.tid).value;
        var termRel = document.getElementById(this.container + "-sparqlbar-term-relationship-" + tjson.tid).value;
        console.log("termType: " + termType + ", termRel: " + termRel);
        if (undefined != termRel) {
          //var termPred = this._config._predicatesShort[termRel];
          var termPred = this.semanticcontext.getConfiguration().getPredicateFromName(termRel);
          if (undefined != termPred) {
            var c = counterObject.tc++;
            s += padding + "    ?" + what + " <" + termPred.iri + "> ?" + termType + c + " .\n" ;
            var termTypeObject = this.semanticcontext.getConfiguration().getEntityFromName(termType);
            s += padding + "      ?" + termType + c + " rdfs:type <" + termTypeObject.rdfTypeIri + "> .\n";
            
            // TODO process child terms here
            if (tjson.children.length > 0) {
              s += this._buildTerms(termType + c,tjson.children,padding + "  ",counterObject);
            }
            
            s += padding /*+ "    } "*/;
          }
        }
      } else {
        // TODO property (=)
        var propentity = this.semanticcontext.getConfiguration().getEntityFromName(this._getParentType(tjson.tid));
        var propname = document.getElementById(this.container + "-sparqlbar-term-properties-" + tjson.tid).value;
        var propvalue = document.getElementById(this.container + "-sparqlbar-term-value-" + tjson.tid).value;
        var propinfo = this.semanticcontext.getConfiguration().getEntityProperty(propentity,propname);
        s += padding + "    ?" + what + " <" + propinfo.iri + "> '" + propvalue + "'@en .\n"; // TODO support I18N
      }
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
  var sparql = this._buildQuery();
  
  this.semanticcontext.subjectQuery(sparql);
  /*
  this.resultsPublisher.publish(true);
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
  */
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
  
  this.semanticcontext = new mljs.defaultconnection.semanticcontext();
  
  this.errorPublisher = new com.marklogic.events.Publisher();
  
  this.results = null; // JSON results object:- 
  // {"head":{"vars":["person"]},"results":{"bindings":[
  //    {"person":{"type":"uri","value":"http://marklogic.com/semantic/targets/person/Nathan%20Olavsky"}},
  //    {"person":{"type":"uri","value":"http://marklogic.com/semantic/targets/person/Abraham%20Troublemaker"}}
  // ]}}
  
  this._iriHandler = null;
  
  //this._config = new com.marklogic.semantic.tripleconfig();
  
  this._refresh();
};

com.marklogic.widgets.sparqlresults.prototype.setSemanticContext = function(sc) {
  this.semanticcontext = sc;
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
  s += "<h2 class='sparqlresults-title'>Subject Search Results</h2>";
  
  var irilinks = new Array();
  
  if (undefined != this.results) {
    
  if (typeof this.results == "boolean" ) {
    // TODO show/hide refresh image based on value of this.results (true|false)
    if (true == this.results) {
      //s += com.marklogic.widgets.bits.loading(this.container + "-loading");
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
    com.marklogic.widgets.semantichelper.summariseInto(this.semanticcontext.getConfiguration(),link.iri,link.elid,this._iriHandler);
  }
};

/**
 * Event target. Receives the SPARQL JSON results object from a linked SPARQLBAR (or other) widget.
 *
 * @param {JSON} results - The JSON SPARQL results object
 */
com.marklogic.widgets.sparqlresults.prototype.updateSubjectResults = function(results) {
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
  
  this.semanticcontext = new mljs.defaultconnection.semanticcontext();
  
  this.loading = false;
  
  this.facts = null;
  
  this._options = "";
  
  //this._config = new com.marklogic.semantic.tripleconfig();
  
  this._iriHandler = null;
  
  //this._contentWidget = null; // JS content results widget to update with fact provenance content
  
  this.reverse = false;
  
  this._refresh();
};

com.marklogic.widgets.entityfacts.prototype.setSemanticContext = function(sc) {
  this.semanticcontext = sc;
};

com.marklogic.widgets.entityfacts.prototype.updateSubjectFacts = function(factsJson) {
  if ("object" == typeof factsJson) {
    mljs.defaultconnection.logger.debug("entityfacts.updateSubjectFacts: Facts: " + JSON.stringify(factsJson));
    
    // list these facts
    this.facts = factsJson;
    
    // if predicate exists, just update relevant section, otherwise refresh whole widget
    if (undefined == factsJson.predicate) {
      this._refresh(); 
    } else {
      // update name
      if (factsJson.predicate == "") {
        
      }
    }
  }
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
    //s += com.marklogic.widgets.bits.loading(this.container + "-loading");
  }
  
  var irilinks = new Array();
  
  if (this.facts != null && this.facts != undefined) {
    // get type: http://www.w3.org/1999/02/22-rdf-syntax-ns#type
    var type = null;
    for (var b = 0;(null == type) && (b < this.facts.facts.results.bindings.length);b++) {
      var predicate = this.facts.facts.results.bindings[b].predicate;
      if (undefined == predicate) {
        predicate = {value: this.facts.predicate};
      }
      var object = this.facts.facts.results.bindings[b].object;
      
      if (predicate.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
        type = object.value;
      }
    }
    mljs.defaultconnection.logger.debug("Got type: " + type);
    
    var entityInfo = this.semanticcontext.getConfiguration().getEntityFromIRI(type);
    
    var entityName = entityInfo.name;
    mljs.defaultconnection.logger.debug("Got entity name: " + entityName);
    
    // get common name from config
    var namepredicate = this.semanticcontext.getConfiguration().getNameProperty(entityName).iri;
    mljs.defaultconnection.logger.debug("Got name predicate: " + namepredicate);
    var namevalue = null;
    for (var b = 0;(null == namevalue) && (b < this.facts.facts.results.bindings.length);b++) {
      var predicate = this.facts.facts.results.bindings[b].predicate;
      if (undefined == predicate) {
        predicate = {value: this.facts.predicate};
      }
      var object = this.facts.facts.results.bindings[b].object;
      
      if (predicate.value == namepredicate) {
        namevalue = object.value;
      }
    }
    mljs.defaultconnection.logger.debug("Got name value: " + namevalue);
    
    //var objectinfo = this._config.getEntityFromIRI(type);
    s += "<h3>" + entityInfo.title + ": " + namevalue + "</h3>";
    
    if (this.semanticcontext.hasContentContext()) {
      s += "<p><a href='#' id='" + this.container + "-contentlink'>Load related content</a></p>";
    }
    
    // TODO publish non IRIs first
    // TODO publish IRIs as links
    for (var b = 0;(b < this.facts.facts.results.bindings.length);b++) {
      var predicate = this.facts.facts.results.bindings[b].predicate;
      if (undefined == predicate) {
        predicate = {value: this.facts.predicate};
      }
      var pinfo = this.semanticcontext.getConfiguration().getPredicateFromIRI(predicate.value);
      var obj = this.facts.facts.results.bindings[b].object;
      mljs.defaultconnection.logger.debug("OUR OBJECT: " + JSON.stringify(obj));
      mljs.defaultconnection.logger.debug("OUR BINDING: " + JSON.stringify(this.facts.facts.results.bindings[b]));
      
      if (predicate.value != namepredicate && predicate.value != "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
        s += "<p><b>" + pinfo.title + ":</b> ";
        // TODO replace the following entirely
        if (undefined != obj["xml:lang"] /* i.e. is an xml string */ || obj.type != "uri" /* is a value, not a URI */   /*|| null == this._iriHandler*/) {
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
  //this.semanticcontext.getConfiguration().summariseInto(iri,elid,this._iriHandler);
  com.marklogic.widgets.semantichelper.summariseInto(this.semanticcontext.getConfiguration(),iri,elid,this._iriHandler);
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
  /*
  
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
  */
  
  this.semanticcontext.getFacts(iri);
  
  this.errorPublisher = new com.marklogic.events.Publisher();
};

/*
com.marklogic.widgets.entityfacts.prototype.setProvenanceWidget = function (wgt) {
  this._contentWidget = wgt;
};

com.marklogic.widgets.entityfacts.prototype.setOptions = function(options) {
  this._options = options;
};
*/

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
  this.semanticcontext.subjectContent(this.facts.subjectIri);
};


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

com.marklogic.widgets.semantichelper.summariseInto = function(ctx,iri,type,elid,iriHandler) {
  mljs.defaultconnection.logger.debug("semantichelper.summariseInto: IRI: " + iri + ", elid: " + elid + ", ctx: " + ctx + ", type: " + type + ", iriHandler: " + iriHandler);
  
  // load type IRI for entity
  var lookupIri = iri;
  var useSubjectAngle = true;
  if (type == "bnode") {
    lookupIri = "_:" + iri;
    useSubjectAngle = false;
  }
  
  var ts = "SELECT ?rdftype WHERE {";
  if (useSubjectAngle) {
    ts += "<";
  }
  ts += lookupIri;
  if (useSubjectAngle) {
    ts += ">";
  }
  ts += " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?rdftype . } LIMIT 1";
  mljs.defaultconnection.logger.debug("TS: " + ts);
  mljs.defaultconnection.sparql(ts,function(result) {
    if (result.inError) {
      // TODO publish error
    } else {
      mljs.defaultconnection.logger.debug("semantichelper.summariseInto: TYPERESPONSE: " + JSON.stringify(result.doc));
      var firstbinding = result.doc.results.bindings[0];
      if (undefined != firstbinding) {
        
        
        var entityinfo = ctx.getConfiguration().getEntityFromIRI(firstbinding.rdftype.value); 
        mljs.defaultconnection.logger.debug("semantichelper.summariseInto: entityInfo: " + JSON.stringify(entityinfo));
        var nameprop = ctx.getConfiguration().getNameProperty(entityinfo.name).iri;
        mljs.defaultconnection.logger.debug("semantichelper.summariseInto: nameprop: " + nameprop);
        if (undefined == nameprop) {
          document.getElementById(elid).innerHTML = lookupIri;
        } else {
          // load common name for this type
          var ns = "SELECT ?name WHERE {";
          if (useSubjectAngle) {
            ns += "<";
          }
          ns += lookupIri;
          if (useSubjectAngle) {
            ns += ">";
          }
          ns += " <" + nameprop  + "> ?name . } LIMIT 1";
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
                    addClickHandler(el,lookupIri);
                  }
                } // end if element is defined
              } else {
                mljs.defaultconnection.logger.debug("This query returns no bindings (results): " + ts);
                mljs.defaultconnection.logger.debug("Result instead: " + JSON.stringify(result2.doc));
              } // end if bindings undefined / empty
            }
          });
        } // end if else nameprop has property map
      } else { 
        document.getElementById(elid).innerHTML = lookupIri;
      }
    }// error if
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
  
  this._lang = "en";
  
  //this._config = new com.marklogic.semantic.tripleconfig();
  
  this._hierarchy = new Array(); // [{tid: 1, children: [{tid: 2, children:[]}, ...]}, ....]
  this._allterms = new Array(); // plain array, [tid] => JSON as above
  this._parentterms = new Array(); // [childid] = parentid
  
  //this.resultsPublisher = new com.marklogic.events.Publisher();
  this.errorPublisher = new com.marklogic.events.Publisher();
  
  this.refresh();
};

com.marklogic.widgets.sparqlbar.prototype.setLang = function(lang) {
  this._lang = lang;
};

com.marklogic.widgets.sparqlbar.prototype.setSemanticContext = function(sc) {
  this.semanticcontext = sc;
  sc.primeSimpleSuggest(); // speeds up MarkLogic server's SPARQL processing on demo systems (i.e. ones that haven't been running long)
  this.refresh(); // redraw - we assume the underlying config has changed, requiring a repaint
};

com.marklogic.widgets.sparqlbar.prototype.updateSuggestions = function(suggestions) {
  if (undefined != suggestions && suggestions.rdfTypeIri == this._suggestionRdfTypeIri && suggestions.predicate == this._suggestionPredicateIri) {
    // We need to show these suggestions
    var elss = document.getElementById(this.container + "-sparqlbar-suggestions");
    var arr = suggestions.suggestions.results.bindings;
    var len = arr.length;
    var s = "";
    var links = new Array();
    for (var b = 0;b < len;b++) {
      var link = {index: b, suggestion: arr[b].suggestion.value}; // TODO support locale of xml:lang behind the scenes too
      links.push(link);
      
      s += "<p class='sparqlbar-suggestion' id='" + this.container + "-sparqlbar-suggestion-" + b + "'>" + link.suggestion + "</p>";
    }
    if ("" == s) {
      s = "<i id='" + this.container + "-sparqlbar-nosuggestion'>No Suggestions</i>";
    }
    elss.innerHTML = s;
    
    // now do click handlers
    var self = this;
    var addClickHandler = function(el,suggestion) {
      el.onclick = function(event) {
        document.getElementById(self._suggestionDestinationElementId).value = suggestion;
        // hide suggestions box
        self._hidden(elss,true);
        
        // disable suggestions
        self._suggestionRdfTypeIri = null;
        self._suggestionPredicateIri = null;
        self._suggestionDestinationElementId = null;
        
        e.stopPropagation();
        return false;
      }
    };
    for (var l = 0, max = links.length;l < max;l++) {
      addClickHandler(document.getElementById(this.container + "-sparqlbar-suggestion-" + links[l].index),links[l].suggestion);
    }
    
    document.getElementById(this.container + "-sparqlbar-nosuggestion").onclick = function(e) {
        self._hidden(elss,true);
        
        // disable suggestions
        self._suggestionRdfTypeIri = null;
        self._suggestionPredicateIri = null;
        self._suggestionDestinationElementId = null;
        
        e.stopPropagation();
        return false;
    };
    
  }
};

/**
 * Refreshes the entire widget UI - useful if you've provided your own triple configuration.
 */
com.marklogic.widgets.sparqlbar.prototype.refresh = function() {
  var s = "";
  s += "<div id='" + this.container + "-sparqlbar' class='mljswidget sparqlbar'><div class='well sparqlbar-inner'>";
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
  var ents = this.semanticcontext.getConfiguration()._newentities;
  for (var nom in ents) {
    var ent = ents[nom];
    if (undefined != ent && "function" != typeof ent) { // fix for array function members
      s += "    <option value='" + ent.name + "'";
      if (first) {
        s += " selected='selected'";
        first = false;
      }
      s += ">" + ent.title + "</option>";
    }
  }
  s += "</select> which <span class='sparqlbar-add'>[<a class='sparqlbar-add-link' id='" + this.container + "-sparqlbar-add-link' href='#'>+ Child</a>]</span></div>";
  
  // criteria
  //  - predicate list
  //  - interactive IRI suggestion list (base on what searching for and predicate value selected)
  // include general 'has a relationship with type'
  
  s += "<div id='" + this.container + "-sparqlbar-terms' class='sparqlbar-terms'></div>";
  
  s += "<div><input type='submit' value='Search'  class='btn btn-primary sparqlbar-button' id='" + this.container + "-sparqlbar-button'/></div>";
  
  /*
  s += "<div class='sparqlbar-results' id='" + this.container + "-sparqlbar-results'><i>No results</i></div>";
  */
  s += "</div></div>";
  document.getElementById(this.container).innerHTML = s;
  
  // add event handlers
  var self = this;
  document.getElementById(this.container + "-sparqlbar-button").onclick = function(e) {
    self._doQuery();
    e.stopPropagation();
    return false;
  };
  
  // + child handler
  document.getElementById(this.container + "-sparqlbar-add-link").onclick = function(e) {
    self._addTerm();
    e.stopPropagation();
    return false;
  };
  
  document.getElementById(this.container + "-sparqlbar-what").onchange = function(e) {
    for (var i = 0;i < self._allterms.length;i++) {
      self._updateTerm(self._allterms[i].tid);
    }
  };
  
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
  var ents = this.semanticcontext.getConfiguration()._newentities
  for (var nom in ents) {
    var ent = ents[nom];
    if (undefined != ent && "function" !== typeof ent) { // fix for array function members
      s += "<option value='" + ent.name + "'";
      if (first) {
        s += " selected='selected'";
        first = false;
      }
      s += ">" + ent.title + "</option>";
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
  
  s += "<select class='hidden' id='" + this.container + "-sparqlbar-term-oper-" + tid + "'>";
  
  // TODO replace the following with things dynamically drawn / shown depending on type
  
  s += "<option value='='>equal to</option>";
  s += "<option value='!='>not equal to</option>";
  s += "<option value='lt'>less than</option>";
  s += "<option value='lte'>less than or equal to</option>";
  s += "<option value='gt'>greater than</option>";
  s += "<option value='gte'>greater than or equal to</option>";
  
  
  s += "</select>";
  
  
  
  
  
  
  s += "<input type='text' length='20'  class='sparqlbar-term-value hidden' id='" + this.container + "-sparqlbar-term-value-" + tid  + "'/>";
  
  s += "<span class='sparlbar-term-and hidden' id='" + this.container + "-sparqlbar-term-" + tid + "-and'>; AND</span>";
  s += " [<a href='#' id='" + this.container + "-sparqlbar-term-" + tid + "-remove'>-</a>] ";
  s += "<span id='" + this.container + "-sparqlbar-term-" + tid + "-addspan'>[<a href='#' id='" + this.container + "-sparqlbar-term-" + tid + "-addchild'>+ Child</a>]</span>";
  s += "<div id='" + this.container + "-sparqlbar-term-" + tid + "-children' class='sparqlbar-term'></div>";
  s += "</div>";
  
  //console.log("Adding html: " + s);
  
  if (undefined == parentid) {
    // WRONG - destroys children - document.getElementById(this.container + "-sparqlbar-terms").innerHTML += s;
    var newcontent = document.createElement('div');
    newcontent.innerHTML = s;

    var mydiv = document.getElementById(this.container + "-sparqlbar-terms");
    while (newcontent.firstChild) {
        mydiv.appendChild(newcontent.firstChild);
    }
  } else {
    //WRONG destroys children - document.getElementById(this.container + "-sparqlbar-term-" + parentid + "-children").innerHTML += s;
    var newcontent = document.createElement('div');
    newcontent.innerHTML = s;

    var mydiv = document.getElementById(this.container + "-sparqlbar-term-" + parentid + "-children");
    while (newcontent.firstChild) {
        mydiv.appendChild(newcontent.firstChild);
    }
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
  document.getElementById(this.container + "-sparqlbar-term-value-" + tid).onkeyup = function(el) {
    self._suggest(tid);
  };
  document.getElementById(this.container + "-sparqlbar-term-properties-" + tid).onchange = function(el) {
    self._refreshOperation(tid);
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

com.marklogic.widgets.sparqlbar.prototype._suggest = function(tid) {
  mljs.defaultconnection.logger.debug("sparqlbar._suggest: tid: " + tid);
  
  var el = document.getElementById(this.container + "-sparqlbar-term-value-" + tid);
  
  // check value, if 3 (by config) or more, ensure we're linked to this field, and perform suggest
  var value = el.value;
  mljs.defaultconnection.logger.debug("sparqlbar._suggest: el.value: " + value);
  if (value.length >= this._suggestionMinimumCharacters) {
    mljs.defaultconnection.logger.debug("sparqlbar._suggest: Firing suggest action");
    
    this._suggestionDestinationElementId = el.getAttribute("id");
    mljs.defaultconnection.logger.debug("sparqlbar._suggest: destination el id: " + this._suggestionDestinationElementId);
    var predicateName = document.getElementById(this.container + "-sparqlbar-term-properties-" + tid).value;
    mljs.defaultconnection.logger.debug("sparqlbar._suggest: predicateName: " + predicateName);
    
    var parentType = this._getParentType(tid);
    var scfg = this.semanticcontext.getConfiguration();
    mljs.defaultconnection.logger.debug("sparqlbar._suggest: parentType: " + parentType);
    var parentInfo = scfg.getEntityFromName(parentType);
    mljs.defaultconnection.logger.debug("sparqlbar._suggest: parentInfo: " + JSON.stringify(parentInfo));
    
    var predicateInfo = scfg.getEntityProperty(parentInfo,predicateName);
    mljs.defaultconnection.logger.debug("sparqlbar._suggest: predicateInfo: " + JSON.stringify(predicateInfo));
    
    this._suggestionRdfTypeIri = parentInfo.rdfTypeIri;
    this._suggestionPredicateIri = predicateInfo.iri;
    
    mljs.defaultconnection.logger.debug("sparqlbar._suggest: rdfTypeIri: " + this._suggestionRdfTypeIri + ", predicateIri: " + this._suggestionPredicateIri + 
      ", suggestion el id: " + this._suggestionDestinationElementId);
      
    mljs.defaultconnection.logger.debug("sparqlbar._suggest: destination id value: " + value);
    
    
    // move element to correct position
    var rect = el.getBoundingClientRect();
    var suggestel = document.getElementById(this.container + "-sparqlbar-suggestions");
    suggestel.setAttribute("style","left: " + el.offsetLeft + "px; top: " + (el.offsetTop + el.offsetHeight) + "px;");
    suggestel.innerHTML = "<i>Loading suggestions...</i>";
    
    // add onblur event, if not already defined
    if (undefined == el.onblur) {
      var self = this;
      el.onblur = function(e) {
        self._hidden(suggestel,true);
        el.onblur = undefined;
      };
    }
    
    // remove hidden class
    this._hidden(suggestel,false);
      
    this.semanticcontext.simpleSuggest(this._suggestionRdfTypeIri,this._suggestionPredicateIri,value);
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

com.marklogic.widgets.sparqlbar.prototype._getRootType = function() {
  return document.getElementById(this.container + "-sparqlbar-what").value;
};

com.marklogic.widgets.sparqlbar.prototype._updateRelationships = function(tid) {
  mljs.defaultconnection.logger.debug("_updateRelationships: tid: " + tid);
  // get from and to and determine valid set of relationship classes
  var parentType = this._getParentType(tid);
  
  var s = "";
  var me = document.getElementById(this.container + "-sparqlbar-term-relatedtype-" + tid).value;
  mljs.defaultconnection.logger.debug("_updateRelationships: RELATING PARENT: " + parentType + " TO ME: " + me);
  var rels = this.semanticcontext.getConfiguration().getValidPredicates(parentType,me);
  for (var i = 0, max = rels.length, rel; i < max;i++) {
    rel = rels[i];
    s += "<option value='" + rel + "'";
    if (0 == i) {
      s += " selected='selected'";
    }
    s += ">" + rel + "</option>";
  }
  
  document.getElementById(this.container + "-sparqlbar-term-relationship-" + tid).innerHTML = s;
};

com.marklogic.widgets.sparqlbar.prototype._updateProperties = function(tid) {
  mljs.defaultconnection.logger.debug("_updateProperties: tid: " + tid);
  // get from and to and determine valid set of properties
  var parentType = this._getParentType(tid);
  if (parentType.indexOf("_") == 0) {
    // no search output selected
    return;
  }
  var parentInfo = this.semanticcontext.getConfiguration().getEntityFromName(parentType);
  mljs.defaultconnection.logger.debug("_updateProperties: from PARENT: " + parentType);
  
  var s = "";
  var props = parentInfo.properties; // this._config._properties[parentType];
  for (var i = 0, max = props.length, propname; i < max;i++) {
    propname = props[i].name;
    s += "<option value='" + propname + "'";
    if (0 == i) {
      s += " selected='selected'";
    }
    s += ">" + propname + "</option>";
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

com.marklogic.widgets.sparqlbar.prototype._getParentPredicate = function(tid) {
  var top = null;
  // Find parent term object type
  var parent = this._parentterms[tid];
  if (null != parent && undefined != parent) {
    top = document.getElementById(this.container + "-sparqlbar-term-relationship-" + parent).value;
  }
  return top;
};

com.marklogic.widgets.sparqlbar.prototype._removeTerm = function(tid) {
  mljs.defaultconnection.logger.debug("_removeTerm: tid: " + tid);
  
  // find any children, and remove recursively
  var children = this._allterms[tid].children;
  for (var c = 0, max = children.length;c < max;c++) {
    this._removeTerm(children[c].tid); // TODO replace with splice for performance?
  }
  
  // remove ourselves from our parent
  var parentid = this._parentterms[tid];
  if (undefined != parentid) {
    var newc = new Array();
    var childs = this._allterms[parentid].children;
    for (var nc = 0, max = childs.length, child;nc < max;nc++) {
      child = childs[nc];
      if (child.tid != tid) {
        newc.push(child);
      }
      this._allterms[parentid].children = newc; // TODO replace with splice for performance?
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
  // TODO improve performance of this by checking if new selected value is different from current selected value, returning immediately if they are the same
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
    var val = document.getElementById(this.container + "-sparqlbar-term-oper-" + termid);
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
    
    this._refreshOperation(termid)
  }
};

com.marklogic.widgets.sparqlbar.prototype._refreshOperation = function(termid) {
    
    mljs.defaultconnection.logger.debug("refreshOperation: termid: " + termid);
    // lookup type to determine which operations to show, if any at all
    var propvalue = document.getElementById(this.container + "-sparqlbar-term-properties-" + termid).value;
    
    mljs.defaultconnection.logger.debug("refreshOperation: propvalue: " + propvalue);
    var parentid = this._parentterms[termid];
    var parententityname = "";
    if (undefined == parentid) {
      // get root top
      parententityname = document.getElementById(this.container + "-sparqlbar-what").value;
    } else {
      parententityname = document.getElementById(this.container + "-sparqlbar-term-relatedtype-" + parentid).value;
    }
    
    mljs.defaultconnection.logger.debug("Property Info: propvalue: " + propvalue + ", parentid: " + parentid + ", parententityname: " + parententityname);
    
    var scfg = this.semanticcontext.getConfiguration();
    
    // lookup predicate for property
    var entity = scfg.getEntityFromName(parententityname);
    mljs.defaultconnection.logger.debug("Property Info: entity: " + JSON.stringify(entity));
    var predinfo = scfg.getEntityProperty(entity,propvalue);
    
    mljs.defaultconnection.logger.debug("Property Info: predinfo: " + JSON.stringify(predinfo));
    
    if (undefined == predinfo.type) {
      var val = document.getElementById(this.container + "-sparqlbar-term-eq-" + termid);
      this._hidden(val,false);
      val = document.getElementById(this.container + "-sparqlbar-term-oper-" + termid);
      this._hidden(val,true);
    } else {
      // TODO support things other than just integer types
      var val = document.getElementById(this.container + "-sparqlbar-term-eq-" + termid);
      this._hidden(val,true);
      val = document.getElementById(this.container + "-sparqlbar-term-oper-" + termid);
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
  var scfg = this.semanticcontext.getConfiguration();
  for (var i = 0, max = termArray.length, tjson, twel, termWhat,termType,termRel,termPref,c,propentity,propname,propvalue,propinfo,termTypeObject;i < max;i++) {
    tjson = termArray[i];
    mljs.defaultconnection.logger.debug("_buildTerms: Got term json: " + JSON.stringify(tjson));
    // TODO support deleted terms (try catch)
    twel = document.getElementById(this.container + "-sparqlbar-term-what-" + tjson.tid);
    if (undefined != twel) {
      termWhat = twel.value;
      mljs.defaultconnection.logger.debug("_buildTerms: Processing term type: " + termWhat);
      
      if ("*" == termWhat) {
        termType = document.getElementById(this.container + "-sparqlbar-term-relatedtype-" + tjson.tid).value;
        termRel = document.getElementById(this.container + "-sparqlbar-term-relationship-" + tjson.tid).value;
        mljs.defaultconnection.logger.debug("_buildTerms: termRel: " + termRel + ", termType: " + termType);
        //console.log("termType: " + termType + ", termRel: " + termRel);
        if (undefined != termRel) {
          //var termPred = this._config._predicatesShort[termRel];
          termPred = scfg.getPredicateFromName(termRel);
          mljs.defaultconnection.logger.debug("_buildTerms: termPred: " + JSON.stringify(termPred));
          if (undefined != termPred) {
            c = counterObject.tc++;
            s += padding + "    ?" + what + " <" + termPred.iri + "> ?" + termType + c + " .\n" ;
            termTypeObject = scfg.getEntityFromName(termType);
            s += padding + "      ?" + termType + c + " rdfs:type <" + termTypeObject.rdfTypeIri + "> .\n";
            
            // TODO process child terms here
            if (tjson.children.length > 0) {
              mljs.defaultconnection.logger.debug("_buildTerms: Processing term pred children");
              s += this._buildTerms(termType + c,tjson.children,padding + "  ",counterObject);
            }
            
            s += padding /*+ "    } "*/;
          }
        }
      } else {
        // TODO property (=)
        propentity = scfg.getEntityFromName(this._getParentType(tjson.tid));
        propname = document.getElementById(this.container + "-sparqlbar-term-properties-" + tjson.tid).value;
        propvalue = document.getElementById(this.container + "-sparqlbar-term-value-" + tjson.tid).value;
        propinfo = scfg.getEntityProperty(propentity,propname);
          var proptype = "xs:string";
          if (undefined != propinfo.type) {
            proptype = propinfo.type;
          }
        
        var eloper = document.getElementById(this.container + "-sparqlbar-term-oper-" + tjson.tid);
        // check if hidden (disabled)
        if (eloper.getAttribute("class").split(" ").contains("hidden")) {
        
          s += padding + "    ?" + what + " <" + propinfo.iri + "> \"" + propvalue + "\"";
          if ("xs:string" == proptype) {
            if (undefined != this._lang) {
              s += "@" + this._lang; // TODO support I18N on string properties
            }
          } else {
            s += "^^<" + proptype + ">";
          } // TODO other types that require specific handling
        } else {
          // oper enabled
          var oper = eloper.value;
          var ouroper = "=";
          if ("!=" == oper) {
            ouroper = "!=";
          } else if ("lt" == oper) {
            ouroper = "<";
          } else if ("lte" == oper) {
            ouroper = "<=";
          } else if ("gt" == oper) {
            ouroper = ">";
          } else if ("gte" == oper) {
            ouroper = ">=";
          }
          // Add a filter command instead
          var rnd = "?a" + Math.floor(Math.random() * 100000);
          s += padding + "    ?" + what + " <" + propinfo.iri + "> " + rnd + " . \n";
          s += padding + "    FILTER (" + rnd + " " + ouroper + " \"" + propvalue + "\"^^<" + proptype + "> ) \n";
        }
        s += " .\n";
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
  
  this.semanticcontext = new mljs.defaultconnection.semanticcontext(); // TODO lazy load this is setSemanticContext is never called (unlikely)
  
  this.errorPublisher = new com.marklogic.events.Publisher();
  
  this.results = null; // JSON results object:- 
  // {"head":{"vars":["person"]},"results":{"bindings":[
  //    {"person":{"type":"uri","value":"http://marklogic.com/semantic/targets/person/Nathan%20Olavsky"}},
  //    {"person":{"type":"uri","value":"http://marklogic.com/semantic/targets/person/Abraham%20Troublemaker"}}
  // ]}}
  
  this._iriHandler = null;
  
  this._mode = "none";
  
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
  var s = "<div id='" + this.container + "-sparqlresults' class='mljswidget sparqlresults'>";
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
    
    if (this._mode != "none") {
      s += "<div><a href='#' id='" + this.container + "-loadContent'>Load related content</a></div>";
    }
    
    // process results, showing common information where appropriate
      // title - get name eventually
      var bindings = this.results.results.bindings;
      for (var b = 0,max = bindings.length, binding;b < max;b++) {
        binding = this.results.results.bindings[b];
        s += "<div id='" + this.container + "-sparqlresults-result-" + b + "' class='sparqlresults";
        if (null != this._iriHandler) {
          s += " sparqlresults-navigable";
        }
        s += "'><h3>" + (b + 1) + ". ";
        for (var et = 0, maxent = entities.length, entityValue;et < maxent;et++) {
          entityValue = binding[entities[et]];
          //s += entities[et] + " (" + entityValue.type + "): " + entityValue.value;
          s += "<span id='" + this.container + "-sparqlresults-result-" + b + "-summary'><i>Loading...</i></span>";
          irilinks.push({iri: entityValue.value, type: binding[entities[et]].type, elid: this.container + "-sparqlresults-result-" + b + "-summary"});
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
  var sh = com.marklogic.widgets.semantichelper;
  //var scfg = this.semanticcontext.getConfiguration();
  for (var i = 0, max = irilinks.length,link; i < max;i++) {
    link = irilinks[i];
    sh.summariseInto(this.semanticcontext,link.iri,link.type,link.elid,this._iriHandler);
  }
  
  if (this._mode != "none") {
    var contentLink = document.getElementById(this.container + "-loadContent");
    if (null != contentLink) {
      var self = this;
      contentLink.onclick = function(e) {self._provenance();e.stopPropagation();return false;};
    }
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


com.marklogic.widgets.sparqlresults.prototype.setProvenanceSparqlMentioned = function() {
  this._mode = "mentioned";
};

com.marklogic.widgets.sparqlresults.prototype._provenance = function() {
  mljs.defaultconnection.logger.debug("sparqlresults._provenance called");
  var sparql = "";
  if (undefined != this.results) {
    
    if (typeof this.results == "boolean" ) {
      return;
    } else {
      if (undefined != this.results.head && undefined != this.results.head.vars && undefined != this.results.results) {
        if (this._mode == "mentioned") {
          sparql = "SELECT ?docuri WHERE {\n";
          // get list of entities returned in search
          var entities = this.results.head.vars; // E.g. person, organisation - these are the returned variable bindings from the query
    
          // process results, showing common information where appropriate
          // title - get name eventually
          var first = true;
          var bindings = this.results.results.bindings;
          for (var b = 0,max = bindings.length, binding;b < max;b++) {
            binding = this.results.results.bindings[b];
            for (var et = 0, maxent = entities.length, entityValue;et < maxent;et++) {
              entityValue = binding[entities[et]];
              if (first) {
                first = false;
              } else {
                sparql += " UNION ";
              }
              sparql += " {<" + entityValue.value + "> <http://marklogic.com/semantics/ontology/mentioned_in> ?docuri . } \n";
            }
          }
      
          sparql += "}";
        }
  
        /*
        var sparql = this.provenanceSparql;
        if (undefined != sparql) {
          sparql = sparql.replace(/#IRI#/, this.iri);
        }*/
        this.semanticcontext.subjectContent(null,sparql);
  
  
      } else {
        return;
      }
    }
  }
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
  
  this.semanticcontext = new mljs.defaultconnection.semanticcontext(); // TODO lazy load if setSemanticContext not called
  
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
    this.iri = this.facts.subject;
    
    // if predicate exists, just update relevant section, otherwise refresh whole widget
    if (undefined == factsJson.predicate) {
      this._refresh(); 
    } else {
      // update name
      if (factsJson.predicate == "") {
        // TODO do something here
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
  var s = "<div id='" + this.container + "-entityfacts' class='mljswidget entityfacts'>";
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
  var scfg = this.semanticcontext.getConfiguration();
  
  if (this.facts != null && this.facts != undefined) {
    // get type: http://www.w3.org/1999/02/22-rdf-syntax-ns#type
    var type = null;
    for (var b = 0,bindings = this.facts.facts.results.bindings, max = bindings.length, predicate, object, binding;(null == type) && (b < max);b++) {
      binding = bindings[b];
      predicate = binding.predicate;
      if (undefined == predicate) {
        predicate = {value: this.facts.predicate};
      }
      object = binding.object;
      
      if (predicate.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
        type = object.value;
      }
    }
    mljs.defaultconnection.logger.debug("Got type: " + type);
    
    var entityInfo = scfg.getEntityFromIRI(type);
    mljs.defaultconnection.logger.debug("Got entity info: " + JSON.stringify(entityInfo));
    
    var entityName = entityInfo.name;
    mljs.defaultconnection.logger.debug("Got entity name: " + entityName);
    
    // get common name from config
    var namepredicate = scfg.getNameProperty(entityName).iri;
    mljs.defaultconnection.logger.debug("Got name predicate: " + namepredicate);
    var namevalue = null;
    for (var b = 0,bindings = this.facts.facts.results.bindings, max = bindings.length, predicate, object, binding;(null == namevalue) && (b < max);b++) {
      binding = bindings[b];
      predicate = binding.predicate;
      if (undefined == predicate) {
        predicate = {value: this.facts.predicate};
      }
      object = binding.object;
      
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
    for (var b = 0,bindings = this.facts.facts.results.bindings, max = bindings.length, predicate, obj, binding;(b < max);b++) {
      binding = bindings[b];
      predicate = binding.predicate;
      if (undefined == predicate) {
        predicate = {value: this.facts.predicate};
      }
      mljs.defaultconnection.logger.debug("OUR PREDICATE: " + JSON.stringify(predicate));
      var pinfo = scfg.getPredicateFromIRI(predicate.value);
      mljs.defaultconnection.logger.debug("OUR PINFO: " + JSON.stringify(pinfo));
      var obj = binding.object;
      mljs.defaultconnection.logger.debug("OUR OBJECT: " + JSON.stringify(obj));
      mljs.defaultconnection.logger.debug("OUR BINDING: " + JSON.stringify(binding));
      
      if (predicate.value != namepredicate && predicate.value != "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
        var title = predicate.value;
        if (undefined != pinfo) {
          title = pinfo.title;
        }
        s += "<p><b>" + title + ":</b> ";
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
  for (var i = 0, max = irilinks.length,link;i < max ;i++) {
    link = irilinks[i];
    this._summariseInto(link.iri,link.elid);
  }
  
  if (this.semanticcontext.hasContentContext()) {
    var self = this;
    var el = document.getElementById(this.container + "-contentlink");
    mljs.defaultconnection.logger.debug("CONTENTLINK: " + el);
    if (null != el) {
      mljs.defaultconnection.logger.debug("ADDING CLICK HANDLER TO CONTENTLINK");
      el.onclick = function() {self._provenance();};
    }
  }
};

com.marklogic.widgets.entityfacts.prototype._summariseInto = function(iri,elid) {
  //this.semanticcontext.getConfiguration().summariseInto(iri,elid,this._iriHandler);
  com.marklogic.widgets.semantichelper.summariseInto(this.semanticcontext,iri,"uri",elid,this._iriHandler);
};

/**
 * Updates the information shown about the entity with the specified IRI (executes a SPARQL query)
 *
 * @param {string} iri - The IRI of the object to show facts about
 **/
com.marklogic.widgets.entityfacts.prototype.updateEntity = function(iri) {
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

com.marklogic.widgets.entityfacts.prototype.setProvenanceSparqlMentioned = function() {
  this.provenanceSparql = "SELECT ?docuri WHERE {<#IRI#> <http://marklogic.com/semantics/ontology/mentioned_in> ?docuri .}";
};

com.marklogic.widgets.entityfacts.prototype._provenance = function() {
  mljs.defaultconnection.logger.debug("_provenance called for: " + this.facts.subjectIri);
  var sparql = this.provenanceSparql;
  if (undefined != sparql) {
    sparql = sparql.replace(/#IRI#/, this.iri);
  }
  this.semanticcontext.subjectContent(this.iri,sparql);
};


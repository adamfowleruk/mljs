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

/**
 * Calculates a list of unique subjects either from a REST sparql response results object, or from an array of s p o facts.
 * @param {object|Array} results - Either the REST SPARQL response object, or an array of simple subject, predicate, object fact values
 */
com.marklogic.widgets.semantichelper.calculateUniqueSubjects = function(results) {
  mljs.defaultconnection.logger.debug("semantichelper.calculateUniqueSubjects: results: " + JSON.stringify(results));
  var subjects = new Array();
  if (undefined == results) {
    return subjects;
  }
  // get list of all subjects (assume DISTINCT was used on subject in query)
  var bindings = [];
  if (undefined != results.results && undefined != results.results.bindings) {
    bindings = results.results.bindings;
  } else if (Array.isArray(results)) {
    // assume just spo
    bindings = results;
  }
  mljs.defaultconnection.logger.debug("semantichelper.calculateUniqueSubjects: Bindings: " + JSON.stringify(bindings));
  for (var b = 0,maxb = bindings.length,bin;b < maxb;b++) {
    bin = bindings[b];
    if (undefined != bin.subject) {
      var subject = null;
      if (undefined != bin.subject.value) {
        subject = bin.subject.value;
      } else {
        subject = bin.subject;
      }
      if (undefined != subject && !subjects.contains(subject)) {
        mljs.defaultconnection.logger.debug("semantichelper.calculateUniqueSubjects: Adding new subject: " + bin.subject.value);
        subjects.push(subject);
      }
    }
  }
  return subjects;
};


com.marklogic.widgets.semantichelper.summariseAllInto = function(ctx,iriHandler,irilinks) {
  var required = new Array(); // TODO make more granular - for large subjects
  // irilinks: [{iri: "", type: "", elid:""},...]

  var self = this;

  var redraw = function() {
    for (var i = 0, maxi = irilinks.length,link;i < maxi;i++) {
      link = irilinks[i];
      var si = ctx.getCachedFacts(link.iri);
      if (undefined == si) {
        if (!required.contains(link.iri)) {
          // add to needed list
          required.push(link.iri);
        }
      } else {
        var done = self._drawSummary(link,si,iriHandler);
        // if not done, save until facts arrive, and kick off facts
        if (!done) {
          if (!required.contains(link.iri)) {
            required.push(link.iri);
          }
        } else {
          // do nothing
        }
      }
    }
  };

  redraw();

  // loop through and get ones without requisite info (?s and ?p but no ?o, or name or type)
  // for remainder, add to query sparql
  // upon return, process remainder from cache
  // kick off sparql for all required

  var updateFactsHandler = {
    updateFacts: function(results) {
      // assume last in sequence (so cache filled)
      redraw();

      //ctx.unregister(updateFactsHandler); // TODO SORT THIS OUT SO WE DONT GET FLOODED BY UPDATES
    }
  };

  if (required.length > 0) {
    // create sparql
    var sparql = "SELECT DISTINCT ?subject ?predicate ?object WHERE {?subject ?predicate ?object . FILTER (";
    for (var i = 0,maxi = required.length,linkiri;i < maxi;i++) {
      linkiri = required[i];
      if (i > 0) {
        sparql += " || ";
      }
      sparql += " (?subject = <" + linkiri + ">) ";
    }
    sparql += " ) . }";

    ctx.register(updateFactsHandler);
    ctx.queryFacts(sparql);
  }
};

com.marklogic.widgets.semantichelper._drawSummary = function(irilink,si,iriHandler) {

  var addClickHandler = function(el,chiri) {
    mljs.defaultconnection.logger.debug("chel: " + el);
    mljs.defaultconnection.logger.debug("chiri: " + chiri);
    el.onclick = function(event) {
      iriHandler(chiri);
    };
  };

  var elid = irilink.elid;

  var sumsimple = function(subjectIri) {
    var theel = document.getElementById(elid);
    if (undefined != theel) {
      var s = "";
      if (null != iriHandler) {
        s += "<a href='#' id='" + elid + "-link'>";
      }
      s += subjectIri;
      if (null != iriHandler) {
        s += "</a>";
      }
      theel.innerHTML = s;
      var el = document.getElementById(elid + "-link");
      mljs.defaultconnection.logger.debug("elid: " + elid);
      mljs.defaultconnection.logger.debug("el: " + el);
      mljs.defaultconnection.logger.debug("subjectIri: " + subjectIri);
      addClickHandler(el,subjectIri);
    }
  };

    var el = document.getElementById(elid);
    if (undefined != el && null != si.nameString && null != si.typeNameString) {
      var cn = si.nameString;
      // display in appropriate element
      var s = "";
      if (null != iriHandler) {
        s += "<a href='#' id='" + elid + "-link'>";
      }
      s += cn + " <small>" + si.typeNameString + "</small>";

      if (null != iriHandler) {
        s += "</a>";
      }
      el.innerHTML = s;

      // add click handler function here to elid-link
      if (null != iriHandler) {
        var el = document.getElementById(elid + "-link");
        addClickHandler(el,irilink.iri);
      }

      return true;
    } else {
      sumsimple(irilink.iri);
    }
  return false;
};

/** @deprecated **/
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
  var addClickHandler = function(el,chiri) {
    mljs.defaultconnection.logger.debug("chel: " + el);
    mljs.defaultconnection.logger.debug("chiri: " + chiri);
    el.onclick = function(event) {
      iriHandler(chiri);
    };
  };

  var sumsimple = function(subjectIri) {
    var theel = document.getElementById(elid);
    if (undefined != theel) {
      var s = "";
  	  if (null != iriHandler) {
  	    s += "<a href='#' id='" + elid + "-link'>";
  	  }
  	  s += subjectIri;
  	  if (null != iriHandler) {
  	    s += "</a>";
  	  }
      theel.innerHTML = s;
      var el = document.getElementById(elid + "-link");
      mljs.defaultconnection.logger.debug("elid: " + elid);
      mljs.defaultconnection.logger.debug("el: " + el);
      mljs.defaultconnection.logger.debug("subjectIri: " + subjectIri);
      addClickHandler(el,subjectIri);
    }
  };


  ts += " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?rdftype . } LIMIT 1";
  mljs.defaultconnection.logger.debug("TS: " + ts);
  mljs.defaultconnection.sparql(ts,function(result) {
    if (result.inError) {
      // TODO publish error
      sumsimple(lookupIri);
    } else {
      mljs.defaultconnection.logger.debug("semantichelper.summariseInto: TYPERESPONSE: " + JSON.stringify(result.doc));
      var firstbinding = result.doc.results.bindings[0];
      if (undefined != firstbinding) {


        var entityinfo = ctx.getTripleConfiguration().getEntityFromIRI(firstbinding.rdftype.value);
        mljs.defaultconnection.logger.debug("semantichelper.summariseInto: entityInfo: " + JSON.stringify(entityinfo));
        var nameprop = ctx.getTripleConfiguration().getNameProperty(entityinfo.iri).iri;
        mljs.defaultconnection.logger.debug("semantichelper.summariseInto: nameprop: " + nameprop);
        if (undefined == nameprop) {
          sumsimple(lookupIri);
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
              sumsimple(lookupIri);
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
                    var el = document.getElementById(elid + "-link");
                    addClickHandler(el,lookupIri);
                  }
                } else {
                  sumsimple(lookupIri);
                }
              } else {
                mljs.defaultconnection.logger.debug("This query returns no bindings (results): " + ts);
                mljs.defaultconnection.logger.debug("Result instead: " + JSON.stringify(result2.doc));
                sumsimple(lookupIri);
              } // end if bindings undefined / empty
            }
          });
        } // end if else nameprop has property map
      } else {
        sumsimple(lookupIri);
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

  this.semanticcontext = mljs.defaultconnection.createSemanticContext();

  this._config = {
    // These are so we only update with the suggestions we care about
    suggestionsEnabled: true,
    uggestionMinimumCharacters: 3,
    suggestionRdfTypeIri: null,
    suggestionPredicateIri: null,
    suggestionDestinationElementId: null,
    lang: "en"
  };

  this.terms = 0;

  //this._config = this.db.createSemanticConfig();

  this._hierarchy = new Array(); // [{tid: 1, children: [{tid: 2, children:[]}, ...]}, ....]
  this._allterms = new Array(); // plain array, [tid] => JSON as above
  this._parentterms = new Array(); // [childid] = parentid

  //this.resultsPublisher = new com.marklogic.events.Publisher();
  this.errorPublisher = new com.marklogic.events.Publisher();

  this.refresh();
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.sparqlbar.getConfigurationDefinition = function() {
  return {
    suggestionsEnabled: {type: "boolean", default: "true", title: "Enabled", description: "Do we lookup suggestions for intrinsic fields?"},
    suggestionRdfTypeIri: {type: "string", default: null, title: "RDF Type IRI", description: "RDF Type to lookup suggestions from."},
    suggestionPredicateIri: {type: "string", default: null, title: "Predicate IRI", description: "Suggestion full predicate Iri."},
    suggestionDestinationElementId: {type: "string", default: null, title: "Destination Element Id", description: "Which element, if any, to send suggestion outputs to."},
    lang: {type: "string", default: "en", title: "Language", description: "Default 2 character language for string elements."}
  };
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.sparqlbar.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }

  // refresh display
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
  if (undefined != suggestions && suggestions.rdfTypeIri == this._config.suggestionRdfTypeIri && suggestions.predicate == this._config.suggestionPredicateIri) {
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
        if (null != self._config.suggestionDestinationElementId && ""!=self._config.suggestionDestinationElementId) {
          document.getElementById(self._config.suggestionDestinationElementId).value = suggestion;
        }
        // hide suggestions box
        self._hidden(elss,true);

        // disable suggestions
        self._config.suggestionRdfTypeIri = null;
        self._config.suggestionPredicateIri = null;
        self._config.suggestionDestinationElementId = null;

        e.stopPropagation();
        return false;
      }
    };
    for (var l = 0, max = links.length;l < max;l++) {
      addClickHandler(document.getElementById(this.container + "-sparqlbar-suggestion-" + links[l].index),links[l].suggestion);
    }

    var nosug = document.getElementById(this.container + "-sparqlbar-nosuggestion");
    if (null != nosug) {
      nosug.onclick = function(e) {
        self._hidden(elss,true);

        // disable suggestions
        self._config.suggestionRdfTypeIri = null;
        self._config.suggestionPredicateIri = null;
        self._config.suggestionDestinationElementId = null;

        e.stopPropagation();
        return false;
      };
    }

  }
};


com.marklogic.widgets.sparqlbar.prototype.updateOntology = function(tripleconfig) {
  this.refresh(); // TODO use this TC rather than load from semantic context
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
  var ents = this.semanticcontext.getTripleConfiguration()._newentities;
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
  s += "</select> which <a class='sparqlbar-add-link' id='" + this.container + "-sparqlbar-add-link' href='#'><span title='Add child term' class='glyphicon glyphicon-plus sparqlbar-add'> </span></a></div>";

  // criteria
  //  - predicate list
  //  - interactive IRI suggestion list (base on what searching for and predicate value selected)
  // include general 'has a relationship with type'

  s += "<div id='" + this.container + "-sparqlbar-terms' class='sparqlbar-terms'></div>";

  s += "<div><button type='submit' class='btn btn-primary sparqlbar-button' id='" + this.container + "-sparqlbar-button'>Search</button></div>";

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
    // remove all children first
    self._removeChildTerms();
  };

  // add first term
  this._addTerm();
};

com.marklogic.widgets.sparqlbar.prototype._removeChildTerms = function(parentid) {
  var childTerms = new Array();
  if (undefined != parentid) {
    // TODO change childTerms to be more selective
    var childTermIds = new Array();
    for (var item in this._parentterms) {
      if (this._parentterms[item] == parentid) {
        console.log("adding child id: " + item);
        childTermIds.push(item);
      }
    }

    //childTerms = new Array();
    for (var i = 0,maxi = childTermIds.length,item;i < maxi;i++) {
      item = childTermIds[i];
      for (var ati = 0,maxati = this._allterms.length,atitem;ati < maxati;ati++) {
        atiitem = this._allterms[ati];
        if (undefined != atiitem && atiitem.tid == item) {
          console.log("adding term to remove: " + item);
          childTerms.push(atiitem);
        }
      }
    }
  } else {
    // remove first term - it's invalid! (tis the thing to find, not a term)
    for (var ati = 1,maxati = this._allterms.length,atitem;ati < maxati;ati++) {
      atiitem = this._allterms[ati];
      childTerms.push(atiitem);
    }
  }

  for (var i = childTerms.length - 1;i >= 0;i--) {
    //self._updateTerm(self._allterms[i].tid);
    var term = childTerms[i];
    if (undefined != term) {
      this._removeTerm(term.tid);
    }
  }

  // then call addTerm();
  if (undefined == parentid) {
    this._addTerm(parentid);
  }
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
  var ents = this.semanticcontext.getTripleConfiguration()._newentities
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
  s += " <a href='#' id='" + this.container + "-sparqlbar-term-" + tid + "-remove'><span class='glyphicon glyphicon-minus sparqlbar-term-remove' title='Remove term'> </span></a> ";
  s += "<a href='#' id='" + this.container + "-sparqlbar-term-" + tid + "-addchild'><span title='Add child term' id='" + this.container + "-sparqlbar-term-" + tid + "-addspan' class='glyphicon glyphicon-plus sparqlbar-term-addchild'> </span></a>";
  s += "<div id='" + this.container + "-sparqlbar-term-" + tid + "-children' class='sparqlbar-term'></div>";
  s += "</div>";

  //console.log("Adding html: " + s);

  if (undefined == parentid) {
    com.marklogic.widgets.appendHTML(document.getElementById(this.container + "-sparqlbar-terms"),s);
  } else {
    com.marklogic.widgets.appendHTML(document.getElementById(this.container + "-sparqlbar-term-" + parentid + "-children"),s);
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
    self._removeChildTerms(tid);
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
    var scfg = this.semanticcontext.getTripleConfiguration();
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
    /*
    if (undefined == el.onblur) {
      var self = this;
      el.onblur = function(e) {
        self._hidden(suggestel,true);
        el.onblur = undefined;
      };
    }*/

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
  var config = this.semanticcontext.getTripleConfiguration();
  var rels = config.getValidPredicates(parentType,me);
  for (var i = 0, max = rels.length, rel; i < max;i++) {
    rel = rels[i];
    // get rel title
    var relinfo = config.getPredicateFromIRI(rel);
    //mljs.defaultconnection.logger.debug("_updateRelationships: Showing rel: " + JSON.stringify(relinfo));
    s += "<option value='" + rel + "'";
    if (0 == i) {
      s += " selected='selected'";
    }
    s += ">" + relinfo.title + "</option>";
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
  var parentInfo = this.semanticcontext.getTripleConfiguration().getEntityFromName(parentType);
  mljs.defaultconnection.logger.debug("_updateProperties: from PARENT: " + parentType);

  var s = "";
  var props = parentInfo.properties; // this._config._properties[parentType];
  for (var i = 0, max = props.length, propname; i < max;i++) {
    propname = props[i].name;
    s += "<option value='" + propname + "'";
    if (0 == i) {
      s += " selected='selected'";
    }
    s += ">" + (props[i].title || propname) + "</option>";
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
  var el = document.getElementById(this.container + "-sparqlbar-term-what-" + termid);
  if (undefined == el) {
    return;
  }
  var what = el.value;
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

    var scfg = this.semanticcontext.getTripleConfiguration();

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
    var entity = this.semanticcontext.getTripleConfiguration().getEntityFromIRI(what);
    s += "SELECT distinct ?" + entity.variable + " WHERE {\n" + "  ?" + entity.variable + " rdfs:type <" + entity.iri + "> .\n";

    // build out top level terms
    s += this._buildTerms(entity.variable,this._hierarchy,"",{tc: 1});

    s += "}";
  }
  //s += " LIMIT 20";
  mljs.defaultconnection.logger.debug("Generated SPARQL: " + s);
  return s;
};

com.marklogic.widgets.sparqlbar.prototype._buildTerms = function(what,termArray,padding,counterObject) {
  var s = "";
  var scfg = this.semanticcontext.getTripleConfiguration();
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
        termTypeObject = scfg.getEntityFromIRI(termType);
        termRel = document.getElementById(this.container + "-sparqlbar-term-relationship-" + tjson.tid).value;
        mljs.defaultconnection.logger.debug("_buildTerms: termRel: " + termRel + ", termType: " + termType);
        //console.log("termType: " + termType + ", termRel: " + termRel);
        if (undefined != termRel) {
          //var termPred = this._config._predicatesShort[termRel];
          termPred = scfg.getPredicateFromIRI(termRel);
          mljs.defaultconnection.logger.debug("_buildTerms: termPred: " + JSON.stringify(termPred));
          if (undefined != termPred) {
            c = counterObject.tc++;
            s += padding + "    ?" + what + " <" + termPred.iri + "> ?" + termTypeObject.variable + c + " .\n" ;
            s += padding + "      ?" + termTypeObject.variable + c + " rdfs:type <" + termTypeObject.iri + "> .\n";

            // TODO process child terms here
            if (tjson.children.length > 0) {
              mljs.defaultconnection.logger.debug("_buildTerms: Processing term pred children");
              s += this._buildTerms(termTypeObject.variable + c,tjson.children,padding + "  ",counterObject);
            }

            s += padding /*+ "    } "*/;
          }
        }
      } else {
        // TODO property (=)
        propentity = scfg.getEntityFromIRI(this._getParentType(tjson.tid));
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
            if (undefined != this._config.lang) {
              s += "@" + this._config.lang; // TODO support I18N on string properties
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

  this.semanticcontext = mljs.defaultconnection.createSemanticContext(); // TODO lazy load this is setSemanticContext is never called (unlikely)

  this.errorPublisher = new com.marklogic.events.Publisher();

  this.results = null; // JSON results object:-
  // {"head":{"vars":["person"]},"results":{"bindings":[
  //    {"person":{"type":"uri","value":"http://marklogic.com/semantic/targets/person/Nathan%20Olavsky"}},
  //    {"person":{"type":"uri","value":"http://marklogic.com/semantic/targets/person/Abraham%20Troublemaker"}}
  // ]}}

  var self = this;
  this._iriHandler = function(iri) {
    // load subject facts based on iri
    self.semanticcontext.subjectFacts(iri);
  };

  this._config = {
    mode: "none"
  };

  //this._config = this.db.createSemanticConfig();

  this._refresh();
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.sparqlresults.getConfigurationDefinition = function() {
  return {
    mode: {type: "enum", default: "none", title: "Mode", description: "What mode are we in? Determines next action/links on page.",
      options: [
        {value: "none", title: "None", description: "No links shown."},
        {value: "mentioned", title: "Mentioned In", description: "Show link to documents where this Subject was mentioned in."},
        {value: "versionRendered", title: "Rendered Version", description: "Show link to versioned rendered documents where this Subject was mentioned in."}
      ]
    }
  };
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.sparqlresults.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }

  // refresh display
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

com.marklogic.widgets.sparqlresults.prototype.explore = function(link) {
  this._exploreLink = link;
};

com.marklogic.widgets.sparqlresults.prototype._refresh = function() {
  var s = "<div id='" + this.container + "-sparqlresults' class='mljswidget panel panel-info sparqlresults'>";
  s += "<div class='title panel-heading sparqlresults-title'>Subject Search Results</div>";
  s += "<div class='panel-body sparqlresults-content'>";
  s += "<div class='list-group'>"

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

    if (this._config.mode != "none") {
      s += "<div><a href='#' id='" + this.container + "-loadContent'>Load related content</a></div>";
    }
    if (this._exploreLink != null) {
      s += "<div><a href='#' id='" + this.container + "-explore'>Explore</a></div>";
    }

    // process results, showing common information where appropriate
      // title - get name eventually
      var bindings = this.results.results.bindings;
      if (0 == bindings.length) {
        s += "<div class='list-group-item sparqlresults-results'>No Results</div>";
      }
      for (var b = 0,max = bindings.length, binding;b < max;b++) {
        binding = this.results.results.bindings[b];
        s += "<div id='" + this.container + "-sparqlresults-result-" + b + "' class='list-group-item sparqlresults-result"; // change this to an a tag?
        if (null != this._iriHandler) {
          s += " sparqlresults-navigable";
        }
        s += "'><h4>" + (b + 1) + ". ";
        for (var et = 0, maxent = 1 /*entities.length*/, entityValue;et < maxent;et++) { // TODO FIGURE OUT WHY THREE ARE HERE??? DUPLICATES???
          entityValue = binding[entities[et]];
          //s += entities[et] + " (" + entityValue.type + "): " + entityValue.value;
          s += "<span id='" + this.container + "-sparqlresults-result-" + b + "-summary'><i>Loading...</i></span>";
          irilinks.push({iri: entityValue.value, type: binding[entities[et]].type, elid: this.container + "-sparqlresults-result-" + b + "-summary"});
        }
        s += "</h4></div>";
      }
    }
   }
  } else {
    s += "<i>No results</i>";
  }

  s += "</div></div></div>";

  document.getElementById(this.container).innerHTML = s;

  // click handlers
  var sh = com.marklogic.widgets.semantichelper;
  //var scfg = this.semanticcontext.getTripleConfiguration();
  //for (var i = 0, max = irilinks.length,link; i < max;i++) {
  //  link = irilinks[i];
  //  sh.summariseInto(this.semanticcontext,link.iri,link.type,link.elid,this._iriHandler);
  //}
  sh.summariseAllInto(this.semanticcontext,this._iriHandler,irilinks);

  if (this._config.mode != "none") {
    var contentLink = document.getElementById(this.container + "-loadContent");
    if (null != contentLink) {
      var self = this;
      contentLink.onclick = function(e) {self._provenance();e.stopPropagation();return false;};
    }
  }
  if (this._exploreLink != null) {
    var explore = document.getElementById(this.container + "-explore");
    if (null != explore) {
      var self = this;
      explore.onclick = function(e) {window.location = self._exploreLink;e.stopPropagation();return false;};
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
  this._config.mode = "mentioned";
  this._refresh();
};

com.marklogic.widgets.sparqlresults.prototype.setProvenanceVersionRendered = function() {
  this._config.mode = "versionRendered";
  this._refresh();
};

com.marklogic.widgets.sparqlresults.prototype.setProvenanceNone = function() {
  this._config.mode = "none";
  this._refresh();
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
              console.log("PROV et: " + et + ", ent: " + entities[et] + ", entityValue: " + entityValue);
              if (first) {
                first = false;
              } else {
                sparql += " UNION ";
              }
              sparql += " {<" + entityValue.value + "> <http://marklogic.com/semantics/ontology/mentioned_in> ?dociri . ?dociri <http://marklogic.com/semantics/ontology/Document#uri> ?docuri . } \n";
            }
          }

          sparql += "}";
        } else if ("versionRendered"==this._mode) {
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
              sparql += " {<" + entityValue.value + "> <http://marklogic.com/ontology/has_version> ?ver . \n";
              sparql += "?ver <http://marklogic.com/ontology/xmlRendering> ?docuri . } \n";
            }
          }

          sparql += "}";
		    } // TODO ADD W3C PROVO PROVENANCE AS A SOURCE - derivedFrom

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

  this.semanticcontext = mljs.defaultconnection.createSemanticContext(); // TODO lazy load if setSemanticContext not called

  this._config = {
    mode: "selectedsubject",
    explorerUrlSpec: null
  };

  this.loading = false;

  var self = this;

  this._defaultIriHandler = function(iri) {
    // show new subject inside this same widget by using subjectQuery
    self.semanticcontext.subjectQuery(
      "select * where {?subject ?predicate ?object . FILTER (?subject = <" + iri + ">) . }",0,1000);
  };

  this._iriHandler = this._defaultIriHandler; // TODO check if actually used anywhere

  this.facts = null;

  this._options = "";

  //this._config = this.db.createSemanticConfig();

  this._customIriHandlers = new Array(); // IRI -> urlspec #IRI#

  this._lastDocumentLookupUri = null; // last document that semantic facts were looked up for - prevents double requests from multiple route to this function

  //this._contentWidget = null; // JS content results widget to update with fact provenance content

  this.reverse = false;

  this._nextID = 1;

  this._refresh();
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.entityfacts.getConfigurationDefinition = function() {
  return {/*
    iriHandler: {type: "string", default:null,title:"IRI Handler",
      description:"The IRI Click handler. Use #IRI# in the URL to open that page with a IRI link when clicked."
    },*/
    mode: {type: "enum",default: "selectedsubject", title: "Display Mode",
      options: [
        {value: "selectedsubject", title: "Selected Subject", description: "The current selected subject in the semantic context."},
        {value: "firstsubject", title: "First Mentioned", description: "Show facts for first subject mentioned in a document via search context search results."},
        {value: "allsubjects", title: "All Mentioned", description: "Show facts about all subjects mentioned in a document via search context search results."}
      ]
    },
    explorerUrlSpec: {type: "string",default: null, title:"Explorer IRI Handler"}
  };
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.entityfacts.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }

  // refresh display
  this._refresh();
};

com.marklogic.widgets.entityfacts.prototype.setSemanticContext = function(sc) {
  this.semanticcontext = sc;
};

com.marklogic.widgets.entityfacts.prototype.updateResults = function(results) {
  if (true === results || false === results) {
    this.loading = results;
    if (this._config.mode != "selectedsubject") { // hide all facts
      this.facts = null;
    }
    this._refresh();
    return;
  }
  this.loading = false;
  if (undefined != results && undefined != results.results && results.results.length > 0) {
    this._lookupDocumentFacts(results.results[0].uri); // first uri
  } else {
    this._refresh();
  }
};

com.marklogic.widgets.entityfacts.prototype.updateResultSelection = function(newsel) {
  this._lookupDocumentFacts(newsel[0]); // first uri
};

com.marklogic.widgets.entityfacts.prototype.updateResultHighlight = function(newsel) {
  this._lookupDocumentFacts(newsel[0]); // first uri
};

com.marklogic.widgets.entityfacts.prototype.updateDocumentSelection = function(newsel) {
  this._lookupDocumentFacts(newsel[0]); // first uri
};

com.marklogic.widgets.entityfacts.prototype.setModeAllMentioned = function() {
  this._config.mode = "allsubjects";
};

com.marklogic.widgets.entityfacts.prototype.setModeFirstMentioned = function() {
  this._config.mode = "firstsubject";
};

com.marklogic.widgets.entityfacts.prototype.setModeSelected = function() {
  this._config.mode = "selectedsubject";
};

com.marklogic.widgets.entityfacts.prototype._lookupDocumentFacts = function(docuri) {
  if (docuri == this._lastDocumentLookupUri) {
    return;
  }
  this._lastDocumentLookupUri = docuri;

  //this._config.mode = "allsubjects"; // or "selectedsubject" or 'firstsubject'

  // TODO MAKE THIS THE SUBJECT MENTIONED IN THE DOCUMENT, NOT THE DOCUMENT ITSELF

  // 1. lookup subject list
  var subjectSparql = "select DISTINCT ?subject where {?d <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://marklogic.com/semantics/ontology/Document> . ";
  subjectSparql += "     ?d <http://marklogic.com/semantics/ontology/Document#uri> \"" + docuri + "\"@en . ";
  subjectSparql += "     ?d <http://marklogic.com/semantics/ontology/mentions> ?subject . }";
  this.semanticcontext.subjectQuery(subjectSparql,0,10);

  // 2. lookup subject facts (for all)

  //var where = "select ?subject ?predicate ?object where {";
  //where = "     ?subject ?predicate ?object .";
  //var where = "     ?d <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://marklogic.com/semantics/ontology/Document> . ";
  //where += "     ?d <http://marklogic.com/semantics/ontology/Document#uri> \"" + docuri + "\"@en . ";
  //where += "     ?d <http://marklogic.com/semantics/ontology/mentions> ?subject .";
  //sparql += "   }";

  //var sparql = "select ?p ?o where {";
  //sparql += "     ?s a <http://marklogic.com/semantics/ontology/Document> . ";
  //sparql += "     ?s <http://marklogic.com/semantics/ontology/Document#uri> '" + docuri + "'@en . ";
  //sparql += "     ?s ?p ?o .";
  //sparql += "   }";

  //this.semanticcontext.getFactsWhere(where);
};

com.marklogic.widgets.entityfacts.prototype.updateSubjectResults = function(results) {
  if (false === results || true === results) {
    // clear list of facts
    this.loading = results;
    this.facts = null;
    this._refresh();
    return;
  }
  this.loading = false;
  // called when list of subjects returned
  var subjects = com.marklogic.widgets.semantichelper.calculateUniqueSubjects(results);

  var sparql = null;
  // loop through results and get unique subject IRIs
  if (subjects.length > 0) {
    mljs.defaultconnection.logger.debug("entityfacts.updateSubjectResults: Mode: " + this._config.mode);
    if ("allsubjects" == this._config.mode) {
      sparql = " FILTER ("
      for (var s = 0,maxs = subjects.length,sub;s < maxs;s++) {
        if (s > 0) {
          sparql += " || ";
        }
        sub = subjects[s];
        sparql += " (?subject = <" + sub + "> ) ";
      }
      sparql += ") .";
    } else if ("firstsubject" == this._config.mode) {
      sparql = " FILTER (?subject = <" + subjects[0] + "> ) .";
    } else {
      // "selectedsubject" - do nothing until we see a subjectFacts call
    }
  } else {
    this.facts = null;
    this._refresh();
  }
  if (null != sparql) {
    this.semanticcontext.getFactsWhere(sparql);
  }
};

com.marklogic.widgets.entityfacts.prototype.explorerLink = function(urlspec) {
  this._config.explorerUrlSpec = urlspec;
};

com.marklogic.widgets.entityfacts.prototype.updateSubjectFacts = function(factsJson) {
  if ("object" == typeof factsJson) {
    mljs.defaultconnection.logger.debug("entityfacts.updateSubjectFacts: Facts: " + JSON.stringify(factsJson));

    // list these facts
    this.facts = factsJson;
    this.loading = false;
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
  var s = "<div id='" + this.container + "-entityfacts' class='mljswidget panel panel-info entityfacts'>";
  if (this.reverse) {
    s += "<div class='title panel-heading entityfacts-title'>Entity Links</div>";
    s += "<div id='" + this.container + "-entityfacts-facts' class='panel-body entityfacts-content'>";
  } else {
    s += "<div class='title panel-heading entityfacts-title'>Entity Facts</div>";
    s += "<div id='" + this.container + "-entityfacts-facts' class='panel-body entityfacts-content'>";
  }


  var irilinks = new Array();
  var iriclicklinks = new Array();
  // LIST SUBJECT(s) FACTS

  if (this.facts != null && this.facts != undefined) {
    var subjects = com.marklogic.widgets.semantichelper.calculateUniqueSubjects(this.facts);

    var maxs = subjects.length;
    if (0 == maxs && this.loading === false) {
      s += "<div class='entityfacts-results'>No Results</div>";
    }
    for (var su = 0,sub;su < maxs;su++) {
      sub = subjects[su];
      mljs.defaultconnection.logger.debug("entityfacts._refresh: Processing subject facts for: " + sub);

      if (su > 0) {
        s += "<hr />";
      }

      s += this._generateSubjectHTML(sub,irilinks,iriclicklinks);
    }
  } else {
    if (this.loading === false) {
      s += "<div class='entityfacts-results'>No Results</div>";
    }
  }
  if (this.loading === true) {
    s += com.marklogic.widgets.bits.loading(this.container + "-loading");
  }
  s += "</div></div>";

  document.getElementById(this.container).innerHTML = s;

  // event handlers and lazy loading
  // lazy load related entity summaries
  //for (var i = 0, max = irilinks.length,link;i < max ;i++) {
  //  link = irilinks[i];
  //  this._summariseInto(link.iri,link.elid);
  //}
  com.marklogic.widgets.semantichelper.summariseAllInto(this.semanticcontext,this._iriHandler,irilinks);

  var self = this;
  if (this.semanticcontext.hasContentContext()) {
    /*
    var el = document.getElementById(this.container + "-contentlink"); // TODO support multiple subjects with own content links
    mljs.defaultconnection.logger.debug("CONTENTLINK: " + el);
    if (null != el) {
      mljs.defaultconnection.logger.debug("ADDING CLICK HANDLER TO CONTENTLINK");
      el.onclick = function() {self._provenance();};
    }
    */

    var addClickHandler = function(iri,elid) {
      var el = document.getElementById(elid);
      el.onclick = function(evt) {
        // do provenance for this iri
        self._provenance(iri);

        evt.stopPropagation();
        return false;
      };
    };

    for (var i = 0,maxi = iriclicklinks.length,cl;i < maxi;i++) {
      cl = iriclicklinks[i];
      addClickHandler(cl.iri,cl.elid);
    }
  }
};


com.marklogic.widgets.entityfacts.prototype._generateSubjectHTML = function(sub,irilinks,iriclicklinks) {
  var scfg = this.semanticcontext.getTripleConfiguration();
  var s = "";

  // get type: http://www.w3.org/1999/02/22-rdf-syntax-ns#type
  var type = null;
  for (var b = 0,bindings = this.facts.results.bindings, max = bindings.length, predicate, object, binding;(null == type) && (b < max);b++) {
    binding = bindings[b];
    if (undefined != binding.subject && binding.subject.value == sub) {
      predicate = binding.predicate;
      if (undefined == predicate) {
        predicate = {value: this.facts.predicate};
      }
      object = binding.object;

      if (predicate.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
        type = object.value;
      }
    }
  }
  mljs.defaultconnection.logger.debug("Got type: " + type);

  var entityInfo = scfg.getEntityFromIRI(type);
  mljs.defaultconnection.logger.debug("Got entity info: " + JSON.stringify(entityInfo));

  var entityName = entityInfo.name;
  mljs.defaultconnection.logger.debug("Got entity name: " + entityName);

  // get common name from config
  var nameprop = scfg.getNameProperty(entityName);
  var namevalue = null;
  if (undefined != nameprop) {
    var namepredicate = nameprop.iri;
    mljs.defaultconnection.logger.debug("Got name predicate: " + namepredicate);
    for (var b = 0,bindings = this.facts.results.bindings, max = bindings.length, predicate, object, binding;(null == namevalue) && (b < max);b++) {
      binding = bindings[b];
      if (undefined != binding.subject) {
        if (binding.subject.value == sub) {
          predicate = binding.predicate;
          if (undefined == predicate) {
            predicate = {value: this.facts.predicate};
          }
          object = binding.object;

          if (predicate.value == namepredicate) {
            namevalue = object.value;
          }
        }
      }
    }
  } else { // nameprop else
    mljs.defaultconnection.logger.debug("WARNING: Class with no name predicate: " + entityName);
  }
  mljs.defaultconnection.logger.debug("Got name value: " + namevalue);

  s += "<div class='mljsResultDefaultResult'>";
  //var objectinfo = this._config.getEntityFromIRI(type);
  s += "<div class='h4'>" + namevalue + " <span class='small'>" + entityInfo.title + "</span>";

  if (this.semanticcontext.hasContentContext()) {
    var iriclickid = this.container + "-contentlink-" + this._nextID++;
    iriclicklinks.push({iri: sub, elid: iriclickid});
    s += " <a href='#' id='" + iriclickid + "'><span class='glyphicon glyphicon-file' title='Load related content'> </span></a>";
  }
  if (this._config.explorerUrlSpec != null) {
    // show facts explorer link with #IRI# in it
    s += " <a href='";
    s += this._config.explorerUrlSpec.replace("#IRI#",encodeURI(sub)); // replace #IRI# with THIS subject's IRI
    s += "' id='" + this.container + "-explorerlink-" + (this._nextID++) + "'><span class='glyphicon glyphicon-eye-open' title='Explore Subject links'> </span></a>";
  }
  s += "</div>";

  // TODO publish non IRIs first
  // TODO publish IRIs as links
  for (var b = 0,bindings = this.facts.results.bindings, max = bindings.length, predicate, obj, binding;(b < max);b++) {
    binding = bindings[b];
    if (undefined != binding.subject && binding.subject.value == sub) {
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
  s += "</div>"; // result div
  return s;
};
/*
com.marklogic.widgets.entityfacts.prototype._summariseInto = function(iri,elid) {
  //this.semanticcontext.getTripleConfiguration().summariseInto(iri,elid,this._iriHandler);
  com.marklogic.widgets.semantichelper.summariseInto(this.semanticcontext,iri,"uri",elid,this._config.iriHandler);
};*/

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
  this.provenanceSparql = "SELECT ?docuri WHERE {<#IRI#> <http://marklogic.com/semantics/ontology/mentioned_in> ?dociri . ?dociri <http://marklogic.com/semantics/ontology/Document#uri> ?docuri . }";
};

com.marklogic.widgets.entityfacts.prototype._provenance = function(iri) {
  mljs.defaultconnection.logger.debug("_provenance called for: " + iri);
  var sparql = this.provenanceSparql;
  if (undefined != sparql) {
    sparql = sparql.replace(/#IRI#/, iri);
  }
  this.semanticcontext.subjectContent(iri,sparql);
};















com.marklogic.widgets.workplaceadminext = window.com.marklogic.widgets.workplaceadminext || {};
com.marklogic.widgets.workplaceadminext.widgets = window.com.marklogic.widgets.workplaceadminext.widgets || {};
com.marklogic.widgets.workplaceadminext.widgets["widget-triples.js"] = [
  {title: "Keylines", classname: "com.marklogic.widgets.keylines", description: "Keylines semantic graph explorer."}
];

com.marklogic.widgets.keylines = function(container) {
  this.container = container;

  this._config = {

  };

  this.sc = null;

  this._kldata = [];
  this._chart = null;

  this._init();
};
/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.keylines.getConfigurationDefinition = function() {
  return {
  };
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.keylines.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }

  // refresh display
  this._refresh();
};

com.marklogic.widgets.keylines.prototype.setSemanticContext = function(sc) {
  this.sc = sc;
};

com.marklogic.widgets.keylines.prototype.drawSubject = function(iri) {
  this.sc.getFacts(subjectIri,false);
};

com.marklogic.widgets.keylines.prototype._init = function() {
  var s = "<div id='" + this.container + "-outer' class='mljswidget keylines'><div class='keylines-inner'><div id='" + this.container + "-kl' style='height: 800px;'></div></div></div>";
  document.getElementById(this.container).innerHTML = s;
};

com.marklogic.widgets.keylines.prototype._refresh = function() {
  var self = this;
  KeyLines.create(this.container + '-kl', function(err, chart) {
    self._chart = chart;
          chart.load({
            type: 'LinkChart',
            items: self._kldata
          });
        });
};


com.marklogic.widgets.keylines.prototype.updateSubjectFacts = function(result) {
  if (true === result || false === result) {
    return; // TODO clear display
  }
  mljs.defaultconnection.logger.debug("keylines.updateSubjectFacts: " + JSON.stringify(result));
  var subjects = com.marklogic.widgets.semantichelper.calculateUniqueSubjects(result);

  // get parentiri, subjectiri, rdftype and group facts to these three
  // find relevant parent-subject iri nodes on the display
  // update this particular data node
  var facts = this.sc.getCachedFacts(subjects[0]).facts
  //this.propertyCache[subjects[0]] = facts;
  this._drawSubjectDetail(subjects[0],facts);
};

com.marklogic.widgets.keylines.prototype._getSubject = function(iri) {
  for (var k = 0,maxk = this._kldata.length,kld;k < maxk;k++) {
    kld = this._kldata[k];
    if (kld.id == iri) {
      return kld;
    }
  }
  return null;
};

com.marklogic.widgets.keylines.prototype._getLink = function(subjectIri,predicateIri,objectIri) {
  var iri = subjectIri + "^^^" + predicateIri + "^^^" + objectIri;
  return this._getSubject(iri);
};

com.marklogic.widgets.keylines.prototype.updateOntology = function(tc) {
  if (undefined != this._lastSubject) {
    this._drawSubjectDetail(this._lastSubject,this._lastFacts);
  }
};

com.marklogic.widgets.keylines.prototype._drawSubjectDetail = function(subjectIri,facts) {
  if (undefined == this._lastSubject) {
    this._lastSubject = subjectIri;
    this._lastFacts = facts;

//    this.sc.subjectFacts(subjectIri);
  }

  /* KLData instance:-
   { id: 'node1',             //'node1' is the identity of the node
     t: 'label',              //the label to be used under the icon
     type: 'node',            //the type of the item: must be 'node' for nodes
     u: '/icons/person.png',  //the url of the icon
     x: 100,                  //the x position (measured to the centre of the icon)
     y: 150                   //the y position (measured to the centre of the icon)
   },{
     c: 'rgb(0, 0, 255)',     //the colour of the link
     id: 'link1',             //'link1' is the identity of this link
     id1: 'node1',            //the identity of the node at one end
     id2: 'node2',            //the identity of the node at the other end
     t: 'label',              //the label to be used for the link
     type: 'link',            //the type of the item: must be 'link' for links
     w: 1                     //the width of the link in pixels
   }
  */
  mljs.defaultconnection.logger.debug("keylines._drawSubjectDetail: Called for: " + subjectIri);
  var self = this;
  var subjectObject = null;
  var addOrGetSubject = function(iri,cls) {
    var kld = self._getSubject(iri);
    if (null == kld) {
      // add new data item
      kld = {id: iri,type:"node",u: "/images/icon-.png",x: 100, y: 150,t: iri};
      self._kldata.push(kld);
    }
  };
  var addOrGetLink = function(siri,piri,oiri,cls) {
    var kld = self._getLink(siri,piri,oiri);
    if (null == kld) {
      // add new data item
      kld = {id: siri + "^^^" + piri + "^^^" + oiri,type:"link",c: 'rgb(0, 0, 255)',x: 100, y: 150,t:self._shortenSubjectIri(piri),a2:true,id1: siri,id2:oiri,w:2};
      self._kldata.push(kld);
    }
  };

  var updateSubjectTitle = function(iri) {
    mljs.defaultconnection.logger.debug("keylines._drawSubjectDetail: updateSubjectTitle: called for " + iri);
    var scfg = self.sc.getTripleConfiguration();
    var cache = self.sc.getCachedFacts(iri);
    mljs.defaultconnection.logger.debug("keylines._drawSubjectDetail: updateSubjectTitle: cached facts: " + JSON.stringify(cache));
    var fs = null;
    if (null != cache) {
      fs = cache.facts;
    } else {
      self.sc.subjectFacts(iri); // TODO limit this to a particular depth
    }

    var getPredicateObject = function(prediri) {
      for (var b = 0,bindings = fs, max = bindings.length, predicate, obj, binding;b < max;b++) {
        binding = bindings[b];
        if (binding.predicate.value == prediri) {
          return binding.object.value;
        }
      }
      return null;
    };

    // find class and it's title
    var type = null;
    var types = [];
    if (null != fs) {
      for (var b = 0,bindings = fs, max = bindings.length, predicate, obj, binding;b < max;b++) {
        binding = bindings[b];
        mljs.defaultconnection.logger.debug("keylines._drawSubjectDetail: processing binding: " + JSON.stringify(binding));
        predicate = binding.predicate;

        if (predicate.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
          type = binding.object.value;
          //mljs.defaultconnection.logger.debug("keylines._drawSubjectDetail: adding type: " + type);
          types.push(type);
        }
      }
    }
    mljs.defaultconnection.logger.debug("keylines._drawSubjectDetail: updateSubjectTitle: type: " + type);

    var typeTitle = "Thing";
    var subjectTitle = null;
    if (null != cache) {
      if (null != cache.typeNameString) {
        typeTitle = cache.typeNameString;
      }
      if (null != cache.nameString) {
        subjectTitle = cache.nameString;
      }
    }
    mljs.defaultconnection.logger.debug("keylines._drawSubjectDetail: typeTitle now: " + typeTitle + " subjectTitle: " + subjectTitle);
    //if ("Thing" == typeTitle) {
      // process from cached facts
    for (var t = 0,maxt = types.length,typ;t < maxt;t++) {
      typ = types[t];
      //mljs.defaultconnection.logger.debug("typ: " + typ);
      var typeEntity = scfg.getEntityFromIRI(typ);
      if (null != typeEntity) {
        if ("Thing" == typeTitle) {
          typeTitle = typeEntity.title;
        }
        //mljs.defaultconnection.logger.debug("type title: " + typeTitle);
        var namePred = scfg.getNameProperty(typeEntity.name);
        //mljs.defaultconnection.logger.debug("nameprop iri: " + namePred);
        if (undefined == subjectTitle) {
          subjectTitle = getPredicateObject(namePred);
          //mljs.defaultconnection.logger.debug("subject title now: " + subjectTitle);
        }
      }

    }
    //}
    if (undefined == subjectTitle) {
      subjectTitle = iri;
    }

    // find subject and set title
    var kld = self._getSubject(iri);
    if (null != kld) {
      kld.t = subjectTitle + " (" + typeTitle + ")";
      //if (null != type) {
        kld.u = "/images/icon-" + typeTitle + ".png";
      //}
    }
  };

  subjectObject = addOrGetSubject(subjectIri,"Subject");
  updateSubjectTitle(subjectIri);

  for (var b = 0,bindings = facts, max = bindings.length, binding;b < max;b++) {
    binding = bindings[b];
    if (binding.object.type == "uri") {
      if (binding.predicate.value != "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
        // draw targets subject -> object of type uri
        var toObject = addOrGetSubject(binding.object.value);
        updateSubjectTitle(binding.object.value);
        // TODO load facts if not known

        // draw link. These have IDs of the form subjectIri^^^predicateIri^^^objectIri, and title of predicate name
        var linkObject = addOrGetLink(binding.subject.value,binding.predicate.value,binding.object.value,"link");

      }

    } else {
      // intrinsic properties - list in off screen text area, or use for link width etc.

    }
  }

  mljs.defaultconnection.logger.debug("keylines._drawSubjectDetail: Calling load on keylines chart for data: " + JSON.stringify(this._kldata));
  this._updateChartData(); // TODO force partial redraw only (coule be called due to user action)

};

com.marklogic.widgets.keylines.prototype._updateChartData = function() {
  var self = this;
  this._chart.load({
    type: 'LinkChart',
    items: self._kldata
  }, function() {
    self._chart.layout('standard', {fit: true, animate: true, tidy: true});
  });
};


com.marklogic.widgets.keylines.prototype._shortenSubjectIri = function(iri) {
  var pos = iri.lastIndexOf("#");
  if (-1 == pos) {
    pos = iri.lastIndexOf("/");
    if (-1 == pos) {
      return iri;
    }
  }
  return iri.substring(pos + 1);
};

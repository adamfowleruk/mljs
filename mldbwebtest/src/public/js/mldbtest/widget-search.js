// global variable definitions
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};






















// SEARCH HELPER STATIC OBJECT FUNCTIONS

com.marklogic.widgets.searchhelper = {};

com.marklogic.widgets.searchhelper.processValueAll = function(str) {
  return com.marklogic.widgets.searchhelper.processValue(str,"all");
};

com.marklogic.widgets.searchhelper.processValue = function(str,mode) {
  var name = str;
  name = com.marklogic.widgets.searchhelper.splitdash(name,mode);
  name = com.marklogic.widgets.searchhelper.splitunderscore(name,mode);
  name = com.marklogic.widgets.searchhelper.camelcase(name,mode);
  return name;
};

com.marklogic.widgets.searchhelper.splitdash = function(value,mode) {
  if (value == undefined || value == null) {
    mldb.defaultconnection.logger.warn("WARNING: splitdash(): value is " + value);
    return "";
  }
  if ("string" != typeof value) {
    mldb.defaultconnection.logger.warn("WARNING: splitdash(): value is not of type string, but of type '" + (typeof value) + "'");
    return "";
  }
  var name = value;
  if ("all" == mode || "splitdash" == mode) {
    //mldb.defaultconnection.logger.debug("Apply splitdash transform to " + name);
    var parts = name.split("-");
    var nn = "";
    for (var i = 0;i < parts.length;i++) {
      nn += parts[i] + " ";
    }
    name = nn.trim();
  }
  return name;
};

com.marklogic.widgets.searchhelper.splitunderscore = function(value,mode) {
  var name = value;
  if ("all" == mode || "splitunderscore" == mode) {
    //mldb.defaultconnection.logger.debug("Apply splitunderscore transform to " + name);
    var parts = name.split("_");
    var nn = "";
    for (var i = 0;i < parts.length;i++) {
      nn += parts[i] + " ";
    }
    name = nn.trim();
  }
  return name;
};

com.marklogic.widgets.searchhelper.camelcase = function(value,mode) {
  var name = value;
  if ("all" == mode || "camelcase" == mode) {
    //mldb.defaultconnection.logger.debug("Apply camelcase transform to " + name);
    var parts = name.split(" ");
    var nn = "";
    for (var i = 0;i < parts.length;i++) {
      nn += parts[i].substring(0,1).toUpperCase() + parts[i].substring(1) + " ";
    }
    name = nn.trim();
  }
  return name;
};









// SEARCH BAR ELEMENT

com.marklogic.widgets.searchbar = function(container) {
  if (undefined == com.marklogic.widgets.searchbar.list) {
    com.marklogic.widgets.searchbar.list = new Array(); // [containerID] -> searchbar widget
  }
  this.container = container;
  this.sortWord = "sort";
  this.defaultQuery = ""; // should be set E.g. to "sort:relevance"
  
  this.optionsName = mldb.__dogenid();
  this.optionsExists = false;
  
  this.collection = null;
  this.directory = null;
  
  this.options = {
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
          "prefix": ""
        }
      } // other constraints here
      ]
                      }
  };
  
  // set up event handlers
  this.resultsPublisher = new com.marklogic.events.Publisher(); // publishes search results (including facet values)
  this.facetsPublisher = new com.marklogic.events.Publisher(); // publishese facets selection changes
  this.sortPublisher = new com.marklogic.events.Publisher(); // publishes sort changes (from query bar)
  this.errorPublisher = new com.marklogic.events.Publisher(); // errors occuring at search time
  
  // draw widget within container
  mldb.defaultconnection.logger.debug("adding search bar html");
  document.getElementById(container).innerHTML = 
    "<div class='searchbar-inner'>" +
      "<div class='searchbar-queryrow'>" +
        "<label class='searchbar-label' for='" + container + "-searchinput'>Search: </label>" +
        "<input class='searchbar-query' type='text' id='" + container + "-searchinput' value='' />" +
        "<input class='searchbar-submit' type='submit' id='" + container + "-submit' value='Search' />" +
      "</div><div class='searchbar-errorrow hidden'></div>";
    "</div>";
  mldb.defaultconnection.logger.debug("adding submit click handler");
  var self = this;
  document.getElementById(container + "-submit").onclick = function() {self._dosearch(self);}; // TODO Check this is valid
  mldb.defaultconnection.logger.debug("added submit click handler");
  
  // set default connection
  this.db = mldb.defaultconnection;
};

com.marklogic.widgets.searchbar.prototype.setCollection = function(col) {
  this.collection = col;
};

com.marklogic.widgets.searchbar.prototype.setDirectory = function(dir) {
  this.directory = dir;
};

com.marklogic.widgets.searchbar.prototype.setOptions = function(options) {
  this.options = options;
  this.optionsExists = false;
};

com.marklogic.widgets.searchbar.prototype.setOptionsName = function(name) {
  this.optionsName = name;
};

/**
 * Should be set E.g. to "sort:relevance"
 */
com.marklogic.widgets.searchbar.prototype.setDefaultQuery = function(defQuery) {
  this.defaultQuery = defQuery;
  var qel = document.getElementById(this.container + "-searchinput");
  var q = qel.getAttribute("value");
  if (null == q || undefined == q || "".equals(q.trim())) {
    qel.setAttribute("value",this.defaultQuery); // don't search yet though
  }
};

com.marklogic.widgets.searchbar.prototype.setConnection = function(connection) {
  this.db = connection;
};

com.marklogic.widgets.searchbar.__dosearch = function(submitelement) {
  // figure out which search bar we need
  var id = submitelement.getAttribute("id");
  // remove -searchinput from elid
  id = id.substring(0,id.length - 12);
  // execute it's dosearch method
  var bar = com.marklogic.widgets.searchbar.list[id];
  if (null == id) {
    mldb.defaultconnection.logger.debug("searchbar.__dosearch - search bar instance does not exist: " + id);
  } else {
    bar._dosearch();
  }
};

com.marklogic.widgets.searchbar.prototype._parseQuery = function(q) {
  var text = "";
  var facets = new Array();
  var sort = null;
  var parts = q.split(" "); // TODO handler spaces in facet values
  for (var i = 0;i < parts.length;i++) {
    if (0 == parts[i].indexOf(this.sortWord + ":")) {
      sort = parts[i].substring(5);
    } else if (-1 != parts[i].indexOf(":")) {
      mldb.defaultconnection.logger.debug("FOUND A FACET IN QUERY: " + parts[i]);
      var fv = parts[i].split(":");
      mldb.defaultconnection.logger.debug("Facet name: " + fv[0] + " value: " + fv[1]);
      if (0 == fv[1].indexOf("\"")) {
        fv[1] = fv[1].substring(1);
        if ((fv[1].length - 1) == fv[1].indexOf("\"")) {
          fv[1] = fv[1].substring(0,fv[1].length-1);
        }
      }
      mldb.defaultconnection.logger.debug("Facet info now name: " + fv[0] + " value: " + fv[1]);
      var found = false;
      for (var f = 0;f < facets.length;f++) {
        if (facets[f].name == fv[0]) {
          // replace value
          facets[f].value = fv[1];
          found = true;
        }
      }
      if (!found) {
        facets.push({name: fv[0], value: fv[1]});
      }
    } else {
      text += " " + parts[i];
    }
  }
  return {q: text.trim(),facets: facets,sort: sort};
};

com.marklogic.widgets.searchbar.prototype._queryToText = function(parsed) {
  var q = parsed.q;
  if (null != parsed.sort) {
    q += " " + this.sortWord + ":" + parsed.sort;
  }
  for (var i = 0;i < parsed.facets.length;i++) {
    q += " " + parsed.facets[i].name + ":\"" + parsed.facets[i].value + "\"";
  }
  return q;
};

com.marklogic.widgets.searchbar.prototype.clear = function() {
  document.getElementById(this.container + "-searchinput").value = "";
};

com.marklogic.widgets.searchbar.prototype.execute = function() {
  var q = document.getElementById(this.container + "-searchinput").value;
  this.__doquery(q);
};

com.marklogic.widgets.searchbar.prototype._dosearch = function(self) {
  // get our search input element
  var q = document.getElementById(self.container + "-searchinput").value;
  
  // TODO parse for Sort and Facets values, and update listeners accordingly (user may remove facets/sort by hand)
  
  self.__doquery(q);
};

com.marklogic.widgets.searchbar.prototype.__doquery = function(q,start) {
  var self = this;
  self.resultsPublisher.publish(true); // forces refresh glyph to show
  self.facetsPublisher.publish(true);
  var ourstart = 1;
  if (0 != start && undefined != start) {
    ourstart = start;
  }
  
  // cleanse query value first
  mldb.defaultconnection.logger.debug("Query before: " + q);
  var parsed = self._parseQuery(q);
  mldb.defaultconnection.logger.debug("Query parsed: " + JSON.stringify(parsed));
  var cq = self._queryToText(parsed);
  q = cq;
  mldb.defaultconnection.logger.debug("Query after: " + cq);
  document.getElementById(this.container + "-searchinput").value = cq;
  
  self.facetsPublisher.publish(parsed.facets);
  
  var dos = function() {
   // fetch results (and update facets, sort)
   var sprops = {};
   if (null != self.collection) {
     sprops.collection = self.collection;
   }
   if (null != self.directory) {
     sprops.directory = self.directory;
   }
   self.db.search(q,self.optionsName,ourstart,sprops,function(result) { // TODO pass start position through, if defined
    if (result.inError) {
      // report error on screen somewhere sensible (e.g. under search bar)
      mldb.defaultconnection.logger.debug(result.error);
      // TODO show error div below search div with message
      self.resultsPublisher.publish(false); // hides refresh glyth on error
    } else {
      self.resultsPublisher.publish(result.doc);
    }
   });
  };
  
  // check for options existance
  if (!this.optionsExists) {
    this.db.saveSearchOptions(this.optionsName,this.options,function(result) {
      if (result.inError) {
        // TODO log error somewhere sensible on screen
        mldb.defaultconnection.logger.debug(result.error);
      } else {
        self.optionsExists = true; // to stop overwriting on subsequent requests
        dos();
      }
    });
  } else {
    dos();
  }
  
};

com.marklogic.widgets.searchbar.prototype.setSortWord = function(word) {
  this.sortWord = word;
};

com.marklogic.widgets.searchbar.prototype.addResultsListener = function(rl) {
  this.resultsPublisher.subscribe(rl);
};

com.marklogic.widgets.searchbar.prototype.removeResultsListener = function(rl) {
  this.resultsPublisher.unsubscribe(rl);
};

com.marklogic.widgets.searchbar.prototype.addSortListener = function(sl) {
  this.sortPublisher.subscribe(sl);
};

com.marklogic.widgets.searchbar.prototype.removeSortListener = function(sl) {
  this.sortPublisher.unsubscribe(sl);
};

com.marklogic.widgets.searchbar.prototype.addFacetsListener = function(fl) {
  this.facetsPublisher.subscribe(fl);
};

com.marklogic.widgets.searchbar.prototype.removeFacetsListener = function(fl) {
  this.facetsPublisher.unsubscribe(fl);
};

com.marklogic.widgets.searchbar.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

com.marklogic.widgets.searchbar.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};

com.marklogic.widgets.searchbar.prototype.updateFacets = function(facetSelection) {
  var q = document.getElementById(this.container + "-searchinput").value;
  
  var parsed = this._parseQuery(q);
  parsed.facets = facetSelection;
  
  q = this._queryToText(parsed);
  
  this.__doquery(q);
};

com.marklogic.widgets.searchbar.prototype.updatePage = function(json) {
  // example: {start: this.start, show: this.perPage}
  if (this.options.options["page-length"] != json.show) {
    this.optionsExists = false; // force re save of options
    this.options.options["page-length"] = json.show;
  }
  var q = document.getElementById(this.container + "-searchinput").value;
  this.__doquery(q,json.start);
};

com.marklogic.widgets.searchbar.prototype.updateSort = function(sortSelection) {
  // update sort selection, and perform search
  var q = document.getElementById(this.container + "-searchinput").value;
  // TODO remove any existing sort
  q += " " + this.sortWord + ":" + sortSelection;
  
  this.__doquery(q);
};

com.marklogic.widgets.searchbar.prototype.reset = function() {
  // clear search bar text
  // send update to results and facets and sort
  this.resultsPublisher.publish(null);
  this.facetsPublisher.publish(null); // TODO verify this is the right element to send
  this.sortPublisher.publish(null); // order default sort
  document.getElementById(this.container + "-searchinput").setAttribute("value",this.defaultQuery);
};













// SEARCH FACETS ELEMENT

com.marklogic.widgets.searchfacets = function(container) {
  this.container = container;
  
  this.listSize = 5;
  this.extendedSize = 10;
  this.allowShowAll = true;
  this.facetSettings = new Array();
  this.hideEmptyFacets = true;
  
  this.results = null;
  
  this.selected = new Array();
  
  this.facetNameTransform = "all"; // This is camelcase and splitdash and splitunderscore
  this.facetValueTransform = "all"; // This is camelcase and splitdash and splitunderscore
  
  // set up event handlers
  this.selectionPublisher = new com.marklogic.events.Publisher();
  
  // html
  this._refresh();
};

com.marklogic.widgets.searchfacets.prototype._setFacetSettings = function(facetName,extended,showall) {
  var json = {extended: extended, showAll: showAll};
  this.facetSettings[facetName] = json;
};

com.marklogic.widgets.searchfacets.prototype._getFacetSettings = function(facetName) {
  var res = this.facetSettings[facetName];
  if (undefined == res || null == res) {
    return {extended: false,showAll: false};
  } else {
    return res;
  }
};

com.marklogic.widgets.searchfacets.prototype.clear = function() {
  this.results = null;
  this._refresh();
};

com.marklogic.widgets.searchfacets.prototype._refresh = function() {
  if (false == this.results || true == this.results ) {
    // TODO show/hide refresh image based on value of this.results (true|false)
    return;
  }
  // example: "facets":{"collection":{"type":"collection","facetValues":[]},"animal":{"type":"xs:string","facetValues":[]},"family":{"type":"xs:string","facetValues":[]}}
  // full example: "facets":{"collection":{"type":"collection","facetValues":[]},
  // "animal":{"type":"xs:string","facetValues":[{"name":"cat","count":2,"value":"cat"}, {"name":"dog","count":2,"value":"dog"},{"name":"homosapien","count":2,"value":"homosapien"},
  //   {"name":"penguin","count":2,"value":"penguin"}]},  
  // "family":{"type":"xs:string","facetValues":[{"name":"bird","count":2,"value":"bird"},{"name":"marklogician","count":2,"value":"marklogician"},{"name":"pet","count":4,"value":"pet"}]}}
  var more = new Array();
  var extended = new Array();
  
  var str = "<div class='searchfacets-title'>Browse</div> <div id='" + this.container + "-facetinfo' class='search-facets'> ";
  
  // draw selected facets and deselectors
  var deselectionTodo = new Array();
  if (0 != this.selected.length) {
    str += "<div class='searchfacets-selected'>";
    
    // lopp through selected
    for (var i = 0;i < this.selected.length;i++) {
      var s = this.selected[i];
      str += "<div class='searchfacets-selection'>" + 
        "<a href='#' class='searchfacets-deselect' id='" + this.container + "-desel-" + s.name + "-" + s.value + "'>X</a> " +
        this._transformFacetName(s.name) + ": " + this._transformFacetValue(s.value) + "</div>";
      // add deselection X link
      deselectionTodo.push(s);
    }
    
    str += "</div>";
  }
  
  var facetHandlersTodo = new Array();
  if (null != this.results && undefined != this.results) {
    if (undefined != this.results.facets) {
      
      for (var name in this.results.facets) { // TODO replace with introspection of objects within search facets (objects, not array)
        var facetStr = "<div class='searchfacets-facet'><div class='searchfacets-facet-title'>" + this._transformFacetName(name) + "</div>" +
          "<div class='searchfacets-facet-values'>";
        var settings = this._getFacetSettings(name);
        var max = this.listSize;
        var values = this.results.facets[name].facetValues;
        // sort facets first by count
        bubbleSort(values, "count");
        var valuesCount = values.length;
        if (settings.more) {
          max = this.extendedSize;
        }
        if (settings.showAll && settings.extended) {
          max = valuesCount;
        }
        for (var v = 0;v < max && v < valuesCount;v++) {
          // limit number of values shown
          if (v < this.listSize || (v < this.extendedSize && settings.extended) || settings.showAll) {
            var fv = values[v];
            facetStr += "<div class='searchfacets-facet-value' id='" + this.container + "-fv-" + name + "-" + fv.name + "'>" + this._transformFacetValue(fv.name) + " (" + fv.count + ")" + "</div>";
            facetHandlersTodo.push({name: name, value: fv.name});
          }
        }
        if (valuesCount > this.listSize) {
          // TODO less... clickable links
          if (!settings.extended) {
            // html for 'show more'
            facetStr += "<div class='searchfacets-more'><a href='#' id='" + this.container + "-" + name + "-more-link'>More...</a></div>";
            more.push(name);
          } else {
            if (valuesCount > this.extendedSize && !settings.showAll && this.allowShowAll) {
              // html for 'show all'
              extended.push(name);
            }
          }
        }
        facetStr += "</div></div>";
        if (!(0 == valuesCount && this.hideEmptyFacets)) {
          str += facetStr;
        }
      }
    }
  }
  
  str += "</div>";
  
  document.getElementById(this.container).innerHTML = str;
  
  // set up event handlers
  var self = this;
  
  // selection handlers
  var addfh = function(fh) {
    var el = document.getElementById(self.container + "-fv-" + fh.name + "-" + fh.value);
    if (undefined != el) {
      el.onclick = function() {self._selectFacet(fh.name,fh.value)};
    }
  };
  for (var i = 0;i < facetHandlersTodo.length;i++) {
    var fh = facetHandlersTodo[i];
    addfh(fh);
  }
  // deselection
  var remfh = function(fh) {
    var el = document.getElementById(self.container + "-desel-" + fh.name + "-" + fh.value);
    if (undefined != el) {
      el.onclick = function() {self._deselectFacet(fh.name,fh.value)};
    }
  };
  for (var i = 0;i < deselectionTodo.length;i++) {
    var fh = deselectionTodo[i];
    remfh(fh);
  }
  
  // more handlers
  for (var i = 0;i < more.length;i++) {
    document.getElementById(this.container + "-" + more[i] + "-more-link").onclick = function() {self._more(more[i]);};
  }
  
  // extended handlers
  for (var i = 0;i < extended.length;i++) {
    document.getElementById(this.container + "-" + extended[i] + "-extended-link").onclick = function() {self._extended(extended[i]);};
  }
  
  // TODO less handlers
};

com.marklogic.widgets.searchfacets.prototype._selectFacet = function(facetName,value) {
  mldb.defaultconnection.logger.debug("Selecting " + facetName + ":" + value);
  this.selected.push({name: facetName,value: value});
  // draw selection
  this._refresh();
  // fire event to handlers
  this.selectionPublisher.publish(this.selected);
};

com.marklogic.widgets.searchfacets.prototype._deselectFacet = function(facetName,value) {
  mldb.defaultconnection.logger.debug("Deselecting " + facetName + ":" + value);
  var newsel = new Array();
  for (var i = 0;i < this.selected.length;i++) {
    var el = this.selected[i];
    if (el.name == facetName && el.value == value) {
      // don't add
    } else {
      newsel.push(el);
    }
  }
  this.selected = newsel;
  this._refresh();
  // fire event to handlers
  this.selectionPublisher.publish(this.selected);
};

com.marklogic.widgets.searchfacets.prototype._transformFacetName = function(facetName) {
  /*var name = facetName;
  name = com.marklogic.widgets.searchhelper.splitdash(name,this.facetNameTransform);
  name = com.marklogic.widgets.searchhelper.splitunderscore(name,this.facetNameTransform);
  name = com.marklogic.widgets.searchhelper.camelcase(name,this.facetNameTransform);
  return name;*/
  return com.marklogic.widgets.searchhelper.processValue(facetName,this.facetNameTransform);
};

com.marklogic.widgets.searchfacets.prototype._transformFacetValue = function(facetValue) {
  /*var name = facetValue;
  name = com.marklogic.widgets.searchhelper.splitdash(name,this.facetValueTransform);
  name = com.marklogic.widgets.searchhelper.splitunderscore(name,this.facetValueTransform);
  name = com.marklogic.widgets.searchhelper.camelcase(name,this.facetValueTransform);
  return name;*/
  return com.marklogic.widgets.searchhelper.processValue(facetValue,this.facetValueTransform);
};


com.marklogic.widgets.searchfacets.prototype._more = function(facetName) {
  this._setFacetSettings(facetName,true,false);
  this._refresh();
};

com.marklogic.widgets.searchfacets.prototype._extended = function(facetName) {
  this._setFacetSettings(facetName,false,true);
  this._refresh();
};

com.marklogic.widgets.searchfacets.prototype.setSizes = function(listSize,extendedSize) {
  this.listSize = listSize;
  this.extendedSize = extendedSize;
};

com.marklogic.widgets.searchfacets.prototype.setAllowShowAll = function(boolvalue) {
  this.allowShowAll = boolvalue;
};

com.marklogic.widgets.searchfacets.prototype.addSelectionListener = function(sl) {
  this.selectionPublisher.subscribe(sl);
};

com.marklogic.widgets.searchfacets.prototype.removeSelectionListener = function(sl) {
  this.selectionPublisher.unsubscribe(sl);
};

com.marklogic.widgets.searchfacets.prototype.updateFacets = function(results) {
  if ("boolean" == typeof results) {
    return;
  }
  this.results = results;
  this._refresh();
};

com.marklogic.widgets.searchfacets.prototype.updateSelectedFacets = function(facets) {
  mldb.defaultconnection.logger.debug("In updateSelectedFacets(facets): " + JSON.stringify(facets));
  this.selected = facets;
  this._refresh();
};














// SEARCH RESULTS ELEMENT

com.marklogic.widgets.searchresults = function(container) {
  this.container = container;
  
  this.results = null;
  
  this.processors = new Array();
  this.availableProcessors = new Array();
  this.processorPriority = new Array();
  
  this.defaultProcessor = {
    matcher: function(result) {
      return true; // handles all results
    }, 
    processor: function(result) {
      var resStr = "";
      // parse each results and snippet / raw content
      var title = result.uri;
      if (!(typeof result.content.title === 'undefined')) {
        title = result.content.title;
      }
      var snippet = null;
      // TODO show all content if snippeting mode is snippet
      if (undefined != result.content.summary) {
        snippet = result.content.summary;
      } else {
        snippet = JSON.stringify(result.content); 
        // TODO check for XML (string not object) content in results.results[i].content
      }
      resStr += "<div class='searchresults-result'><h3>" + result.index + ". " + title + "</h3>";
      if (null != snippet) {
        resStr += "<div class='searchresults-snippet'>" + snippet + "</div>";
      }
      resStr += "</div>";
      return resStr;
    }
  };
  
  this._refresh();
  
  // event handlers
  this.selectionPublisher = new com.marklogic.events.Publisher();
};

com.marklogic.widgets.searchresults.prototype.clear = function() {
  this.results = null;
  this._refresh();
};

com.marklogic.widgets.searchresults.prototype.updateResults = function(results) {
  this.results = results;
  
  this._refresh();
};

com.marklogic.widgets.searchresults.prototype._refresh = function() {
  // update results
  if (typeof this.results == "boolean" ) {
    // TODO show/hide refresh image based on value of this.results (true|false)
    return;
  }
  if (null == this.results || this.results.results.length == 0) {
    document.getElementById(this.container).innerHTML = 
      "<div class='searchresults-inner'>" +
        "<div class='searchresults-title'>Results</div><div class='searchresults-results'>No Results</div>" +
      "</div>";
  } else {
    mldb.defaultconnection.logger.debug("RESULTS OBJECT: " + JSON.stringify(this.results));
    
    var resStr = 
      "<div class='searchresults-inner'><div class='searchresults-title'>Results</div><div class='searchresults-results'>";
      
    var uureplace = 1001;
    var replacements = new Array();
    
    for (var i = 0;i < this.results.results.length;i++) {
      // run processors in order
      var result = this.results.results[i];
      var found = false;
      for (var p = 0;!found && p < this.processorPriority.length;p++) {
        var pname = this.processorPriority[p];
        mldb.defaultconnection.logger.debug("checking applicability of processor: " + pname);
        if (this.processors[pname].matcher(result)) {
          found = true;
          mldb.defaultconnection.logger.debug("found processor: " + pname);
          var returned = this.processors[pname].processor(result);
          if (undefined != returned.nodeType) {
            var id = (uureplace++);
            resStr = "<div id='" + this.container + "-searchresults-xml-" + id + "'></div>";
            replacements[id] = returned;
          } else {
            resStr += returned;
          }
        }
      }
      if (!found) {
        mldb.defaultconnection.logger.debug("No processor found, using default");
        resStr += this.defaultProcessor.processor(result);
      }
    }
    resStr += "</div></div>"; // end of results container div and results inner
    mldb.defaultconnection.logger.debug("RES STR: " + resStr);
    
    document.getElementById(this.container).innerHTML = resStr;
    
    // now do any XML replacements
    for (var r = 1001;r < uureplace;r++) {
      document.getElementById(this.container + "-searchresults-xml-" + r).innerHTML = replacements[r]; // TODO verify we don't have to clone the XML document before insert (shouldn't need to)
    }
  }
};

com.marklogic.widgets.searchresults.prototype.addSelectionListener = function(sl) {
  this.selectionPublisher.subscribe(sl);
};

com.marklogic.widgets.searchresults.prototype.removeSelectionListener = function(sl) {
  this.selectionPublisher.unsubscribe(sl);
};

// search results custom processing

com.marklogic.widgets.searchresults.prototype.addProcessor = function(name,matcher_func,processor_func) {
  this.processors[name] = {matcher:matcher_func,processor:processor_func};
  this.availableProcessors.push(name);
  this.processorPriority.push(name);
};

com.marklogic.widgets.searchresults.prototype.removeProcessor = function(name) {
  this.processors[name] = undefined;
  this.availableProcessors.remove(name);
  this.processorPriority.remove(name);
};

com.marklogic.widgets.searchresults.prototype.setProcessorPriority = function(procNameArray) {
  this.processorPriority = procNameArray;
};









// SEARCH RESULTS PAGINATION

com.marklogic.widgets.searchpager = function(container) {
  this.container = container;
  
  this.perPage = 10;
  this.start = 0;
  this.total = 0;
  
  // event handlers
  this.pagePublisher = new com.marklogic.events.Publisher();
  
  // html
  document.getElementById(container).innerHTML = 
    "<span class='searchpager-showing' id='" + container + "-searchpager-showing'></span>" +
    "<span class='searchpager-first searchpager-button' id='" + container + "-searchpager-first'><a href='#' id='" + container + "-searchpager-first-a' class='searchpager-link'>&lt;&lt;  </a></span>" +
    "<span class='searchpager-previous searchpager-button' id='" + container + "-searchpager-previous'><a href='#' id='" + container + "-searchpager-previous-a' class='searchpager-link'>&lt;  </a></span>" +
    "<span class='searchpager-page' id='" + container + "-searchpager-page'>-</span>" +
    "<span class='searchpager-next searchpager-button' id='" + container + "-searchpager-next'><a href='#' id='" + container + "-searchpager-next-a' class='searchpager-link'>  &gt;</a></span>" +
    "<span class='searchpager-last searchpager-button' id='" + container + "-searchpager-last'><a href='#' id='" + container + "-searchpager-last-a' class='searchpager-link'>  &gt;&gt;</a></span>";
  var self = this;
  document.getElementById(container + "-searchpager-first-a").onclick = function() {self._first();};
  document.getElementById(container + "-searchpager-previous-a").onclick = function() {self._previous();};
  document.getElementById(container + "-searchpager-next-a").onclick = function() {self._next();};
  document.getElementById(container + "-searchpager-last-a").onclick = function() {self._last();};
  
  this._refresh();
};

com.marklogic.widgets.searchpager.prototype.clear = function() {
  this.updatePage(null);
};

com.marklogic.widgets.searchpager.prototype.updatePage = function(results) {
  mldb.defaultconnection.logger.debug("updatePage: results: " + results);
  
  if ("boolean" == typeof results) {
    // TODO show/hide refresh image based on value of this.results (true|false)
    return;
  }
  if (null == results) {
    this.start = 1;
    this.total = 0;
  } else {
    // extract search settings - e.g. number per page -> this.perPage
    this.perPage = results["page-length"];
    this.start = results.start;
    this.total = results.total;
  }
    
  this._refresh();
};

com.marklogic.widgets.searchpager.prototype.addPageListener = function(l) {
  this.pagePublisher.subscribe(l);
};

com.marklogic.widgets.searchpager.prototype.removePageListener = function(l) {
  this.pagePublisher.unsubscribe(l);
};

com.marklogic.widgets.searchpager.prototype._refresh = function() {
  mldb.defaultconnection.logger.debug("REFRESH: start: " + this.start + ", total: " + this.total + ", perPage: " + this.perPage);
  var last = (this.start + this.perPage - 1);
  if (last > this.total) {
    last = this.total;
  }
  var st = this.start;
  if (st > this.total) {
    st = this.total;
  }
  if (0 == st) {
    document.getElementById(this.container + "-searchpager-showing").innerHTML = "Showing no results";
  } else {
    document.getElementById(this.container + "-searchpager-showing").innerHTML = 
      "Showing " + st + " to " + last + " of " + this.total;
  }
  
  // calculate our page number
  var page = 1 + Math.floor(st / this.perPage);
  var maxpage = 1 + Math.floor(this.total / this.perPage);
  if (0 == st) {
    page = 0;
    maxpage = 0;
  }
  if (0 == page) {
    document.getElementById(this.container + "-searchpager-page").innerHTML = " - ";
  } else {
    document.getElementById(this.container + "-searchpager-page").innerHTML = 
      "Page " + page + " of " + maxpage;
  }
  
  // TODO show/hide or enable/disable next / prev
  if (page < 2) {
    // hide first and previous
    // show next and last page
  } else if (page == maxpage) {
    // show first and previous
    // hide next and last page
  }
};

com.marklogic.widgets.searchpager.prototype._fire = function() {
  this._refresh();
  
  var json = {start: this.start, show: this.perPage};
  this.pagePublisher.publish(json);
};

com.marklogic.widgets.searchpager.prototype._first = function() {
  this.start = 1;
  this._fire();
};

com.marklogic.widgets.searchpager.prototype._previous = function() {
  this.start = this.start - this.perPage;
  if (this.start < 1) {
    this.start = 1;
  }
  this._fire();
};

com.marklogic.widgets.searchpager.prototype._next = function() {
  this.start = this.start + this.perPage;
  var lastpage = 1 + Math.floor(this.total / this.perPage);
  mldb.defaultconnection.logger.debug("start now: " + this.start + ", lastpage: " + lastpage);
  if (Math.floor(this.start / this.perPage) > lastpage) {
    mldb.defaultconnection.logger.debug("new page greater than maxpage");
    this.start = 1 + Math.floor(this.perPage * (lastpage - 1));
    mldb.defaultconnection.logger.debug("start now now: " + this.start);
  }
  this._fire();
};

com.marklogic.widgets.searchpager.prototype._last = function() {
  var lastpage = 1 + Math.floor(this.total / this.perPage);
  this.start = 1 + Math.floor(this.perPage * (lastpage - 1));
  this._fire();
};











// SEARCH SORT ELEMENT

com.marklogic.widgets.searchsort = function(container) {
  this.container = container;
  
  // event handlers
  this.selectionPublisher = new com.marklogic.events.Publisher();
  this.sortOptions = new Array();
  this.sortOptions.push({title: "None", value: ""}); // value is required
  //this.sortOptions.push({title: "Relevance", value: "relevance", order: "descending"}); // value is required
  
  // html
  this._refresh();
};

com.marklogic.widgets.searchsort.prototype._refresh = function() {
  var str = 
    "<span class='searchsort-text'>Sort: </span>" +
    "<select class='searchsort-select'>";
//      "<option value='relevance'>Relevance</option>" +
  for (var i = 0;i < this.sortOptions.length;i++) {
    var o = this.sortOptions[i];
    str += "<option value='" + o.value + "'>";
    if (undefined != o.title) {
      str += o.title;
    } else {
      str += com.marklogic.widgets.searchhelper.processValueAll(o.value);
    }
    //str += " (";
    /*if (undefined != o.order) {
      str += " (" +com.marklogic.widgets.searchhelper.camelcase(o.order,"all") + ")";
    } else {
      // TODO not specified - default to ascending?
    }*/
    //str += ")";
  }
  str += "</select>";
  document.getElementById(this.container).innerHTML = str;
};

com.marklogic.widgets.searchsort.prototype.addSelectionListener = function(sl) {
  this.selectionPublisher.subscribe(sl);
};

com.marklogic.widgets.searchsort.prototype.removeSelectionListener = function(sl) {
  this.selectionPublisher.unsubscribe(sl);
};

/**
 * Invoked from search bar if sort manually typed in
 */
com.marklogic.widgets.searchsort.prototype.updateSort = function(sortSelection) {
  // NB do NOT fire results update event here - we've likely been called by it
  
};

com.marklogic.widgets.searchsort.prototype.setOptions = function(options) {
  // parse options object for sort settings
  var so = options.options["sort-order"];
  this.sortOptions = new Array();
  this.sortOptions.push({title: "None", value: ""}); // value is required
  if (undefined != so) {
    for (var i = 0;i < so.length;i++) {
      var key = so[i]["json-key"];
      if (undefined != key) {
        this.sortOptions.push({value: key, order: so[i]["direction"]});
      }
    }
  }
  this._refresh();
};










// SEARCH PAGE ELEMENT (combines others)

com.marklogic.widgets.searchpage = function(container) {
  this.container = container;
  
  document.getElementById(container).innerHTML = 
   "<div class='container_12 searchpage-inner'>" +
    "<div id='" + container + "-facets' class='grid_4 searchpage-facets'> </div> " + 
    "<div id='" + container + "-main' class='grid_8 searchpage-main'>" +
      "<div id='" + container + "-bar' class='searchpage-bar'></div>" +
      "<div id='" + container + "-error' class='searchpage-error'></div>" +
      "<div class='grid_8 searchpage-controls'>" +
        "<div class='searchpage-controls-inner'>" +
          "<div id='" + container + "-pager' class='grid_6 alpha searchpage-pager'></div>" +
          "<div id='" + container + "-sort' class='grid_2 omega searchpage-sort'></div>" +
        "</div>" +
      "</div>" +
      "<div id='" + container + "-results' class='grid_8 searchpage-results'></div>" +
    "</div></div>";
  
  // NB these simple names allow direct access via mypage.bar in order for page creator to set config defaults (E.g. facet size)
  this.bar = new com.marklogic.widgets.searchbar(container + "-bar");
  this.facets = new com.marklogic.widgets.searchfacets(container + "-facets");
  this.pager = new com.marklogic.widgets.searchpager(container + "-pager");
  this.sort = new com.marklogic.widgets.searchsort(container + "-sort");
  this.results = new com.marklogic.widgets.searchresults(container + "-results");
  this.error = new com.marklogic.widgets.error(container + "-error");
  
  // cross register handlers
  var self = this;
  this.bar.addResultsListener(function(res) {self.results.updateResults(res);});
  this.bar.addResultsListener(function(res) {self.pager.updatePage(res);});
  this.bar.addResultsListener(function(obj) {self.facets.updateFacets(obj);});
  this.bar.addSortListener(function(obj) {self.sort.updateSort(obj);});
  this.bar.addFacetsListener(function(obj) {self.facets.updateSelectedFacets(obj);});
  
  this.sort.addSelectionListener(function(obj) {self.bar.updateSort(obj);});
  this.facets.addSelectionListener(function(obj) {self.bar.updateFacets(obj);});
  this.pager.addPageListener(function(obj) {self.bar.updatePage(obj);});
  
  this.bar.addErrorListener(function(obj) {
    this.error.updateError(obj);
    this.facets.clear();
    this.results.clear();
    this.page.clear();
  });
  
  // set default connection
  this.db = mldb.defaultconnection;
};

com.marklogic.widgets.searchpage.prototype.setOptions = function(name,options) {
  this.bar.setOptionsName(name);
  this.bar.setOptions(options);
  this.sort.setOptions(options);
};

com.marklogic.widgets.searchpage.prototype.execute = function() {
  this.bar.execute(); // search for all
};

com.marklogic.widgets.searchpage.prototype.setConnection = function(connection) {
  this.db = connection;
  // update search bar connection
  this.bar.setConnection(connection);
};

com.marklogic.widgets.searchpage.reset = function() {
  this.bar.reset(); // updates other widgets through event handlers
};

// global variable definitions
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};



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
  this.resultsPublisher = new com.marklogic.events.Publisher();
  this.facetsPublisher = new com.marklogic.events.Publisher();
  this.sortPublisher = new com.marklogic.events.Publisher();
  
  // draw widget within container
  console.log("adding search bar html");
  document.getElementById(container).innerHTML = 
    "<div class='searchbar-inner'>" +
      "<div class='searchbar-queryrow'>" +
        "<label class='searchbar-label' for='" + container + "-searchinput'>Search: </label>" +
        "<input class='searchbar-query' type='text' id='" + container + "-searchinput' value='' />" +
        "<input class='searchbar-submit' type='submit' id='" + container + "-submit' value='Search' />" +
      "</div><div class='searchbar-errorrow hidden'></div>";
    "</div>";
  console.log("adding submit click handler");
  var self = this;
  document.getElementById(container + "-submit").onclick = function() {self._dosearch(self);}; // TODO Check this is valid
  console.log("added submit click handler");
  
  // set default connection
  this.db = mldb.defaultconnection;
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
    console.log("searchbar.__dosearch - search bar instance does not exist: " + id);
  } else {
    bar._dosearch();
  }
};

com.marklogic.widgets.searchbar.prototype._dosearch = function(self) {
  // get our search input element
  var q = document.getElementById(self.container + "-searchinput").value;
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
  
  var dos = function() {
   // fetch results (and update facets, sort)
   self.db.search(q,self.optionsName,ourstart,function(result) { // TODO pass start position through, if defined
    if (result.inError) {
      // report error on screen somewhere sensible (e.g. under search bar)
      console.log(result.error);
      // TODO show error div below search div with message
      self.resultsPublisher.publish(false); // hides refresh glyth on error
      self.facetsPublisher.publish(false);
    } else {
      self.resultsPublisher.publish(result.doc);
      self.facetsPublisher.publish(result.doc.facets); // TODO verify this is the right element to send
    }
   });
  };
  
  // check for options existance
  if (!this.optionsExists) {
    this.db.saveSearchOptions(this.optionsName,this.options,function(result) {
      if (result.inError) {
        // TODO log error somewhere sensible on screen
        console.log(result.error);
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

com.marklogic.widgets.searchbar.prototype.updateFacets = function(facetSelection) {
  // update facet selection, and perform search
  var strFacets = "";
  // expecting [ {name: 'facetname', value: 'facetvalue'}, ...]
  for (var i = 0;i < facetSelection.length;i++) {
    strFacets += facetSelection[i].name + ":\"" + facetSelection[i].value + "\" ";
  }
  
  // merge with current query
  // TODO remove existing facets in the query string
  var q = document.getElementById(this.container + "-searchinput").value;
  q += " " + strFacets;
  
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
  var q = document.getElementById(this.container + "-searchinput").getAttribute("value");
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
  
  this.results = null;
  
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

com.marklogic.widgets.searchfacets.prototype._refresh = function() {
  if (false == this.results || true == this.results ) {
    // TODO show/hide refresh image based on value of this.results (true|false)
    return;
  }
  // example: "facets":{"collection":{"type":"collection","facetValues":[]},"animal":{"type":"xs:string","facetValues":[]},"family":{"type":"xs:string","facetValues":[]}}
  var more = new Array();
  var extended = new Array();
  
  var str = "<div class='searchfacets-title'>Browse</div> <div id='" + this.container + "-facetinfo' class='search-facets'> ";
  
  if (null != this.results && undefined != this.results) {
    if (undefined != this.results.facets) {
      for (var i = 0;i < this.results.facets.length;i++) { // TODO replace with introspection of objects within search facets (objects, not array)
        var name = this.results.facets[i];
        str += "<div class='searchfacets-facet'><div class='searchfacets-facet-title'>" + name + "</div>" +
          "<div class='searchfacets-facet-values'>";
        var settings = this._getFacetSettings(name);
        var valuesCount = this.results.facets[name].facetValues.length;
        for (var v = 0;v < valuesCount;v++) {
          // TODO limit number of values shown
          if (v < this.listSize || (v < this.extendedSize && settings.extended) || settings.showAll) {
            str += "<div class='searchfacets-facet-value'>" + this.results.facets[name].facetValues[v] + "</div>";
          }
        }
        if (valuesCount > this.listSize) {
          if (!settings.extended) {
            // html for 'show more'
            str += "<div class='searchfacets-more'><a href='#' id='" + this.container + "-" + name + "-more-link'>More...</a></div>";
            more.push(name);
          } else {
            if (valuesCount > this.extendedSize && !settings.showAll && this.allowShowAll) {
              // html for 'show all'
              extended.push(name);
            }
          }
        }
        str += "</div></div>";
      }
    }
  }
  
  str += "</div>";
  
  document.getElementById(this.container).innerHTML = str;
  
  // set up event handlers
  var self = this;
  for (var i = 0;i < more.length;i++) {
    document.getElementById(container + "-" + more[i] + "-more-link").onclick = function() {self._more(more[i]);};
  }
  for (var i = 0;i < extended.length;i++) {
    document.getElementById(container + "-" + extended[i] + "-extended-link").onclick = function() {self._extended(extended[i]);};
  }
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
  this.results = results;
  this._refresh();
};














// SEARCH RESULTS ELEMENT

com.marklogic.widgets.searchresults = function(container) {
  this.container = container;
  
  this.results = null;
  
  this.processors = new Array();
  this.availableProcessors = new Array();
  this.processorPriority = new Array();
  
  this.addProcessor("default",
    function(result) {
      return true; // handles all results
    }, function(result) {
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
  );
  
  this._refresh();
  
  // event handlers
  this.selectionPublisher = new com.marklogic.events.Publisher();
};

com.marklogic.widgets.searchresults.prototype.updateResults = function(results) {
  this.results = results;
  
  this._refresh();
};

com.marklogic.widgets.searchresults.prototype._refresh = function() {
  // update results
  if (false == this.results || true == this.results ) {
    // TODO show/hide refresh image based on value of this.results (true|false)
    return;
  }
  if (null == this.results || this.results.results.length == 0) {
    document.getElementById(this.container).innerHTML = 
      "<div class='searchresults-inner'>" +
        "<div class='searchresults-title'>Results</div><div class='searchresults-results'>No Results</div>" +
      "</div>";
  } else {
    console.log("RESULTS OBJECT: " + JSON.stringify(this.results));
    
    var resStr = 
      "<div class='searchresults-inner'><div class='searchresults-title'>Results</div><div class='searchresults-results'>";
    
    for (var i = 0;i < this.results.results.length;i++) {
      // run processors in order
      var result = this.results.results[i];
      var found = false
      for (var p = 0;!found && p < this.processorPriority.length;p++) {
        var pname = this.processorPriority[p];
        if (this.processors[pname].matcher(result)) {
          found = true;
          resStr += this.processors[pname].processor(result);
        }
      }
      
    }
    resStr += "</div></div>"; // end of results container div and results inner
    console.log("RES STR: " + resStr);
    
    document.getElementById(this.container).innerHTML = resStr;
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

com.marklogic.widgets.searchpager.prototype.updatePage = function(results) {
  if (false == this.results || true == this.results ) {
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
  console.log("start now: " + this.start + ", lastpage: " + lastpage);
  if (Math.floor(this.start / this.perPage) > lastpage) {
    console.log("new page greater than maxpage");
    this.start = 1 + Math.floor(this.perPage * (lastpage - 1));
    console.log("start now now: " + this.start);
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
  
  // html
  this._refresh();
};

com.marklogic.widgets.searchsort.prototype._refresh = function() {
  document.getElementById(this.container).innerHTML = 
    "<span class='searchsort-text'>Sort: </span>" +
    "<select class='searchsort-select'>" +
      "<option value='relevance'>Relevance</option>" +
    "</select>";
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








// SEARCH PAGE ELEMENT (combines others)

com.marklogic.widgets.searchpage = function(container) {
  this.container = container;
  
  document.getElementById(container).innerHTML = 
   "<div class='container_12 searchpage-inner'>" +
    "<div id='" + container + "-facets' class='grid_4 searchpage-facets'> </div> " + 
    "<div id='" + container + "-main' class='grid_8 searchpage-main'>" +
      "<div id='" + container + "-bar' class='searchpage-bar'></div>" +
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
  
  // cross register handlers
  var self = this;
  this.bar.addResultsListener(function(res) {self.results.updateResults(res);});
  this.bar.addResultsListener(function(res) {self.pager.updatePage(res);});
  this.bar.addResultsListener(function(obj) {self.facets.updateFacets(obj);});
  this.bar.addSortListener(function(obj) {self.sort.updateSort(obj);});
  
  this.sort.addSelectionListener(function(obj) {self.bar.updateSort(obj);});
  this.facets.addSelectionListener(function(obj) {self.bar.updateFacets(obj);});
  this.pager.addPageListener(function(obj) {self.bar.updatePage(obj);});
  
  // set default connection
  this.db = mldb.defaultconnection;
};

com.marklogic.widgets.searchbar.prototype.setConnection = function(connection) {
  this.db = connection;
  // update search bar connection
  this.bar.setConnection(connection);
};

com.marklogic.widgets.searchpage.reset = function() {
  this.bar.reset(); // updates other widgets through event handlers
};

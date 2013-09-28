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

com.marklogic.widgets.searchhelper.snippet = function(result) {
  var resStr = "";
  
        for (var i = 0;i < result.matches.length;i++) {
          resStr += "<div class='searchresults-snippet'>\"";
          for (var m = 0;m < result.matches[i]["match-text"].length;m++) {
            if ("string" == typeof result.matches[i]["match-text"][m]) {
              resStr += result.matches[i]["match-text"][m] ;
            } else {
              resStr += "<span class='searchresults-snippet-highlight'>" + result.matches[i]["match-text"][m].highlight + "</span>";
            }
          }
          resStr += "\"</div>";
        }
        
  return resStr;
};

com.marklogic.widgets.searchhelper.splitdash = function(value,mode) {
  if (value == undefined || value == null) {
    mljs.defaultconnection.logger.warn("WARNING: splitdash(): value is " + value);
    return "";
  }
  if ("string" != typeof value) {
    mljs.defaultconnection.logger.warn("WARNING: splitdash(): value is not of type string, but of type '" + (typeof value) + "'");
    return "" + value; // return raw value - can be converted to string
  }
  var name = value;
  if ("all" == mode || "splitdash" == mode) {
    //mljs.defaultconnection.logger.debug("Apply splitdash transform to " + name);
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
    //mljs.defaultconnection.logger.debug("Apply splitunderscore transform to " + name);
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
    //mljs.defaultconnection.logger.debug("Apply camelcase transform to " + name);
    var parts = name.split(" ");
    var nn = "";
    for (var i = 0;i < parts.length;i++) {
      nn += parts[i].substring(0,1).toUpperCase() + parts[i].substring(1) + " ";
    }
    name = nn.trim();
  }
  return name;
};

com.marklogic.widgets.searchhelper.jsontohtml = function(json) {
  var str = "<div class='jsonhtml'>";
  for (var tag in json) {
    if ("object" == typeof json[tag]) {
      str += "<div class='jsonproperty'><div class='jsonpropertytitlewrapper'><span class='jsonpropertytitle'>" + com.marklogic.widgets.searchhelper.camelcase(tag) + ":- </span></div>";
      str += com.marklogic.widgets.searchhelper.jsontohtml(json[tag]);
      str += "</div>";
    } else {
      // simple value
      str += "<div class='jsonproperty'><div class='jsonpropertytitlewrapper'>";
      str += "<span class='jsonpropertytitle'>" + com.marklogic.widgets.searchhelper.camelcase(tag) + ": </span>";
      str += "<span class='jsonpropertyvalue'>" + json[tag] + "</span>";
      str += "</div></div>";
    }
  }
  str += "</div>";
  return str;
};

com.marklogic.widgets.searchhelper.xmltohtml = function(xml) {
  // Take first text element as title, second as snippet
  // TODO if needed - see search results logic itself for xmlDoc.evaluate
};












// SEARCH BAR ELEMENT

/**
 * Creates a search bar widget
 * @constructor
 */
com.marklogic.widgets.searchbar = function(container) {
  if (undefined == com.marklogic.widgets.searchbar.list) {
    com.marklogic.widgets.searchbar.list = new Array(); // [containerID] -> searchbar widget
  }
  this.container = container;
  
  this.ctx = new mljs.prototype.searchcontext();
  
  this._mode = "fullquery"; // also 'contributestructured' for contributing simple word queries to search context
  
  // draw widget within container
  mljs.defaultconnection.logger.debug("adding search bar html");
  document.getElementById(container).innerHTML = 
    "<div class='searchbar-inner'>" +
      "<div class='searchbar-queryrow'>" +
        "<label class='searchbar-label' for='" + container + "-searchinput'>Search: </label>" +
        "<input class='searchbar-query' type='text' id='" + container + "-searchinput' value='' />" +
        "<input class='btn btn-primary searchbar-submit' type='submit' id='" + container + "-submit' value='Search' />" +
      "</div><div class='searchbar-errorrow hidden'></div>";
    "</div>";
  mljs.defaultconnection.logger.debug("adding submit click handler");
  var self = this;
  document.getElementById(container + "-submit").onclick = function() {self._dosearch(self);}; // TODO Check this is valid
  mljs.defaultconnection.logger.debug("added submit click handler");
  
  // now do enter click handler
  var searchKeyPress = function(e)
    {
        // look for window.event in case event isn't passed in
        if (typeof e == 'undefined' && window.event) { e = window.event; }
        if (e.keyCode == 13)
        {
            document.getElementById(container + "-submit").click();
        }
    };
  document.getElementById(container + "-searchinput").onkeypress = searchKeyPress;
  
};

com.marklogic.widgets.searchbar.__dosearch = function(submitelement) {
  // figure out which search bar we need
  var id = submitelement.getAttribute("id");
  // remove -searchinput from elid
  id = id.substring(0,id.length - 12);
  // execute it's dosearch method
  var bar = com.marklogic.widgets.searchbar.list[id];
  if (null == id) {
    mljs.defaultconnection.logger.debug("searchbar.__dosearch - search bar instance does not exist: " + id);
  } else {
    bar._dosearch();
  }
};

/**
 * Clears the search string in the input box of this widget
 */
com.marklogic.widgets.searchbar.prototype.clear = function() {
  document.getElementById(this.container + "-searchinput").value = "";
  this.ctx.reset();
};

/**
 * Executes the search currently container in this widget's input box. Useful to execute a 'blank' search on initial page load without user interaction.
 */
com.marklogic.widgets.searchbar.prototype.execute = function() {
  var q = document.getElementById(this.container + "-searchinput").value;
  this.ctx.dosimplequery(q);
};

com.marklogic.widgets.searchbar.prototype.setMode = function(mode) {
  this._mode = mode;
};

com.marklogic.widgets.searchbar.prototype.setModeContributeStructured = function() {
  this._mode = "contributestructured";
};

com.marklogic.widgets.searchbar.prototype._dosearch = function(self) {
  // get our search input element
  var q = document.getElementById(self.container + "-searchinput").value;
  
  // TODO parse for Sort and Facets values, and update listeners accordingly (user may remove facets/sort by hand)
  if (this._mode == "fullquery") {
    self.ctx.dosimplequery(q);
  } else if (this._mode == "contributestructured") {
    var qb = new this.ctx.db.query();
    qb.query(qb.term(q));
    self.ctx.contributeStructuredQuery(this.container,qb.toJson().query);
  }
};

com.marklogic.widgets.searchbar.prototype.updateSimpleQuery = function(q) {
  if (null != q && undefined != q && "" != q) {
    mljs.defaultconnection.logger.debug(" - updateSimpleQuery: Setting query string to: " + q);
    document.getElementById(this.container + "-searchinput").value = q;
  }
};

com.marklogic.widgets.searchbar.prototype.updateResults = function(results) {
  if (typeof (results) != "boolean" && undefined != results && null != results && undefined != results.qtext) {
    mljs.defaultconnection.logger.debug(" - updateResults: Setting query string to: " + results.qtext);
    document.getElementById(this.container + "-searchinput").value = results.qtext;
  }
};

com.marklogic.widgets.searchbar.prototype.setContext = function(context) {
  this.ctx = context;
};









// SEARCH FACETS ELEMENT

/**
 * Creates a search facets interactive widget in the specified container.
 * 
 * @param {string} container - The HTML ID of the element this widget should place its content in to.
 */
com.marklogic.widgets.searchfacets = function(container) {
  this.container = container;
  
  this.listSize = 5;
  this.extendedSize = 10;
  this.allowShowAll = true;
  this.facetSettings = new Array();
  this.hideEmptyFacets = true;
  
  this.results = null;
  
  this.ctx = mljs.defaultconnection.createSearchContext();
  
  this.selected = new Array();
  
  this.facetNameTransform = "all"; // This is camelcase and splitdash and splitunderscore
  this.facetValueTransform = "all"; // This is camelcase and splitdash and splitunderscore
  
  // set up event handlers
  this.selectionPublisher = new com.marklogic.events.Publisher();
  
  // html
  this._refresh();
};

com.marklogic.widgets.searchfacets.prototype.setContext = function(context) {
  this.ctx = context;
};


com.marklogic.widgets.searchfacets.prototype._setFacetSettings = function(facetName,extended,showall) {
  var json = {extended: extended, showAll: showall};
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

/**
 * Clears the facet widget of all results.
 */
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
  
  var str = "<div class='mljswidget searchfacets'><div class='title searchfacets-title'>Browse</div> <div id='" + this.container + "-facetinfo' class='search-facets'> ";
  
  // draw selected facets and deselectors
  var deselectionTodo = new Array();
  if (0 != this.selected.length) {
    str += "<div class='searchfacets-selected'>";
    
    // lopp through selected
    for (var i = 0;i < this.selected.length;i++) {
      var s = this.selected[i];
      str += "<div class='searchfacets-selection'>" + 
        "<a href='#" + this.container + "-desel-" + s.name + "-" + s.value + "' class='searchfacets-deselect' id='" + this.container + "-desel-" + s.name + "-" + s.value + "'>X</a> " +
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
        var facetStr = "<div class='searchfacets-facet' id='" + this.container + "-facetinfo-" + name + "'><div class='searchfacets-facet-title'>" + this._transformFacetName(name) + "</div>" +
          "<div class='searchfacets-facet-values'>";
        var settings = this._getFacetSettings(name);
        var max = this.listSize;
        var values = this.results.facets[name].facetValues;
        // sort facets first by count
        bubbleSort(values, "count");
        var valuesCount = values.length;
        if (settings.extended) {
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
            // html for 'show more'
          if (!settings.showAll) { // we should show more or less in the more div (but not if we show 'less' in the extended div, hence if !showAll)
            facetStr += "<div class='searchfacets-more'><a href='#" + this.container + "-facetinfo-" + name + "' id='" + this.container + "-" + name + "-more-link'>";
            
            if (!settings.extended) {
              facetStr += "More";
            } else {
              facetStr += "Less";
            }
            facetStr += "...</a></div>";
            more.push(name);
          }
          
          if (settings.extended) {
            // show all link
            if (valuesCount > this.extendedSize && this.allowShowAll) {
              facetStr += "<div class='searchfacets-extended'><a href='#" + this.container + "-facetinfo-" + name + "' id='" + this.container + "-" + name + "-extended-link'>";
              if (settings.showAll) {
                facetStr += "Less"
              } else {
                facetStr += "All";
              }
              facetStr += "...</a></div>";
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
  
  str += "</div></div>";
  
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
  var addmoreh = function(morei) {
    document.getElementById(self.container + "-" + morei + "-more-link").onclick = function() {self._more(morei);};
  };
  for (var i = 0;i < more.length;i++) {
    var morei = more[i];
    mljs.defaultconnection.logger.debug("more[i]: " + morei + " , i: " + i);
    addmoreh(morei);
  }
  
  // extended handlers
  var addexth = function(exti) {
    document.getElementById(self.container + "-" + exti + "-extended-link").onclick = function() {self._extended(exti);};
  };
  for (var i = 0;i < extended.length;i++) {
    var exti = extended[i];
    mljs.defaultconnection.logger.debug("extended[i]: " + exti + " , i: " + i);
    addexth(exti);
  }
  
  // TODO less handlers
};

com.marklogic.widgets.searchfacets.prototype._selectFacet = function(facetName,value) {
  mljs.defaultconnection.logger.debug("Selecting " + facetName + ":" + value);
  // TODO check that this facet value isn't already selected
  this.selected.push({name: facetName,value: value});
  // draw selection
  this._refresh();
  // fire event to handlers
  this.selectionPublisher.publish(this.selected);
};

com.marklogic.widgets.searchfacets.prototype._deselectFacet = function(facetName,value) {
  mljs.defaultconnection.logger.debug("Deselecting " + facetName + ":" + value);
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
  mljs.defaultconnection.logger.debug("searchfacets._more: " + facetName + ", extended currently: " + this._getFacetSettings(facetName).extended);
  this._setFacetSettings(facetName,!this._getFacetSettings(facetName).extended,false);
  this._refresh();
};

com.marklogic.widgets.searchfacets.prototype._extended = function(facetName) {
  mljs.defaultconnection.logger.debug("searchfacets._extended: " + facetName + ", showAll currently: " + this._getFacetSettings(facetName).showAll);
  this._setFacetSettings(facetName,true,!this._getFacetSettings(facetName).showAll);
  this._refresh();
};

/**
 * Sets the initial list size and the extended list size to show. Controls number of results to show per facet.
 * 
 * @param {positiveInteger} listSize - Number of results to show per facet (listed by descending frequency)
 * @param {positiveInteger} extendedSize - Number of results to show per facet if 'show more' is clicked.
 */
com.marklogic.widgets.searchfacets.prototype.setSizes = function(listSize,extendedSize) {
  this.listSize = listSize;
  this.extendedSize = extendedSize;
};

/**
 * Sets whether to allow the user to show all results per facet.
 * 
 * @param {boolean} boolvalue - Whether to enable the 'show all' link after clicking 'show more'.
 */
com.marklogic.widgets.searchfacets.prototype.setAllowShowAll = function(boolvalue) {
  this.allowShowAll = boolvalue;
};

/**
 * Adds a facet selection (click) listener to this widget
 * 
 * @param {function(facetSelectionJSON)} sl - Selection listener function
 */
com.marklogic.widgets.searchfacets.prototype.addFacetSelectionListener = function(sl) {
  this.selectionPublisher.subscribe(sl);
};

/**
 * Remove a facet selection listener from this widget
 * 
 * @param {function(facetSelectionJSON)} sl - Selection listener function
 */
com.marklogic.widgets.searchfacets.prototype.removeFacetSelectionListener = function(sl) {
  this.selectionPublisher.unsubscribe(sl);
};

/**
 * Event Target. Link to a search bar (or advanced search)'s addResultListener function (NOT addFacetListener)
 * 
 * @param {JSON} results - The REST API search results JSON object. See GET /v1/search.
 */
com.marklogic.widgets.searchfacets.prototype.updateFacets = function(results) {
  if ("boolean" == typeof results) {
    return;
  }
  this.results = results;
  
  // extract selected facet values
  this.selected = this.ctx.lastParsed.facets;
  
  this._refresh();
};

/**
 * Event Target. Used if another widget updates the facets via the search bar. E.g. manually type a facet value.
 * 
 * @param {JSON[]} facets - The JSON facet objects that are currently selected.
 */
com.marklogic.widgets.searchfacets.prototype.updateSelectedFacets = function(facets) {
  mljs.defaultconnection.logger.debug("In updateSelectedFacets(facets): " + JSON.stringify(facets));
  this.selected = facets;
  this._refresh();
};














// SEARCH RESULTS ELEMENT

/**
 * Displays a list of search results, rendered appropriately for the content. Supports custom renderers. 
 * These could render content in the search result or use the URI to fetch more information on the document.
 * Supports both JSON and XML (likely XHTML) content display by default.
 * Also allows making the entire result clickable, to navigate to another application page, supporting dynamic URL creation.
 * 
 * @constructor
 * @param {string} container - HTML ID of the element in which to draw this widget's content
 */
com.marklogic.widgets.searchresults = function(container) {
  this.container = container;
  
  this.ctx = mljs.defaultconnection.createSearchContext();
  
  this.processors = new Array();
  this.availableProcessors = new Array();
  this.processorPriority = new Array();
  
  this.detailsLink = null;
  
  this.lazyId = 1;
  this.lazyLoaders = new Array();
  
  var self = this;
  
  var htmlRec = function(content) {
    var resStr = "";
    console.log("type of content: " + (typeof content));
    if ("string" == typeof content) {
      return content;
    } else {
      for (var tag in content) {
        console.log("processing tag: " + tag);
        resStr += "<" + tag;
        if (undefined != content[tag].class) {
          resStr += " class='" + content[tag].class + "'";
          content[tag].class = undefined;
        }
        if (undefined != content[tag].id) {
          resStr += " id='" + content[tag].id + "'";
          content[tag].id = undefined;
        }
        resStr += ">";
        console.log("calling htmlRec for tag: " + tag);
        resStr += htmlRec(content[tag]);
        resStr += "</" + tag + ">";
      }
      return resStr;
    }
  };
  this.defaultProcessor = {
    matcher: function(result) {
      return true; // handles all results
    }, 
    processor: function(result) {
      // check if 1 root json element that is called 'html'
      /*
      console.log("TYPEOF: " + (typeof result.content));
      console.log("length: " + ( result.content.length));
      console.log("html: " + ( result.content.html)); */
      self.ctx.db.logger.debug("matches: " + result.matches);
      if (undefined != result.matches) {
        self.ctx.db.logger.debug("first match: " + result.matches[0]);
        self.ctx.db.logger.debug("match text: " + result.matches[0]["match-text"]);
        self.ctx.db.logger.debug("match text 0: " + result.matches[0]["match-text"][0]);
      }
      if ("string" == typeof result.content && -1 != result.content.indexOf("html")) { // TODO replace with XPath as this is very wide ranging - http://www.w3.org/1999/xhtml (escape dots?)
          // Get title from /html/head/title or /html/body/h1[1] or /html/body/h2[1] or /html/body/p[1]
          // don't rely on xml.evaluate() though
          self.ctx.db.logger.debug("searchresults: defaultProcesor: Got HTML content");
          var titleStart = result.content.indexOf("title>"); // NB can't do <title because there may be a random namespace name. Replace this with XPATH if supported
          var titleEnd = result.content.indexOf("title>",titleStart + 6);
          var bodyStart = result.content.indexOf("body");
          var bodyEnd = result.content.indexOf(">",bodyStart + 4);
          var endBodyStart = result.content.indexOf("body",bodyEnd + 1);
          self.ctx.db.logger.debug("titleStart: " + titleStart);
          self.ctx.db.logger.debug("titleEnd: " + titleEnd);
          self.ctx.db.logger.debug("bodyStart: " + bodyStart);
          self.ctx.db.logger.debug("bodyEnd: " + bodyEnd);
          self.ctx.db.logger.debug("endBodyStart: " + endBodyStart);
          
          //var endBodyEnd = result.content.indexOf(">",endBodyStart + 6);
          
          var bodyContent = result.content.substring(bodyEnd + 1,endBodyStart);
          self.ctx.db.logger.debug("bodyContent: " + bodyContent);
          var title = result.uri;
          if (-1 != titleStart && -1 != titleEnd) {
            title = result.content.substring(titleStart + 6,titleEnd);
          } else {
            var firstElStart = bodyContent.indexOf("<");
            var firstElEnd = bodyContent.indexOf(">",firstElStart + 1);
            var endFirstElStart = bodyContent.indexOf("</",firstElEnd);
            if (-1 != firstElStart && -1 != firstElEnd && -1 != endFirstElStart) {
              title = bodyContent.substring(firstElEnd + 1,endFirstElStart);
            } 
          }
          self.ctx.db.logger.debug("title: " + title);
          // render first 4 elements from /html/body/element()[1 to 4]
          // render all content for now
          
          var resStr = "<div class='searchresults-result'><h3>" + result.index + ". " + title + "</h3>";
          resStr += "<div class='searchresults-snippet'>" + bodyContent + "</div>";
          resStr += "</div>";
          return resStr;
          
        //} else {
          
          /*
          self.ctx.db.logger.debug("defaultProcessor: Got JSON Object rendering of an HTML document");
          // is a xhtml document rendered as json
          var content = result.content.html.body;
          var resStr = htmlRec(content);
          */
        } 
       else if (undefined != result.matches && undefined != result.matches[0] && undefined != result.matches[0]["match-text"] && undefined != result.matches[0]["match-text"][0] /*&& result.matches[0]["match-text"][0].indexOf("<html") == 0*/) {
        self.ctx.db.logger.debug("defaultProcessor: Got a snippet match with a html element");
        
        //var xml = textToXML(result.matches[0]["match-text"][0]);
        //var txt = result.matches[0]["match-text"][0];
        //self.ctx.db.logger.debug("RAW HTML TEXT: " + txt);
        //var strip = txt.substring(txt.indexOf(">",txt.indexOf("<body") + 5) + 1,txt.indexOf("</body>"));
        //self.ctx.db.logger.debug("STRIP TEXT: " + strip);
        var title = null;
        //var titleEl = xml.getElementsByTagName("title")[0];
        self.ctx.db.logger.debug("PATH: " + result.path);
        //if (undefined != titleEl && null != titleEl && null != titleEl.nodeValue) {
        //  title = titleEl.nodeValue;
        //} else {
          title = result.path.substring(8,result.path.length - 2);
        //}
        var resStr = "<div class='searchresults-result'><h3>" + result.index + ". " + title + "</h3>";
        //resStr += "<div class='searchresults-snippet'>" + (new XMLSerializer()).serializeToString(xml.getElementsByTagName("body")[0]) + "</div>";
        
        
        resStr += com.marklogic.widgets.searchhelper.snippet(result);
        
        //resStr += "<div class='searchresults-snippet'>" + /*strip*/ txt + "</div>";
        //resStr += "<div class='searchresults-snippet'><iframe scrolling='no'>" + result.matches[0]["match-text"][0] + "</iframe></div>";
        
        resStr += "</div>";
        return resStr;
      } else if ("object" == typeof(result.content)) {
        // TRY TO GUESS JSON CONTENT
        self.ctx.db.logger.debug("defaultProcessor: Got JSON Object content");
        
        var resStr = "";
        // parse each results and snippet / raw content
        var title = result.uri;
        if (undefined != result.content && undefined != result.content.title ) {
          title = result.content.title;
        }
        var snippet = null;
        // TODO show all content if snippeting mode is snippet
        if (undefined != result.content && undefined != result.content.summary) {
          snippet = result.content.summary;
        } else if (undefined != result.content) {
          //snippet = JSON.stringify(result.content); 
          snippet = com.marklogic.widgets.searchhelper.jsontohtml(result.content);
          // TODO check for XML (string not object) content in results.results[i].content
        } else {
          // no snippet available
        }
        
        if (null == snippet) {
          // TODO show JSON tree structure as HTML
          self.ctx.db.logger.debug("defaultProcessor: No JSON summary, building JSON tree HTML output");
        }
        
        resStr += "<div class='searchresults-result'><h3>" + result.index + ". " + title + "</h3>";
        if (null != snippet) {
          resStr += "<div class='searchresults-snippet'>" + snippet + "</div>";
        }
        resStr += "</div>";
        return resStr;
      } else {
        // ATTEMPT TO PARSE AS XML
        self.ctx.db.logger.debug("defaultProcessor: Got suspected XML - last processor option anyway...");
        try {
          var xmlDoc = textToXML(result.content);
          self.ctx.db.logger.debug("defaultProcessor:  - XML parse successful...");
          
          var resStr = "";
          // parse each results and snippet / raw content
          var title = result.uri;
          var snippet = null;
          
          if (undefined != xmlDoc.evaluate) {
            // check for common title names - title, name, id, h1
            var evalResult = xmlDoc.evaluate("//title[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
            if (undefined == evalResult || "" == evalResult.stringValue) {
              self.ctx.db.logger.debug("defaultProcessor: //title[1]/text() undefined");
              evalResult = xmlDoc.evaluate("//name[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
              
              if (undefined == evalResult || "" == evalResult.stringValue) {
              self.ctx.db.logger.debug("defaultProcessor: //name[1]/text() undefined");
                evalResult = xmlDoc.evaluate("//id[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
              
                if (undefined == evalResult || "" == evalResult.stringValue) {
              self.ctx.db.logger.debug("defaultProcessor: //id[1]/text() undefined");
                  evalResult = xmlDoc.evaluate("//h1[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
              
                  if (undefined == evalResult || "" == evalResult.stringValue) {
              self.ctx.db.logger.debug("defaultProcessor: //h1[1]/text() undefined");
                    self.ctx.db.logger.debug("defaultProcessor: trying (//text())[1]");
                    evalResult = xmlDoc.evaluate("(//text())[1]",xmlDoc,null,XPathResult.STRING_TYPE,null);
                    self.ctx.db.logger.debug("defaultProcessor: output: " + evalResult.stringValue);
                  }
                }
              }
            }
            if (undefined != evalResult && null != evalResult && "" != evalResult.stringValue) {
              title = evalResult.stringValue;
            }
            // check for common snippet names - summary, synopsis, description, details
            evalResult = xmlDoc.evaluate("//summary[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
            if (undefined == evalResult || "" == evalResult.stringValue) {
              self.ctx.db.logger.debug("defaultProcessor: //summary[1]/text() undefined");
              evalResult = xmlDoc.evaluate("//synopsis[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
              if (undefined == evalResult || "" == evalResult.stringValue) {
              self.ctx.db.logger.debug("defaultProcessor: //synopsis[1]/text() undefined");
                evalResult = xmlDoc.evaluate("//description[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
                if (undefined == evalResult || "" == evalResult.stringValue) {
              self.ctx.db.logger.debug("defaultProcessor: //description[1]/text() undefined");
                  evalResult = xmlDoc.evaluate("//details[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
                  
                  if (undefined == evalResult || "" == evalResult.stringValue) {
              self.ctx.db.logger.debug("defaultProcessor: //details[1]/text() undefined");
                    self.ctx.db.logger.debug("defaultProcessor: trying (//text())[2]");
                    evalResult = xmlDoc.evaluate("(//text())[2]",xmlDoc,null,XPathResult.STRING_TYPE,null);
                    self.ctx.db.logger.debug("defaultProcessor: output: " + evalResult.stringValue);
                  }
                }
              }
            }
            if (undefined != evalResult && null != evalResult && "" != evalResult.stringValue) {
              snippet = evalResult.stringValue;
            }
          }
        
          if (null == snippet) {
            // show XML tree structure as HTML
            self.ctx.db.logger.debug("defaultProcessor: No XML summary, building XML tree HTML output");
            
            // display tree of XML
            snippet = com.marklogic.widgets.searchhelper.xmltohtml(xmlDoc); // TODO
          }
          
          if (null == snippet) {
            snippet = result.content;
          }
        
          resStr += "<div class='searchresults-result'><h3>" + result.index + ". " + title + "</h3>";
          if (null != snippet) {
            resStr += "<div class='searchresults-snippet'>" + snippet + "</div>";
          }
          resStr += "</div>";
          return resStr;
        } catch (err) {
          self.ctx.db.logger.debug("defaultProcessor: XML mode: Failed to create XML document from text: " + result.content);
        }
      }
    }
  };
  
  this.builtinProcessors = [];
  this.builtinProcessors["svg"] = {
   matcher: function(result) {
    var xml = null;
    if ("string" == typeof result.content) {
      xml = textToXML(result.content);
    } else if ("object" == typeof result.content && undefined != result.content.nodeType) {
      xml = result.content; // should never happen - always returned as string
    }
    if (null != xml) {
      // check namespace and root element
      if (xml.childNodes[0].nodeName == "svg") {
        mljs.defaultconnection.logger.debug("Potential SVG nodeName: " + xml.childNodes[0].nodeName);
        mljs.defaultconnection.logger.debug("Potential SVG nodeType: " + xml.childNodes[0].nodeType);
        return true;
      } else {
        return false;
      }
    }
    return false;
  }, processor: function (result) {
    return "<div class='searchresults-result'><h3>" + result.index + ". " + result.uri + "</h3>" +
      "<div style='height: 200px;position:relative;'>" + result.content + "</div></div>"; // returns the full xml to be applied within the document as SVG
  } };
  
  this._refresh();
  
  // event handlers
  this.selectionPublisher = new com.marklogic.events.Publisher();
};

com.marklogic.widgets.searchresults.prototype.setContext = function(context) {
  this.ctx = context;
};


/**
 * Sets the URL specification and enables clickable result links. Replaces #URI# with the URI of the clicked document.
 * 
 * @param {string} urlspec - URL specification to use
 */
com.marklogic.widgets.searchresults.prototype.details = function(urlspec) {
  this.detailsLink = urlspec;
};

/**
 * Clears all results from this widget.
 */
com.marklogic.widgets.searchresults.prototype.clear = function() {
  this.results = null;
  this._refresh();
};

/**
 * Event target. Link to a search (or advanced search)'s addResultListener method.
 * 
 * @param {JSON} results - REST API JSON result object. See GET /v1/search
 */
com.marklogic.widgets.searchresults.prototype.updateResults = function(results) {
  this.results = results;
  
  this._refresh();
};

com.marklogic.widgets.searchresults.prototype._refresh = function() {
  // update results
  if (typeof this.results == "boolean" ) {
    // TODO show/hide refresh image based on value of this.results (true|false)
    if (true == this.results) {
      document.getElementById(this.container).innerHTML = "<div class='mljswidget searchresults-inner'>" +
        "<h2 class='title searchresults-title'>Results</h2><div class='searchresults-results'>" + 
        com.marklogic.widgets.bits.loading(this.container + "-loading") + "</div></div>";
    } else {
      document.getElementById(this.container).innerHTML = "<div class='mljswidget searchresults-inner'>" +
        "<h2 class='title searchresults-title'>Results</h2><div class='searchresults-results'>" + 
        com.marklogic.widgets.bits.failure(this.container + "-failure") + "</div></div>";
    }
    return;
  }
  this.lazyLoaders = new Array();
  if (null == this.results || undefined == this.results.results || this.results.results.length == 0) {
    document.getElementById(this.container).innerHTML = 
      "<div class='mljswidget searchresults-inner'>" +
        "<h2 class='title searchresults-title'>Results</h2><div class='searchresults-results'>No Results</div>" +
      "</div>";
  } else {
    mljs.defaultconnection.logger.debug("RESULTS OBJECT: " + JSON.stringify(this.results));
    
    var resStr = 
      "<div class='mljswidget searchresults-inner'><h2 class='title searchresults-title'>Results</h2><div class='searchresults-results'>";
      
    var uureplace = 1001;
    var replacements = new Array();
    
    var pointer = null != this.detailsLink;
    
    for (var i = 0;i < this.results.results.length;i++) {
      resStr += "<div id='" + this.container + "-searchresults-wrapper-" + i + "' class='searchresults-wrapper"
      if (pointer) {
        resStr += " searchresults-navigable";
      }
      resStr += "'>";
        
        
      // run processors in order
      var result = this.results.results[i];
      var found = false;
      for (var p = 0;!found && p < this.processorPriority.length;p++) {
        var pname = this.processorPriority[p];
        mljs.defaultconnection.logger.debug("checking applicability of processor: " + pname);
        if (this.processors[pname].matcher(result)) {
          found = true;
          mljs.defaultconnection.logger.debug("found processor: " + pname);
          var returned = this.processors[pname].processor(result,this);
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
        mljs.defaultconnection.logger.debug("No processor found, checkin builtins");
        for (var pname in this.builtinProcessors) {
          if ('object' == typeof(this.builtinProcessors[pname]) && this.builtinProcessors[pname].matcher(result)) {
            found = true;
            mljs.defaultconnection.logger.debug("found builtin processor: " + pname);
            var returned = this.builtinProcessors[pname].processor(result,this);
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
          mljs.defaultconnection.logger.debug("No processor found, using default");
          resStr += this.defaultProcessor.processor(result);
        }
      }
      
      resStr += "</div>";
    }
    resStr += "</div></div>"; // end of results container div and results inner
    mljs.defaultconnection.logger.debug("RES STR: " + resStr);
    
    document.getElementById(this.container).innerHTML = resStr;
    
    // now add click handlers to each result div, if required
    if (pointer) {
      var self = this;
      var addPointerHandler = function(id,result) {
        document.getElementById(id).onclick = function(evt) {
          self._navigateTo(result.uri);
        }
      }
      for (var i = 0;i < this.results.results.length;i++) {
        var id = this.container + "-searchresults-wrapper-" + i;
        var result = this.results.results[i];
        addPointerHandler(id,result);
      }
    }
    
    // now do any XML replacements
    for (var r = 1001;r < uureplace;r++) {
      document.getElementById(this.container + "-searchresults-xml-" + r).innerHTML = replacements[r]; // TODO verify we don't have to clone the XML document before insert (shouldn't need to)
    }
    
    // go through lazy loaders and run them
    for (var i = 0;i < this.lazyLoaders.length;i++) {
      var loader = this.lazyLoaders[i];
      loader.callback(loader.docuri,loader.elid);
    }
  }
};

com.marklogic.widgets.searchresults.prototype.generateLazyId = function() {
  return this.lazyId++;
};

com.marklogic.widgets.searchresults.prototype.lazyLoad = function(docuri,elid,callback) {
  this.lazyLoaders.push({docuri: docuri,elid: elid,callback: callback});
};

com.marklogic.widgets.searchresults.prototype._navigateTo = function(uri) {
  var go = this.detailsLink.replace("#URI#",uri);
  window.location = go;
};

/**
 * Adds a result selection listener to this widget.
 * 
 * @param {function(uri)} sl - Search listener function
 */
com.marklogic.widgets.searchresults.prototype.addSelectionListener = function(sl) {
  this.selectionPublisher.subscribe(sl);
};

/**
 * Removes a result selection listener.
 * 
 * @param {function(uri)} sl - Search listener function
 */
com.marklogic.widgets.searchresults.prototype.removeSelectionListener = function(sl) {
  this.selectionPublisher.unsubscribe(sl);
};

// search results custom processing

/**
 * Adds a result processor object to this widget.
 * 
 * @param {string} name - Processor name reference
 * @param {function(result)} matcher_func - Function to invoke to see if a particular result can be handled by this processor
 * @param {function(result)} processor_func - Function to process the result to generate representative XHTML
 */
com.marklogic.widgets.searchresults.prototype.addProcessor = function(name,matcher_func,processor_func) {
  this.processors[name] = {matcher:matcher_func,processor:processor_func};
  this.availableProcessors.push(name);
  this.processorPriority.push(name);
};

/**
 * Removes a named processor from the list of available processors.
 * 
 * @param {string} name - The processor name to remove
 */
com.marklogic.widgets.searchresults.prototype.removeProcessor = function(name) {
  this.processors[name] = undefined;
  this.availableProcessors.remove(name);
  this.processorPriority.remove(name);
};

/**
 * Sets the order of checking whether a processor matches a result.
 * 
 * @param {string[]} procNameArray - Processor name array
 */
com.marklogic.widgets.searchresults.prototype.setProcessorPriority = function(procNameArray) {
  this.processorPriority = procNameArray;
};









// SEARCH RESULTS PAGINATION

/**
 * Creates a search results pager widget. Show total number of pages, current page, and which results are shown, and next/previous/first/last page navigation arrows.
 * 
 * @constructor
 * @param {string} container - HTML ID of the element to render this widget in to
 */
com.marklogic.widgets.searchpager = function(container) {
  this.container = container;
  
  this.perPage = 10;
  this.start = 0;
  this.total = 0;
  
  this.ctx = mljs.defaultconnection.createSearchContext();
  
  // event handlers
  this.pagePublisher = new com.marklogic.events.Publisher();
  
  // html
  document.getElementById(container).innerHTML = 
    "<div class='mljswidget searchpager'><span class='searchpager-showing' id='" + container + "-searchpager-showing'></span>" +
    "<span class='searchpager-first searchpager-button' id='" + container + "-searchpager-first'><a href='#' id='" + container + "-searchpager-first-a' class='searchpager-link'>&lt;&lt;  </a></span>" +
    "<span class='searchpager-previous searchpager-button' id='" + container + "-searchpager-previous'><a href='#' id='" + container + "-searchpager-previous-a' class='searchpager-link'>&lt;  </a></span>" +
    "<span class='searchpager-page' id='" + container + "-searchpager-page'>-</span>" +
    "<span class='searchpager-next searchpager-button' id='" + container + "-searchpager-next'><a href='#' id='" + container + "-searchpager-next-a' class='searchpager-link'>  &gt;</a></span>" +
    "<span class='searchpager-last searchpager-button' id='" + container + "-searchpager-last'><a href='#' id='" + container + "-searchpager-last-a' class='searchpager-link'>  &gt;&gt;</a></span></div>";
  var self = this;
  document.getElementById(container + "-searchpager-first-a").onclick = function() {self._first();};
  document.getElementById(container + "-searchpager-previous-a").onclick = function() {self._previous();};
  document.getElementById(container + "-searchpager-next-a").onclick = function() {self._next();};
  document.getElementById(container + "-searchpager-last-a").onclick = function() {self._last();};
  
  this._refresh();
};


com.marklogic.widgets.searchpager.prototype.setContext = function(context) {
  this.ctx = context;
};

/**
 * Clears the results (and thus numbers) from this widget.
 */
com.marklogic.widgets.searchpager.prototype.clear = function() {
  this.updatePage(null);
};

/**
 * Event target. Link via add addResultsListener. Updates the pager based on a new JSON results object containing a start ID and number of results per page.
 * 
 * @param {JSON} results - REST API JSON results object. See GET /v1/search
 */
com.marklogic.widgets.searchpager.prototype.updatePage = function(results) {
  mljs.defaultconnection.logger.debug("updatePage: results: " + results);
  
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

/**
 * Adds a listener for which page to navigate to.
 * 
 * @param {function(positiveInteger)} l - The function to invoke with the page to navigate to
 */
com.marklogic.widgets.searchpager.prototype.addPageListener = function(l) {
  this.pagePublisher.subscribe(l);
};

/**
 * Removes a page listener.
 * 
 * @param {function(positiveInteger)} l - The function to invoke with the page to navigate to
 */
com.marklogic.widgets.searchpager.prototype.removePageListener = function(l) {
  this.pagePublisher.unsubscribe(l);
};

com.marklogic.widgets.searchpager.prototype._refresh = function() {
  mljs.defaultconnection.logger.debug("REFRESH: start: " + this.start + ", total: " + this.total + ", perPage: " + this.perPage);
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
  var page = Math.ceil(st / this.perPage);
  var maxpage = Math.ceil(this.total / this.perPage);
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
  mljs.defaultconnection.logger.debug("start now: " + this.start + ", lastpage: " + lastpage);
  if (Math.floor(this.start / this.perPage) > lastpage) {
    mljs.defaultconnection.logger.debug("new page greater than maxpage");
    this.start = 1 + Math.floor(this.perPage * (lastpage - 1));
    mljs.defaultconnection.logger.debug("start now now: " + this.start);
  }
  this._fire();
};

com.marklogic.widgets.searchpager.prototype._last = function() {
  var lastpage = 1 + Math.floor(this.total / this.perPage);
  this.start = 1 + Math.floor(this.perPage * (lastpage - 1));
  this._fire();
};











// SEARCH SORT ELEMENT

/**
 * Shows a search sort widget. IN PROGRESS - selecting a sort option does not currently do anything.
 * 
 * @constructor
 * @param {string} container - The HTML ID of the element to render this widget into.
 */
com.marklogic.widgets.searchsort = function(container) {
  this.container = container;
  
  this.ctx = mljs.defaultconnection.createSearchContext();
  
  this.initialised = false;
  this.selectedValue = null;
  
  // event handlers
  this.selectionPublisher = new com.marklogic.events.Publisher();
  this.sortOptions = new Array();
  //this.sortOptions.push({title: "None", "json-key": "", direction: "ascending"}); // value is required
  //this.sortOptions.push({title: "Relevance", value: "relevance", order: "descending"}); // value is required
  
  // html
  this._refresh();
};

com.marklogic.widgets.searchsort.prototype.setContext = function(context) {
  this.ctx = context;
};


com.marklogic.widgets.searchsort.prototype._refresh = function() {
  var selid =  this.container + "-searchsort-select";
  var str = 
    "<div class='mljswidget searchsort'><span class='searchsort-text'>Sort: </span>" +
    "<select class='searchsort-select' id='" + selid + "'>";
//      "<option value='relevance'>Relevance</option>" +
  for (var i = 0;i < this.sortOptions.length;i++) {
    var selected = false;
    if (this.selectedValue == null) {
      selected = true;
      this.selectedValue = this.sortOptions[i];
    } else {
      selected = ((this.selectedValue["json-key"]==this.sortOptions[i]["json-key"]) &&
                  (this.selectedValue["element"]==this.sortOptions[i]["element"]) &&
                  (this.selectedValue["attribute"]==this.sortOptions[i]["attribute"]) &&
                  (this.selectedValue["field"]==this.sortOptions[i]["field"]) &&
                  (this.selectedValue["direction"]==this.sortOptions[i]["direction"]))
    }
    var o = this.sortOptions[i];
    str += "<option value='" + i + "'";
    if (selected) {
      str += " selected='selected'";
    }
    str += ">"; // use i not o.value so that we can determine o.value and o.direction on _updateSortSelect
    var title = "";
    //if (undefined != o.title) {
    //  title = o.title;
    //} else {
      var val = "";
      if (undefined != o["json-key"]) {
        val = o["json-key"];
      }
      // element, element attribute, path etc sort options
      if (undefined != o.element) {
        if (undefined != o.attribute) {
          val = o["attribute"];
        } else {
          val = o["element"];
        }
      }
      if (undefined != o.field) {
        val = o["field"];
      }
      
      title = com.marklogic.widgets.searchhelper.processValueAll(val);
    //}
    //str += " (";
    if ("" != title && undefined != o.direction) {
      title += " (" + com.marklogic.widgets.searchhelper.camelcase(o.direction,"all") + ")";
    } else {
      // TODO not specified - default to ascending? - no, leave this to the first, untitled sort option given by MarkLogic server
    }
    if ("" == title) {
      title = "None";
    }
    //str += ")";
    str += title;
  }
  str += "</select></div>";
  document.getElementById(this.container).innerHTML = str;
  
  // add event handlers
  var self = this;
  var sel = document.getElementById(selid);
  sel.onchange = function(evt) {
    self._updateSortSelect(sel.value);
  };
};

com.marklogic.widgets.searchsort.prototype._updateSortSelect = function(index) {
  var value = this.sortOptions[index];
  this.selectedValue = value;
  mljs.defaultconnection.logger.debug("searchsort: publishing selected sort option: " + JSON.stringify(value));
  // fire sort changed event
  this.selectionPublisher.publish(value);
};

/**
 * Adds a listener for a sort word selection.
 * 
 * @param {function(string)} sl - Sort selection listener function
 */
com.marklogic.widgets.searchsort.prototype.addSortListener = function(sl) {
  this.selectionPublisher.subscribe(sl);
};

/**
 * Removes a listener for a sort word selection.
 * 
 * @param {function(string)} sl - Sort selection listener function
 */
com.marklogic.widgets.searchsort.prototype.removeSortListener = function(sl) {
  this.selectionPublisher.unsubscribe(sl);
};

/**
 * Event target. Link to a search's addSortSelectionListener function. Occurs if the sort word is manually changed in the search bar.
 *
 * @param {string} sortSelection - The sort word selected.
 */
com.marklogic.widgets.searchsort.prototype.updateSort = function(sortSelection) {
  // NB do NOT fire results update event here - we've likely been called by it
  // DO NOT update our own sortOptions - there may only be one result coming back (the one the user has just selected) keep our original options
  
  // just select the correct option in the list
};

/**
 * Sets the search options to use to determine sort word choices in this control.
 * 
 * @param {JSON} options - REST API JSON options object. See PUT /v1/config/query
 */
com.marklogic.widgets.searchsort.prototype.updateOptions = function(options) {
  mljs.defaultconnection.logger.debug("searchsort: updateOptions: " + JSON.stringify(options));
  mljs.defaultconnection.logger.debug("searchsort: initalised yet?: " + this.initialised);
  
  if (this.initialised) return;
  this.initialised = true; // prevents overwriting when one is selected
  // TODO replace with a check potentially if number of sort options is not 1, or is more than our own number of sort options (-1 for none)
  
  // parse options object for sort settings
  var so = options["sort-order"];
  this.sortOptions = new Array();
  //this.sortOptions.push({title: "None", value: ""}); // value is required
  if (undefined != so) {
    for (var i = 0;i < so.length;i++) {
      this.sortOptions.push(so[i]);
      /*
      var key = so[i]["json-key"];
      if (undefined != key) {
        this.sortOptions.push({value: key, direction: so[i]["direction"], "json-key": so[i]["json-key"]});
      }*/
      // TODO check for element, element attribute, path etc. ordering values too
    }
  }
  this._refresh();
};










// SEARCH PAGE ELEMENT (combines others)

/**
 * Creates a new search page widget, containing a search bar, search pager, search sorter, search results and search facets widget.
 * 
 * @constructor
 * @param {string} container - The HTML ID of the container within which to render this widget.
 */
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
          "<div id='" + container + "-pager' class='grid_5 alpha searchpage-pager'></div>" +
          "<div id='" + container + "-sort' class='grid_3 omega searchpage-sort'></div>" +
        "</div>" +
      "</div>" +
      "<div id='" + container + "-results' class='grid_8 searchpage-results'></div>" +
      "<div id='" + container + "-results-actions' class='grid_8 searchpage-results-actions'></div>" +
    "</div></div>";
    
  this.context = mljs.defaultconnection.createSearchContext();
  
  // NB these simple names allow direct access via mypage.bar in order for page creator to set config defaults (E.g. facet size)
  this.bar = new com.marklogic.widgets.searchbar(container + "-bar");
  this.facets = new com.marklogic.widgets.searchfacets(container + "-facets");
  this.pager = new com.marklogic.widgets.searchpager(container + "-pager");
  this.sort = new com.marklogic.widgets.searchsort(container + "-sort");
  this.results = new com.marklogic.widgets.searchresults(container + "-results");
  this.error = new com.marklogic.widgets.error(container + "-error");
  
  // cross register handlers
  var self = this;
  /*
  this.bar.addResultsListener(function(res) {self.results.updateResults(res);});
  this.bar.addResultsListener(function(res) {self.pager.updatePage(res);});
  this.bar.addResultsListener(function(obj) {self.facets.updateFacets(obj);});
  this.bar.addSortListener(function(obj) {self.sort.updateSort(obj);});
  this.bar.addFacetsListener(function(obj) {self.facets.updateSelectedFacets(obj);});
  
  this.sort.addSelectionListener(function(obj) {self.bar.updateSort(obj);});
  this.facets.addSelectionListener(function(obj) {self.bar.updateFacets(obj);});
  this.pager.addPageListener(function(obj) {self.bar.updatePage(obj);});
  */
  
  this.context.register(this.bar);
  this.context.register(this.sort);
  this.context.register(this.facets);
  this.context.register(this.pager);
  this.context.register(this.results);
  
  /*
  this.bar.addErrorListener(function(obj) {
    this.error.updateError(obj);
    this.facets.clear();
    this.results.clear();
    this.page.clear();
    this.context.reset();
  });*/
  
  // set default connection
  this.db = mljs.defaultconnection;
};

/**
 * Sets the options to be used by all the search page widgets
 *
 * @tutorial 011-browser-create-app
 * 
 * @param {string} name - The search options name
 * @param {JSON} options - The REST API JSON options object
 * @param {boolean} check_options_exist - Whether to check if the options already exist on the server
 */
com.marklogic.widgets.searchpage.prototype.setOptions = function(name,options,check_options_exist) {
  this.context.setOptions(name,options);
  /*
  // set widgets with those provided
  this.bar.setOptionsName(name);
  this.bar.setOptions(options);
  this.sort.setOptions(options);
  */
};

/**
 * Execute the search in the input box
 */
com.marklogic.widgets.searchpage.prototype.execute = function() {
  this.context.dosimplequery(); // search for all
};

/**
 * Sets the mljs connection object to use
 * 
 * @param {mljs} connection - The mljs connection instance
 */
com.marklogic.widgets.searchpage.prototype.setConnection = function(connection) {
  this.db = connection;
  // update search bar connection
  this.context.setConnection(connection);
};

/**
 * Resets the search box input field
 */
com.marklogic.widgets.searchpage.reset = function() {
  this.context.reset(); // updates other widgets through event handlers
};

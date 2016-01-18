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

/**
 * Helper functions used by search widgets primarily
 * @static
 */
com.marklogic.widgets.searchhelper = {};

// TODO REMOVE PROCESSING CODE, USE THAT IN MLJS CORE's string helper functions

/**
 * Converts a value in to separate words, splitting the words by dash, underscore, and CamelCase
 *
 * @param {string} str - The value to process
 */
com.marklogic.widgets.searchhelper.processValueAll = function(str) {
  return com.marklogic.widgets.searchhelper.processValue(str,"all");
};

/**
 * Converts a value in to separate words, using the specified mode
 *
 * @param {string} str - The value to process
 * @param {string} mode - The mode ("all|splitdash|splitunderscore|camelcase")
 */
com.marklogic.widgets.searchhelper.processValue = function(str,mode) {
  var name = str;
  name = com.marklogic.widgets.searchhelper.splitdash(name,mode);
  name = com.marklogic.widgets.searchhelper.splitunderscore(name,mode);
  name = com.marklogic.widgets.searchhelper.camelcase(name,mode);
  return name;
};

/**
 * Generate a standard set of snippet HTML. Useful for integrating to custom search results renderers
 *
 * @param {result} result - REST result JSON. Should contain result.matches[{"match-text": ["", ... ]}, ... ]
 */
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

/**
 * Splits a string in to words when it encounters a dash. Returns a string with spaces instead of dashes.
 *
 * @param {string} value - The original value
 * @param {string} mode - The mode. Function only operates is mode is "all" or "splitdash"
 */
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

/**
 * Splits a string in to words when it encounters an underscore. Returns a string with spaces instead of underscores.
 *
 * @param {string} value - The original value
 * @param {string} mode - The mode. Function only operates is mode is "all" or "splitdunderscore"
 */
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

/**
 * Splits a string in to words when it encounters a capital letter. Returns a string with spaces before a capital letter.
 *
 * @param {string} value - The original value
 * @param {string} mode - The mode. Function only operates is mode is "all" or "camelcase"
 */
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

/**
 * Converts any JSON object to a nested HTML representation. Do NOT pass this function circular JSON objects.
 *
 * @param {json} json - The JSON to display
 */
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

/**
 * Converts any xml to a pretty printed HTML version
 * @param {XMLDocument} xml - The XML Document object (not string) for an XML node to display;
 */
com.marklogic.widgets.searchhelper.xmltohtml = function(xml) {
  var str = "";
  // documents can have multiple root nodes
  for (var n = 0,maxn = xml.childNodes.length,node;n < maxn;n++) {
    node = xml.childNodes[n];

    mljs.defaultconnection.logger.debug("xmltohtml: evaluating: " + node.nodeName);
    str += com.marklogic.widgets.searchhelper._innerxmltohtml(node, "", null);
  }
  return "<code>" + str + "</code>";
};

com.marklogic.widgets.searchhelper._innerxmltohtml = function(node,indentstring,parent) {
  var s = "";
  if ("#text" == node.nodeName) {
    return node.textContent;
  }
  if ("#comment" == node.nodeName || "xml-stylesheet" == node.nodeName ) {
    return "";
  }
  s += indentstring + "&lt;" + node.nodeName;
  // handle attributes too
  for (var a = 0,maxa = node.attributes.length,attr;a < maxa;a++) {
    attr = node.attributes[a];
    if (-1 == attr.name.indexOf("xmlns")) {
      // an actual attribute rather than namespace definition (We're handling those separately)
      s += " " + attr.name + "=\"" + attr.nodeValue + "\"";
    }
  }
  // check for change in namespace
  if (null != parent && parent.namespaceURI != node.namespaceURI) {
    s += " xmlns=\"" + node.namespaceURI + "\"";
  }
  s += "&gt;";
  var newindent = indentstring + "&nbsp;";
  var needNewLine = false;
  for (var n = 0,maxn = node.childNodes.length,child;n < maxn;n++) {
    child = node.childNodes[n];
    var cs = com.marklogic.widgets.searchhelper._innerxmltohtml(child,newindent,node);
    if (0 == cs.indexOf(newindent + "&lt;")) { // child is a node not text
      s += "<br/>";
      needNewLine = true;
    }
    s += cs;
  }
  if (needNewLine) {
    s += "<br/>" + indentstring;
  }
  s += "&lt;/" + node.nodeName + "&gt;";
  return s;
};

/*
com.marklogic.widgets.searchhelper.htmlRec = function(content) {
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
        resStr += com.marklogic.widgets.searchhelper.htmlRec(content[tag]);
        resStr += "</" + tag + ">";
      }
      return resStr;
    }
  }; // UNUSED ANYWHERE ELSE */

com.marklogic.widgets.searchhelper.handleJson = function(result,json) {

        var resStr = "";
        // parse each results and snippet / raw content
        var title = result.uri;
        if (undefined != json && undefined != json.title ) {
          title = json.title;
        }
        var snippet = null;
        // TODO show all content if snippeting mode is snippet
        if (undefined != json && undefined != json.summary) {
          snippet = json.summary;
        } else if (undefined != json) {
          //snippet = JSON.stringify(result.content);
          snippet = com.marklogic.widgets.searchhelper.jsontohtml(json);
          // TODO check for XML (string not object) content in results.results[i].content
        } else {
          // no snippet available
        }

        if (null == snippet) {
          // TODO show JSON tree structure as HTML
          mljs.defaultconnection.logger.debug("defaultProcessor: No JSON summary, building JSON tree HTML output");
        }

        resStr += "<div class='searchresults-result'><div class='h4'>" + result.index + ". " + title + "</div>";
        if (null != snippet) {
          resStr += "<div class='searchresults-snippet'>" + snippet + "</div>";
        }
        resStr += "</div>";
        return resStr;
  };












// ADVANCED SEARCH ELEMENT

/**
 * Creates an advanced search widget. This uses the currently configured search options to render an appropriate advanced search form.
 *
 * @constructor
 * @param {string} container - The ID of the HTML element to render this widget within
 */
com.marklogic.widgets.advancedsearch = function(container) {
  this.container = container;

  this.ctx = new mljs.prototype.searchcontext();

  this._include = null;

  this._init();
};


/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.advancedsearch.getConfigurationDefinition = function() {
  return {
  }
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.advancedsearch.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this[prop] = config[prop];
  }

  // refresh display
  //this._refresh();
};

com.marklogic.widgets.advancedsearch.prototype.include = function(arr) {
  this._include = arr;
};

com.marklogic.widgets.advancedsearch.prototype._init = function() {
  // TODO skeleton HTML
  var s = "<div class='mljswidget advancedsearch'>";
  s += " <h2>Advanced Search</h2>";
  s += " <div class='' id='" + this.container + "-fields'></div>";
  s += " <div style='text-align:center;width:100%;'>";
  s += "  <input class='btn btn-primary advancedsearch-submit' type='submit' id='" + this.container + "-submit' value='Search' />";
  s += " </div>";
  s += "</div>";
  document.getElementById(this.container).innerHTML = s;

  // event handlers
  var self = this;
  document.getElementById(this.container + "-submit").onclick = function() {self._dosearch();};
};

com.marklogic.widgets.advancedsearch.prototype._dosearch = function() {
  // go through this._options.constraint[idx] from values in this._used
  var facets = [];
  for (var i = 0, max = this._used.length, idx;i < max;i++) {
    idx = this._used[i];
    // get value
    var val = document.getElementById(this.container + "-field-" + idx).value;
    // if value specified, add to facets
    if (val.trim().length > 0) {
      facets.push({name: this._options.options.constraint[idx].name, value: val});
    }
  }
  // contribute facets to search
  this.ctx.contributeFacets(facets);
};

/**
 * Set the search context object to use for operations
 *
 * @param {mljs.searchcontext} ctx - The search context instance to invoke
 */
com.marklogic.widgets.advancedsearch.prototype.setSearchContext = function(context) {
  this.ctx = context;
};

/**
 * Get the search context object this widget will use for operations
 */
com.marklogic.widgets.advancedsearch.prototype.getSearchContext = function() {
  return this.ctx;
};


com.marklogic.widgets.advancedsearch.prototype.render = function() {
  this._options = this.ctx.getOptions(); // ML Options JSON

  // loop through constraints
  var s = "";
  this._used = [];
  for (var i = 0, max = this._options.options.constraint.length,con;i < max;i++) {
    con = this._options.options.constraint[i];
    // render appropriate form element
    // TODO handle exclusions/inclusions
    // TODO collection (all, some tickbox)
    if (null == this._include || this._include.contains(con.name)) {
      if (undefined != con.range) {
        // TODO string
        if ("xs:string" == con.range.type) {
          // render annotation as label
          s += "<span class=' advancedsearch-field'>";
          var title = ""
          if (undefined != con.annotation && con.annotation.length > 0) {
            title = con.annotation[0];
          } else {
            // get from name
            title = com.marklogic.widgets.searchhelper.processValue(con.name,"all");
          }
          s += " <label for='" + this.container + "-field-" + i + "'>" + title + ": </label>";
          // render input box for value
          // use constraint index as unique id reference
          s += " <input id='" + this.container + "-field-" + i + "' type='text' />";
          s += "</span>";
          this._used.push(i);
          if (0 == this._used.length % 2) {
            s += "<br />";
          }
        } // range type if
      } // constraint type if
    } // include check if
    // TODO geo (address lookup + range)
  }
  document.getElementById(this.container + "-fields").innerHTML = s;


  // ENTER KEY HANDLER
  var self = this;
  var searchKeyPress = function(e)
    {
        // look for window.event in case event isn't passed in
        if (typeof e == 'undefined' && window.event) { e = window.event; }
        if (e.keyCode == 13)
        {
          // TODO self.updateSuggestions(null);
            document.getElementById(self.container + "-submit").click();
        } else {
          // update suggestions
          // TODO self.ctx.doSuggest(input.value);
        }
    };

  for (var i = 0, max = this._used.length, idx;i < max;i++) {
    idx = this._used[i];

    var input = document.getElementById(this.container + "-field-" + idx);

    // now do enter click handler
    input.onkeypress = searchKeyPress;
  }

  // TODO enable auto completion lookup
};













// SEARCH BAR ELEMENT

/**
 * Creates a search bar widget
 *
 * @constructor
 * @param {string} container - The ID of the HTML element to render this widget within
 */
com.marklogic.widgets.searchbar = function(container) {
  console.log("MA: IN SEARCH BAR");
  if (undefined == com.marklogic.widgets.searchbar.list) {
    com.marklogic.widgets.searchbar.list = new Array(); // [containerID] -> searchbar widget
  }
  this.container = container;
  this.containerElement = container;
  if ("string"==typeof(container)) {
    this.containerElement = document.getElementById(container);
  }
  if (undefined != this.containerElement.id) {
    this.container = this.containerElement.id;
  } else {
    this.container = "somerandomsearchbarname";
  }
  console.log("MA: type: " + typeof(this.containerElement));
  console.log("MA: id: " + this.container);

  this.ctx = new mljs.prototype.searchcontext();

  this._mode = "fullquery"; // also 'contributestructured' for contributing simple word queries to search context

  // draw widget within container
  mljs.defaultconnection.logger.debug("adding search bar html");
  this.containerElement.innerHTML =
    "<div class='mljswidget well searchbar-inner'>" +
      "<div class='input-append input-prepend searchbar-queryrow'>" +
        "<span class='searchbar-label' for='" + this.container + "-searchinput'>Search: </span>" +
        "<input class='span2 searchbar-query' type='text' id='" + this.container + "-searchinput' value='' placeholder='Enter query' />" +
        "<button class='btn btn-primary glyphicon glyphicon-search searchbar-submit' type='button' id='" + this.container + "-submit'></button>" +
      "</div>" +
      "<ul class='list-unstyled searchbar-autocomplete hidden' id='" + this.container + "-ac' tabindex='0'></ul>" +
      "<div class='searchbar-errorrow hidden'></div>";
    "</div>";
  mljs.defaultconnection.logger.debug("adding submit click handler");
  var self = this;
  document.getElementById(this.container + "-submit").onclick = function() {self._dosearch(self);}; // TODO Check this is valid
  mljs.defaultconnection.logger.debug("added submit click handler");

  var input = document.getElementById(this.container + "-searchinput");

  // now do enter click handler
  var searchKeyPress = function(e)
    {
        // look for window.event in case event isn't passed in
        if (typeof e == 'undefined' && window.event) { e = window.event; }
        if (e.keyCode == 13)
        {
          self.updateSuggestions(null);
            document.getElementById(self.container + "-submit").click();
        } else {
          // update suggestions
          self.ctx.doSuggest(input.value);
        }
    };
  input.onkeypress = searchKeyPress;

};


/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.searchbar.getConfigurationDefinition = function() {
  return {
  }
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.searchbar.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this[prop] = config[prop];
  }

  // refresh display
  //this._refresh();
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

com.marklogic.widgets.searchbar.prototype.updateSuggestions = function(suggestions) {
  var ul = document.getElementById(this.container + "-ac");
  if (undefined == suggestions || undefined == suggestions.suggestions || suggestions.suggestions.length == 0) {
    // hide ul
    com.marklogic.widgets.hide(ul,true);
  } else {
    // TODO show a drop down just below the search bar, but higher Z order (on top) that is selectable to complete the query
    var cont = this.containerElement; // OLD - document.getElementById(this.container);
    var input = document.getElementById(this.container + "-searchinput");

    // draw items
    var s = "";
    for (var i = 0, max = suggestions.suggestions.length, sug;i < max;i++) {
      sug = suggestions.suggestions[i];
      s += "<li class='search-suggest-item'><a id='" + this.container + "-s-" + i + "'>" + sug + "</a></li>";
    }
    ul.innerHTML = s;

    function setCursor(node,pos) {

    var node = (typeof node == "string" || node instanceof String) ? document.getElementById(node) : node;

    if(!node){
        return false;
    }else if(node.createTextRange){
        var textRange = node.createTextRange();
        textRange.collapse(true);
        textRange.moveEnd(pos);
        textRange.moveStart(pos);
        textRange.select();
        return true;
    }else if(node.setSelectionRange){
        node.setSelectionRange(pos,pos);
        return true;
    }

    return false;
    };

    var handler = function(suggestion) {
      com.marklogic.widgets.hide(ul,true);

      // find last word boundary and replace as appropriate
      var q = input.value;
      var pos = q.length - 1;
      var found = false;
      while (!found && pos > 0) {
        var ch = q.substring(pos,pos+1);
        if (":" == ch || " " == ch) {
          found = true;
          pos++;
        } else {
          pos--;
        }
      }
      input.value = /*q.substring(0,pos) +*/ suggestion;
      // TODO fix the above to allow multiple suggestions anywhere within a free text search query

      // set cursor position to end of the search bar
      setCursor(input,q.length);
    };


    var addSelectHandler = function(el,suggestion) {
      el.onclick = function(e) {
        handler(suggestion);
      };
      // TODO button press too
      // now do enter click handler
      var selectKeyPress = function(e) {
        // look for window.event in case event isn't passed in
        if (typeof e == 'undefined' && window.event) { e = window.event; }
        if (e.keyCode == 13) {
          handler(suggestion);
        }
      };
      el.onkeypress = selectKeyPress;

    };

    // TODO add event handlers
    for (var i = 0, max = suggestions.suggestions.length, sug;i < max;i++) {
      sug = suggestions.suggestions[i];
      var li = document.getElementById(this.container + "-s-" + i);
      addSelectHandler(li,sug)
    }

    // reposition ul
    ul.style.left = input.left - cont.left;
    // show ul
    com.marklogic.widgets.hide(ul,false);
  }
};

/**
 * Executes the search currently container in this widget's input box. Useful to execute a 'blank' search on initial page load without user interaction.
 */
com.marklogic.widgets.searchbar.prototype.execute = function() {
  var q = document.getElementById(this.container + "-searchinput").value;
  this.ctx.dosimplequery(q);
};

/**
 * Sets the search mode. (Defaults to 'full query')
 *
 * NOTE: If in contribute mode then a term query will be generated. This does seem to use the default grammar, so you can provide things like "animal:dog family:pet".
 *
 * @param {string} mode - The mode. Either "fullquery" (default) or "contributestructured"
 */
com.marklogic.widgets.searchbar.prototype.setMode = function(mode) {
  this._mode = mode;
};

/**
 * Convenience method to set the mode to contributed from the default of "fullquery"
 */
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
    self.ctx.contributeStructuredQuery(this.container,q); // requires searchcontext from MLJS V 1.2+ - Detects this as text not JSON to perform combinedQuery when V7, term query on V6
  }
};

/**
 * Called by a search context when the query string is updated by another widget. Does not result in a search being executed by this widget.
 *
 * @param {string} q - The new query
 */
com.marklogic.widgets.searchbar.prototype.updateSimpleQuery = function(q) {
  if (null != q && undefined != q && "" != q) {
    mljs.defaultconnection.logger.debug(" - updateSimpleQuery: Setting query string to: " + q);
    document.getElementById(this.container + "-searchinput").value = q;
  }
};

/**
 * Called by a search context when new search results are received.
 *
 * @param {results} results - The JSON results object from the REST server
 */
com.marklogic.widgets.searchbar.prototype.updateResults = function(results) {
  if (typeof (results) != "boolean" && undefined != results && null != results && undefined != results.qtext) {
    mljs.defaultconnection.logger.debug(" - updateResults: Setting query string to: " + results.qtext);
    document.getElementById(this.container + "-searchinput").value = results.qtext;
  }
};

/**
 * Set the search context object to use for operations
 *
 * @param {mljs.searchcontext} ctx - The search context instance to invoke
 */
com.marklogic.widgets.searchbar.prototype.setSearchContext = function(context) {
  this.ctx = context;
};

/**
 * Get the search context object this widget will use for operations
 */
com.marklogic.widgets.searchbar.prototype.getSearchContext = function() {
  return this.ctx;
};








// SEARCH FACETS ELEMENT

/**
 * Creates a search facets interactive widget in the specified container.
 *
 * This widget is MLJS Workplace enabled.
 *
 * @constructor
 * @param {string} container - The HTML ID of the element this widget should place its content in to.
 */
com.marklogic.widgets.searchfacets = function(container) {
  this.container = container;

  // Publicly settable properties
  this.listSize = 5;
  this.extendedSize = 10;
  this.allowShowAll = true;
  this.hideEmptyFacets = true;

  // Internal properties
  this.facetSettings = new Array();

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

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.searchfacets.getConfigurationDefinition = function() {
  return {
    listSize: {type: "positiveInteger", minimum: 1, default: 5, title: "List Size", description: "How many facet values to show at first."},
    extendedSize: {type: "positiveInteger", minimum: 1, default: 10, title: "Extended List Size", description: "How many values to show when a user clicks 'Show More'."},
    allowShowAll: {type: "boolean", default: true, title: "Display Show All action", description: "Whether the Show All link should be allowed if there are more facet values than the value of Extended Size."},
    hideEmptyFacets: {type: "boolean", default:true, title: "Hide Empty Facets", description: "Should facets with no values be hidden?"}
  }
  // TODO include facet name/value transform settings
  // TODO include facet settings (if applicable?)
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.searchfacets.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this[prop] = config[prop];
  }

  // refresh display
  this._refresh();
};

/**
 * Set the search context object to use for operations
 *
 * @param {mljs.searchcontext} ctx - The search context instance to invoke
 */
com.marklogic.widgets.searchfacets.prototype.setSearchContext = function(context) {
  this.ctx = context;
};

/**
 * Get the search context object this widget will use for operations
 */
com.marklogic.widgets.searchfacets.prototype.getContext = function() {
  return this.ctx;
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

  var str = "<div class='mljswidget well searchfacets'>" +
    "<div class='title h3 searchfacets-title'>Browse</div>" +
    "<div id='" + this.container + "-facetinfo' class='search-facets'> ";

  var self = this;
  var fname = function(name) {
    var opts = self.ctx.getOptions();
//    if (undefined != opts && "" != opts) {
      var annotation = opts._findConstraint(name).annotation;
      if (undefined == annotation) {
        return self._transformFacetName(name);
      } else {
        return annotation[0];
      }
  //  }
  };

  // draw selected facets and deselectors
  var deselectionTodo = new Array();
  if (0 != this.selected.length) {
    str += "<div class='panel panel-info searchfacets-selected'>";

    // lopp through selected
    for (var i = 0;i < this.selected.length;i++) {
      var s = this.selected[i];
      str += "<div class='searchfacets-selection'>" +
        "<a href='#" + this.container + "-desel-" + s.name + "-" + s.value + "' class='searchfacets-deselect' id='" + this.container + "-desel-" + s.name + "-" + s.value +
        "'><span class='glyphicon glyphicon-remove'></span></a> " +
        fname(s.name) + ": " + this._transformFacetValue(s.name,s.value) + "</div>";
      // add deselection X link
      deselectionTodo.push(s);
    }

    str += "</div>";
  }

  var facetHandlersTodo = new Array();
  if (null != this.results && undefined != this.results) {
    if (undefined != this.results.facets) {

      for (var name in this.results.facets) { // TODO replace with introspection of objects within search facets (objects, not array)
        var facet = this.results.facets[name];
        var values = facet.facetValues;

        // could be null - e.g. geo boxes
        if (undefined != values) {
        var facetStr = "<div class='panel panel-info searchfacets-facet' id='" + this.container + "-facetinfo-" + name + "'><div class='panel-heading searchfacets-facet-title'>" + fname(name) + "</div>" +
          "<div class='panel-body searchfacets-facet-values'>";
        var settings = this._getFacetSettings(name);
        var max = this.listSize;
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
            facetStr += "<div class='";
            if (1 == (v%2)) {
              facetStr += "bg-gray-lighter ";
            }
            facetStr += "searchfacets-facet-value' id='" + this.container + "-fv-" + name + "-" + fv.name + "'>" + this._transformFacetValue(name,fv.name) + " <span class='badge searchfacets-facet-count'>" + fv.count + "</span>" + "</div>";
            facetHandlersTodo.push({name: name, value: fv.name});
          }
        }
        if (valuesCount > this.listSize) {
          // TODO less... clickable links
            // html for 'show more'
          if (!settings.showAll) { // we should show more or less in the more div (but not if we show 'less' in the extended div, hence if !showAll)
            facetStr += "<div class='text-info searchfacets-more'><a href='#" + this.container + "-facetinfo-" + name + "' id='" + this.container + "-" + name + "-more-link'>";

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
              facetStr += "<div class='text-info searchfacets-extended'><a href='#" + this.container + "-facetinfo-" + name + "' id='" + this.container + "-" + name + "-extended-link'>";
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

com.marklogic.widgets.searchfacets.prototype._transformFacetValue = function(facetName,facetValue) {
  /*var name = facetValue;
  name = com.marklogic.widgets.searchhelper.splitdash(name,this.facetValueTransform);
  name = com.marklogic.widgets.searchhelper.splitunderscore(name,this.facetValueTransform);
  name = com.marklogic.widgets.searchhelper.camelcase(name,this.facetValueTransform);
  return name;*/
  // try options cache first
  var fv = this.ctx.getOptionsBuilder().getFacetValueString(facetName,facetValue);
  if (null == fv) {
    return com.marklogic.widgets.searchhelper.processValue(facetValue,this.facetValueTransform);
  } else {
    return fv;
  }
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
 * This widget is partially MLJS Workplace enabled.
 *
 * @constructor
 * @param {string} container - HTML ID of the element in which to draw this widget's content
 */
com.marklogic.widgets.searchresults = function(container) {
  this.container = container;
  this.containerElement = container;
  if ("string"==typeof(container)) {
    this.containerElement = document.getElementById(container);
  }
  if (undefined != this.containerElement.id) {
    this.container = this.containerElement.id;
  } else {
    this.container = "somerandomsearchresultsname";
  }

  this.ctx = mljs.defaultconnection.createSearchContext();

  // publicly accessible configuration
  this.selectionMode = "append"; // append or replace

  // private configuration

  this.processors = {}; // we never reference it numerically, only as a hash, to use a JSON object instead of an Array
  this.availableProcessors = new Array();
  this.processorPriority = new Array();

  this.detailsLink = null;

  this.lazyId = 1;
  this.lazyLoaders = new Array();

  this._layout = new com.marklogic.widgets.searchlayouts.default(container); // pass entire container area to layout

  var self = this;

  this._actions = {}; // name -> action class with matcher() and render() functions


  this._refresh();

  // event handlers
  this.selectionPublisher = new com.marklogic.events.Publisher();
  this.highlightPublisher = new com.marklogic.events.Publisher();


  // MIXIN custom processors at this point
  var custom = com.marklogic.widgets.searchresultsext;
  for (var act in com.marklogic.widgets.defaultactions) {
    this._actions[act] = com.marklogic.widgets.defaultactions[act];
  }
  if (undefined != custom) {
    for (var name in custom) {
      var cust = custom[name];
      if (undefined != cust.customrenderers) {
        var renderers = cust.customrenderers;
        for (var ren in renderers) {
          this.processors[ren] = renderers[ren]; // copy over in to this object - and custom in code will be added/overridden on top
        }
      }
      if (undefined != cust.customactions) {
        var ca = cust.customactions;
        for (var act in ca) {
          this._actions[act] = ca[act];
        }
      }
    }
  }
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.searchresults.getConfigurationDefinition = function() {
  return {
    selectionMode: {type: "enum", default: "append", title: "Selection Mode", description: "If no action happens on click, which selection mode to use.",
      options: [
        {value: "append", title: "Append", description: "Append this document to the list of those selection"},
        {value: "replace", title: "Replace", description: "Replace selection with the selected document only"}
      ]}
  }
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.searchresults.prototype.setConfiguration = function(config) {
  for (var p in config) {
    this[p] = config[p];
  }
};

/**
 * Programmatically overrides the selection mode to be replace.
 */
com.marklogic.widgets.searchresults.prototype.setSelectionModeReplace = function() {
  this.selectionMode = "replace";
};

/**
 * Set the search context object to use for operations
 *
 * @param {mljs.searchcontext} ctx - The search context instance to invoke
 */
com.marklogic.widgets.searchresults.prototype.setSearchContext = function(context) {
  this.ctx = context;
};

/**
 * Get the search context object this widget will use for operations
 */
com.marklogic.widgets.searchresults.prototype.getContext = function() {
  return this.ctx;
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
      this._layout.loading();
    } else {
      this._layout.failure();
    }
    return;
  }
  this.lazyLoaders = new Array();
  if (null == this.results || undefined == this.results.results || this.results.results.length == 0) {
    this._layout.empty();
  } else {
    mljs.defaultconnection.logger.debug("RESULTS OBJECT: " + JSON.stringify(this.results));

    //var resStr =
    //  "<div class='mljswidget searchresults-inner'><h2 class='title searchresults-title'>Results</h2><div class='searchresults-results'>";

    //var uureplace = 1001;
    //var replacements = new Array();

    var settings = {}; // TODO parameters for renderer

    for (var i = 0;i < this.results.results.length;i++) {
      //var wrapperId = this.container + "-searchresults-wrapper-" + i;
      //resStr += "<div id='" + wrapperId + "' class='searchresults-wrapper"
      //if (pointer) {
      //  resStr += " searchresults-navigable";
      //}
      //resStr += "'>";


      // run processors in order
      var result = this.results.results[i];

      var found = false;
      // Try first: Custom processors, configured on the page
      //for (var p = 0;!found && p < this.processorPriority.length;p++) {
      for (var pname in this.processors) {
        //var pname = this.processorPriority[p];
        mljs.defaultconnection.logger.debug("checking applicability of processor: " + pname);
        if (this.processors[pname].matcher(result,this,settings)) {
          found = true;
          mljs.defaultconnection.logger.debug("found processor: " + pname);
          // process using a layout
          this._layoutResult(result,this,settings,i,this.processors[pname]);
        } // if matches
      }

        if (!found) {
          // Try built in renderers
          for (var pname in com.marklogic.widgets.searchresults.defaultrenderers) {
            if (!found) {
              found = com.marklogic.widgets.searchresults.defaultrenderers[pname].matcher(result,this,settings);
              if (found) {
                mljs.defaultconnection.logger.debug("found builtin processor: " + pname);
                // process using a layout
                this._layoutResult(result,this,settings,i,com.marklogic.widgets.searchresults.defaultrenderers[pname]);
              }
            }
          }
        }
        // NEW END
      //}

      //resStr += "</div>";
    }
    //resStr += "</div></div>"; // end of results container div and results inner
    //mljs.defaultconnection.logger.debug("RES STR: " + resStr);

    //document.getElementById(this.container).innerHTML = resStr;

    // now add click handlers to each result div, if required
    //if (pointer) {
    //}

    // now do any XML replacements
    /*for (var r = 1001;r < uureplace;r++) {
      document.getElementById(this.container + "-searchresults-xml-" + r).innerHTML = replacements[r]; // TODO verify we don't have to clone the XML document before insert (shouldn't need to)
    }*/

    // go through lazy loaders and run them
    for (var i = 0;i < this.lazyLoaders.length;i++) {
      var loader = this.lazyLoaders[i];
      loader.callback(loader.docuri,loader.elid);
    }
    // now clear them prior to next invocation
    this.lazyLoaders = new Array();
  }
};


com.marklogic.widgets.searchresults.prototype.addResultHoverHandler = function(result,elid) {

    var pointer = (null != this.detailsLink);

      var self = this;
      var addPointerHandler = function(id,result) {
        document.getElementById(id).onclick = function(evt) {
          self._navigateTo(result.uri);
        }
      };
      if (!pointer) {
        // fire selection event instead
        addPointerHandler = function(id,result) {
          document.getElementById(id).onclick = function(evt) {
            self.selectionPublisher.publish({mode: self.selectionMode, uri: result.uri});
          }
        };
      }/*
      for (var i = 0;i < this.results.results.length;i++) {
        var id = this.container + "-searchresults-wrapper-" + i;
        var result = this.results.results[i];
        addPointerHandler(id,result);
      }*/
      addPointerHandler(elid,result);
}

/**
 * This method uses the new MLJS 1.4 advanced search result rendering support. It queries the configured layout, and places the relevant processor sections within it.
 * @private
 */
com.marklogic.widgets.searchresults.prototype._layoutResult = function(result,manager,settings,resultindex,processor) {
  // get new result contianer from layout
  var layout = this._layout;
  var resultContainer = layout.getResultContainer(result,manager,settings,resultindex);
  var sections = ["title","summary","metadata","thumbnail","actions","related","similar","facts"]; // TODO comments area too

  var replacements = new Array();

  var replaceXML = function(docuri,elid) {
    document.getElementById(elid).innerHTML = replacements[elid]; // TODO verify we don't have to clone the XML document before insert (shouldn't need to)
  };

  mljs.defaultconnection.logger.debug("searchresults._layoutResult: Rendering result: " + result.uri);

  // try each section in turn
  for (var s = 0, maxs = sections.length,section;s < maxs;s++) {
    section = sections[s];
    // get section elements from layout
    var layoutSection = resultContainer[section];
    mljs.defaultconnection.logger.debug("searchresults._layoutResult:   Rendering section: " + section);
    // if not supported, show our results widget's default view for each
    if (undefined == processor[section]) {
      // show default
      if ("summary" == section && undefined != processor.processor) {
        // old style summary support
        var returned = processor.processor(result,manager);
        var resStr = "";
        if (undefined != returned.nodeType) {
          //var id = (uureplace++);
          resStr = "<div id='" + this.container + "-searchresults-xml-" + resultindex + "'></div>";
          replacements[this.container + "-searchresults-xml-" + resultindex] = returned;
          manager.lazyLoad(result.uri,this.container + "-searchresults-xml-" + resultindex, replaceXML);
        } else {
          resStr += returned;
        }
        document.getElementById(layoutSection).innerHTML = resStr;
      } else {
        if ("title" == section && undefined != processor.processor) {
          document.getElementById(layoutSection).innerHTML = "";
        } else {
          document.getElementById(layoutSection).innerHTML = com.marklogic.widgets.defaulthtmlsections[section](result,manager,settings);
        }
      }
    } else {
      // render content
      document.getElementById(layoutSection).innerHTML = processor[section](result,manager,settings);
    }
  } // end for (section)


};

com.marklogic.widgets.searchlayouts = {};
com.marklogic.widgets.searchlayouts.default = function(container) {
  // initialisation
  this.container = container;
  this.containerElement = container;
  if ("string"==typeof(container)) {
    this.containerElement = document.getElementById(container);
  }
  if (undefined != this.containerElement.id) {
    this.container = this.containerElement.id;
  } else {
    this.container = "somerandomsearchresultsname";
  }

  this._areas = {};
  this._hasMessage = false;
  this._uriMap = {};

  this._init();
};
com.marklogic.widgets.searchlayouts.default.prototype._init = function() {
  var s = "<div id='" + this.container + "-outer' class='mljswidget panel panel-info searchresults mljsResultDefaultOuter'>";
  s += "<div class='title panel-heading searchresults-title'>Results</div>";
  s += "<div id='" + this.container + "-inner' class='searchresults-results mljsResultDefaultInner'></div>";
  s += "</div>";
  this.containerElement.innerHTML = s;
};
com.marklogic.widgets.searchlayouts.default.prototype.reset = function() {
  // strip out all current content areas
  document.getElementById(this.container + "-inner").innerHTML = "";
  this._areas = {};
  this._uriMap = {};
};
com.marklogic.widgets.searchlayouts.default.prototype.loading = function() {
  // strip out all current content areas
  //document.getElementById(this.container + "-inner").innerHTML = "";
  this._areas = {};
  this._uriMap = {};
  document.getElementById(this.container + "-inner").innerHTML =
    "<div class='searchresults-results'>" +
    com.marklogic.widgets.bits.loading(this.container + "-loading") + "</div>";
  this._hasMessage = true;
};
com.marklogic.widgets.searchlayouts.default.prototype.failure = function() {
  // strip out all current content areas
  //document.getElementById(this.container + "-inner").innerHTML = "";
  this._areas = {};
  this._uriMap = {};
  document.getElementById(this.container + "-inner").innerHTML =
    "<div class='searchresults-results'>" +
    com.marklogic.widgets.bits.failure(this.container + "-failure") + "</div>";
  this._hasMessage = true;
};

com.marklogic.widgets.searchlayouts.default.prototype.empty = function() {
  this._areas = {};
  this._uriMap = {};
  document.getElementById(this.container + "-inner").innerHTML =
    "<div class='searchresults-results'>No Results</div>";

  this._hasMessage = true;
};
com.marklogic.widgets.searchlayouts.default.prototype.select = function(newsel) {
  // deselect all
  for (var uri in this._uriMap) {
    var idx = this._uriMap[uri];
    if (undefined != idx) {
      if (newsel.contains(uri)) {
        com.marklogic.widgets.addClass(
          document.getElementById(this.container + "-result-" + idx + "-summary"),"selected");
      } else {
        com.marklogic.widgets.removeClass(
          document.getElementById(this.container + "-result-" + idx + "-summary"),"selected");
      }
    }
  }
};

com.marklogic.widgets.searchlayouts.default.prototype.getResultContainer = function(result,manager,settings,resultindex) {
  if (this._hasMessage) {
    // clear results
    document.getElementById(this.container + "-inner").innerHTML = "";
    this._hasMessage = false;
  }
  var area = this._areas[resultindex];
  if (undefined == area) {
    // create new area
    area = {
      title: this.container + "-result-" + resultindex + "-title",
      summary: this.container + "-result-" + resultindex + "-summary",
      metadata: this.container + "-result-" + resultindex + "-metadata",
      actions: this.container + "-result-" + resultindex + "-actions",
      thumbnail: this.container + "-result-" + resultindex + "-thumbnail",
      related: this.container + "-result-" + resultindex + "-related",
      similar: this.container + "-result-" + resultindex + "-similar",
      facts: this.container + "-result-" + resultindex + "-facts"
    };

    // draw new area in html
    // TODO default layout CSS
    var s = "<div id='" + this.container + "-result-" + resultindex + "' class='";
    /*
    if (1 == (resultindex % 2)) {
      s += "bg-gray-lighter ";
    }
    */
    s += "mljsResultDefaultResult'>";
    s += "<div id='" + this.container + "-result-" + resultindex + "-toprow' class='mljsResultDefaultTopRow'>";
    s +=   "<div id='" + this.container + "-result-" + resultindex + "-topleft' class='mljsResultDefaultTopLeft'>";
    s +=     "<div id='" + this.container + "-result-" + resultindex + "-title' class='mljsResultDefaultTitle'></div>"; // TODO number? Indented area for content?
    s +=     "<div id='" + this.container + "-result-" + resultindex + "-main' class='mljsResultDefaultMain'>";
    s +=       "<div id='" + this.container + "-result-" + resultindex + "-summary' class='mljsResultDefaultSummary'></div>";
    s +=       "<div id='" + this.container + "-result-" + resultindex + "-metadata' class='mljsResultDefaultMetadata'></div>";
    s +=     "</div>";
    s +=     "<div id='" + this.container + "-result-" + resultindex + "-actions' class='mljsResultDefaultActions'></div>";
    s +=   "</div>";
    s +=   "<div id='" + this.container + "-result-" + resultindex + "-topright' class='mljsResultDefaultTopRight'>";
    s +=     "<div id='" + this.container + "-result-" + resultindex + "-thumbnail' class='mljsResultDefaultThumbnail'></div>";
    s +=   "</div>";
    s += "</div>";

    s += "<div id='" + this.container + "-result-" + resultindex + "-bottomrow' class='mljsResultDefaultBottomRow'>";
    s +=   "<div id='" + this.container + "-result-" + resultindex + "-detail' class='mljsResultDefaultDetail hidden'>";
    s +=     "<div id='" + this.container + "-result-" + resultindex + "-related' class='mljsResultDefaultRelated hidden'></div>";
    s +=     "<div id='" + this.container + "-result-" + resultindex + "-similar' class='mljsResultDefaultSimilar hidden'></div>";
    s +=     "<div id='" + this.container + "-result-" + resultindex + "-facts' class='mljsResultDefaultFacts hidden'></div>";
    s +=   "</div>";
    s += "</div>";

    s += "</div>";

    // TODO correctly append content
    com.marklogic.widgets.appendHTML(document.getElementById(this.container + "-inner"),s);
    this._uriMap[result.uri] = resultindex;
    //document.getElementById(this.container + "-inner").innerHTML += s;

    // add event handlers
    manager.addResultHoverHandler(result,this.container + "-result-" + resultindex + "-summary");

    this._areas[resultindex] = area;
  }
  return area;
};

// NB could be doc or search result actions. Be aware.
com.marklogic.widgets.defaultactions = {
  view: {
    matcher: function(result,manager,settings) {
      return true;
    },
    render: function(result,manager,settings) {
      var actionView = null;
      var innerView = "<button type=\"button\" onclick='window.location=\"/view.html5?uri=" + encodeURI(result.uri) + "\";' class=\"btn btn-default \"><span class='glyphicon glyphicon-search mljsResultActionBase mljsResultActionView'></span></button>";
      return com.marklogic.widgets.defaulthtmlrenderer.wrapAction(actionView,innerView,result,manager,settings);
    }
  },
  open: {
    matcher: function(result,manager,settings) {
      return true;
    }, render: function(result,manager,settings) {
      var actionDownload = null;
      // TODO force the below to download rather than just view
      var innerDownload = "<button type=\"button\" onclick='window.location=\"/v1/documents?uri=" + encodeURI(result.uri) + "\";' class=\"btn btn-default \"><span class='glyphicon glyphicon-download mljsResultActionBase mljsResultActionDownload'></span></button>";
      return com.marklogic.widgets.defaulthtmlrenderer.wrapAction(actionDownload,innerDownload,result,manager,settings);
    }
  },
  openoriginal: {
    matcher: function(result,manager,settings) {
      var meta = com.marklogic.widgets.defaulthtmlrenderer.getMetadata(result,"originalurl") ;
      return (null != meta);
    }, render: function(result,manager,settings) {
      var meta = com.marklogic.widgets.defaulthtmlrenderer.getMetadata(result,"originalurl") ;
      var viewOrig = "<button type=\"button\" target=\"_blank\" onclick='window.location=\"/v1/documents?uri=" + encodeURI(meta) + "\";' class=\"btn btn-default \"><span class=''>View Original</span></button>";
      return com.marklogic.widgets.defaulthtmlrenderer.wrapAction(null,viewOrig,result,manager,settings);
    }
  },
  viewPrettyXML: { // superseded by document view control supporting any XML content
    matcher: function(result,manager,settings) {
      return false;
    },
    render: function(result,manager,settings) {
      // return HTML
      // Also register action (if required)
      return com.marklogic.widgets.defaultactions.viewPrettyXML.wrap("<img src='/images/mljs/view-pretty-small.png' />",result,manager,settings);
    },
    wrap: function(html,result,manager,settings) {
      return "<a href='/v1/documents?transform=xmltohtml&uri=" + encodeURI(result.uri) + "' target='_blank'>" + html + "</a>";
    }
  },
  explore:  { // MLJS document ontology link
    matcher: function(result,manager,settings) {
      return false;
    },
    render: function(result,manager,settings) {
      return "";
    }
  }
};

com.marklogic.widgets.defaulthtmlsections = {
  title: function(result,manager,settings) {
    return com.marklogic.widgets.defaulthtmlrenderer.defaultTitle(result,manager,settings);
  },summary: function(result,manager,settings) {
    return com.marklogic.widgets.defaulthtmlrenderer.defaultSummary(result,manager,settings);
  },metadata: function(result,manager,settings) {
    return com.marklogic.widgets.defaulthtmlrenderer.defaultMetadata(result,manager,settings);
  },actions: function(result,manager,settings) {
    return com.marklogic.widgets.defaulthtmlrenderer.defaultActions(result,manager,settings);
  },thumbnail: function(result,manager,settings) {
    return com.marklogic.widgets.defaulthtmlrenderer.defaultThumbnail(result,manager,settings);
  },similar: function(result,manager,settings) {
    return com.marklogic.widgets.defaulthtmlrenderer.defaultSimilar(result,manager,settings);
  },related: function(result,manager,settings) {
    return com.marklogic.widgets.defaulthtmlrenderer.defaultRelated(result,manager,settings);
  },comments: function(result,manager,settings) {
    return com.marklogic.widgets.defaulthtmlrenderer.defaultComments(result,manager,settings);
  },facts: function(result,manager,settings) {
    return com.marklogic.widgets.defaulthtmlrenderer.defaultRelatedTriples(result,manager,settings);
  }
};

com.marklogic.widgets.defaulthtmlrenderer = {
  // default handlers entire areas for rendering
  // old all render
  defaultSearchResult: function(result,manager,settings) {
    return com.marklogic.widgets.defaulthtmlrenderer.wrapSearchResult(
        com.marklogic.widgets.defaulthtmlrenderer.genericTitle(result.index,result.uri) +
        com.marklogic.widgets.searchhelper.snippet(result) // TODO refactor snippet generation code in to this object
      ,result,manager,settings);
  },
  // new section renders
  defaultTitle: function(result,manager,settings) {
    return com.marklogic.widgets.defaulthtmlrenderer.genericTitle(result.index,result.uri);
  },
  defaultSummary: function(result,manager,settings) {
    mljs.defaultconnection.logger.debug("defaulthtmlrenderer.defaultSummary");
    // for summary or snippet (determined by search options - must be one or the other only, never both)
    // easy if snippet, not so easy if any content (just use matcher functions to check result)
    if (undefined != result.matches) {
      // snippet
      return com.marklogic.widgets.defaulthtmlrenderer.genericTitle(result.index,result.uri) + com.marklogic.widgets.searchhelper.snippet(result);
    } else {
      // content
      // assume same as default renderer - should never get to this point
      for (var r in com.marklogic.widgets.searchresults.defaultrenderers) {
        var renderer = com.marklogic.widgets.searchresults.defaultrenderers[r];
        if (renderer.matcher(result,manager,settings)) {
          return com.marklogic.widgets.defaulthtmlrenderer.genericTitle(result.index,result.uri) + renderer.processor(result,manager,settings);
        }
      }
    }
  },
  defaultMetadata: function(result,manager,settings) {
    var s = "";
    if (undefined != result.metadata) {
      var count = 0;
            for (var metai = 0, maxi = result.metadata.length, meta;metai < maxi;metai++) {
              meta = result.metadata[metai];
              //console.log("  meta instance: " + metai);
              for (var p in meta) {
                if ("metadata-type" != p) { // TODO other exceptions
                  var value = meta[p];
                  if (null != value) { // TODO allow setting on segment for only showing named meta elements (p value)
                    var name = p;
                    if (name.substring(0,1) == "{") {
                      name = name.substring(name.indexOf("}") + 1);
                    }

    var opts = manager.ctx.getOptions();
    var con = opts._findConstraint(name);
    if (undefined != con) {
      // undefined is possible if it's an extracted element name, not a constraint with an annotation
    var annotation = con.annotation;
    if (undefined == annotation) {
      name = name;
    } else {
      name = annotation[0];
    }
  }


                    if (count > 0) {
                      s += ", ";
                    }
                    s += " <span><b>" + name + ":</b> " + value + "</span>";
                    count++;
                  }
                }
              }
            }
    } // if result.metadata
    return s;
  },
  defaultActions: function(result,manager,settings) {
    var str = "<div class='btn-toolbar' role='toolbar'>";
    str += "<div class='btn-group btn-group-sm'>";
    /*
    var actionView = null;
    var innerView = "<button type=\"button\" onclick='window.location=\"/view.html5?uri=" + encodeURI(result.uri) + "\";' class=\"btn btn-default \"><span class='glyphicon glyphicon-search mljsResultActionBase mljsResultActionView'></span></button>";
    str += com.marklogic.widgets.defaulthtmlrenderer.wrapAction(actionView,innerView,result,manager,settings);

    var actionDownload = null;
    // TODO force the below to download rather than just view
    var innerDownload = "<button type=\"button\" onclick='window.location=\"/v1/documents?uri=" + encodeURI(result.uri) + "\";' class=\"btn btn-default \"><span class='glyphicon glyphicon-download mljsResultActionBase mljsResultActionDownload'></span></button>";
    str += com.marklogic.widgets.defaulthtmlrenderer.wrapAction(actionDownload,innerDownload,result,manager,settings);


        var meta = com.marklogic.widgets.defaulthtmlrenderer.getMetadata(result,"originalurl") ;
        if (null != meta) {
          var viewOrig = "<button type=\"button\" target=\"_blank\" onclick='window.location=\"/v1/documents?uri=" + encodeURI(meta) + "\";' class=\"btn btn-default \"><span class=''>View Original</span></button>";
          str += com.marklogic.widgets.defaulthtmlrenderer.wrapAction(null,viewOrig,result,manager,settings);
        }
        */
    for (var act in manager._actions) {
      // render each applicable action
      var action = manager._actions[act];
      if (action.matcher(result,manager,settings)) {
        str += action.render(result,manager,settings);
      }
    }

    str += "</div>";

    str += "</div>";
    return str;
  },
  defaultThumbnail: function(result,manager,settings) {
    var flagged = manager.getResultExtract(result,"flagged");
    var s = "<div class='";
    //console.log("flagged: " + flagged + " type: " + typeof(flagged));
    if (true == flagged) {
      //s += "bg-danger";
    }
    s += "'>";
    if (0 == result.mimetype.indexOf("image/")) {
      // show small image
      s += "<img src='/v1/documents?uri=" + encodeURI(result.uri) + "' style='width: 150px;' alt='" + encodeURI(result.uri) + "'/>"
    } else {
      //  also support XHTML results where their extracted originaluri property points to an image, or has image mime type
      var matchit = function(str) {
        return (str.endsWith(".jpg") || str.endsWith(".jpeg") || str.endsWith(".gif") ||
                str.endsWith(".png") )
      };

        var str = com.marklogic.widgets.defaulthtmlrenderer.getMetadata(result,"originalurl") ;
        if (null != str) {
          if (matchit(str)) {

            s += "<img style='width: 150px;";

            if (true == flagged) {
              s += "border: 5px solid #d9534f;";
            }
            s += "' src='/v1/documents?uri=" + encodeURI(str) + "' alt='" + encodeURI(str) + "' />"
          }
        }

    }
    s += "</div>";
    // custom pluggable linking function
    return s;
  },
  defaultSimilar: function(result,manager,settings) {
    // from returnSimilar option
    return "";
  },
  defaultRelated: function(result,manager,settings) {
    // lazy loaded
    // by default, use custom MarkLogic ontology to relate to other documents via related_to assertion (not derived_from? others?)
    return "";
  },
  defaultComments: function(result,manager,settings) {
    // lazy loaded
    return "";
  },
  defaultRelatedTriples: function(result,manager,settings) {
    return "";
  },
  // default subclasses
  defaultSummaryTriples: function(result,manager,settings) {
    var s = "";

      // convert to XML (sem:triples)
      var xml = textToXML(result.content);

      var resolver = function(prefix){
	      if (prefix === "sem") {
    	    return "http://marklogic.com/semantics";
	      } else {
	        return null;
	      }
      };

      // get all child nodes (sem:triple)
      var iterator = xml.evaluate("//sem:triple",xml,resolver,XPathResult.UNORDERED_NODE_ITERATOR_TYPE,null);
      var child = iterator.iterateNext();
      var first = true;
      //for (var i = 0, max = children.length, child;i < max;i++) {
      while (child) {
        //child = children.item(i);
        // cannot execute xpath on child nodes
        var subject = "", predicate = "", obj = "";
        for (var n = 0;n < child.childNodes.length;n++) {
          var gc = child.childNodes.item(n);
          if (1 == gc.nodeType) {
            if ("sem:subject" == gc.nodeName) {
              subject = gc.textContent;
            } else if ("sem:predicate" == gc.nodeName) {
              predicate = gc.textContent;
            } else if ("sem:object" == gc.nodeName) {
              obj = gc.textContent;
            }
          }
        }

        //var subject = child.evaluate("/sem:subject/text()",child,resolver,XPathResult.STRING_TYPE,null);
        //var predicate = child.evaluate("/sem:predicate/text()",child,resolver,XPathResult.STRING_TYPE,null);
        //var obj = child.evaluate("/sem:object/text()",child,resolver,XPathResult.STRING_TYPE,null);
        //var objectIRI = child.evaluate("/sem:subject[!@dataType]/text()",child,resolver,XPathResult.STRING_TYPE,null);
        //var objectTyped = child.evaluate("/sem:subject[@dataType]/text()",child,resolver,XPathResult.STRING_TYPE,null);
        if (!first) {
          s += "<br/>";
        } else {
          first = false;
        }
        s += "Subject: " + subject + ", Predicate: " + predicate + ", Object: " + obj;
        child = iterator.iterateNext();
      }
    return s;
  },
  defaultSearchResultTriples: function(result,manager,settings) {

      // gen title
      //var s = "<div class='searchresults-result'><h3>" + result.index + ". Subgraph " + result.uri + "</h3>";
      var s = com.marklogic.widgets.defaulthtmlrenderer.wrapTitle(
          result.index + ". Subgraph " + result.uri
        ,result,manager,settings);

      s += com.marklogic.widgets.defaulthtmlrenderer.defaultSummaryTriples(result,manager,settings);

      return com.marklogic.widgets.defaulthtmlrenderer.wrapSearchResult(s,result,manager,settings);
  },
  genericXMLTitle: function(result,manager,settings) {
          try {
            var xmlDoc = textToXML(result.content);
            manager.ctx.db.logger.debug("successfully converted xml text to XML doc");
            //manager.ctx.db.logger.debug("defaultProcessor:  - XML parse successful...");

            //var resStr = "";
            // parse each results and snippet / raw content
            var title = result.uri;
            manager.ctx.db.logger.debug("title initially: " + title);
            var snippet = null;

            if (null != result.content && undefined != xmlDoc.evaluate) {
              // check for common title names - title, name, id, h1
              var evalResult = xmlDoc.evaluate("//title[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
              if (undefined == evalResult || "" == evalResult.stringValue) {
                //manager.ctx.db.logger.debug("defaultProcessor: //title[1]/text() undefined");
                evalResult = xmlDoc.evaluate("//name[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);

                if (undefined == evalResult || "" == evalResult.stringValue) {
                  //manager.ctx.db.logger.debug("defaultProcessor: //name[1]/text() undefined");
                  evalResult = xmlDoc.evaluate("//id[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);

                  if (undefined == evalResult || "" == evalResult.stringValue) {
                //manager.ctx.db.logger.debug("defaultProcessor: //id[1]/text() undefined");
                    evalResult = xmlDoc.evaluate("//h1[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);

                    if (undefined == evalResult || "" == evalResult.stringValue) {
                      //manager.ctx.db.logger.debug("defaultProcessor: //h1[1]/text() undefined");
                      //manager.ctx.db.logger.debug("defaultProcessor: trying (//text())[1]");
                      evalResult = xmlDoc.evaluate("(//text())[1]",xmlDoc,null,XPathResult.STRING_TYPE,null);
                      //manager.ctx.db.logger.debug("defaultProcessor: output: " + evalResult.stringValue);
                    }
                  }
                }
              }
              if (undefined != evalResult && null != evalResult && undefined != evalResult.stringValue && "" != evalResult.stringValue) {
                title = evalResult.stringValue;
              }
              if (0 == title.indexOf("This page contains the following errors")) { // XML parse hack
                title = result.uri;
              }
            }
            manager.ctx.db.logger.debug("title after eval: " + title);

          return com.marklogic.widgets.defaulthtmlrenderer.wrapTitle(
                    result.index + ". " + title,
                  result,manager,settings);
        } catch (err) {
            manager.ctx.db.logger.debug("defaultProcessor: XML mode: Failed to create XML document from text: " + result.content);
        }
          return "";

  },
  defaultSearchResultXML: function(result,manager,settings){
            manager.ctx.db.logger.debug("defaulthtmlrenderer.defaultSearchResultXML");

          // try XML now
          try {
            var xmlDoc = textToXML(result.content);
            manager.ctx.db.logger.debug("successfully converted xml text to XML doc");
            //manager.ctx.db.logger.debug("defaultProcessor:  - XML parse successful...");

            //var resStr = "";
            // parse each results and snippet / raw content
            var title = result.uri;
            manager.ctx.db.logger.debug("title initially: " + title);
            var snippet = null;

            if (null != result.content && undefined != xmlDoc.evaluate) {
              // check for common title names - title, name, id, h1
              var evalResult = xmlDoc.evaluate("//title[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
              if (undefined == evalResult || "" == evalResult.stringValue) {
                //manager.ctx.db.logger.debug("defaultProcessor: //title[1]/text() undefined");
                evalResult = xmlDoc.evaluate("//name[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);

                if (undefined == evalResult || "" == evalResult.stringValue) {
                  //manager.ctx.db.logger.debug("defaultProcessor: //name[1]/text() undefined");
                  evalResult = xmlDoc.evaluate("//id[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);

                  if (undefined == evalResult || "" == evalResult.stringValue) {
                //manager.ctx.db.logger.debug("defaultProcessor: //id[1]/text() undefined");
                    evalResult = xmlDoc.evaluate("//h1[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);

                    if (undefined == evalResult || "" == evalResult.stringValue) {
                      //manager.ctx.db.logger.debug("defaultProcessor: //h1[1]/text() undefined");
                      //manager.ctx.db.logger.debug("defaultProcessor: trying (//text())[1]");
                      evalResult = xmlDoc.evaluate("(//text())[1]",xmlDoc,null,XPathResult.STRING_TYPE,null);
                      //manager.ctx.db.logger.debug("defaultProcessor: output: " + evalResult.stringValue);
                    }
                  }
                }
              }
              if (undefined != evalResult && null != evalResult && undefined != evalResult.stringValue && "" != evalResult.stringValue) {
                title = evalResult.stringValue;
              }
              if (0 == title.indexOf("This page contains the following errors")) { // XML parse hack
                title = result.uri;
              }
            manager.ctx.db.logger.debug("title after eval: " + title);





              // check for common snippet names - summary, synopsis, description, details
              evalResult = xmlDoc.evaluate("//summary[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
              if (undefined == evalResult || "" == evalResult.stringValue) {
                //manager.ctx.db.logger.debug("defaultProcessor: //summary[1]/text() undefined");
                evalResult = xmlDoc.evaluate("//synopsis[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
                if (undefined == evalResult || "" == evalResult.stringValue) {
                  //manager.ctx.db.logger.debug("defaultProcessor: //synopsis[1]/text() undefined");
                  evalResult = xmlDoc.evaluate("//description[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);
                  if (undefined == evalResult || "" == evalResult.stringValue) {
                    //manager.ctx.db.logger.debug("defaultProcessor: //description[1]/text() undefined");
                    evalResult = xmlDoc.evaluate("//details[1]/text()",xmlDoc,null,XPathResult.STRING_TYPE,null);

                    if (undefined == evalResult || "" == evalResult.stringValue) {
                      //manager.ctx.db.logger.debug("defaultProcessor: //details[1]/text() undefined");
                      //manager.ctx.db.logger.debug("defaultProcessor: trying (//text())[2]");
                      evalResult = xmlDoc.evaluate("(//text())[2]",xmlDoc,null,XPathResult.STRING_TYPE,null);
                      //manager.ctx.db.logger.debug("defaultProcessor: output: " + evalResult.stringValue);
                    }
                  }
                }
              }
              if (undefined != evalResult && null != evalResult && undefined != evalResult.stringValue && "" != evalResult.stringValue) {
                snippet = evalResult.stringValue;
              }
            }

            manager.ctx.db.logger.debug("content currently: " + snippet);
            if (null == snippet && null != result.content) {
              // show XML tree structure as HTML
              //manager.ctx.db.logger.debug("defaultProcessor: No XML summary, building XML tree HTML output");

              // display tree of XML
              manager.ctx.db.logger.debug("setting content to full XML doc as html");
              snippet = com.marklogic.widgets.searchhelper.xmltohtml(xmlDoc); // TODO
            }

/*
            // see if we're an XHTML file pointing to an image
            if (com.marklogic.widgets.searchresults.defaultrenderers.image.matcher(result)) {
              manager.ctx.db.logger.debug("content is an xml file pointing to an image: " + snippet);
              // render summary area
              snippet = com.marklogic.widgets.searchresults.defaultrenderers.image.summary(result,manager,settings);
            }
            */

            if (null == snippet || 0 == snippet.indexOf("error on line 1 at column 1")) {
              if (null == result.content) {
                snippet = "";
              } else {
                snippet = result.content;
              }
            }
            manager.ctx.db.logger.debug("content finally: " + snippet);

            //resStr += "<div class='searchresults-result'><h3>" + result.index + ". " + title + "</h3>";
            //if (null != snippet) {
            //  resStr += "<div class='searchresults-snippet'>" + snippet + "</div>";
            //}
            //resStr += "</div>";

            var resStr =
                com.marklogic.widgets.defaulthtmlrenderer.wrapTitle(
                    result.index + ". " + title,
                  result,manager,settings);
            if (null != snippet) {
              resStr += com.marklogic.widgets.defaulthtmlrenderer.wrapSummary(snippet,result,manager,settings);
            }

            return com.marklogic.widgets.defaulthtmlrenderer.wrapSearchResult(
                resStr
              ,result,manager,settings);
          } catch (err) {
            manager.ctx.db.logger.debug("defaultProcessor: XML mode: Failed to create XML document from text: " + result.content);
          }
          return "";
  },
  defaultSearchResultHTML: function(result,manager,settings) {

          // Get title from /html/head/title or /html/body/h1[1] or /html/body/h2[1] or /html/body/p[1]
          // don't rely on xml.evaluate() though
          //manager.ctx.db.logger.debug("searchresults: defaultProcesor: Got HTML content");
          var titleStart = result.content.indexOf("title>"); // NB can't do <title because there may be a random namespace name. Replace this with XPATH if supported
          var titleEnd = result.content.indexOf("title>",titleStart + 6);
          var bodyStart = result.content.indexOf("body");
          var bodyEnd = result.content.indexOf(">",bodyStart + 4);
          var endBodyStart = result.content.indexOf("body",bodyEnd + 1);
          //manager.ctx.db.logger.debug("titleStart: " + titleStart);
          //manager.ctx.db.logger.debug("titleEnd: " + titleEnd);
          //manager.ctx.db.logger.debug("bodyStart: " + bodyStart);
          //manager.ctx.db.logger.debug("bodyEnd: " + bodyEnd);
          //manager.ctx.db.logger.debug("endBodyStart: " + endBodyStart);

          //var endBodyEnd = result.content.indexOf(">",endBodyStart + 6);

          var bodyContent = result.content.substring(bodyEnd + 1,endBodyStart - 2);
          manager.ctx.db.logger.debug("bodyContent: " + bodyContent);
          var title = result.uri;
          if (-1 != titleStart && -1 != titleEnd) {
            title = result.content.substring(titleStart + 6,titleEnd - 2);
          } else {
            var firstElStart = bodyContent.indexOf("<");
            var firstElEnd = bodyContent.indexOf(">",firstElStart + 1);
            var endFirstElStart = bodyContent.indexOf("</",firstElEnd);
            if (-1 != firstElStart && -1 != firstElEnd && -1 != endFirstElStart) {
              title = bodyContent.substring(firstElEnd + 1,endFirstElStart);
            }
          }
          //manager.ctx.db.logger.debug("title: " + title);
          // render first 4 elements from /html/body/element()[1 to 4]
          // render all content for now

          //var resStr = "<div class='searchresults-result'><h3>" + result.index + ". " + title + "</h3>";
          //resStr += "<div class='searchresults-snippet'>" + bodyContent + "</div>";
          //resStr += "</div>";
          //return resStr;
          var titleHtml = com.marklogic.widgets.defaulthtmlrenderer.wrapTitle(
              result.index + ". " + title
            ,result,manager,settings);
          var summaryHtml =
            com.marklogic.widgets.defaulthtmlrenderer.wrapSummary(bodyContent,result,manager,settings);
          manager.ctx.db.logger.debug("defaultSearchResultHTML: title: " + titleHtml);
          manager.ctx.db.logger.debug("defaultSearchResultHTML: summary: " + summaryHtml);
          var theHtml = com.marklogic.widgets.defaulthtmlrenderer.wrapSearchResult(
              titleHtml + summaryHtml
            ,result,manager,settings);

          manager.ctx.db.logger.debug("defaultSearchResultHTML: all: " + theHtml);
          return theHtml;
  },
  defaultSearchResultUnknown: function(result,manager,settings) {
    return com.marklogic.widgets.defaulthtmlrenderer.genericTitle(result.index,result.uri);
  },
  defaultSearchResultText: function(result,manager,settings) {

      var resStr = com.marklogic.widgets.defaulthtmlrenderer.genericTitle(result.index,result.uri);

      //resStr += "<div>";
      if (undefined == result.content) {
        // no text
      } else {
        if (result.content.length <= 100) {
          resStr += result.content;
        } else {
          resStr += result.content.substring(0,100) + "...";
        }
      }
      //  resStr += "</div>";
        return resStr;
  },
  defaultSearchResultJSON: function(result,manager,settings){

        try {
          var json = result.content;
          if ("string" == typeof(json)) {
            json = JSON.parse(json); // hack for old 7.0-0 nightlies
          }

          // we hit this line if we succeed
          return com.marklogic.widgets.searchhelper.handleJson(result,json);
        } catch (err) {
          // failure
        }
        return "";
  },
  defaultSearchResultSVG: function(result,manager,settings) {
      return com.marklogic.widgets.defaulthtmlrenderer.wrapSearchResult(
          com.marklogic.widgets.defaulthtmlrenderer.genericSVG(result.content)
        ,result,manager,settings);
  },

  // wrappers handle MLJS provided outer HTML - they have a fixed API
  wrapSearchResult: function(inner,result,manager,settings) {
    return "<div class='searchresults-result'>" + inner + "</div>";
  },
  wrapTitle: function(inner,result,manager,settings) {
    return "<div class='h4'>" + inner + "</div>";
  },
  wrapSummary: function(inner,result,manager,settings) {
    return "<div class='searchresults-snippet'>" + inner + "</div>";
  },
  wrapAction: function(action,inner,result,manager,settings) {
    // E.g. view, edit link
    return inner;
  },

  // Generics handle reusable inner content - they have a variable, specific API
  genericTitle: function(index,docuri) {
    var dt = docuri;
    var pos = dt.lastIndexOf("/");
    if (pos > 0) { // not -1 or 0
      dt = dt.substring(pos + 1);
    }
    return "<div class='h4'>" + index + ". <span title='" + encodeURI(docuri) + "'>" + dt + "</span></div>";
  },
  genericSVG: function(svg) {
    return "<div style='height: 200px;position:relative;'>" + svg + "</div>";
  },
  genericUnknown: function() {
    return "";
  },

  // helper methods
  getMetadata: function(result,param) {
    if (undefined == result.metadata) {
      return null;
    }
            for (var metai = 0, maxi = result.metadata.length, meta;metai < maxi;metai++) {
              meta = result.metadata[metai];
              //console.log("  meta instance: " + metai);
              for (var p in meta) {
                //console.log("    found param: " + param);
                // find our one
                // NB may be multiple of them - TODO support more than just last found
                if (p == param) {
                  //console.log("      found latsrc constraint param");
                  return meta[p];

                }
              }
            }
            return null;
  },
  getMetadataConstraint: function(result,constraintName) {
    return com.marklogic.widgets.defaulthtmlrenderer.getMetadata(result,constraintName); // same as generic getMetadata
  },
  getMetadataElement: function(result,element,namespace_opt) {
    return com.marklogic.widgets.defaulthtmlrenderer.getMetadata(result,"{" + (namespace_opt || "") + "}" + element);
  } // TODO other metadata elements as required - path? geo?

};

com.marklogic.widgets.searchresults.defaultrenderers = {
  json: {
    matcher: function(result,manager,settings) {
      return ("json" == result.format && undefined == result.matches);
    },
    processor: function(result,manager,settings) {
      if (undefined != result.matches) {return com.marklogic.widgets.searchhelper.snippet(result);}
      return com.marklogic.widgets.defaulthtmlrenderer.defaultSearchResultJSON(result,manager,settings);
    }
  },
  snippet: {
    matcher: function(result,manager,settings) {
      return (undefined != result.matches && undefined != result.matches[0] && undefined != result.matches[0]["match-text"] &&
              undefined != result.matches[0]["match-text"][0] /*&& result.matches[0]["match-text"][0].indexOf("<html") == 0*/);

    },
    processor: function(result,manager,settings) {
      //if (undefined != result.matches) {return com.marklogic.widgets.searchhelper.snippet(result);}
      return com.marklogic.widgets.defaulthtmlrenderer.defaultSearchResult(result,manager,settings); // should never get here
    }
  },
  imagelink: {
    matcher: function(result) {
      var matchit = function(str) {
        return (str.endsWith(".jpg") || str.endsWith(".jpeg") || str.endsWith(".gif") ||
                str.endsWith(".png") )
      };

        var str = com.marklogic.widgets.defaulthtmlrenderer.getMetadata(result,"originalurl") ;
        if (null != str) {
          return matchit(str);
        }
        return false;
      return match;
    }, summary: function(result,manager,settings) {
        return "";
    }, title: function(result,manager,settings) {
      return com.marklogic.widgets.defaulthtmlrenderer.genericXMLTitle(result,manager,settings);
    }, thumbnail: function(result,manager,settings) {
        var str = com.marklogic.widgets.defaulthtmlrenderer.getMetadata(result,"originalurl") ;

          return "<img style='width: 150px;' src='/v1/documents?uri=" + encodeURI(str) + "' alt='" + encodeURI(str) + "' />";
    }

  },
  image: {
    matcher: function(result) {
      var matchit = function(str) {
        return (str.endsWith(".jpg") || str.endsWith(".jpeg") || str.endsWith(".gif") ||
                str.endsWith(".png") )
      };
      var match = matchit(result.uri);

      return match;
    }, thumbnail: function(result,manager,settings) {
        return "<img style='width: 150px;' src='/v1/documents?uri=" + encodeURI(result.uri) + "' alt='" + encodeURI(result.uri) + "' />";

    }, summary: function() {
      return "";
    }
  },
  svg: {
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
    },
    // backwards compatibility
    processor: function (result,manager,settings) {
      if (undefined != result.matches) {return com.marklogic.widgets.searchhelper.snippet(result);}
      return com.marklogic.widgets.defaulthtmlrenderer.defaultSearchResultSVG(result,manager,settings);
    },

    // Enhanced rendering
    summary: function(result, manager, settings) {
      if (undefined != result.matches) {return com.marklogic.widgets.searchhelper.snippet(result);}
      return com.marklogic.widgets.defaulthtmlrenderer.genericSVG(result.content);
    }
    // other areas are as default
  },
  html: {
    matcher: function(result,manager,settings) {
      // TODO content type can be text/html - from get() anyway - is this reflected in search output too???
      return ("string" == typeof result.content && -1 != result.content.substring(0,100).indexOf("<html"));
      // TODO replace with XPath as this is very wide ranging - http://www.w3.org/1999/xhtml (escape dots?)
    },
    processor: function(result,manager,settings) {
      if (undefined != result.matches) {return com.marklogic.widgets.searchhelper.snippet(result);}
      return com.marklogic.widgets.defaulthtmlrenderer.defaultSearchResultHTML(result,manager,settings);
    }
  },
  triples: {
    matcher: function(result,manager,settings) {
      if (undefined == result.content) {
        return false;
      }
      return ("<sem:triples" == result.content.substring(0,12)); // TODO handle wider variety of formats - E.g. whitespace at start
      // TODO flesh this out
    },
    processor: function(result,manager,settings) {
      if (undefined != result.matches) {return com.marklogic.widgets.searchhelper.snippet(result);}
      return com.marklogic.widgets.defaulthtmlrenderer.defaultSearchResultTriples(result,manager,settings);
    }
  },
  xml: {
    matcher: function(result,manager,settings) {
      return ("xml" == result.format);
    },
    processor: function(result,manager,settings) {
      if (undefined != result.matches) {return com.marklogic.widgets.defaulthtmlrenderer.defaultTitle(result,manager,settings) + com.marklogic.widgets.searchhelper.snippet(result);}
      return com.marklogic.widgets.defaulthtmlrenderer.defaultSearchResultXML(result,manager,settings);
    }
  },
  text: {
    matcher: function(result,manager,settings) {
      return ("text" == result.format);
    },
    processor: function(result,manager,settings) {
      if (undefined != result.matches) {return com.marklogic.widgets.searchhelper.snippet(result);}
      return com.marklogic.widgets.defaulthtmlrenderer.defaultSearchResultText(result,manager,settings);
    }
  },
  fallback: {
    matcher: function(result,manager,settings) {
      return true;
    },
    summary: function(result,manager,settings) {
      if (undefined != result.matches) {return com.marklogic.widgets.searchhelper.snippet(result);}
      return com.marklogic.widgets.defaulthtmlrenderer.genericUnknown(result,manager,settings);

    }
  }
};





// START MANAGER PUBLIC FUNCTIONS DESIGNED FOR USE BY CUSTOM SEARCH RESULT RENDERERS

/**
 * Generates a lazy loading ID. Used by custom renderers when they want to call a function after this widget renders individual result HTML renderings.
 * Usually action event handlers.
 * MANAGER FUNCTION FOR CUSTOM SEARCH RESULT RENDERER USE
 * @return {string} elid - The unique HTML element ID to use for a custom piece of html for later referencing. E.g. see lazyLoad()
 */
com.marklogic.widgets.searchresults.prototype.generateLazyID = function() {
  return this.lazyId++;
};

/**
 * Provides a post result rendering function for lazy loading of a search result.
 * MANAGER FUNCTION FOR CUSTOM SEARCH RESULT RENDERER USE
 * @param {string} docuri - MarkLogic document URI
 * @param {string} elid - The HTML element ID. Usually gotten from generateLazyID()
 * @param {function} callback - The callback function. Receives two parameters when called, the docuri then the html element id
 */
com.marklogic.widgets.searchresults.prototype.lazyLoad = function(docuri,elid,callback) {
  this.lazyLoaders.push({docuri: docuri,elid: elid,callback: callback});
};

com.marklogic.widgets.searchresults.prototype._navigateTo = function(uri) {
  var go = this.detailsLink.replace("#URI#",uri);
  window.location = go;
};

/**
 * Returns the value of the specified extracted value from the metadata section of the search result. Helper function
 * MANAGER FUNCTION FOR CUSTOM SEARCH RESULT RENDERER USE
 * @param {MLJS.SearchResult} result - Single search result JSON from REST API JSON results object
 * @param {string} extractname - The name (from constraint or element name) of the extracted metadata. Normally a constraint name, something like 'sender'. Note though for XML elements rather than constraints this is {http://namespace}elementlocalname
 * @param {string} ns_opt - Namespace of the element (if XML only)
 */
com.marklogic.widgets.searchresults.prototype.getResultExtract = function(result,extractname,ns_opt) {
  if (undefined != result && undefined != result.metadata) {
    for (var metai = 0, maxi = result.metadata.length, meta;metai < maxi;metai++) {
      meta = result.metadata[metai];
      //console.log("  meta instance: " + metai);
      for (var p in meta) {
        console.log("    searchresults.getResultExtract: found param: " + p);
        // find our one
        // NB may be multiple of them - TODO support more than just last found
        if (p.substring(0,1) == "{") {
          console.log(" getResultExtract: Got XML element");
          // XML namespaced element
          var t = "{" + ns_opt + "}" + extractname;
          if (p == t) {
            console.log(" getResultExtract: MATCHES!: " + t);
            return meta[p];
          }
        } else {
          if (p == extractname) {
            //console.log("      found latsrc constraint param");
            return meta[p];
          }

        }
      }
    }
  }

  // TODO check the raw result too, not just metadata

  return null;
};

// END MANAGER PUBLIC FUNCTIONS



/**
 * Adds a result highlight listener to this widget.
 *
 * @param {function} sl - Search listener function. Function will be passed a uri array
 */
com.marklogic.widgets.searchresults.prototype.addResultHighlightListener = function(sl) {
  this.highlightPublisher.subscribe(sl);
};

/**
 * Removes a result higlight listener.
 *
 * @param {function} sl - Search listener function. Function will be passed a uri array
 */
com.marklogic.widgets.searchresults.prototype.removeResultHighlightListener = function(sl) {
  this.highlightPublisher.unsubscribe(sl);
};

/**
 * Adds a result selection listener to this widget.
 *
 * @param {function} sl - Search listener function. Function will be passed a uri array
 */
com.marklogic.widgets.searchresults.prototype.addResultSelectionListener = function(sl) {
  this.selectionPublisher.subscribe(sl);
};

/**
 * Removes a result selection listener.
 *
 * @param {function} sl - Search listener function. Function will be passed a uri array
 */
com.marklogic.widgets.searchresults.prototype.removeResultSelectionListener = function(sl) {
  this.selectionPublisher.unsubscribe(sl);
};

// search results custom processing

/**
 * Adds a result processor object to this widget.
 *
 * @param {string} name - Processor name reference
 * @param {function|json} matcher_func - Function to invoke to see if a particular result can be handled by this processor. Function passed a result object. - OR - JSON object containing all processor supported sections
 * @param {function} processor_func - Function to process the result to generate representative XHTML. Function passed a result object
 */
com.marklogic.widgets.searchresults.prototype.addProcessor = function(name,matcher_func,processor_func) {
  if (undefined == processor_func && typeof(matcher_func) == "object") {
    this.processors[name] = matcher_func
  } else {
    this.processors[name] = {matcher:matcher_func,processor:processor_func};
    this.availableProcessors.push(name);
    this.processorPriority.push(name);
  }
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

com.marklogic.widgets.searchresults.prototype.updateResultSelection = function(newsel) {
  // loop through our results (NOT the selection list)
  // if newsel list contains result, then select it (CSS class)
  // else, remove selection class
  if (undefined == this.results || undefined == this.results.results) {
    return;
  }
  //this._layout.select(newsel);
  for (var i = 0;i < this.results.results.length;i++) {
    var wrapperId = this.container + "-result-" + i;
    // run processors in order
    var result = this.results.results[i];

    if (newsel.contains(result.uri)) {
      // add selection class
      com.marklogic.widgets.addClass(document.getElementById(wrapperId),"selected");
    } else {
      // remove selection class
      com.marklogic.widgets.removeClass(document.getElementById(wrapperId),"selected");
    }
  }
};

com.marklogic.widgets.searchresults.prototype.updateResultHighlight = function(newhigh) {
  // loop through our results (NOT the selection list)
  // if newsel list contains result, then select it (CSS class)
  // else, remove selection class
  if (undefined == this.results || undefined == this.results.results) {
    // This can happen if a search is executing but markers still visible form old search, and user mouses over them
    return;
  }
  for (var i = 0;i < this.results.results.length;i++) {
    var wrapperId = this.container + "-result-" + i;
    // run processors in order
    var result = this.results.results[i];

    if (newhigh.contains(result.uri)) {
      // add selection class
      com.marklogic.widgets.addClass(document.getElementById(wrapperId),"highlighted");
    } else {
      // remove selection class
      com.marklogic.widgets.removeClass(document.getElementById(wrapperId),"highlighted");
    }
  }
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

  this.perPage = 10; // TODO get this from search options / results
  this.start = 0;
  this.total = 0;

  this.ctx = mljs.defaultconnection.createSearchContext();

  // event handlers
  this.pagePublisher = new com.marklogic.events.Publisher();

  // html
  document.getElementById(container).innerHTML =
    "<div class='mljswidget searchpager'><span class='searchpager-showing' id='" + container + "-searchpager-showing'></span>" +
    "<a href='#' id='" + container + "-searchpager-first-a' class='searchpager-link'><span class='glyphicon glyphicon-step-backward searchpager-first searchpager-button' id='" + container + "-searchpager-first'> </span></a>" +
    "<a href='#' id='" + container + "-searchpager-previous-a' class='searchpager-link'><span class='glyphicon glyphicon-chevron-left searchpager-previous searchpager-button' id='" + container + "-searchpager-previous'> </span></a>" +
    "<span class='searchpager-page' id='" + container + "-searchpager-page'>-</span>" +
    "<a href='#' id='" + container + "-searchpager-next-a' class='searchpager-link'><span class='glyphicon glyphicon-chevron-right searchpager-next searchpager-button' id='" + container + "-searchpager-next'> </span></a>" +
    "<a href='#' id='" + container + "-searchpager-last-a' class='searchpager-link'><span class='glyphicon glyphicon-step-forward searchpager-last searchpager-button' id='" + container + "-searchpager-last'> </span></a></div>";
  var self = this;
  document.getElementById(container + "-searchpager-first-a").onclick = function() {self._first();};
  document.getElementById(container + "-searchpager-previous-a").onclick = function() {self._previous();};
  document.getElementById(container + "-searchpager-next-a").onclick = function() {self._next();};
  document.getElementById(container + "-searchpager-last-a").onclick = function() {self._last();};

  this._refresh();
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.searchpager.getConfigurationDefinition = function() {
  return {
  };
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.searchpager.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this[prop] = config[prop];
  }

  // refresh display
  this._refresh();
};

/**
 * Set the search context object to use for operations
 *
 * @param {mljs.searchcontext} ctx - The search context instance to invoke
 */
com.marklogic.widgets.searchpager.prototype.setSearchContext = function(context) {
  this.ctx = context;
};

/**
 * Get the search context object this widget will use for operations
 */
com.marklogic.widgets.searchpager.prototype.getContext = function() {
  return this.ctx;
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

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.searchsort.getConfigurationDefinition = function() {
  return {
  }
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.searchsort.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this[prop] = config[prop];
  }

  // refresh display
  this._refresh();
};

/**
 * Set the search context object to use for operations
 *
 * @param {mljs.searchcontext} ctx - The search context instance to invoke
 */
com.marklogic.widgets.searchsort.prototype.setSearchContext = function(context) {
  this.ctx = context;
};

/**
 * Get the search context object this widget will use for operations
 */
com.marklogic.widgets.searchsort.prototype.getContext = function() {
  return this.ctx;
};


com.marklogic.widgets.searchsort.prototype._refresh = function() {
  var selid =  this.container + "-searchsort-select";
  var str =
    "<div class='mljswidget input-prepend searchsort'>" +
      //"<div class='input-prepend searchsort-inner'>" +
        "<span class='searchsort-text'>Sort: </span>" +
        "<select class='form-control searchsort-select' id='" + selid + "'>";
//      "<option value='relevance'>Relevance</option>" +
  for (var i = 0;i < this.sortOptions.length;i++) {
    var selected = false;
    if (this.selectedValue == null) {
      selected = true;
      this.selectedValue = this.sortOptions[i]; // TODO do this outside of the loop, set to FIRST sort option
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
          val = o["attribute"].name;
        } else {
          val = o["element"].name;
        }
      }
      if (undefined != o.field) {
        val = o["field"].name;
      }

      // check for annotation to override title
      // check for first annotation
    if (undefined != o.annotation && undefined != o.annotation[0]) {
      title = o.annotation[0];
    }
    if (undefined == title || "" == title) {
      title = com.marklogic.widgets.searchhelper.processValueAll(val);

      if ("" != title && undefined != o.direction) {
        var dir = com.marklogic.widgets.searchhelper.camelcase(o.direction,"all");
        if ("Ascending" == dir) {
          dir = "Asc";
        } else if ("Descending" == dir) {
          dir = "Desc";
        }
        title += " (" + dir + ")";
      } else {
        // TODO not specified - default to ascending? - no, leave this to the first, untitled sort option given by MarkLogic server
      }
    }
    //}
    //str += " (";
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









/**
 * Creates a new document selection widget, showing a list of document URIs that have been selected on this page.
 *
 * @constructor
 * @param {string} container - The HTML ID of the container within which to render this widget.
 */
com.marklogic.widgets.selection = function(container) {
  this.container = container;

  this._selected = new Array(); // URI list

  this._refresh();
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.selection.getConfigurationDefinition = function() {
  return {
  };
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.selection.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this[prop] = config[prop];
  }

  // refresh display
  this._refresh();
};

com.marklogic.widgets.selection.prototype._refresh = function() {
  var str = "<div id='" + this.container + "-selection' class='mljswidget panel panel-info selection'>";
  str += "<div class='title panel-heading selection-title'>Selected Documents</div>";
  str += "<div class='panel-body selection-content'>";

  if (0 == this._selected.length) {
    str += "<i>None Selected</i>";
  } else {
    for (var i = 0,max = this._selected.length,sel;i < max;i++) {
      sel = this._selected[i];
      str += "<p>" + sel + "</p>"; // TODO allow editing of selection (removing selected docs) // TODO lookup doc summary somehow - title facet, etc.
    }
  }
  str += "</div></div>";
  document.getElementById(this.container).innerHTML = str;
};

/**
 * Responds to a search context's update of the list of selected document URIs
 *
 * @param {Array(string)} newsel - String array containing URIs of selected documents.
 */
com.marklogic.widgets.selection.prototype.updateDocumentSelection = function(newsel) {
  this._selected = newsel;
  this._refresh();
};











// SEARCH PAGE ELEMENT (combines others)

/**
 * Creates a new search page widget, containing a search bar, search pager, search sorter, search results and search facets widget.
 *
 * @constructor
 * @deprecated Use a Workplace widget with thin-thick layout, or a saved Workplace page configuration.
 * @param {string} container - The HTML ID of the container within which to render this widget.
 */
com.marklogic.widgets.searchpage = function(container) {
  this.container = container;

  document.getElementById(container).innerHTML =
   "<div class='container_12 searchpage-inner'>" +
    "<div id='" + container + "-facets' class='grid_4 searchpage-facets'> </div> " +
    "<div id='" + container + "-main' class='grid_8 searchpage-main'>" +
      "<div id='" + container + "-bar' class='searchpage-bar'></div>" +
      //"<div id='" + container + "-error' class='searchpage-error'></div>" +
      "<div class='searchpage-controls'>" +
        "<div class='searchpage-controls-inner'>" +
          "<div id='" + container + "-pager' class='grid_5 alpha searchpage-pager'></div>" +
          "<div id='" + container + "-sort' class='grid_3 omega searchpage-sort'></div>" +
        "</div>" +
      "</div>" +
      "<div id='" + container + "-results' class='searchpage-results'></div>" +
      //"<div id='" + container + "-results-actions' class='searchpage-results-actions'></div>" +
    "</div></div>";

  this.context = mljs.defaultconnection.createSearchContext();

  // NB these simple names allow direct access via mypage.bar in order for page creator to set config defaults (E.g. facet size)
  this.bar = new com.marklogic.widgets.searchbar(container + "-bar");
  this.facets = new com.marklogic.widgets.searchfacets(container + "-facets");
  this.pager = new com.marklogic.widgets.searchpager(container + "-pager");
  this.sort = new com.marklogic.widgets.searchsort(container + "-sort");
  this.results = new com.marklogic.widgets.searchresults(container + "-results");
  //this.error = new com.marklogic.widgets.error(container + "-error");

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


com.marklogic.widgets.searchpage.prototype.setSearchContext = function(ctx) {
  this.context = ctx;

  this.context.register(this.bar);
  this.context.register(this.sort);
  this.context.register(this.facets);
  this.context.register(this.pager);
  this.context.register(this.results);
};

com.marklogic.widgets.searchpage.prototype.getSearchContext = function() {
  return this.context;
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











/**
 * Structured query selection widget. Can be used akin to a sort selection widget for structured queries that use
 * MarkLogic V7's range index relevancy scoring methods.
 *
 * @constructor
 * @param {string} container - The HTML ID of the container to render this widget within
 */
com.marklogic.widgets.searchselection = function(container) {
  this.container = container;

  this._config = {
    title: "Relevancy Method: ",
    mode: "replace",
    queries: []
  };

  // TODO support both query mode and contribution mode
  // TODO support JSON (fixed query) and function(dynamic query) methods

  this._queries = {}; // { queryname: jsonOrFunction, ...} - holds PROCESSED version of config queries // TODO refactor this so just config.queries
  this._selectedQuery = null; // queryname value from above array

  this._refresh();

  this.ctx = mljs.defaultconnection.createSearchContext();
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.searchselection.getConfigurationDefinition = function() {
  return {
    title: {type: "string", default: "Relevancy Method: ", title: "Title", description: "How to describe the drop down."},
    mode: {type: "enum", default: "replace", title: "Mode", description: "Are we replacing the search or contributing to it.",
      options: [
        {value: "replace", title: "Replace", description: "Replace the search with the one selected"},
        {value: "contribute", title: "Contribute", description: "Contribute this query to the search"}
      ]
    },
    queries: {type: "multiple", minimum: 0, default: [], title: "Queries", description: "JSON Structured queries to select",
          childDefinitions: {
            //title,searchcontext,latsrc,lonsrc,titlesrc,summarysrc,icon_source_opt,heatmap_constraint
            title: {type: "string", default: "", title: "Title", description: "Title to show in drop down"},
            query: {type: "string",default: "", title: "Query", description: "JSON string query to execute"}
          }
    }
  };
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.searchselection.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }

  // parse queries
  var queries = config.queries;
  if (undefined != queries && Array.isArray(queries)) {
    for (var q = 0,maxq = queries.length,query;q < maxq;q++) {
      query = queries[q];
      this._queries[query.title] = JSON.parse(query.query);
    }
  }

  // refresh display
  this._refresh();
};

/**
 * Set the search context object to use for operations
 *
 * @param {mljs.searchcontext} ctx - The search context instance to invoke
 */
com.marklogic.widgets.searchselection.prototype.setSearchContext = function(ctx) {
  this.ctx = ctx;
};

/**
 * Get the search context object this widget will use for operations
 */
com.marklogic.widgets.searchselection.prototype.getContext = function() {
  return this.ctx;
};

com.marklogic.widgets.searchselection.prototype._config = function() {
  // TODO
};

com.marklogic.widgets.searchselection.prototype._refresh = function() {
  var selid = this.container + "-searchselection-select";
  var str = "<div id='" + this.container + "-searchselection' class='mljswidget well searchselection'>";

  str += "<span class='searchselection-text'>" + this._config.title + "</span>" +
    "<select class='searchselection-select' id='" + selid + "'>";
  for (var name in this._queries) {
    str += "<option value='" + name + "'";
    if (name == this._selectedQuery) {
      str += " selected='selected'";
    }
    str += ">" + name + "</option>";
  }
  str += "</select>";

  str += "</div>";
  document.getElementById(this.container).innerHTML = str;

  // add event handlers
  var self = this;
  var sel = document.getElementById(selid);
  sel.onchange = function(evt) {
    self.__selection(sel.value);
  };
};

/**
 * Adds the specified query as one which can be selected within this widget.
 *
 * @param {string} name - The visible name (title) to use for this search configuration
 * @param {JSON|string} jsonOrFunction - The JSON structured query (from qb.toJson()) or a function that when invoked returns this JSON.
 */
com.marklogic.widgets.searchselection.prototype.addQuery = function(name,jsonOrFunction) {
  this._queries[name] = jsonOrFunction;

  this._refresh();
};

/**
 * Removes the specified query from this widget
 *
 * @param {string} name - The visible name (title) of this search configuration to remove
 */
com.marklogic.widgets.searchselection.prototype.removeQuery = function(name) {
  this._queries[name] = undefined;

  this._refresh();
};

com.marklogic.widgets.searchselection.prototype.__selection = function(selvalue) {
  // set this._selectedQuery
  this._selectedQuery = selvalue;
  // perform query
  this.__doquery();
};

com.marklogic.widgets.searchselection.prototype.__doquery = function() {
  // ensure a query is selected
  if (null == this._selectedQuery) {
    var first = null;
    for (var name in this._queries) {
      if (null == first) {
        first = name;
      }
    }
    if (null == first) {
      // no queries configured
      return;
    } else {
      this._selectedQuery = first;
      this._refresh(); // ensure query selected in UI too
    }
  }

  // generate query
  var q = this._queries[this._selectedQuery];
  var query = null;
  if ("function"===typeof(q)) {
    mljs.defaultconnection.logger.debug("searchselection.__doquery: Calling query function");
    query = q();
  } else if ("object"===typeof(q)) {
    mljs.defaultconnection.logger.debug("searchselection.__doquery: Setting query value");
    query = q;
  }
  mljs.defaultconnection.logger.debug("searchselection.__doquery: Query now: " + JSON.stringify(query));

  // perform query
  if ("contribute" == this._config.mode) {
    mljs.defaultconnection.logger.debug("searchselection.__doquery: Contributing Query");
    this.ctx.contributeStructuredQuery(this.container,query,1); // start at first result as we're switching queries
  } else {
    mljs.defaultconnection.logger.debug("searchselection.__doquery: Overwriting Query");
    this.ctx.doStructuredQuery(query);
  }
};

com.marklogic.widgets.searchselection.prototype.setModeContributeStructured = function() {
  this._mode = "contribute";
};












/**
 * Creates a search metrics display widget. Shows nothing if search metrics not enabled in your search options.
 *
 * @param {string} container - The HTML element ID of the container to render this widget within.
 */
com.marklogic.widgets.searchmetrics = function(container) {
  this.container = container;
  this.ctx = mljs.defaultconnection.createSearchContext();

  this.updateResults(false); // show 'blank' results
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.searchmetrics.getConfigurationDefinition = function() {
  return {
  };
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.searchmetrics.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this[prop] = config[prop];
  }

  // refresh display
  this.updateResults(false);
};

/**
 * Called by a Search Context instance to render search metrics based on the last search operation.
 *
 * @param {json} results - The MarkLogic REST API JSON results wrapper object
 */
com.marklogic.widgets.searchmetrics.prototype.updateResults = function(results) {
  var str = "";

  // results can be true, false or a JSON REST API results object
  if ("boolean" == typeof(results)) {
    if (results) {
      // refreshing search results, show loading icon
      str += com.marklogic.widgets.bits.loading(this.container + "-loading");
    } else {
      // search failed - show nothing
      // Alternatively: str += com.marklogic.widgets.bits.failure(this.container + "-failure");
    }
  } else {
    // create html output
    if (undefined != results.metrics) {
      var time = results.metrics["total-time"]; // Value like: PT1.064535S - it's marklogic, so assumes it's never in minutes (because MarkLogic rocks!)
      var time = time.substring(2,time.length - 1);
      str += "Search completed in " + time + " seconds"; // TODO VALIDATE THIS LINE
    } else {
      // show nothing, rather than useless message
      mljs.defaultconnection.logger.debug("searchmetrics.updateResults: Results REST API JSON doesn't contain search metrics. Did you set up the search options correctly?");
    }
  }

  // send output to webpage DOM (do not make multiple edits to the DOM - it's slower)
  document.getElementById(this.container).innerHTML = str;
};









com.marklogic.widgets.refreshsearch = function(container) {
  this.container = container;

  this._searchContext = null;

  this._config = {
    mode: "structured" // structured or content
  };

  var s = "<div class='mljswidget refreshsearch' id='" + this.container + "-outer'>";
  s += "<button class='btn btn-primary glyphicon glyphicon-refresh' id='" + this.container + "-button'></button>";
  s += "</div>";
  document.getElementById(this.container).innerHTML = s;

  var self = this;
  document.getElementById(this.container + "-button").onclick = function() {
    console.log("refreshsearch: Click");
    if (null != self._searchContext) {
      if ("structured" == self._config.mode) {
        self._searchContext.contributeStructuredQuery(self.container,null); // forces search (without blank contributed search term)
      } else {
        // do simple query with last query value
        self._doSimpleQuery(null); // forces default query // TODO make this last query, not just default
      }
    }
  };
};

com.marklogic.widgets.refreshsearch.getConfigurationDefinition = function() {
  return {
    mode: {type: "enum", default: "structured", title: "Search Mode", description: "Are we executing a structured (or values) query, or content query?",
      options: [
        {value: "structured", title: "Structured", description: "Structured Query"},
        {value: "content", title: "Content", description: "(Defualt) Content Query"}
      ]}
  };
};


com.marklogic.widgets.refreshsearch.prototype.setConfiguration = function(config) {
  this._config = config;
};

com.marklogic.widgets.refreshsearch.prototype.setSearchContext = function(ctx) {
  this._searchContext = ctx;
};

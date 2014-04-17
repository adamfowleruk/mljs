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

// SEARCH RESULTS DECLARE ALL WIDGET









// LIST RM COLLECTIONS WIDGET -> NA Same as any collection widget - widget-collections.js


com.marklogic.widgets.dlscollections = function(container) {
  this.container = container;
  this._uriHandler = null;
  this.errorPublisher = new com.marklogic.events.Publisher(); 
  
  document.getElementById(this.container).innerHTML = "<h2 class='dlscollections-title'>List of DLS Managed Collections</h2><div id='" + this.container + "-list'><i>Ready for load.</i></div>";
};

com.marklogic.widgets.dlscollections.prototype.uriHandler = function(handler) {
  this._uriHandler = handler;
};

com.marklogic.widgets.dlscollections.prototype.refresh = function() {
  var self = this;
  mljs.defaultconnection.dlscollections(function(result) {
    var s = "";
    if (0 == result.doc.collections) {
      s += "<p><i>No results</i></p>";
    } else {
      for (var i = 0;i < result.doc.collections.length;i++) {
        s += "<p>";
        if (null != self._uriHandler) {
          s += "<a href='" + self._uriHandler.replace("#URI#",result.doc.collections[i]) + "'>";
        }
        s += result.doc.collections[i];
        if (null != self._uriHandler) {
          s += "</a>";
        }
        s += "</p>";
      }
    }
    document.getElementById(self.container + "-list").innerHTML = s;
  });
};

/**
 * Adds an error listener to this widget
 * 
 * @param {function(error)} fl - The error listener to add
 */
com.marklogic.widgets.dlscollections.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 * 
 * @param {function(error)} fl - The error listener to remove
 */
com.marklogic.widgets.dlscollections.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};




// VIEW RM COLLECTION WIDGET -> NA Instead use search widget with constraint on collection URI as it's more flexible



com.marklogic.widgets.dlscollection = function(container) {
  this.container = container;
  this.errorPublisher = new com.marklogic.events.Publisher(); 
  this._uriViewHandler = null; // application document content editing/viewing handler
  this._uriInfoHandler = null; // RM / DLS view info handler
  
  document.getElementById(this.container).innerHTML = "<h2 class='dlscollection-title'>Documents in DLS collection</h2><div id='" + this.container + "-list'><i>Ready for load.</i></div>";
};

com.marklogic.widgets.dlscollection.prototype.uriViewHandler = function(handler) {
  this._uriViewHandler = handler;
};

com.marklogic.widgets.dlscollection.prototype.uriInfoHandler = function(handler) {
  this._uriInfoHandler = handler;
};

com.marklogic.widgets.dlscollection.prototype.loadCollection = function(collection) {
  var self = this;
  mljs.defaultconnection.dlscollection(collection,function(result) {
    var s = "";
    s += "<p><b>Contents of collection: " + collection + "</b></p>";
    if (0 == result.doc.uris) {
      s += "<p><i>No results</i></p>";
    } else {
      for (var i = 0;i < result.doc.uris.length;i++) {
        s += "<p>";
        if (null != self._uriInfoHandler) {
          s += "[<a href='" + self._uriInfoHandler.replace("#URI#",result.doc.uris[i]) + "'>Info</a>] ";
        }
        if (null != self._uriViewHandler) {
          s += "[<a href='" + self._uriViewHandler.replace("#URI#",result.doc.uris[i]) + "'>View</a>] ";
        }
        s += result.doc.uris[i];
        s += "</p>";
      }
    }
    document.getElementById(self.container + "-list").innerHTML = s;
  });
};


/**
 * Adds an error listener to this widget
 * 
 * @param {function(error)} fl - The error listener to add
 */
com.marklogic.widgets.dlscollection.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 * 
 * @param {function(error)} fl - The error listener to remove
 */
com.marklogic.widgets.dlscollection.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};







// LIST RM RETENTION RULES WIDGET


com.marklogic.widgets.dlsrules = function(container) {
  this.container = container;
  this.errorPublisher = new com.marklogic.events.Publisher(); 
  
  document.getElementById(this.container).innerHTML = "<h2 class='dlsrules-title'>List of DLS Rules</h2><div id='" + this.container + "-list'><i>Ready for load.</i></div>";
};

com.marklogic.widgets.dlsrules.prototype.uriHandler = function(handler) {
  this._uriHandler = handler;
};

com.marklogic.widgets.dlsrules.prototype.refresh = function() {
  var self = this;
  mljs.defaultconnection.dlsrules(function(result) {
    var s = "";
    if (0 == result.doc.rules.length) {
      s += "<p><i>No rules exist</i></p>";
    } else {
      for (var i = 0;i < result.doc.rules.length;i++) {
        s += "<p>";
        if (null != self._uriHandler) {
          s += "<a href='" + self._uriHandler.replace("#URI#",result.doc.rules[i]["retentionRule"].name) + "'>";
        }
        s += result.doc.rules[i]["retentionRule"].name;
        if (null != result.doc.rules[i]["retentionRule"].comment) { 
          s += ": <i>\"" + result.doc.rules[i]["retentionRule"].comment + "\"</i>";
        }
        if (null != self._uriHandler) {
          s += "</a>";
        }
        s += "</p>";
      }
    }
    document.getElementById(self.container + "-list").innerHTML = s;
  });
};


/**
 * Adds an error listener to this widget
 * 
 * @param {function(error)} fl - The error listener to add
 */
com.marklogic.widgets.dlsrules.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 * 
 * @param {function(error)} fl - The error listener to remove
 */
com.marklogic.widgets.dlsrules.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};








// ADD RM RETENTION RULES WIDGET

com.marklogic.widgets.dlsruleinfo = function(container) {
  this.container = container;
  this.errorPublisher = new com.marklogic.events.Publisher(); 

  this.name = null;
  
  this.refresh();
};

com.marklogic.widgets.dlsruleinfo.prototype.refresh = function() {
  if (null != this.name) {
    var self = this;
    mljs.defaultconnection.dlsrule(this.name,function(result) {
      console.log("doc content: " + JSON.stringify(result.doc));
      var s = "<h2>DLS Rule Details</h2>";
      s += "<b>Name: </b>" + result.doc["retentionRule"].name;
      s += "<br/><b>Comment: </b>";
      if (null == result.doc["retentionRule"].comment) {
        s += "<i>No comment</i>";
      } else {
        s += result.doc["retentionRule"].comment; 
      }
      s += "<br/><b>Versions to keep: </b>" + result.doc["retentionRule"]["numVersions"];
      s += "<br/><b>Document query summary: </b><a href='#'>" + result.doc["retentionRule"]["documentQueryText"] + "</a>";
      document.getElementById(self.container).innerHTML = s;
    });
  } else {
    var s = "<h2>DLS Rule Details</h2>";
    s += "<p><i>Loading...</i></p>";
    document.getElementById(this.container).innerHTML = s;
  }
  
};

com.marklogic.widgets.dlsruleinfo.prototype.info = function(name) {
  this.name = name;
  this.refresh();
};


/**
 * Adds an error listener to this widget
 * 
 * @param {function(error)} fl - The error listener to add
 */
com.marklogic.widgets.dlsruleinfo.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 * 
 * @param {function(error)} fl - The error listener to remove
 */
com.marklogic.widgets.dlsruleinfo.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};



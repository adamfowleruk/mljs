// global variable definitions
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};

// SEARCH RESULTS DECLARE ALL WIDGET









// LIST RM COLLECTIONS WIDGET -> NA Same as any collection widget - widget-collections.js


com.marklogic.widgets.dlscollections = function(container) {
  this.container = container;
  this._uriHandler = null;
  
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





// VIEW RM COLLECTION WIDGET -> NA Instead use search widget with constraint on collection URI as it's more flexible



com.marklogic.widgets.dlscollection = function(container) {
  this.container = container;
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








// LIST RM RETENTION RULES WIDGET


com.marklogic.widgets.dlsrules = function(container) {
  this.container = container;
  
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









// ADD RM RETENTION RULES WIDGET

com.marklogic.widgets.dlsruleinfo = function(container) {
  this.container = container;

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




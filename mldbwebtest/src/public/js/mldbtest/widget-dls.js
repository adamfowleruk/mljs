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
  mldb.defaultconnection.dlscollections(function(result) {
    var s = "";
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
  mldb.defaultconnection.dlscollection(collection,function(result) {
    var s = "";
    for (var i = 0;i < result.doc.uris.length;i++) {
      s += "<p>";
      if (null != self._uriInfoHandler) {
        s += "<a href='" + self._uriInfoHandler.replace("#URI#",result.doc.uris[i]) + "'>";
      }
      s += result.doc.uris[i];
      if (null != self._uriInfoHandler) {
        s += "</a>";
      }
      s += "</p>";
    }
    document.getElementById(self.container + "-list").innerHTML = s;
  });
};








// LIST RM RETENTION RULES WIDGET











// ADD RM RETENTION RULES WIDGET


// global variable definitions
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};

com.marklogic.widgets.collectionuris = function(container) {
  this.container = container;
};

com.marklogic.widgets.collectionuris.prototype.list = function(parenturi) {
  this.parenturi = parenturi;
  var self = this;
  
  // load results as simple list
  mldb.defaultconnection.subcollections(parenturi,function(result) {
    // TODO handle error condition
    var el = document.getElementById(self.container);
    
    if (result.inError) {
      el.innerHTML = "ERROR: " + JSON.stringify(result.details);
    } else {
      var s = "";
      for (var i = 0;i < result.doc.values.length;i++) {
        var uri = result.doc.values[i];
        s += "<p class='collections-result'>" + uri + "</p>";
      }
      
      el.innerHTML = s;
    }
  });
};


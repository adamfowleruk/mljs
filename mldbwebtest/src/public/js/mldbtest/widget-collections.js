// global variable definitions
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};


/**
 * Creates a widget to show a list of collection URIs
 * @constructor
 * @param {string} container - the HTML ID of the container to place this widget in.
 */
com.marklogic.widgets.collectionuris = function(container) {
  this.container = container;
  this.errorPublisher = new com.marklogic.events.Publisher(); 
};

/**
 * Adds an error listener to this widget
 * 
 * @param {function(error)} fl - The error listener to add
 */
com.marklogic.widgets.collectionuris.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 * 
 * @param {function(error)} fl - The error listener to remove
 */
com.marklogic.widgets.collectionuris.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};

/**
 * Uses the mljs default connection to list the child collection URIs of the specified parent. Use blank for all.
 * 
 * @param {string} parenturi - The parent URI to find the children for.
 */
com.marklogic.widgets.collectionuris.prototype.list = function(parenturi) {
  this.parenturi = parenturi;
  var self = this;
  
  // load results as simple list
  mljs.defaultconnection.subcollections(parenturi,function(result) {
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


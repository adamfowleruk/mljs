// global variable definitions
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};

com.marklogic.widgets.docbuilder = function(container) {
  this.container = container;
  
  this._init();
};

com.marklogic.widgets.docbuilder.prototype._init = function() {
  var parentel = document.getElementById(this.container);
  parentel.innerHTML = "<div id='" + this.container + "-"
};

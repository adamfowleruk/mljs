// global variable definitions
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};

com.marklogic.widgets.kratu = function(container) {
  this.container = container;
  
  this.results = null;
  this.kratu = new Kratu();
  this.kratu.setRenderElement( document.getElementById(this.container) );
  
  this.render = "content"; // summary = top level ML search info, content = raw document info
  
  this._refresh();
};

com.marklogic.widgets.kratu.prototype.updateResults = function(results) {
  this.results = results;
  
  if ("content" == this.render) {
    var content = new Array();
    for (var i = 0;i < this.results.results.length;i++) {
      content.push(this.results.results[i].content);
    }
    this.kratu.setEntities(content);
  } else {
    this.kratu.setEntities(this.results.results);
  }
  this._refresh();
};

com.marklogic.widgets.kratu.prototype._refresh = function() {
  if (null == this.results || undefined == this.results || "boolean" == this.results) {
    return; // draw nothing
  }
  this.kratu.renderReport();
};
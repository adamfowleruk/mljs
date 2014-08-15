/**
 * Provides AJAX methods to perform server side ingest using info studio
 */

com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};

com.marklogic.widgets.IngestPanel = function(containerid) {
  // TODO draw our UI using DOM
  $("#" + containerid).append("<div id='status'></div>");
  $("#" + containerid).append("<div id='errors'></div>");
};

com.marklogic.widgets.IngestPanel.prototype.monitor = function(ingester) {
  ingester.listeners.subscribe(this.__respond);
};

com.marklogic.widgets.IngestPanel.prototype.begin = function(collections,path) {
  console.log("Creating ingester. path: " + path + ", collection: " + collections);
  $("#status").replaceWith("<div id='status'>Loading...</div>");
  var that = this;
  this.ingester = new com.marklogic.ingest.Ingester(collections,path);
  
  
  this.ingester.listeners.subscribe(function(json) {  
    var done = json.ticket.documentsProcessed + json.ticket.errors;
    var total = json.ticket.totalDocuments;
    $("#status").replaceWith("Completed " + json.ticket.documentsProcessed + " / " + total + " (with " + json.ticket.errors + " errors) - " + (done * ( 100 / total)) + "% complete.");
  
    if (json.ticket.errors > 0) {
      // show errors now
      that.ingester.getErrors(function(errors) {
        console.log("Errors: " + JSON.stringify(errors));
      
        // TODO display
        $("#errors").replaceWith("<div id='errors'>Errors occurred: " + errors.errors.error.errorCode + "</div>");
      });
    }
  });
  this.ingester.ingest();
  console.log("Ingest started");
};
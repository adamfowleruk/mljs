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
/**
 * Provides AJAX methods to perform server side ingest using info studio
 */

com = window.com || {};
com.marklogic = window.com.marklogic || {};

com.marklogic.ingest = {};

com.marklogic.ingest.Ingester = function(collection,path) {
  this.collection = collection;
  this.path = path;
  
  // default variable values
  this.ingesturl = "/ingest/do.json";
  this.infourl = "/ingest/ticketinfo.json";
  this.errorurl = "/ingest/ticketerrors.json";
  
  // event handlers
  this.listeners = new com.marklogic.events.Publisher();
  
  // set default connection
  this.db = mljs.defaultconnection;
};

com.marklogic.setConnection = function(connection) {
  this.db = connection;
};

com.marklogic.ingest.Ingester.prototype.setIngestURL = function(url) {
  this.ingesturl = url;
};

com.marklogic.ingest.Ingester.prototype.ingest = function() {
  console.log("Ingester ingest");
  // hit url
  var that = this;
  
  $.ajax({ 
             type: "POST",
             dataType: "json",
             url: that.ingesturl,
             data: {path: that.path,collection: that.collection},
             success: function(data) {
               console.log("JSON: " + JSON.stringify(data));
               console.log("ajax success. TickerURI: " + data.ticketuri);   
                // returns ticket uri
                // save ticket uri
                that.ticketuri = data.ticketuri;
                // start ticket monitoring task
                that._beginMonitor();
              },
              error: function(httpRequest, textStatus, errorThrown) { 
                  console.log("status=" + textStatus + ",error=" + errorThrown);
                }
          });
};

com.marklogic.ingest.Ingester.prototype._beginMonitor = function() {
  console.log("Ingester beginMonitor");
  // start timer every 2 seconds to get ticket information
  this.interval = setInterval((function(self) {
    return function() {
      self._tick();
    }
  })(this),2000);
};

com.marklogic.ingest.Ingester.prototype.getErrors = function(callback) {
  var that = this;
  // get status via ajax
  $.ajax({ 
             type: "GET",
             dataType: "json",
             url: this.errorurl,
             data: {ticketuri: this.ticketuri},
             success: function(json) {
               console.log("JSON errors: " + JSON.stringify(json));
               callback(json);
             },
              error: function(httpRequest, textStatus, errorThrown) { 
                  console.log("status=" + textStatus + ",error=" + errorThrown);
                }
         });
};

com.marklogic.ingest.Ingester.prototype._tick = function() {
  console.log("Ingester tick");
  console.log("asking url: " + this.infourl);
  var that = this;
  // get status via ajax
  $.ajax({ 
             type: "GET",
             dataType: "json",
             url: this.infourl,
             data: {ticketuri: this.ticketuri},
             success: function(json) {
               console.log("JSON: " + JSON.stringify(json));
               var done = json.ticket.documentsProcessed + json.ticket.errors;
               var total = json.ticket.totalDocuments;
               if (done == total) {
                 // cancel set Interval
                 clearInterval(that.interval);
               }
               that.listeners.publish(json);
               // get ticket info json
               // check status
               // sent events as necessary
               // if finished, clearInterval(that.interval)
             },
              error: function(httpRequest, textStatus, errorThrown) { 
                  console.log("status=" + textStatus + ",error=" + errorThrown);
                }
         });
  
};
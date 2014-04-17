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

/**
 * A wrapper for the Google Kratu tabular data exploration widget
 * @constructor
 * @param {string} container - The HTML ID of the element to place this widget's content within.
 */
com.marklogic.widgets.profile = function(container) {
  this.container = container;
  this.errorPublisher = new com.marklogic.events.Publisher(); 
  
  this._refresh();
};


com.marklogic.widgets.profile.prototype._refresh = function() {
  var puri = "/profiles/" + username + ".json";
  var self = this;
  mljs.defaultconnection.get(puri,function(result) {
    var str = "<div class='mljswidget profile'>";
    
    var p = result.doc;
    
    str += "<table style='border:none;width:100%;'><tr><td style='width:12.5%;height:180px;'>";
    //str += "<img src='/show/view?uri=" + encodeURI(p.profileimguri) + "&original=true&fullurl=true' />";
    str += "<img src='/v1/documents?uri=" + encodeURI(p.profileimguri) + "' />";
    str += "</td><td colspan='3' style='width:37.5%;height:180px;'>";
    str += "<h2>" + p.name + "</h3>";
    str += "<p>" + p.role + "</p>";
    str += "<p>" + p.contact + "</p>";
    
    str += "</td>";
    
    str += "<td colspan='4' rowspan='2' style='width:50%;'>";
    
    str += "<h3>Details</h3>";
    str += "<table style='border:none;width:100%'>";
    str += "<tr><td style='width:50%;'>Mobile:</td><td>" + p.mobile + "<td></tr>";
    str += "<tr><td style='width:50%;'>Account:</td><td>" + p.account + "<td></tr>";
    str += "<tr><td style='width:50%;'>Email:</td><td>" + p.email + "<td></tr>";
    str += "<tr><td style='width:50%;'>City:</td><td>" + p.city + "<td></tr>";
    str += "<tr><td style='width:50%;'>Country:</td><td>" + p.country + "<td></tr>";
    str += "<tr><td style='width:50%;'>Other:</td><td>" + p.other + "<td></tr>";
    str += "</table>";
    
    str += "<h3>My RFPs</h3>";
    str += "<table style='border:none;width:100%'>";
    str += "<tr><th>Name</th><th>Date</th><th>Client</th></tr>";
    for (var i = 0, max = p.rfps.length,r;i < max;i++) {
      r = p.rfps[i];
      str += "<tr><td>" + r.name + "</td><td>" + r.date + "</td><td>" + r.client + "</td></tr>";
    }
    str += "</table>";
    
    str += "<h3>My Saved Searches</h3>";
    str += "<table style='border:none;width:100%'>";
    str += "<tr><th>Name</th><th>Search</th></tr>";
    for (var i = 0, max = p.searches.length,s;i < max;i++) {
      s = p.searches[i];
      str += "<tr><td>" + s.name + "</td><td>" + s.query + "</td></tr>";
    }
    str += "</table>";
    
    str += "</td></tr>";
    
    str += "<tr><td colspan='4' style='width:50%;'>";
    
    str += "<h3>Documents added over time</h3>";
    str += "<img src='/v1/documents?uri=" + encodeURI(p.graphimguri) + "' />"
    
    str += "<h3>Tag Cloud</h3>";
    str += "<img src='/v1/documents?uri=" + encodeURI(p.cloudimguri) + "' />"
    
    str += "</td></tr>";
    
    str += "</table>";
    
    str += "</div>";
    
    document.getElementById(self.container).innerHTML = str;
  });
};
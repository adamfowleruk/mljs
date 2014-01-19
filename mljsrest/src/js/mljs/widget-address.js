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


/*
 * This file contains widgets that enable address lookups and other anciliary, non MarkLogic specific functionality.
 */
 
// TODO determine if we need a geocontext to handle point locations and associated operations
 
// Requires this script:<script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=false"></script>
/**
 * Looks up a lon/lat pair based on an entered address. Uses google maps v3 geocoder code (thus requires google maps JS to be loaded)
 * 
 * @constructor
 */
com.marklogic.widgets.addressbar = function(container) {
  this.container = container;
  this._geo = mljs.defaultconnection.createGeoContext();
  this._qb = mljs.defaultconnection.createQuery();
  this._geocoder = new google.maps.Geocoder();
  
  this._radius = 5;
  this._radiusMeasure = "mi";
  
  this._init();
};

/**
 * Sets the geocontext to update when a new location is submitted
 * 
 * @param {geocontext} ctx - The GeoContext to update
 */
com.marklogic.widgets.addressbar.prototype.setGeoContext = function(ctx) {
  this._geo = ctx;
};

com.marklogic.widgets.addressbar.prototype._init = function() {
  // draw initial html
  var s = "Address: <input id='" + this.container + "-address' class='addressbar-address' type='text' size='20' />";
  s += "<input class='btn btn-primary addressbar-submit' type='submit' id='" + this.container + "-submit' value='Search' />";
  document.getElementById(this.container).innerHTML = s;
  
  var button = document.getElementById(this.container + "-submit");
  var self = this;
  button.onclick = function(evt) {
    self._dosearch();
    evt.stopPropagation();
    return false;
  };
  
  // now do enter click handler
  var searchKeyPress = function(e) {
    // look for window.event in case event isn't passed in
    if (typeof e == 'undefined' && window.event) { 
      e = window.event; 
    }
    if (e.keyCode == 13) {
      button.click();
    }
  };
  document.getElementById(this.container + "-address").onkeypress = searchKeyPress;
};

/**
 * The radius to pass to the geocontext for a new location.
 * 
 * TODO when not specified, default to a point instead of a circle being contributed to the geocontext
 * 
 * @param {double} radius - The radius
 * @param {string} radiusMeasure - The unit of the radius. "miles", "m", "km", "nm" or "degrees"
 */
com.marklogic.widgets.addressbar.prototype.radius = function(radius,radiusMeasure) {
  this._radius = radius;
  this._radiusMeasure = radiusMeasure;
  return this;
};

com.marklogic.widgets.addressbar.prototype._dosearch = function() {
  // perform lookup
  var self = this;
  var address = document.getElementById(this.container + "-address").value;
  if (null == address || "" == address) {
    //self._ctx.contributeStructuredQuery(self.container, null); // clears contribution
    self._geo.contributeArea(self.container,null);
    return;
  }
  this._geocoder.geocode({ 'address': address}, function(results, status) {
    console.log("Results: " + JSON.stringify(results));
    if (status == google.maps.GeocoderStatus.OK) {
      var pos = results[0].geometry.location;
      console.log("Results: pos: " + JSON.stringify(pos) + " := lat: " + pos.d + ", lon: " + pos.e);
      
      // contribute ourselves to the search context
      // TODO CONVERT FROM EPSG900913 LatLng to EPSG4326/WGS84
      var circle = self._qb.circleDef(pos.d,pos.e,self._radius,self._radiusMeasure);
      //self._ctx.contributeStructuredQuery(self.container, term);
      self._geo.contributeArea(self.container,circle);
    } else {
      alert("Could not look up address for the following reason: " + status);
    }
  });
};
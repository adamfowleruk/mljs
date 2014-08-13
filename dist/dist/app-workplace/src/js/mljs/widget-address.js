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

  this._config = {
    radius: 5,
    radiusMeasure: "mi"
  };

  this._init();
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.addressbar.getConfigurationDefinition = function() {
  var self = this;
  return {
    radius: {type: "positiveInteger", default: 5, title: "Radius",description: "Radius from point to contribute to query."},
    radiusMeasure: {type:"enum", default: "mi", title: "Radius Measure", description: "Measuring unit used for radius",
      options: [
        {value: "mi", title: "Statute Miles", description: "Standard (statute) miles."},
        {value: "nm", title: "Nautical Miles", description: "Nautical Miles."},
        {value: "km", title: "Kilometres", description: "Kilometres."},
        {value: "m", title: "Metres", description: "Metres."},
        {value: "degrees", title: "Degrees", description: "Degrees of Arc. 1 degree = 60nm."}
      ]
    }
  };
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.addressbar.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }
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
  var s = "<div class='mljswidget well address'>";
  s += "<div class='input-append input-prepend'>";
  s += "<span class='address-text'>Address: </span><input id='" + this.container + "-address' class='span2 addressbar-address' type='text' size='20' />";
  s += "<button class='btn btn-primary addressbar-submit' type='submit' id='" + this.container + "-submit'>Search</button>";
  s += "</div></div>";
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

/**
 * Sets the address in the widget and does a lookup
 * @param {string} address - The plain text address to lookup
 */
com.marklogic.widgets.addressbar.prototype.setAddress = function(address) {
  document.getElementById(this.container + "-address").value = address;
  // TODO test this fires an update. If not, uncomment the below line
  //this._dosearch();
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
      var lat = pos.d || pos.k;
      var lon = pos.e || pos.A;
      console.log("Results: pos: " + JSON.stringify(pos) + " := lat: " + lat + ", lon: " + lon);

      // contribute ourselves to the search context
      // TODO CONVERT FROM EPSG900913 LatLng to EPSG4326/WGS84
      var circle = self._qb.circleDef(lat,lon,self._radius,self._radiusMeasure);
      //self._ctx.contributeStructuredQuery(self.container, term);
      self._geo.contributeArea(self.container,circle);
    } else {
      alert("Could not look up address for the following reason: " + status);
    }
  });
};

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
 * OpenLayers mapping widget.
 *
 * Openlayers website - http://www.openlayers.org/
 *
 * @constructor
 */
com.marklogic.widgets.openlayers = function(container) {
  this.container = container;

  // granularity constants
  this.HIGH = 256;
  this.MEDIUM = 128;
  this.LOW = 64;

  this.map = null; // openlayers map control
  this.baseLayer = null;

  this._config = {
    "constraint-name": null,
    showGoogleStreet: false,
    showArcGISOnline: false,
    showAllBing: false,
    heatmapGranularity: this.HIGH
  };

  this.transformWgs84 = new OpenLayers.Projection("EPSG:4326");

  this.series = {}; // {title: "", context: searchcontext,latsource:"location.lat",lonsource:"location.lon",titlesource:"",summarysource:""};

  this._selectionLayer = null;
  //this._drawControls = {};
  this._polyControl = null; // regular polygon (circle and bounding box)
  this._polygonControl = null; // irregular polygon (free hand polygon)
  this._dragControl = null; // NOT USED

  this._geoSelectionPublisher = new com.marklogic.events.Publisher();
  this._resultSelectionPublisher = new com.marklogic.events.Publisher();
  this._resultHighlightPublisher = new com.marklogic.events.Publisher();

  this._selectedUri = null;
  this._highlightedUri = null;

  this._configurationContext = null;

  this.heatmap = null; // open layers heatmap

  this._refresh();
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.openlayers.getConfigurationDefinition = function() {
  var self = this;
  return {
    showGoogleStreet: {type: "boolean", default: false, title: "Show Google Street Layer",description: "Show the Google Street layer."},
    showArcGISOnline: {type: "boolean", default: false, title: "Show Arc GIS Online Layer",description: "Show the Arc GIS Online layer."},
    showAllBing: {type: "boolean", default: false, title: "Show All Bing Maps Layers",description: "Show all Bing Maps layers."},
    "constraint-name": {type: "string", default: null, title: "Selection Constraint Name", description: "The name of the search options constraint to use for selection."},
    heatmapGranularity: {type: "enum", default: self.HIGH, title: " Heat Map Granularity", description: "How detailed a heatmap to calculate in MarkLogic Server.",
      options: [
        {value: self.HIGH, title: "High", description: "Many heatmap areas(" + self.HIGH + ")."},
        {value: self.MEDIUM, title: "Medium", description: "Several heatmap areas(" + self.MEDIUM + ")."},
        {value: self.LOW, title: "Low", description: "Few heatmap areas(" + self.LOW + ")."}
      ]
    },
        series: {type: "multiple", minimum: 0, default: [], title: "Series", description: "Data series to render on the map",
          childDefinitions: {
            //title,searchcontext,latsrc,lonsrc,titlesrc,summarysrc,icon_source_opt,heatmap_constraint
            title: {type: "string", default: "", title: "Series name", description: "Common name for this series"},
            searchcontext: {type: "SearchContext",default: null, title: "Search Context", description: "Search context data source"},
            latsrc: {type: "string",default: null,title: "Latitude Source", description: "document value to extract latitude from"},
            lonsrc: {type: "string",default: null,title: "Longitude Source", description: "document value to extract longitude from"},
            titlesrc: {type: "string",default: null,title: "Title Source", description: "document value to extract Title from"},
            summarysrc: {type: "string",default: null,title: "Summary Source", description: "document value to extract Summary from"},
            iconsrc: {type: "string",default: null,title: "Summary Source", description: "document value to extract Icon URL from"},
            heatmapconstraint: {type: "string",default: null,title: "Heatmap Constraint", description: "Name of the constraint holding the heatmap"}
          }
        }
  };
};

com.marklogic.widgets.openlayers.prototype.setConfigurationContext = function(ctx) {
  this._configurationContext = ctx;
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.openlayers.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }
  if (undefined != config.series && null != this._configurationContext) {
    for (var s = 0,maxs = config.series.length,series;s < maxs;s++) {
      series = config.series[s];
      this.addSeries(series.title,this._configurationContext.getInstance(series.searchcontext),
        series.latsrc,series.lonsrc,series.titlesrc,series.summarysrc,series.iconsrc,series.heatmapconstraint);
    }
  }

  // refresh display
  this._refresh();

  // process layer config AFTER refresh
  if (true===this._config.showGoogleStreet) {
    this.addGoogleStreet();
  }
  if (true===this._config.showArcGISOnline) {
    this.addArcGISOnline();
  }
  if (true===this._config.showAllBing) {
    this.addAllBing();
  }
};

/**
 * The minimum grid to generate heatmap results in
 *
 * @param {double} val - The grid size. E.g. 5x5 grid = 25 as a value. Widget guarantees heatmap will be at least this granular.
 */
com.marklogic.widgets.openlayers.prototype.setHeatmapGranularity = function(val) {
  this._config.heatmapGranularity = val;
};

/**
 * Called by a searchcontext to listen for area selection events
 *
 * @param {function} lis - The listener
 */
com.marklogic.widgets.openlayers.prototype.addGeoSelectionListener = function(lis) {
  this._geoSelectionPublisher.subscribe(lis);
};

/**
 * Called by a searchcontext to remove a listener for area selection events
 *
 * @param {function} lis - The listener
 */
com.marklogic.widgets.openlayers.prototype.removeGeoSelectionListener = function(lis) {
  this._geoSelectionPublisher.unsubscribe(lis);
};

/**
 * Called by a searchcontext to listen for result search selection events
 *
 * @param {function} lis - The listener
 */
com.marklogic.widgets.openlayers.prototype.addResultSelectionListener = function(lis) {
  this._resultSelectionPublisher.subscribe(lis);
};

/**
 * Called by a searchcontext to remove a listener for search result selection events
 *
 * @param {function} lis - The listener
 */
com.marklogic.widgets.openlayers.prototype.removeResultSelectionListener = function(lis) {
  this._resultSelectionPublisher.unsubscribe(lis);
};

/**
 * Called by a searchcontext to listen for result highlighting (usually hovering over a marker)
 *
 * @param {function} lis - The listener
 */
com.marklogic.widgets.openlayers.prototype.addResultHighlightListener = function(lis) {
  this._resultHighlightPublisher.subscribe(lis);
};


/**
 * Called by a searchcontext to remove a listener for result highlighting (usually hovering over a marker)
 *
 * @param {function} lis - The listener
 */
com.marklogic.widgets.openlayers.prototype.removeResultHighlightListener = function(lis) {
  this._resultHighlightPublisher.unsubscribe(lis);
};

/**
 * Called by a searchcontext to instruct the map that a result has been selection.
 * NOT IMPLEMENTED
 *
 * @param {Array} newsel - The new selection
 */
com.marklogic.widgets.openlayers.prototype.updateResultSelection = function(newsel) {
  // TODO respond to other widgets' selection events too
};

/**
 * Called by a searchcontext to instruct the map that a result has been highlighted.
 * NOT IMPLEMENTED
 *
 * @param {Array} newsel - The newly highlighted selection
 */
com.marklogic.widgets.openlayers.prototype.updateResultHighlight = function(newsel) {
  // TODO respond to other widgets' highlight events too
};

/**
 * Sets the constraint name this widget should use when raising a selection change event and passing a structured query term.
 *
 * @param {string} name - Constraint name to use (the constraint should point to a geospatial index of points that should be within this selection)
 */
com.marklogic.widgets.openlayers.prototype.setGeoSelectionConstraint = function(name) {
  this._config["constraint-name"] = name;
};

/**
 * Configures the OpenLayers map to detect the browser's location
 */
com.marklogic.widgets.openlayers.prototype.addGeolocate = function() {
  var geolocate = new OpenLayers.Control.Geolocate({
    bind: false,
    geolocationOptions: {
        enableHighAccuracy: false,
        maximumAge: 0,
        timeout: 7000
    }
  });
  this.map.addControl(geolocate);
};

/**
 * Adds a google street layer to the map, and returns the layer (so you can remove it later)
 */
com.marklogic.widgets.openlayers.prototype.addGoogleStreet = function() {
  var g = new OpenLayers.Layer.Google("Google Streets", null, {
                eventListeners: {
                    tileloaded: this._updateStatus,
                    loadend: this._detect
                }});
  this.addLayer(g);
  return g;
};

/**
 * Adds an ArcGIS live online layer, with caching support
 */
com.marklogic.widgets.openlayers.prototype.addArcGISOnline = function() {
  var layerInfo = {
    "currentVersion": 10.01,
    "serviceDescription": "This worldwide street map presents highway-level data for the world and street-level data for the United States, Canada, Japan, Southern Africa, and a number of countries in Europe and elsewhere. This comprehensive street map includes highways, major roads, minor roads, railways, water features, administrative boundaries, cities, parks, and landmarks, overlaid on shaded relief imagery for added context. The street map was developed by ESRI using ESRI basemap data, AND road data, USGS elevation data, and UNEP-WCMC parks and protected areas for the world, and Tele Atlas Dynamap� and Multinet� street data for North America and Europe. Coverage for street-level data in Europe includes Andorra, Austria, Belgium, Czech Republic, Denmark, France, Germany, Great Britain, Greece, Hungary, Ireland, Italy, Luxembourg, Netherlands, Northern Ireland (Belfast only), Norway, Poland, Portugal, San Marino, Slovakia, Spain, Sweden, and Switzerland. Coverage for street-level data elsewhere in the world includes China (Hong Kong only), Colombia, Egypt (Cairo only), Indonesia (Jakarta only), Japan, Mexico (Mexico City only), Russia (Moscow and St. Petersburg only), South Africa, Thailand, and Turkey (Istanbul and Ankara only). For more information on this map, visit us \u003ca href=\"http://goto.arcgisonline.com/maps/World_Street_Map \" target=\"_new\"\u003eonline\u003c/a\u003e.",
    "mapName": "Layers",
    "description": "This worldwide street map presents highway-level data for the world and street-level data for the United States, Canada, Japan, Southern Africa, most countries in Europe, and several other countries. This comprehensive street map includes highways, major roads, minor roads, one-way arrow indicators, railways, water features, administrative boundaries, cities, parks, and landmarks, overlaid on shaded relief imagery for added context. The map also includes building footprints for selected areas in the United States and Europe and parcel boundaries for much of the lower 48 states.\n\nThe street map was developed by ESRI using ESRI basemap data, DeLorme base map layers, AND road data, USGS elevation data, UNEP-WCMC parks and protected areas for the world, Tele Atlas Dynamap� and Multinet� street data for North America and Europe, and First American parcel data for the United States. Coverage for street-level data in Europe includes Andorra, Austria, Belgium, Czech Republic, Denmark, France, Germany, Great Britain, Greece, Hungary, Ireland, Italy, Luxembourg, Netherlands, Norway, Poland, Portugal, San Marino, Slovakia, Spain, Sweden, and Switzerland. Coverage for street-level data elsewhere in the world includes China (Hong Kong only), Colombia, Egypt (Cairo only), Indonesia (Jakarta only), Japan, Mexico, Russia, South Africa, Thailand, and Turkey (Istanbul and Ankara only). For more information on this map, visit us online at http://goto.arcgisonline.com/maps/World_Street_Map\n",
    "copyrightText": "Sources: ESRI, DeLorme, AND, Tele Atlas, First American, ESRI Japan, UNEP-WCMC, USGS, METI, ESRI Hong Kong, ESRI Thailand, Procalculo Prosis",
    "layers": [{
      "id": 0,
      "name": "World Street Map",
      "parentLayerId": -1,
      "defaultVisibility": true,
      "subLayerIds": null,
      "minScale": 0,
      "maxScale": 0
    }],
    "tables": [],
    "spatialReference": {
      "wkid": 102100
    },
    "singleFusedMapCache": true,
    "tileInfo": {
      "rows": 256,
      "cols": 256,
      "dpi": 96,
      "format": "JPEG",
      "compressionQuality": 90,
      "origin": {
        "x": -20037508.342787,
        "y": 20037508.342787
      },
      "spatialReference": {
        "wkid": 102100
      },
      "lods": [{
        "level": 0,
        "resolution": 156543.033928,
        "scale": 591657527.591555
      }, {
        "level": 1,
        "resolution": 78271.5169639999,
        "scale": 295828763.795777
      }, {
        "level": 2,
        "resolution": 39135.7584820001,
        "scale": 147914381.897889
      }, {
        "level": 3,
        "resolution": 19567.8792409999,
        "scale": 73957190.948944
      }, {
        "level": 4,
        "resolution": 9783.93962049996,
        "scale": 36978595.474472
      }, {
        "level": 5,
        "resolution": 4891.96981024998,
        "scale": 18489297.737236
      }, {
        "level": 6,
        "resolution": 2445.98490512499,
        "scale": 9244648.868618
      }, {
        "level": 7,
        "resolution": 1222.99245256249,
        "scale": 4622324.434309
      }, {
        "level": 8,
        "resolution": 611.49622628138,
        "scale": 2311162.217155
      }, {
        "level": 9,
        "resolution": 305.748113140558,
        "scale": 1155581.108577
      }, {
        "level": 10,
        "resolution": 152.874056570411,
        "scale": 577790.554289
      }, {
        "level": 11,
        "resolution": 76.4370282850732,
        "scale": 288895.277144
      }, {
        "level": 12,
        "resolution": 38.2185141425366,
        "scale": 144447.638572
      }, {
        "level": 13,
        "resolution": 19.1092570712683,
        "scale": 72223.819286
      }, {
        "level": 14,
        "resolution": 9.55462853563415,
        "scale": 36111.909643
      }, {
        "level": 15,
        "resolution": 4.77731426794937,
        "scale": 18055.954822
      }, {
        "level": 16,
        "resolution": 2.38865713397468,
        "scale": 9027.977411
      }, {
        "level": 17,
        "resolution": 1.19432856685505,
        "scale": 4513.988705
      }]
    },
    "initialExtent": {
      "xmin": -20037507.0671618,
      "ymin": -20037507.0671618,
      "xmax": 20037507.0671618,
      "ymax": 20037507.0671619,
      "spatialReference": {
        "wkid": 102100
      }
    },
    "fullExtent": {
      "xmin": -20037507.0671618,
      "ymin": -19971868.8804086,
      "xmax": 20037507.0671618,
      "ymax": 19971868.8804086,
      "spatialReference": {
        "wkid": 102100
      }
    },
    "units": "esriMeters",
    "supportedImageFormatTypes": "PNG24,PNG,JPG,DIB,TIFF,EMF,PS,PDF,GIF,SVG,SVGZ,AI,BMP",
    "documentInfo": {
      "Title": "World Street Map",
      "Author": "ESRI",
      "Comments": "",
      "Subject": "streets, highways, major roads, railways, water features, administrative boundaries, cities, parks, protected areas, landmarks ",
      "Category": "transportation(Transportation Networks) ",
      "Keywords": "World, Global, 2009, Japan, UNEP-WCMC",
      "Credits": ""
    },
    "capabilities": "Map"
  };

  var maxExtent = new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34);
  //Max extent from layerInfo above
  var layerMaxExtent = new OpenLayers.Bounds(
  layerInfo.fullExtent.xmin, layerInfo.fullExtent.ymin, layerInfo.fullExtent.xmax, layerInfo.fullExtent.ymax);
  var resolutions = [];
  for (var i = 0; i < layerInfo.tileInfo.lods.length; i++) {
    resolutions.push(layerInfo.tileInfo.lods[i].resolution);
  }

  var l = new OpenLayers.Layer.ArcGISCache( "Arc GIS Online",
    "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer", {
    isBaseLayer: true,
    // From layerInfo above
    resolutions: resolutions,
    tileSize: new OpenLayers.Size(layerInfo.tileInfo.cols, layerInfo.tileInfo.rows),
    tileOrigin: new OpenLayers.LonLat(layerInfo.tileInfo.origin.x , layerInfo.tileInfo.origin.y),
    maxExtent: layerMaxExtent,
    projection: 'EPSG:' + layerInfo.spatialReference.wkid
  });
  this.addLayer(l);
  return l;
};

/**
 * Add three example Bing layers - road, hybrid, aerial
 */
com.marklogic.widgets.openlayers.prototype.addAllBing = function() {
  // TODO replace the following key
  var apiKey = "AqTGBsziZHIJYYxgivLBf0hVdrAk9mWO5cQcb8Yux8sW5M8c8opEC2lZqKR1ZZXf";

  var road = new OpenLayers.Layer.Bing({
    name: "Bing Road",
    key: apiKey,
    type: "Road"
  });
  var hybrid = new OpenLayers.Layer.Bing({
    name: "Bing Hybrid",
    key: apiKey,
    type: "AerialWithLabels"
  });
  var aerial = new OpenLayers.Layer.Bing({
    name: "Bing Aerial",
    key: apiKey,
    type: "Aerial"
  });
  var layers = [road,hybrid,aerial];
  this.addLayers(layers);
  return layers;
};

/**
 * Ensures that this OpenLayers map has a heatmap layer. (It doesn't always by default, but will if it detects you want one).
 *
 * NB This may no longer be true. I believe the heatmap acts as a layer that always exists in the map.
 */
com.marklogic.widgets.openlayers.prototype.ensureHeatmap = function() {
  if (null == this.heatmap) {
    this.heatmap = new OpenLayers.Layer.Heatmap("Heatmap", this.map, this.baseLayer, {visible: true, radius:40}, {isBaseLayer: false, opacity: 0.3, projection: new OpenLayers.Projection("EPSG:4326")});
    this.addLayer(this.heatmap);
  }
};

/**
 * Adds a custom instance of OpenLayers.Layer - E.g. your own WMS based layer, or ArcGIS layer
 *
 * @param {OpenLayers.Layer} layer - The OpenLayers layer to add to this map as a base layer
 */
com.marklogic.widgets.openlayers.prototype.addLayer = function(layer) {
  this.map.addLayer(layer);
  // TODO add caching support to any new layers too
};

/**
 * Adds several custom instances of OpenLayers.Layer - E.g. your own WMS based layer, or ArcGIS layer
 *
 * @param {Array} layers - The OpenLayers layers to add to this map as a base layer
 */
com.marklogic.widgets.openlayers.prototype.addLayers = function(layers) {
  this.map.addLayers(layers);
  // TODO add caching support to any new layers too
};

com.marklogic.widgets.openlayers.prototype.__mode = function(newmode) {
  mljs.defaultconnection.logger.debug("openlayers.__mode: Mode selected: " + newmode);

  // TODO destroy any existing polygons
  // find matching layer and activate
  /*
  for (var name in this._drawControls) {
    var control = this._drawControls[name];
    if (newmode == name) {
      mljs.defaultconnection.logger.debug("openlayers.__mode: Activating: " + name);
      control.activate();
    } else {
      mljs.defaultconnection.logger.debug("openlayers.__mode: De-activating: " + name);
      control.deactivate();
    }
  }*/
  if ("drag" == newmode) { // WONT HAPPEN NOW
    this._dragControl.activate();
    this._polyControl.deactivate();
    this._polygonControl.deactivate();
  } else if ("none" == newmode) {
    this._dragControl.deactivate();
    this._polyControl.deactivate();
    this._polygonControl.deactivate();
  } else if ("polygon" == newmode) {
    this._dragControl.deactivate();
    this._polyControl.deactivate();
    this._polygonControl.activate();
  } else {
    var options = {sides: 4};
    if ("circle" == newmode) {
      options.sides = 40;
      options.irregular = false;
    } else if ("box" == newmode) {
      options.sides = 4;
      options.irregular = true;
    }
    this._polyControl.handler.setOptions(options);
    this._dragControl.deactivate();
    this._polyControl.activate();
    this._polygonControl.deactivate();
  }
  // TODO add completion handler and fetch polygon defined
  // TODO convert in to ML type (circle, bounding box, polygon)
  // TODO fire updateGeoBounds event (effectively modifies any listening searches)
};

com.marklogic.widgets.openlayers.prototype._removeAllFeaturesBut = function(feature) {

      var nonMeFeatures = new Array();
      for (var f = 0;f < this._selectionLayer.features.length;f++) {
        if (feature === this._selectionLayer.features[f]) {
          // do nothing
        } else {
          nonMeFeatures.push(this._selectionLayer.features[f]);
        }
      }
      this._selectionLayer.removeFeatures(nonMeFeatures);
};

/**
 * Redraws the entire map display
 * @private
 */
com.marklogic.widgets.openlayers.prototype._refresh = function() {
  var self = this;

  // detect parent bounds
  var p = document.getElementById(this.container);
  var width = p.offsetWidth;
  if (undefined == width || width == 0 || width < 100) {
    width = 800;
  }
  var height = p.offsetHeight;
  if (undefined == height || height == 0 || height < 100) {
    height = 500;
  }
  var actualHeight = height - 26;
  var actualWidth = width - 2;
  this.width = actualWidth;
  this.height = actualHeight;

  var str = "<div class='mljswidget panel panel-info openlayers'>";
  str += "<div class='panel-body openlayers-content'>";
  str += "<div id='" + this.container + "-map' class='openlayers-map' style='height:" + (actualHeight-55) + "px;width:" + (actualWidth-30) + "px;'></div>";

  str += "<div class='openlayers-controls'>";
  // mode selection
  str += "<div class='openlayers-mode'>Mode: <select id='" + this.container + "-mode'><option value='none'>Move</option><option value='circle'>Circle Radius Select</option>";
  str += "<option value='box'>Bounding Box Select</option><option value='polygon'>Polygon Select</option></select>";
  str += " <a href='#' id='" + this.container + "-clear' class='openalyers-clear'>Clear Selection</a>  ";
  str += " | <span class='small'>Hint: Hold down shift and drag to draw a freehand polygon. Double click to complete. </span></div></div>";
  str += "</div>";

  str += "</div>";

  p.innerHTML = str;

  // mode selection handler
  var sel = document.getElementById(this.container + "-mode");
  sel.onchange = function(evt) {
    self.__mode(sel.value);
  };

  var clear = document.getElementById(this.container + "-clear");
  clear.onclick = function(evt) {
    self._removeAllFeaturesBut(); // removes all

    self._geoSelectionPublisher.publish({type: null,contributor: self.container});

    evt.preventDefault();
    return false;
  };

  // Use proxy to get same origin URLs for tiles that don't support CORS.
  //OpenLayers.ProxyHost = "proxy.cgi?url=";

  var map, cacheWrite, cacheRead1, cacheRead2;

  function init() {
    self.baseLayer = new OpenLayers.Layer.OSM("OpenStreetMap (CORS)", null, {
      eventListeners: {
        tileloaded: this._updateStatus,
        loadend: this._detect
      }
    });
    map = new OpenLayers.Map({
      div: self.container + "-map",
      projection: "EPSG:900913",
      displayProjection: new OpenLayers.Projection("EPSG:900913"),
      layers: [
        self.baseLayer
      ],
      center: [0,0], // [0,0]
      zoom: 1
    });
    self.map = map;

    //var gmap = new OpenLayers.Layer.Google("Google Streets");
    //map.addLayers([gmap]);

    self.ensureHeatmap(); // add this underneath selection layer and markers layer

    self._selectionLayer = new OpenLayers.Layer.Vector("Selection Layer");

    map.addLayers([self._selectionLayer]);
    //map.addControl(new OpenLayers.Control.MousePosition());
    /*
    self._drawControls = {
      polygon: new OpenLayers.Control.DrawFeature(self._selectionLayer,
        OpenLayers.Handler.Polygon),
      box: new OpenLayers.Control.DrawFeature(self._selectionLayer,
        OpenLayers.Handler.RegularPolygon, {
          handlerOptions: {
            sides: 4,
            irregular: true
          }
        }
      ),
      circle: new OpenLayers.Control.DrawFeature(self._selectionLayer,
        OpenLayers.Handler.RegularPolygon, {
          handlerOptions: {
            side: 40,
            irregular: false
          }
        }),
      drag: new OpenLayers.Control.DragFeature(self._selectionLayer)
    };
    for(var key in self._drawControls) {
      map.addControl(self._drawControls[key]);
    }
    self._drawControls.drag.activate();*/

    var polyOptions = {sides:4};
    self._polyControl = new OpenLayers.Control.DrawFeature(self._selectionLayer,
      OpenLayers.Handler.RegularPolygon,
      {handlerOptions: polyOptions});
    self._polygonControl = new OpenLayers.Control.DrawFeature(self._selectionLayer,
        OpenLayers.Handler.Polygon);
    map.addControl(self._polyControl);
    map.addControl(self._polygonControl);
    var drag = new OpenLayers.Control.DragFeature(self._selectionLayer);
    map.addControl(drag);
    //drag.activate();
    self._dragControl = drag;

    var featureFunc = function(feature) {
      mljs.defaultconnection.logger.debug("FEATURE ADDED: " + feature);

      // TODO destroy previous features
      self._removeAllFeaturesBut(feature);

      // check for type of polygon that has been created - box, poly, circle
      var selmode = document.getElementById(self.container + "-mode").value;

      if ("polygon" == selmode) {
        var points = [];
        var ps = feature.geometry.components[0].components;
        for (var p = 0;p < ps.length;p++) {
          var olps = ps[p];
          var mlps = new OpenLayers.LonLat(olps.x,olps.y).transform(this.map.displayProjection,self.transformWgs84);
          points[p] = {latitude: mlps.lat, longitude: mlps.lon};
        }
        self._geoSelectionPublisher.publish({
          type: "polygon",contributor: self.container,
          "constraint-name": self._config["constraint-name"],
          polygon: points
        });
      } else if ("circle" == selmode) {
        // Find centre location and radius on map (and convert to miles for ML)
        var center = feature.geometry.getCentroid();

        mljs.defaultconnection.logger.debug("x,y=" + center.x + "," + center.y);

        // get first (any) point on circle and determine radius
        var point = feature.geometry.components[0].components[0]; // assume Point member of LinearRing

        var line = new OpenLayers.Geometry.LineString([center, point]);
        var dist = line.getGeodesicLength(new OpenLayers.Projection("EPSG:900913"));

        var radiusMiles = dist * 0.000621371192; // conversion to statute (British) Miles as used by MarkLogic

        // Convert EPSG:900913 point to EPSG:4326 (WGS84)
        var wgsPoint = new OpenLayers.LonLat(center.x,center.y).transform(self.map.displayProjection,self.transformWgs84);

        self._geoSelectionPublisher.publish({
          type: "circle",contributor: self.container,
          "constraint-name": self._config["constraint-name"],
          latitude: wgsPoint.lat, longitude: wgsPoint.lon, radiusmiles: radiusMiles
        });
      } else if ("box" == selmode) {
        var p1 = feature.geometry.components[0].components[0];
        var p2 = feature.geometry.components[0].components[2];
        var north = p1.y;
        var south = p2.y;
        if (south > north) {
          north = p2.y;
          south = p1.y;
        }
        var west = p1.x;
        var east = p2.x;
        if (west > east) {
          west = p2.x;
          east = p1.x
        }
        mljs.defaultconnection.logger.debug("GEOBOX: north: " + north + ", south: " + south + ", west: " + west + ", east: " + east);
        // do the above incase of rotated rectangles
        var nw = new OpenLayers.LonLat(west,north).transform(self.map.displayProjection,self.transformWgs84);
        var se = new OpenLayers.LonLat(east,south).transform(self.map.displayProjection,self.transformWgs84);
        mljs.defaultconnection.logger.debug("GEOBOX: EPSG4326: north: " + nw.lat + ", south: " + se.lat + ", west: " + nw.lon + ", east: " + se.lon);

        self._geoSelectionPublisher.publish({
          type: "box", contributor: self.container,
          "constraint-name": self._config["constraint-name"],
          box: {north: nw.lat, south: se.lat, east: se.lon, west: nw.lon}
          //box: {north: self.eightDecPlaces(nw.lat), south: self.eightDecPlaces(se.lat), east: self.eightDecPlaces(se.lon), west: self.eightDecPlaces(nw.lon)}
        });
      }
    };
    self._polyControl.featureAdded = featureFunc;
    self._polygonControl.featureAdded = featureFunc;


    // try cache before loading from remote resource
    cacheRead1 = new OpenLayers.Control.CacheRead({ // auto activated (this default) - cache local first, then online
        eventListeners: {
            activate: function() {
                cacheRead2.deactivate();
            }
        }
    });
    // try loading from remote resource and fall back to cache
    cacheRead2 = new OpenLayers.Control.CacheRead({
        autoActivate: false,
        fetchEvent: "tileerror",
        eventListeners: {
            activate: function() {
                cacheRead1.deactivate();
            }
        }
    });
    cacheWrite = new OpenLayers.Control.CacheWrite({
        imageFormat: "image/jpeg",
        eventListeners: {
            cachefull: function() {
                if (seeding) {
                    stopSeeding();
                }
                mljs.defaultconnection.logger.debug("Cache full.");
            }
        }
    });
    var layerSwitcher = new OpenLayers.Control.LayerSwitcher();
    map.addControls([cacheRead1, cacheRead2, cacheWrite, layerSwitcher]);
    //layerSwitcher.maximizeControl();



    // detect what the browser supports
    function detect(evt) {
        // detection is only done once, so we remove the listener.
        evt.object.events.unregister("loadend", null, detect);
        var tile = map.baseLayer.grid[0][0];
        try {
            var canvasContext = tile.getCanvasContext();
            if (canvasContext) {
                // will throw an exception if CORS image requests are not supported
                canvasContext.canvas.toDataURL();
            } else {
                //status.innerHTML = "Canvas not supported. Try a different browser.";
                mljs.defaultconnection.logger.debug("Canvas not supported. Try a different browser.");
            }
        } catch(e) {
            // we remove the OSM layer if CORS image requests are not supported.
            //map.setBaseLayer(map.layers[1]);
            mljs.defaultconnection.logger.debug("CORS not supported - cannot load OSM maps");
            evt.object.destroy();
            layerSwitcher.destroy();
        }
    };
    this.__detect = function(evt) {detect(evt);};

    // update the number of cache hits and detect missing CORS support
    function updateStatus(evt) {
        if (window.localStorage) {
            mljs.defaultconnection.logger.debug(localStorage.length + " entries in cache.");
        } else {
            mljs.defaultconnection.logger.debug("Local storage not supported. Try a different browser.");
        }
        if (evt && evt.tile.url.substr(0, 5) === "data:") {
            cacheHits++;
        }
        //hits.innerHTML = cacheHits + " cache hits.";
    };
    this.__updateStatus = function(evt) {updateStatus(evt);};

    // turn the cacheRead controls on and off
    function toggleRead() {
        //if (!this.checked) {
        //    cacheRead1.deactivate();
        //    cacheRead2.deactivate();
        //} else {
            setType();
        //}
    };

    // turn the cacheWrite control on and off
    function toggleWrite() {
        cacheWrite[cacheWrite.active ? "deactivate" : "activate"]();
    };

    // clear all tiles from the cache
    function clearCache() {
        OpenLayers.Control.CacheWrite.clearCache();
        updateStatus();
    };

    // activate the cacheRead control that matches the desired fetch strategy
    function setType() {
        //if (tileloadstart.checked) {
            cacheRead1.activate(); // cahce first
        //} else {
        //    cacheRead2.activate(); // online first
        //}
    };

    // start seeding the cache
    function startSeeding() {
        var layer = map.baseLayer,
            zoom = map.getZoom();
        seeding = {
            zoom: zoom,
            extent: map.getExtent(),
            center: map.getCenter(),
            cacheWriteActive: cacheWrite.active,
            buffer: layer.buffer,
            layer: layer
        };
        // make sure the next setCenter triggers a load
        map.zoomTo(zoom === layer.numZoomLevels-1 ? zoom - 1 : zoom + 1);
        // turn on cache writing
        cacheWrite.activate();
        // turn off cache reading
        cacheRead1.deactivate();
        cacheRead2.deactivate();

        layer.events.register("loadend", null, seed);

        // start seeding
        map.setCenter(seeding.center, zoom);
    };

    // seed a zoom level based on the extent at the time startSeeding was called
    function seed() {
        var layer = seeding.layer;
        var tileWidth = layer.tileSize.w;
        var nextZoom = map.getZoom() + 1;
        var extentWidth = seeding.extent.getWidth() / map.getResolutionForZoom(nextZoom);
        // adjust the layer's buffer size so we don't have to pan
        layer.buffer = Math.ceil((extentWidth / tileWidth - map.getSize().w / tileWidth) / 2);
        map.zoomIn();
        if (nextZoom === layer.numZoomLevels-1) {
            stopSeeding();
        }
    };

    // stop seeding (when done or when cache is full)
    function stopSeeding() {
        // we're done - restore previous settings
        seeding.layer.events.unregister("loadend", null, seed);
        seeding.layer.buffer = seeding.buffer;
        map.setCenter(seeding.center, seeding.zoom);
        if (!seeding.cacheWriteActive) {
            cacheWrite.deactivate();
        }
        //if (read.checked) {
            setType();
        //}
        seeding = false;
    };
  };

  init();
};

com.marklogic.widgets.openlayers.prototype.eightDecPlaces = function(val) {
  var str = "" + val;
  var pos = str.indexOf(".");
  return 1.0 * (str.substring(0,pos + 1) + str.substring(pos + 1,pos + 9)); // TODO check for bug if no decimal place exists
};

/**
 * Helper function to center and zoom the map. Note that zoom levels are OpenLayers zoom levels, not necessarily the zoom level of the layer you are using.
 *
 * @param {float} lat - Latitude
 * @param {float} lon - Longitude
 * @param {integer} zoom - Zoom level (OpenLayers zoom level, not necessarily the mapping layer's own internal level)
 */
com.marklogic.widgets.openlayers.prototype.go = function(lat,lon,zoom) {
  this.map.setCenter( new OpenLayers.LonLat(lon,lat).transform(this.transformWgs84, this.map.projection), zoom,true,true);
};

/**
 * Response to a geo context's locale being updated. Currently only supports center, but in future will supports bounds, zooming to the right level to
 * show the entire area required
 *
 * @param {JSON} locale - The geo context local definition. Has center(longitude,latitude), bounds (n,e,s,w) and area(Array of points/circle/box/polygon) properties
 */
com.marklogic.widgets.openlayers.prototype.updateLocale = function(locale) {
  mljs.defaultconnection.logger.debug("openlayers.updateLocale: Called with: " + JSON.stringify(locale));
  // use center position to set map center
  this.map.setCenter(new OpenLayers.LonLat(locale.center.longitude, locale.center.latitude).transform(this.transformWgs84,this.map.projection),this.map.getZoom(),true,true);
};

/**
 * Adds a series of Feature (Marker) icons on to the map when the specified searchcontext fires an updateResults event.
 *
 * NB This method fetches longitude, latitude, summary and title information from within the result document (result[i].content).
 * This means the searchcontext must be configured to return RAW (full document) results, or use a transform to extract the relevant portion of the document.
 *
 * @param {string} title - The title (and reference name) of the series to add. This is shown in the Layer selection area
 * @param {mljs.searchcontext} searchcontext - The searchcontext that this widget should listen to and generate markers in this series for
 * @param {string} latsrc - The JSON path (E.g. "location.lat") of the property to extract from the JSON or XML document to use as the latitude
 * @param {string} lonsrc - The JSON path (E.g. "location.lon") of the property to extract from the JSON or XML document to use as the longitude
 * @param {string} titlesrc - The JSON path (E.g. "title") of the property to extract from the JSON or XML document to use as the title
 * @param {string} summarysrc - The JSON path (E.g. "summary") of the property to extract from the JSON or XML document to use as the summary
 * @param {string} icon_source - The Optional JSON path (E.g. "icon") of the property to extract from the JSON or XML document to use as the icon absolute URL (E.g. /images/myicon.png)
 * @param {string} heatmap_constraint - The constraint name to use for the heatmap on this series. Note: Heatmap based only upon the last series executed and configured
 */
com.marklogic.widgets.openlayers.prototype.addSeries = function(title,searchcontext,latsrc,lonsrc,titlesrc,summarysrc,icon_source_opt,heatmap_constraint) {
  this.series[name] = {title: title, context: searchcontext,latsource:latsrc,lonsource:lonsrc,titlesource:titlesrc,summarysource:summarysrc,constraint: heatmap_constraint};

  // add new layer
  var layer = new OpenLayers.Layer.Markers(title); // TODO other layer configuration - e.g. icon, selectable handler, etc.

  var size = new OpenLayers.Size(21,25);
  var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
  var icon = new OpenLayers.Icon('/js/OpenLayers-2.13.1/img/marker-blue.png', size, offset);


  this.series[name].layer = layer;
  this.map.addLayer(layer);
  /*
  // selection/hover support for this layer
  var selectControl = new OpenLayers.Control.SelectFeature(layer, {
    hover: true
  });
  selectControl.events.register('featurehighlighted', null, featureHighlighted);
  this.map.addControl(selectControl);

  var featureHighlighted = function(evt) {
    // Needed only for interaction, not for the display.
    var onPopupClose = function (evt) {
        // 'this' is the popup.
        var feature = this.feature;
        if (feature.layer) {
            selectControl.unselect(feature);
        }
        this.destroy();
    };

    var feature = evt.feature;
    var popup = new OpenLayers.Popup.FramedCloud("featurePopup",
            feature.geometry.getBounds().getCenterLonLat(),
            new OpenLayers.Size(100,100),
            "<h2>"+feature.attributes.station_na + "</h2>" +
            "Location: " + feature.attributes.location + '<br/>' +
            "Elevation: " + feature.attributes.elev_,
            null, true, onPopupClose);
    feature.popup = popup;
    popup.feature = feature;
    this.map.addPopup(popup, true);
  };*/


  var popup; // global reference

  // add updateResults wrapper function
  var self = this;
  var lisfunc = function(results) {
    mljs.defaultconnection.logger.debug("openlayers.addSeries.listfunc: In dynamic results listener...");
    // check for reset call
  self._selectedUri = null;
  self._highlightedUri = null;
    if (null == results || "boolean"==typeof(results)) {
      if (false === results) {
      }
      // clear heatmap
      self.heatmap.setDataSet({data: [], max: 0});
      return;
    }

        mljs.defaultconnection.logger.debug("openlayers.addSeries.listfunc: Deleting results markers in layer: " + title);
        // remove all markers
        var oldm = layer.markers;
        for (var i = 0;i < oldm.length;i++) {
          var mark = oldm[i];
          mark.erase();
          layer.removeMarker(mark);
          mark.destroy();
        }
        layer.clearMarkers();

    mljs.defaultconnection.logger.debug("openlayers.addSeries.listfunc: Processing results");
    // add each marker in new result set
    for (var i = 0,max = results.results.length,r;i < max;i++) {
      r = results.results[i];
      //mljs.defaultconnection.logger.debug("openlayers.addSeries.listfunc: Processing result: " + JSON.stringify(r));

      var thedoc = jsonOrXml(r.content);
      // support metadata extraction too
      var lat = null;
      var lon = null;
      if ("object" == typeof (latsrc)) {
        // json description - {type: "extract", source: "constraint", "constraint": "location"}
        if ("extract" == latsrc.type) {
          if ("constraint" == latsrc.source) {
            for (var metai = 0, maxi = r.metadata.length, meta;metai < maxi;metai++) {
              meta = r.metadata[metai];
              //console.log("  meta instance: " + metai);
              for (var param in meta) {
                //console.log("    found param: " + param);
                // find our one
                // NB may be multiple of them - TODO support more than just last found
                if (param == latsrc.constraint) {
                  //console.log("      found latsrc constraint param");
                  var parts = meta[param].split(",");
                  lat = parts[0];
                  lon = parts[1];
                  console.log("*** Found location parts: lat: " + parts[0] + ", lon: " + parts[1]);
                }
              }
            }
          } else {
            console.log("latsrc source not a constraint");
            // do something. E.g. element, not geo constraint
          }
        } else {
            console.log("latsrc type not an extract");
          // do something else
        }
      } else {
        var lat = extractValue(thedoc,latsrc);
        var lon = extractValue(thedoc,lonsrc);
      }
      mljs.defaultconnection.logger.debug("openlayers.addSeries.listfunc: lat: " + lat + ", lon: " + lon);
      var m = new OpenLayers.Marker(new OpenLayers.LonLat(lon,lat).transform(self.transformWgs84,self.map.displayProjection),icon.clone());

      // TODO popup/infobox based on search result, extract title and summary
      layer.addMarker(m);


      var addEvents = function(m,uri) {
        // add hover handlers
        m.events.register('mouseover', m, function(evt) {
          self._highlightedUri = uri;
          self._resultHighlightPublisher.publish({mode: "replace", uri: uri});
        });
        //here add mouseout event
        m.events.register('mouseout', m, function(evt) {
          self._highlightedUri = null;
          self._resultHighlightPublisher.publish({mode: "replace", uri: null});
        });
        m.events.register('click', m, function(evt) {
          // TODO change marker icon when selected/unselected (Red?)
          if (uri == self._selectedUri) {
            // deselect
            self._selectedUri = null;
            self._resultSelectionPublisher.publish({mode: "replace", uri: null});
          } else {
            self._selectedUri = uri;
            self._resultSelectionPublisher.publish({mode: "replace", uri: uri});
          }
        });
      };

      addEvents(m,r.uri);
    }
    mljs.defaultconnection.logger.debug("openlayers.addSeries.listfunc: Finished adding all results");

    // Now add heatmap information, if it exists
    if (undefined != results.facets[heatmap_constraint] && undefined != results.facets[heatmap_constraint].boxes) {
      // create heatmap box overlays - but they're based on points, not boxes, so how is this done in AppBuilder?
      //  - Is this the old method used in some older demos, prior to AppBuilder 5?
      //  - How does AppBuilder 5's heatmaps work? Do they use *all* results? If so, how is this accomplished? (normally there's a limit)
      // AppBuilder uses the center points of the boxes for points with scores
      // Convert to heatmap points
      // in order to use the OpenLayers Heatmap Layer we have to transform our data into
      // { max: , data: [{lonlat: , count: },...]}
      var boxes = results.facets[heatmap_constraint].boxes;
      var data = []; // not an array object
      //var max = 0;
      for (var i = 0, maxb = boxes.length,box,lat,lng,dp;i < maxb;i++) {
        box = boxes[i];
        lat = 0.5*(box.s+box.n);
        lng = 0.5*(box.w+box.e);
        dp = {lonlat: new OpenLayers.LonLat(lng,lat),count:box.count}; // was*10 // TODO figure out why a scaling factor is needed - can this be calculated generally using total???
        /*if (box.count > max) {
          max = box.count;
        }*/
        data[i] = dp;
      }
      // Do we need to create blank boxes too?
      mljs.defaultconnection.logger.debug("Heatmap MAX: " + boxes.length);

      self.heatmap.setDataSet({data: data, max: boxes.length});
    }


  };
  searchcontext.addResultsListener(lisfunc);
  this.series[name].listener = lisfunc;

  // contribute our heatmap query if required
  if (undefined != this.series[name].constraint) {
    this.ensureHeatmap();
    var self = this;

    var updateHeatmap = function() {
      var ex = self.map.getExtent().transform(self.map.displayProjection,self.transformWgs84); // Bounds object
      var amount = self._config.heatmapGranularity;
      var ratio = Math.sqrt(amount / (self.height*self.width));
      var up = Math.ceil(ratio*self.height);
      var across = Math.ceil(ratio*self.width);
      mljs.defaultconnection.logger.debug("Heatmap Amount: " + amount + ", ratio: " + ratio + ", up: " + up + ", across: " + across);
      mljs.defaultconnection.logger.debug("Heatmap Bounds: N: " + ex.top + ", South: " + ex.bottom + ", West: " + ex.left + ", East: " + ex.right);
      var heatmap = {n: ex.top,s: ex.bottom,w: ex.left,e: ex.right,latdivs:up,londivs:across};

      searchcontext.updateGeoHeatmap(heatmap_constraint,heatmap);
    };

    // TODO also add map zoom event handler to update this on the fly too
    this.map.events.register("moveend",this.map,function() {
      updateHeatmap();
    });

    updateHeatmap();
  }

};

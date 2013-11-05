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
  
  this.map = null; // openlayers map control
  
  this.series = {}; // {title: "", context: searchcontext,latsource:"location.lat",lonsource:"location.lon",titlesource:"",summarysource:""};
  
  this._refresh();
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
  
  var str = "<div id='" + this.container + "-map' style='height:" + height + "px;width:" + width + "px;'></div>"; // may want other HTML elements later
  
  p.innerHTML = str;
  
  // Use proxy to get same origin URLs for tiles that don't support CORS.
  //OpenLayers.ProxyHost = "proxy.cgi?url=";

  var map, cacheWrite, cacheRead1, cacheRead2;

  function init() {
    map = new OpenLayers.Map({
      div: self.container + "-map",
      projection: "EPSG:900913",
      displayProjection: new OpenLayers.Projection("EPSG:900913"),
      layers: [
        new OpenLayers.Layer.OSM("OpenStreetMap (CORS)", null, {
          eventListeners: {
            tileloaded: this._updateStatus,
            loadend: this._detect
          }
        }
        )
      ],
      center: [0,0], // [0,0]
      zoom: 1
    });
    self.map = map;
    
    //var gmap = new OpenLayers.Layer.Google("Google Streets");
    //map.addLayers([gmap]);
    
    
    var selectionLayer = new OpenLayers.Layer.Vector("Selection Layer");
    
    map.addLayers([selectionLayer]);
    //map.addControl(new OpenLayers.Control.MousePosition());
    
    drawControls = {
      point: new OpenLayers.Control.DrawFeature(selectionLayer,
        OpenLayers.Handler.Point),
      line: new OpenLayers.Control.DrawFeature(selectionLayer,
        OpenLayers.Handler.Path),
      polygon: new OpenLayers.Control.DrawFeature(selectionLayer,
        OpenLayers.Handler.Polygon),
      box: new OpenLayers.Control.DrawFeature(selectionLayer,
        OpenLayers.Handler.RegularPolygon, {
          handlerOptions: {
            sides: 4,
            irregular: true
          }
        }
      )
    };
    for(var key in drawControls) {
      map.addControl(drawControls[key]);
    } 
    
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

/**
 * Helper function to center and zoom the map. Note that zoom levels are OpenLayers zoom levels, not necessarily the zoom level of the layer you are using.
 * 
 * @param {float} lat - Latitude
 * @param {float} lon - Longitude
 * @param {integer} zoom - Zoom level (OpenLayers zoom level, not necessarily the mapping layer's own internal level)
 */
com.marklogic.widgets.openlayers.prototype.go = function(lat,lon,zoom) {
  this.map.setCenter( new OpenLayers.LonLat(lon,lat).transform(new OpenLayers.Projection("EPSG:4326"), this.map.projection), zoom);
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
 * @param {string} iconsrc - The Optional JSON path (E.g. "icon") of the property to extract from the JSON or XML document to use as the icon absolute URL (E.g. /images/myicon.png)
 */
com.marklogic.widgets.openlayers.prototype.addSeries = function(title,searchcontext,latsrc,lonsrc,titlesrc,summarysrc,icon_source_opt) {
  this.series[name] = {title: title, context: searchcontext,latsource:latsrc,lonsource:lonsrc,titlesource:titlesrc,summarysource:summarysrc};
  
  // add new layer
  var layer = new OpenLayers.Layer.Markers(title); // TODO other layer configuration - e.g. icon, selectable handler, etc.
  
  var size = new OpenLayers.Size(21,25);
  var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
  var icon = new OpenLayers.Icon('/js/OpenLayers-2.13.1/img/marker-blue.png', size, offset);

  
  this.series[name].layer = layer;
  this.map.addLayer(layer); 
  
  // add updateResults wrapper function
  var self = this;
  var lisfunc = function(results) {
    mljs.defaultconnection.logger.debug("openlayers.addSeries.listfunc: In dynamic results listener...");
    // check for reset call
    if (null == results || "boolean"==typeof(results)) {
      if (false === results) {
      }
      return;
    }
    
        mljs.defaultconnection.logger.debug("openlayers.addSeries.listfunc: Deleting results markers in layer: " + title);
        // remove all markers
        var oldm = layer.markers;
        for (var i = 0;i < oldm.length;i++) {
          layer.removeMarker(oldm[i]); 
        }
    
    mljs.defaultconnection.logger.debug("openlayers.addSeries.listfunc: Processing results");
    // add each marker in new result set
    for (var i = 0,max = results.results.length,r;i < max;i++) {
      r = results.results[i];
      //mljs.defaultconnection.logger.debug("openlayers.addSeries.listfunc: Processing result: " + JSON.stringify(r));
      
      var thedoc = jsonOrXml(r.content);
      var lat = extractValue(thedoc,latsrc);
      var lon = extractValue(thedoc,lonsrc);
      mljs.defaultconnection.logger.debug("openlayers.addSeries.listfunc: lat: " + lat + ", lon: " + lon);
      var m = new OpenLayers.Marker(new OpenLayers.LonLat(lon,lat).transform(new OpenLayers.Projection("EPSG:4326"),self.map.projection),icon.clone());
      // TODO popup/infobox based on search result, extract title and summary
      layer.addMarker(m);
    }
    mljs.defaultconnection.logger.debug("openlayers.addSeries.listfunc: Finished adding all results");
  };
  searchcontext.addResultsListener(lisfunc);
  this.series[name].listener = lisfunc;
};



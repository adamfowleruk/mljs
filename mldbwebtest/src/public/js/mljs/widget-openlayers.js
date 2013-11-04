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
 * Adds a custom instance of OpenLayers.Layer - E.g. your own WMS based layer, or ArcGIS layer
 * 
 * @param {OpenLayers.Layer} layer - The OpenLayers layer to add to this map as a base layer
 */
com.marklogic.widgets.openlayers.prototype.addLayer = function(layer) {
  this.map.addLayer(layer);
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
        layers: [new OpenLayers.Layer.OSM("OpenStreetMap (CORS)", null, {
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


    
    // add UI and behavior
    /*
    var status = document.getElementById("status"),
        hits = document.getElementById("hits"),
        cacheHits = 0,
        seeding = false;
    var read = document.getElementById("read");
    read.checked = true;
    read.onclick = toggleRead;
    var write = document.getElementById("write");
    write.checked = false;
    write.onclick = toggleWrite;
    document.getElementById("clear").onclick = clearCache;
    var tileloadstart = document.getElementById("tileloadstart");
    tileloadstart.checked = "checked";
    tileloadstart.onclick = setType;
    document.getElementById("tileerror").onclick = setType;
    document.getElementById("seed").onclick = startSeeding;
    */
    
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



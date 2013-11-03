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
  
  this._refresh();
};

com.marklogic.widgets.openlayers.prototype._refresh = function() {
  var self = this;
  
  // detect parent bounds
  var p = document.getElementById(this.container);
  var width = p.width;
  if (undefined == width || width ==0) {
    width = 800;
  }
  var height = p.height;
  if (undefined == height || height ==0) {
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
                    tileloaded: updateStatus,
                    loadend: detect
                }
            })
            /*,
            new OpenLayers.Layer.WMS("OSGeo (same origin - proxied)", "http://vmap0.tiles.osgeo.org/wms/vmap0", {
                layers: "basic"
            }, {
                eventListeners: {
                    tileloaded: updateStatus
                }
            })*/
        ],
        center: [0,0], // [0,0]
        zoom: 1
    });
    self.map = map;
    
    var gmap = new OpenLayers.Layer.Google("Google Streets");
    map.addLayers([gmap]);
    
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
    layerSwitcher.maximizeControl();


    
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
    }

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
    }
    
    // turn the cacheRead controls on and off
    function toggleRead() {
        //if (!this.checked) {
        //    cacheRead1.deactivate();
        //    cacheRead2.deactivate();
        //} else {
            setType();
        //}
    }
    
    // turn the cacheWrite control on and off
    function toggleWrite() {
        cacheWrite[cacheWrite.active ? "deactivate" : "activate"]();
    }
    
    // clear all tiles from the cache
    function clearCache() {
        OpenLayers.Control.CacheWrite.clearCache();
        updateStatus();
    }
    
    // activate the cacheRead control that matches the desired fetch strategy
    function setType() {
        //if (tileloadstart.checked) {
            cacheRead1.activate(); // cahce first
        //} else {
        //    cacheRead2.activate(); // online first
        //}
    }
    
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
    }
    
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
    }
    
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
    }
  };
  
  init();
};

/**
 * Helper function to center and zoom the map. Note that zoom levels are OpenLayers zoom levels, not necessarily the zoom level of the layer you are using.
 * 
 * @param {float} lat - Latitude
 * @param {float} lon - Longitude
 * @param {integer} zoom - Zoom level
 */
com.marklogic.widgets.openlayers.prototype.go = function(lat,lon,zoom) {
  this.map.setCenter( new OpenLayers.LonLat(lon,lat).transform(new OpenLayers.Projection("EPSG:4326"), this.map.projection), zoom);
};

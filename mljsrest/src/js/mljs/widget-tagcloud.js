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





com.marklogic.widgets.tagcloud = function(container) {
  this.container = container;
  
  // example: "facets":{"collection":{"type":"collection","facetValues":[]},"animal":{"type":"xs:string","facetValues":[]},"family":{"type":"xs:string","facetValues":[]}}
  // full example: "facets":{"collection":{"type":"collection","facetValues":[]},
  // "animal":{"type":"xs:string","facetValues":[{"name":"cat","count":2,"value":"cat"}, {"name":"dog","count":2,"value":"dog"},{"name":"homosapien","count":2,"value":"homosapien"},
  //   {"name":"penguin","count":2,"value":"penguin"}]},  
  // "family":{"type":"xs:string","facetValues":[{"name":"bird","count":2,"value":"bird"},{"name":"marklogician","count":2,"value":"marklogician"},{"name":"pet","count":4,"value":"pet"}]}}
  this.results = null;
  
  this.facet = null;
  
  this.ctx = mljs.defaultconnection.createSearchContext();
  
  this._refresh();
};

com.marklogic.widgets.tagcloud.prototype.setFacet = function(f) {
  this.facet = f;
};

com.marklogic.widgets.tagcloud.prototype._refresh = function() {
  var str = "";
  if (null == this.facet) {
    str += "<p>No Facet specified. Use wgt.setFacet(name) to specify which facet to display as a tag cloud.</p>";
  } else {
  
    if (null != this.results && undefined != this.results) {
      if (undefined != this.results.facets) {
      
        for (var name in this.results.facets) {
        
          if (this.facet == name) {
          
          
            var values = this.results.facets[name].facetValues;
            // sort facets first by count
            bubbleSort(values, "count");
            var maxCount = values[0].count;
            var minCount = values[values.length - 1].count;
            mljs.defaultconnection.logger.debug("maxCount: " + maxCount + ", minCount: " + minCount);
            var startSize = 10;
            var maxSize = 20;
            var factor = 1;
            if (maxCount != minCount) {
              factor =  (maxSize - startSize) / (maxCount - minCount);
            } else {
              // prevents divide by zero when only one item
              factor = (maxSize - startSize);
            }
            mljs.defaultconnection.logger.debug("factor: " + factor);
            bubbleSort(values, "value",true);
            
            var valuesCount = values.length;
            for (var v = 0;v < valuesCount;v++) {
              var fv = values[v];
              str += "<span class='tagcloud-value' title='" + fv.name.replace(/'/g,"&#39;") + " (" + fv.count + ")' style='font-size: " + (startSize + ((fv.count - minCount) * factor)) + "px;'>" + fv.name + "</span>";
          
            } // end for v
          } // end if name matches
        } // end name for
      } // end if facets null
    } // end if results null
  } // end if no facet specified
  
  document.getElementById(this.container).innerHTML = str;
};


/**
 * Set the search context object to use for operations
 * 
 * @param {mljs.searchcontext} ctx - The search context instance to invoke
 */
com.marklogic.widgets.tagcloud.prototype.setContext = function(context) {
  this.ctx = context;
};

/**
 * Get the search context object this widget will use for operations
 */
com.marklogic.widgets.tagcloud.prototype.getContext = function() {
  return this.ctx;
};

            
            

/**
 * Event Target. Link to a search bar (or advanced search)'s addResultListener function (NOT addFacetListener)
 * 
 * @param {JSON} results - The REST API search results JSON object. See GET /v1/search.
 */
com.marklogic.widgets.tagcloud.prototype.updateFacets = function(results) {
  if ("boolean" == typeof results) {
    return;
  }
  this.results = results;
  
  this._refresh();
};

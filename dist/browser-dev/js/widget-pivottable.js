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






com.marklogic.widgets.workplaceadminext = window.com.marklogic.widgets.workplaceadminext || {};
com.marklogic.widgets.workplaceadminext.widgets = window.com.marklogic.widgets.workplaceadminext.widgets || {};
com.marklogic.widgets.workplaceadminext.widgets["widget-pivottable.js"] = [
  {title: "Pivot Table", classname: "com.marklogic.widgets.pivottable", description: "Pivot table."}
];


com.marklogic.widgets.pivottable = function(container) {
  this.container = container;

  this._config = {
  };

  this.results = null;

  this.ctx = mljs.defaultconnection.createSearchContext();

  this.derivers = $.pivotUtilities.derivers;

  this.renderers = $.extend(
            $.pivotUtilities.renderers,
            $.pivotUtilities.c3_renderers,
            $.pivotUtilities.d3_renderers,
            $.pivotUtilities.export_renderers
            );

  this._refresh();
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.pivottable.getConfigurationDefinition = function() {
  return {
  };
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.pivottable.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }
  if (""==this._config.facet) {
    this._config.facet = null;
  }

  // refresh display
  this._refresh();
};

com.marklogic.widgets.pivottable.prototype.setFacet = function(f) {
  this._config.facet = f;
};

com.marklogic.widgets.pivottable.prototype._refresh = function() {
  var json = new Array();

  var flatten = function(jobj,r) {
    var r = r || {};
    for (var p in jobj) {
      if (p != "search" && p != "xmlns" && p != "sem" && p != "triple" && !p.startsWith("control-") && !p.startsWith("grid-") && p != "#text") {
        var param = jobj[p];
        if (Array.isArray(param)) {
          r[p] = param;
        } else if ("object" == typeof param) {
          flatten(param,r);
        } else {
          //if (p == "companyname" || p == "hqcountry" || p == "mainbusinessactivities" || p == "totalsold" ||
          //  "scottishemployeecount" == p || "totalgoodssold" == p || "totalservicessold" == p //|| "urn" == p
          //  || "town" == p || "county" == p
          //) {
            r[p] = param;
          //}
        }
      }
    }
    return r;
  };

  if (null != this.results) {
    console.log("PIVOT: have results");
    for (var i = 0,maxi = this.results.results.length,r;i < maxi;i++) {
      r = this.results.results[i];
      if (null != r.content) {
        // we have a raw document in XML or JSON (ASSUME XML)
        var jo = flatten(xmlToJson(textToXML(r.content)));
        console.log("PIVOT: " + JSON.stringify(jo));
        json.push(jo);
        console.log("PIVOT: Have converted xml to JSON");
      }
    }
  }

  // pivot table assumes all properties exist in EACH and EVERY result - so normalise them...
  var listParams = function(jarray) {
    var params = [];
    for (var i = 0;i < jarray.length;i++) {
      jobj = jarray[i];
      for (var p in jobj) {
        if (!params.contains(p)) {
          params.push(p);
        }
      }
    }
    return params;
  };
  var normalise = function(params,jobj) {
    for (var i = 0, maxi = params.length, p;i < maxi;i++) {
      p = params[i];
      if (undefined == jobj[p]) {
        jobj[p] = "";
      }
    }
  };

  var ps = listParams(json);
  for (var r = 0;r < json.length;r++) {
    normalise(ps,json[r]);
  };

  console.log("PIVOT: Numbers of results: " + json.length);
  console.log("PIVOT: JSON: " + JSON.stringify(json));

  /*
  json = [
    {"hqcountry": "england","mainbusiness": "Software"},
    {"hqcountry": "scotland", "mainbusiness": "Manufacturing"}
  ];
  */

  var self = this;

  $("#" + this.container).pivotUI(json, {
                  renderers: self.renderers,
                  derivedAttributes: {
                    "Employee Bin": self.derivers.bin("scottishemployeecount","50"),
                    "Goods Sold Bin": self.derivers.bin("totalgoodssold","500000"),
                    "Total Sold Bin": self.derivers.bin("totalsold","500000"),
                    "Services Sold Bin": self.derivers.bin("totalservicessold","500000")
                    /*
                      "Age Bin": derivers.bin("Age", 10),
                      "Gender Imbalance": function(mp) {
                          return mp["Gender"] == "Male" ? 1 : -1;
                      }
                      */
                  },
                  cols: ["hqcountry"], rows: ["mainbusinessactivities"],
                  rendererName: "Table"
              });


  /*
  var str = "";
  str += "<div class='mljswidget panel panel-info widget-tagcloud'>";
  if (null == this._config.facet) {
    str += "<p>No Facet specified. Use wgt.setFacet(name) to specify which facet to display as a tag cloud.</p>";
  } else {

    if (null != this.results && undefined != this.results) {
      if (undefined != this.results.facets) {

        for (var name in this.results.facets) {

          if (this._config.facet == name) {


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
  str += "</div>";

  document.getElementById(this.container).innerHTML = str;
  */
};


/**
 * Set the search context object to use for operations
 *
 * @param {mljs.searchcontext} ctx - The search context instance to invoke
 */
com.marklogic.widgets.pivottable.prototype.setSearchContext = function(context) {
  this.ctx = context;
};

/**
 * Get the search context object this widget will use for operations
 */
com.marklogic.widgets.pivottable.prototype.getContext = function() {
  return this.ctx;
};




/**
 * Event Target. Link to a search bar (or advanced search)'s addResultListener function (NOT addFacetListener)
 *
 * @param {JSON} results - The REST API search results JSON object. See GET /v1/search.
 */
com.marklogic.widgets.pivottable.prototype.updateResults = function(results) {
  if ("boolean" == typeof results) {
    return;
  }
  this.results = results;

  console.log("PIVOT: updateResults called with data");

  this._refresh();
};

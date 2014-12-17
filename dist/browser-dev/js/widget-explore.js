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
 * This widget allows a user to explore a graph of data starting with a specified subject.
 * The widget is also capable of showing each node's properties, and relationship information.
 * Additionally, if a node is of type MarkLogicDocument then it's facet information is loaded
 * as property values.
 *
 * This widget will also support dynamically generating SPARQL and structured queries necessary
 * to create a report. This will be done by dragging and dropping properties/facets on to a
 * receiver object. Each receiver object will have it's semantic context updated with the dropped
 * property (and thus high level 'select' sparql query, and document value query).
 *
 * @constructor
 * @param {string} container - The ID of the HTML element to draw this widget within.
 */
com.marklogic.widgets.graphexplorer = function(container) {
  this.container = container;

  this.documentContext = null;
  this.semanticContext = null; // used for querying for information to display ONLY

  this.entities = new Array(); // {"subjectparam": "ent1", "", queryterms : {semantic:  some query, content: some config}, parentiri: , subjectiri: , docuri: , subjectsfacts: , column: , row: , jswrapper: }

  this.properties = new Array(); // {htmlid: "span3456", parentid: "div1234", predicate: ""}

  this.propertyCache = new Array(); // subjectiri -> facts json
  this.facetCache = new Array(); // documentUri -> facets json

  this.drawWhenComplete = new Array(); // JSON object {subject: iri, dependencies: [string dep iri]}

  this.columnCount = new Array(); // 1 based column number > count of widgets drawn in there

  this.searchOptionsName = "all";

  this.columnWidths = new Array(); // colnumber -> pixel width maximum in column
  this.rowHeights = new Array(); // crownumber -> pixel height maximum in row

  this._existingPaths = {}; // this._existingPaths[parentiri][childiri] = path

  this._messageBoxes = new Array(); // list of msgboxes shown, to destroy!!!

  this._init();
};

com.marklogic.widgets.graphexplorer.prototype.setConfiguration = function(config) {
  // TODO REPLACE THIS UGLY HACK
  if (undefined != config.iri) {
    this.drawSubject(config.iri);
  }
};

/**
 * Ensures that a drawn column (to place Subject rectangles in) is at least so many pixels wide.
 *
 * @param {integer} colnum - The column number (1 based)
 * @param {double} width - The minimum column width in pixels
 */
com.marklogic.widgets.graphexplorer.prototype.checkColumnWidth = function(colnum,width) {
  var curwidth = this.columnWidths[colnum];
  mljs.defaultconnection.logger.debug("checkColumnWidth: colnum: " + colnum + ", curwidth: " + curwidth + ", width: " + width);
  if (undefined == curwidth) {
    curwidth = 0;
  }
  if (curwidth < width) {
    this.columnWidths[colnum] = width;
  }
};

/**
 * Ensures that a drawn row (to place Subject rectangles in) is at least so many pixels high.
 *
 * @param {integer} num - The row number (1 based)
 * @param {double} height - The minimum row height in pixels
 */
com.marklogic.widgets.graphexplorer.prototype.checkRowHeight = function(num,height) {
  var cur = this.rowHeights[num];
  mljs.defaultconnection.logger.debug("checkRowHeight: rownum: " + num + ", curheight: " + cur + ", height: " + height);
  if (undefined == cur) {
    cur = 0;
  }
  if (cur < height) {
    this.rowHeights[num] = height;
  }
};

/**
 * Adding all column's widths up before the specified column. Used to find an appropriate left css style value.
 *
 * @param {integer} column - The column index to determine the left pixel for
 */
com.marklogic.widgets.graphexplorer.prototype.widthBefore = function(column) {
  var width = 0;
  for (var i = 1;i < this.columnWidths.length && i < column;i++) {
    mljs.defaultconnection.logger.debug("widthBefore: i=" + i + " => " + this.columnWidths[i]);
    width += this.columnWidths[i];
  }
  return width;
};

/**
 * Adding all row's heights up before the specified row. Used to find an appropriate top css style value.
 *
 * @param {integer} row - The row index to determine the top pixel for
 */
com.marklogic.widgets.graphexplorer.prototype.heightBefore = function(row) {
  var height = 0;
  for (var i = 1;i < this.rowHeights.length && i < row;i++) {
    mljs.defaultconnection.logger.debug("heightBefore: i=" + i + " => " + this.rowHeights[i]);
    height += this.rowHeights[i];
  }
  return height;
};

/**
 * Sets the name of the search options to use for retrieving viewable document facets.
 *
 * @param {string} name - The name of the search options saved on the server
 */
com.marklogic.widgets.graphexplorer.prototype.setSearchOptionsName = function(name) {
  this.searchOptionsName = name;
};

/**
 * Gets the name of the search options to use for retrieving viewable document facets.
 */
com.marklogic.widgets.graphexplorer.prototype.getSearchOptionsName = function() {
  return this.searchOptionsName;
};

/**
 * Sets the document context for this widget
 *
 * @param {documentcontext} ctx - The document context instance
 */
com.marklogic.widgets.graphexplorer.prototype.setDocumentContext = function(ctx) {
  this.documentContext = ctx;
};

/**
 * Gets the document context for this widget
 */
com.marklogic.widgets.graphexplorer.prototype.getDocumentContext = function() {
  return this.documentContext;
};

/**
 * Sets the semantic context for this widget
 *
 * @param {semanticcontext} ctx - The semantic context instance
 */
com.marklogic.widgets.graphexplorer.prototype.setSemanticContext = function(ctx) {
  this.semanticContext = ctx;
};

/**
 * Gets the semantic context for this widget
 */
com.marklogic.widgets.graphexplorer.prototype.getSemanticContext = function() {
  return this.semanticContext;
};

com.marklogic.widgets.graphexplorer.prototype._init = function() {
  var id = this.container + "-graphexplorer";
  var html = "<div id='" + id + "' class='mljswidget panel panel-info graphexplorer'>";
  html += "  <div class='title panel-heading graphexplorer-title'>Graph Explorer</div>";
  html += "  <div id='" + id + "-content' class='panel-body graphexplorer-content'></div>";
  html += "</div>";

  document.getElementById(this.container).innerHTML = html;

  // set up highcharts

    var chart = new Highcharts.Chart({
      /*
        title: {
            text: '',
            align: "left"
        },*/
        chart: {
            renderTo: id + "-content",
            events: {
                load: function () {

          }
        },
        width: 2000,
        height: 2000
      }
    });

  var chartdiv = document.getElementById(this.container + "-graphexplorer-content").childNodes[0];
  chartdiv.style.overflow = "scroll";
  chartdiv.style.width = "100%";
  chartdiv.style.height = "2050px";

  this.chart = chart;
  this.renderer = chart.renderer;

  /*
                    // Draw the flow chart
                    var ren = chart.renderer,
                        colors = Highcharts.getOptions().colors,
                        rightArrow = ['M', 0, 0, 'L', 100, 0, 'L', 95, 5, 'M', 100, 0, 'L', 95, -5],
                        leftArrow = ['M', 100, 0, 'L', 0, 0, 'L', 5, 5, 'M', 0, 0, 'L', 5, -5],
                        seArrow = ['M', 145, 115, 'L', 220, 235, 'L',215,235,'M',220,230,'L',220,235],
                        swAnti = ['M',80,120,'L',80,245,'C',80,270,80,270,105,270,'L',210,270,'L',205,265,'M',205,275,'L',210,270];

                        ren.path(['M', 235, 185, 'L', 235, 155, 'C', 235, 130, 235, 130, 215, 130,
                              'L', 95, 130, 'L', 100, 125, 'M', 95, 130, 'L', 100, 135])
                         .attr({
                             'stroke-width': 2,
                             stroke: colors[3]
                         })
                         .add();

                    var jc = ren.label('<b>Adam Fowler</b><br/><b><i>(Joint Customer)</i></b><br/><br/><b>Prop 1:</b> Value 1<br/><b>Prop 2:</b> Value 2', 20, 40)
                        .attr({
                            fill: "white",
                            stroke: colors[0],
                            'stroke-width': 4,
                            padding: 6,
                            r: 8
                        })
                        .css({
                            color: colors[0]
                        })
                        .add()
                        .shadow(true);

                    // Headers
                    var nkb = ren.label('<b>Fowler</b><br/><b><i>(NKB Customer)</i></b><br/><br/><b>Prop 1:</b> Value 1<br/><b>Prop 2:</b> Value 2', 220, 40)
                        .attr({
                            fill: "white",
                            stroke: colors[0],
                            'stroke-width': 4,
                            padding: 6,
                            r: 8
                        })
                        .css({
                            color: colors[0]
                        })
                        .add()
                        .shadow(true);


                    var nic = ren.label('<b>A Fowler</b><br/><b><i>(NIC Client)</i></b><br/><br/><b>Prop 1:</b> Value 1', 220, 240)
                        .attr({
                            fill: "white",
                            stroke: colors[0],
                            'stroke-width': 4,
                            padding: 6,
                            r: 8
                        })
                        .css({
                            color: colors[0]
                        })
                        .add()
                        .shadow(true);

                  var jcbb = jc.getBBox();
                  mljs.defaultconnection.logger.debug("JCBB: " + JSON.stringify(jcbb));
                  var nicbb = nic.getBBox();
                  mljs.defaultconnection.logger.debug("NICBB: " + JSON.stringify(nicbb));

                  ren.path(swAnti
                    //['M',(jcbb.x + (0.5 * jcbb.width)),(jcbb.y + jcbb.height + 10),'L',80,245,'C',80,270,80,270,105,270,'L',210,270,'L',205,265,'M',205,275,'L',210,270]
                    ).attr({
                             'stroke-width': 2,
                             stroke: colors[4]
                         })
                         .add();

                  ren.path(seArrow).attr({
                             'stroke-width': 2,
                             stroke: colors[4]
                         })
                         .add();

  */


};

com.marklogic.widgets.graphexplorer.prototype._entityFromUI = function(elid) {
  for (var i = 0, max = this.entities.length, ent;i < max;i++) {
    ent = this.entities[i];
    if (ent.htmlid == elid) {
      return ent;
    }
  }
  return null;
};

com.marklogic.widgets.graphexplorer.prototype._entityFromIRI = function(iri) {
  for (var i = 0, max = this.entities.length, ent;i < max;i++) {
    ent = this.entities[i];
    if (ent.subjectiri == iri) {
      return ent;
    }
  }
  return null;
};

com.marklogic.widgets.graphexplorer.prototype._iriFromUri = function(uri) {
  for (var i = 0, max = this.entities.length, ent;i < max;i++) {
    ent = this.entities[i];
    if (ent.docuri == uri) {
      return ent.subjectiri;
    }
  }
  return null;
};

com.marklogic.widgets.graphexplorer.prototype._propertyFromUI = function(elid) {
  for (var i = 0, max = this.properties.length, prop;i < max;i++) {
    prop = this.properties[i];
    if (prop.htmlid == elid) {
      return prop;
    }
  }
  return null;
};

com.marklogic.widgets.graphexplorer.prototype._loadSubjectInformation = function(iri) {
  this.semanticContext.getFacts(iri,false);
};

/**
 * Indicates that a subject's facets have been received by the semantic context and the subject should be redrawn
 * UNUSED
 *
 * @param {string} subjectIri - The IRI of the subject to display
 */
com.marklogic.widgets.graphexplorer.prototype.updateSelectedSubject = function(subjectIri) {
  // find primary node in diagram
  // create if does not exist
  // replace with content of new node
};


com.marklogic.widgets.graphexplorer.prototype._incrementColumnCount = function(column) {
  var count = this._getColumnCount(column) + 1;
  this.columnCount[column] = count;
  return count;
};


com.marklogic.widgets.graphexplorer.prototype._getColumnCount = function(column) {
  var count = this.columnCount[column];
  if (undefined == count || "number" !== typeof (count)) {
    count = 0;
    this.columnCount[column] = count;
  }
  return count;
};

/**
 * Draw the specified subject in this widget. Determines position from parent property.
 *
 * @param {string} subjectIri - The IRI of the primary subject to draw
 * @param {string} parentIri - The IRI of the parent to draw this subject under
 * @param {integer} column - The column to draw this subject in
 * @param {integer} row - The row to draw this subject in
 */
com.marklogic.widgets.graphexplorer.prototype.drawSubject = function(subjectIri,parentIri,column,row) {
  if (undefined == column) {
    column = 1;
  }
  if (undefined == row) {
    row = 1;
  }
    if (1 == column && 1 == row) {
      this._incrementColumnCount(1);
    }
    //var x = 20 + (200 * (column - 1));
    //var y = 40 + (200 * (row - 1));

    var x = 20 + (100 * (column - 1)) + this.widthBefore(column);
    var y = 40 + (20 * (row - 1)) + this.heightBefore(row);
    mljs.defaultconnection.logger.debug("drawSubject: x=" + x + ", y=" + y);

    // draw subject box itself
    var ren = this.renderer;
    var colors = Highcharts.getOptions().colors;

    // show 'properties/rels loading'
    var box = ren.label('<b>Loading...</b>', x, y).attr({
      fill: "white",
      stroke: colors[0],
      'stroke-width': 4,
      padding: 6,
      r: 8
    }).css({
      color: colors[0]
    }).add().shadow(true);

    // save our config in a JS object
    var ent = {parentiri: parentIri, subjectiri: subjectIri, docuri: null , subjectsfacts:new Array(), column:column , row: row, jswrapper: box, jslinkboxes: []};
    this.entities.push(ent);
    // load properties of subject
    this.semanticContext.getFacts(subjectIri,false);

    return ent;

    /*
  if (null == this.propertyCache[subjectIri]) {
  } else {
    this._drawSubjectDetail(subjectIri,this.propertyCache[subjectIri]);
  }*/
};

com.marklogic.widgets.graphexplorer.prototype._drawSubjectDetail = function(subjectIri,facts) {
  // get entity from saved details
  var ent = this._entityFromIRI(subjectIri);
  if (null == ent) {
    mljs.defaultconnection.logger.debug("graphexplorer._drawSubjectDetail: No node for element: " + subjectIri + ", so not drawing anything to represent it.");
    return;
  }
  if (null != ent.jswrapper) {
    ent.jswrapper.destroy();
    var boxes = ent.jslinkboxes;
    for (var i = 0,b,max = boxes.length;i < max;i++) {
      boxes[i].destroy();
    }
    ent.jslinkboxes = [];
  }

  var ren = this.renderer;
  var colors = Highcharts.getOptions().colors;

  // get JS box
  // remove from graph

  // generate new box
  var column = ent.column;
  var row = ent.row;

    //var x = 20 + (200 * (column - 1));
    //var y = 40 + (200 * (row - 1));

    var x = 20 + (100 * (column - 1)) + this.widthBefore(column);
    var y = 40 + (20 * (row - 1)) + this.heightBefore(row);
    mljs.defaultconnection.logger.debug("_drawSubjectDetail: x=" + x + ", y=" + y);

  // draw subject box itself

  // use semantic config to find common name and type (use summarise into code)
  var scfg = this.semanticContext.getTripleConfiguration();


  var propValues = new Array();

  // show properties within box
  var props = "";
  var title = subjectIri;
  var docuri = null; // only applicable to MarkLogic document entities - see later code in this function
  var type = "Unknown";
    for (var b = 0,bindings = facts, max = bindings.length, predicate, obj, binding;b < max;b++) {
      binding = bindings[b];
      predicate = binding.predicate;
      mljs.defaultconnection.logger.debug("OUR PREDICATE: " + JSON.stringify(predicate));
      var pinfo = scfg.getPredicateFromIRI(predicate.value);
      mljs.defaultconnection.logger.debug("OUR PINFO: " + JSON.stringify(pinfo));
      var obj = binding.object;
      mljs.defaultconnection.logger.debug("OUR OBJECT: " + JSON.stringify(obj));
      mljs.defaultconnection.logger.debug("OUR BINDING: " + JSON.stringify(binding));

      if (predicate.value != "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
        var t = predicate.value;
        if (undefined != pinfo) {
          t = pinfo.title;
        }
        var ttitle = t;
        if (ttitle == predicate.value) {
          ttitle = this._shortenSubjectIri(predicate.value);
        }

        //props += "<b>" + t + ":</b> " + obj.value + "<br/>";
        // WARNING the below REMOVES multiple relations with the same PREDICATE!!!
        var pv = propValues[predicate.value];
        if (undefined == pv) {
          pv = propValues[predicate.value] = [];
        }
        propValues[predicate.value].push({value: obj.value, title: ttitle, type: obj.type});

        if (predicate.value == "http://marklogic.com/semantics/ontology/Document#uri") {
          docuri = obj.value;
        }

        //s += "</p>";
      } else {
        // got rdftype
        type = obj.value;
      }
    }

  var predEntity = scfg.getEntityFromIRI(type);
  var baseType = type;
  mljs.defaultconnection.logger.debug("***PREDENTITY: " + JSON.stringify(predEntity));
  if (undefined != predEntity && undefined != predEntity.name) {
    type = predEntity.title;
    var nameprop = scfg.getNameProperty(predEntity.name);
    var namepredicate = null;
    if (undefined != nameprop) {
      namepredicate = nameprop.iri;
    }
    //mljs.defaultconnection.logger.debug("Got name predicate: " + namepredicate);
    if (undefined != namepredicate) {

      var predValue = propValues[namepredicate];
      if (undefined != predValue) {
        title = predValue[0].value;
      } else {
        // leave title as iri
      }
    }
  } else {
    type = this._shortenSubjectIri(type);
  }

  if (title == subjectIri) {
    title = this._shortenSubjectIri(subjectIri);
  }

  mljs.defaultconnection.logger.debug("Type Processing: " + type);
  mljs.defaultconnection.logger.debug("Base Type Processing: " + baseType);

  var loadingContent = false;

  if ("http://marklogic.com/semantics/ontology/Document" == baseType) {
    var uri = docuri; // SEE EARLIER CODE - OLD: //subjectIri.substring(48);
    ent.docuri = uri;

    // check the subject cache for this IRI (done earlier in function)
    // <http://marklogic.com/semantics/ontology/Document#uri>

    var facets = this.facetCache[uri];
    if (null == facets) {
      mljs.defaultconnection.logger.debug("WE: NO FACETS CACHE. PROCESSING ML DOCUMENT SUBJECT: " + subjectIri);

      loadingContent = true;

      this.documentContext.getFacets(uri,this.searchOptionsName); // TODO in future may change this to the URI property rather than relying on the URI as the subjectIri (incase many entities link to the same doc)
    } else {

        mljs.defaultconnection.logger.debug("WE: Got facet values in cache");
      for (facet in facets) {
        mljs.defaultconnection.logger.debug("WE: facet name: " + facet);
        var values = facets[facet].facetValues;
        var facetValues = "";
        if (undefined != values) {
          var max = values.length;
          for (var v = 0;v < max;v++) {
            var fv = values[v];
            if (v > 0) {
              facetValues += ", ";
            }
              mljs.defaultconnection.logger.debug("WE: facet value: " + fv.name);
            facetValues += fv.name;
          }
        }
        if ("" != facetValues) {

            mljs.defaultconnection.logger.debug("WE: setting prop values");
          propValues[facet] = [{value: facetValues, title: facet, type: "facet"}];
        }
      }
    }
  }


  var summaries = new Array(); // holds {subject: iri, element: elid} objects

  var relnum = 0;

  var self = this;
  var addshow = function(relbox,rn,left,top,piri,riri) {
    var destroyBoxes = function() {
      for (var bn = 0,maxbn = self._messageBoxes.length,thebox;bn < maxbn;bn++) {
        thebox = self._messageBoxes[bn];
        thebox.destroy();
      }
      self._messageBoxes = new Array();
    };
    relbox.on("mouseover",function(){
      destroyBoxes();
      var msgbox = ren.label(rn,left+18,top-7).attr({
        fill: "white",
        stroke: colors[4],
        'stroke-width': 4,
        padding: 6,
        r: 8
      }).css({
        color: colors[0]
      }).add().shadow(true);
      self._messageBoxes.push(msgbox);
    }).on("mouseout",function() {
      destroyBoxes();
    }).on("click",function() {
      // TODO load related object
      mljs.defaultconnection.logger.debug("RELATION CLICKED: piri: " + piri + ", riri: " + riri);

      // Check if subject has already been drawn. If so, just draw arrow to the subject's box.
      var existingent = self._entityFromIRI(riri);
      var targetrow = 1;
      var targetcol = 1;
      if (undefined == existingent) {
        var newcol = ent.column + 1;
        var newrow = self._incrementColumnCount(newcol);
        self.drawSubject(riri,piri,newcol,newrow);
        targetrow = newrow;
        targetcol = newcol;
      } else {
        targetrow = existingent.row;
        targetcol = existingent.column;

        if (undefined != self._existingPaths[subjectIri] && undefined != self._existingPaths[subjectIri][piri] &&
            undefined != self._existingPaths[subjectIri][piri][riri]) {
          // don't redraw existing link
          // WRONG is showing ANY subject with this path, not OUR subject!
          return;
        }
      }

      // now draw a connector from mini box to top left of box
      var starttop = top + 5;
      var startleft = left + 5;
      //var endtop = 27 + 5 + (200 * (newrow - 1));
      var endtop = 27 + 5 + (20 * (targetrow - 1)) + self.heightBefore(targetrow);
      if (endtop < 52) {
        endtop = 52;
      }
      endtop += 25;
      //var endleft = 13 + (200 * (newcol - 1));
      var endleft = 13 + (100 * (targetcol - 1)) + self.widthBefore(targetcol);
      var dy = 1.0*(endtop - starttop);
      var dx = 1.0*(endleft - startleft);
      var theta = 1.0 * Math.atan(dy / dx); // Tan Theta = Opposite (height) / Adjacent (width)
      var length = 7.0;
      var fourtyfive = Math.PI * 0.25;
      var beta = theta + fourtyfive;
      var alpha = fourtyfive - theta;
      mljs.defaultconnection.logger.debug("startleft: " + startleft + ", starttop: " + starttop + ", endleft: " + endleft + ", endtop: " + endtop + ", dy: " + dy + ", dx: " + dx + ", theta: " + theta + ", alpha: " + alpha + ", beta: " + beta + ", length: " + length);
      var aLeftTop = (1.0*endtop) - (length * Math.cos(alpha));
      var aLeftLeft = (1.0*endleft) - (length * Math.sin(alpha));
      //var aRightTop = (1.0*endtop) + (length * Math.sin(90.0 - 45.0 - theta));
      //var aRightLeft = (1.0*endleft) - (length * Math.cos(90.0 - 45.0 - theta));
      //var aLeftTop = (1.0*endtop) - (length * Math.sin(beta));
      //var aLeftLeft = (1.0*endleft) - (length * Math.cos(beta));
      var aRightTop = (1.0*endtop) + (length * Math.cos(beta));
      var aRightLeft = (1.0*endleft) - (length * Math.sin(beta));
      var pth = ren.path(['M', startleft, starttop, 'L', endleft, endtop, 'L',aLeftLeft,aLeftTop,'M',aRightLeft,aRightTop,'L',endleft,endtop]).attr({
        'stroke-width': 2,stroke: colors[0] }).add();

      // add to existing to ensure duplicate paths are not drawn
      self._existingPaths[subjectIri] = self._existingPaths[subjectIri] || {};
      self._existingPaths[subjectIri][piri] = self._existingPaths[subjectIri][piri] || {};
      self._existingPaths[subjectIri][piri][riri] = pth;
    });

  };

  var infos = new Array();

  for (var propname in propValues) {
    //if (propValues.hasOwnProperty(propname)) { // ensure property, not function
    mljs.defaultconnection.logger.debug("PROPERTY VALUE: " + JSON.stringify(propValues[propname]));
    mljs.defaultconnection.logger.debug("PROPERTY VALUE TYPE: " + typeof(propValues[propname]));
    if (Array.isArray(propValues[propname])) {
      mljs.defaultconnection.logger.debug("PROPERTY TO LIST: " + propname);
      prop = propValues[propname];
      // TODO list multiples as indiviual rows
      for (var p = 0,maxp = prop.length,prp;p <maxp;p++) {
        prp = prop[p];
        var propShow = prp.value;
        if ("uri" == prp.type) {
          // FIRST CHECK TO SEE IF THE RELATED OBJECT'S PROPERTIES ARE CACHED
          // IF NOT, LOAD
          var relname = this._generateNameLink(prp.value);
          if (null == relname) {
            // load description later
            var propCount = this.propertyCount++;
            var elid = this.container + "-loadname-" + propCount;
            //propShow = "<span id='" + elid + "'>" + "<i>Loading...</i>" + "</span>"; // not showing loading as we dont get a callback if there is no further details
            propShow = "<span id='" + elid + "'>" + this._shortenSubjectIri(prp.value) + "</span>";
            summaries.push(prp.value);
          } else {
            propShow = relname;
            infos.push({relname: relname, propname:propname,propvalue:prp.value});
          }
        }
        props += "<b>" + prp.title + ":</b> " + propShow + "<br/>";

      } // end prop multiple for
    }
  }

  var drawrel = function(x,y,info) {
    // draw relationship box instead
    var left = x + 5 + 6; // X BOX POS - was 158? or 325 (wide) (6 is for the rect border not being taken into account with box.width)
    var top = y + 7 + (17 * relnum++);
    var relbox = ren.rect(left, top,10,10,2).attr({
      'stroke-width': 4, stroke: colors[0], fill: colors[0]
    }).add();
    ent.jslinkboxes.push(relbox);
    addshow(relbox,info.relname,left,top,info.propname,info.propvalue);

  };


  var s = "<b>" + title + "</b><br/><i>" + type + "</i><br/><br/>" + props;
  if (loadingContent) {
    s += "<br/><b><i>Loading...</i></b>";
  }

  // if an ML document, go load the facets (or show if already loaded)
  var box = ren.label(s, x, y).attr({
    fill: "white",
    stroke: colors[0],
    'stroke-width': 4,
    padding: 6,
    r: 8
  }).css({
    color: colors[0]
  }).add().shadow(true);

  ent.jswrapper = box;

  for (var i = 0, max = infos.length,info;i < max;i++) {
    info = infos[i];
    drawrel(x + box.width,y,info);
  }

  this.checkColumnWidth(column,box.width);
  this.checkRowHeight(row,box.height);

  // load descriptions, element handler
  // CHECK DRAW ON COMPLETE DOESN'T ALREADY HOLD US - PREVENT WEIRD CIRCULAR REFERENCES AND INFINITE LOOPS
  var exists = false;
  for (var i = 0;!exists && i < this.drawWhenComplete.length;i++) {
    exists = (this.drawWhenComplete[i].subject == subjectIri);
  }
  if (!exists) {
    this.drawWhenComplete.push({subject: subjectIri,dependencies: summaries});
    for (var i = 0, max = summaries.length,summary;i < max;i++) {
      summary = summaries[i];
      this.semanticContext.getFacts(summary);
    }
  }

};

com.marklogic.widgets.graphexplorer.prototype._shortenSubjectIri = function(iri) {
  var pos = iri.lastIndexOf("#");
  if (-1 == pos) {
    pos = iri.lastIndexOf("/");
    if (-1 == pos) {
      return iri;
    }
  }
  return iri.substring(pos + 1);
};

com.marklogic.widgets.graphexplorer.prototype._generateNameLink = function(subjectIri) {
  // NB return null if we don't have enough information yet
  // get subject rdf type
  // if blank, we've not loaded their info yet
  // if exists, use to find common name of entity in entityInfo
  // now load name property
  // if blank, we've not loaded their info yet
  var name = this._getSubjectName(subjectIri);
  if (null == name) {
    return null;
  } else {
    return name; // TODO may want to format this in to a link to load related elements
  }
};

com.marklogic.widgets.graphexplorer.prototype._getSubjectName = function(subjectIri) {
  var cache = this.propertyCache[subjectIri];
  mljs.defaultconnection.logger.debug("getSubjectName: properties for: " + subjectIri + " :- " + JSON.stringify(cache));
  if (null == cache) {
    return null;
  }

  var type = this._getSubjectPredicate(cache,"http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
  if (null == type) {
    mljs.defaultconnection.logger.debug("getSubjectName: type null, returning shortened subject iri");
    return this._shortenSubjectIri(subjectIri);
  }

  var scfg = this.semanticContext.getTripleConfiguration();

  var predEntity = scfg.getEntityFromIRI(type);
  if (undefined == predEntity || undefined == predEntity.name) {
    mljs.defaultconnection.logger.debug("getSubjectName: predEntity null, returning shortened subject iri");
    return this._shortenSubjectIri(subjectIri);
  }
  var nameprop = scfg.getNameProperty(predEntity.name);
  var namepredicate = null;
  if (undefined != nameprop) {
    namepredicate = nameprop.iri;
  }
  if (undefined == namepredicate) {
    mljs.defaultconnection.logger.debug("getSubjectName: namepredicate null, returning shortened subject iri");
    return this._shortenSubjectIri(subjectIri);
  }

  var pred = this._getSubjectPredicate(cache,namepredicate);
  if (null == pred) {
    mljs.defaultconnection.logger.debug("getSubjectName: Cached predicate null, returning shortened subject iri");
    return this._shortenSubjectIri(subjectIri);
  }
  return pred;
};

com.marklogic.widgets.graphexplorer.prototype._getSubjectPredicate = function(cache,predIri) {
  mljs.defaultconnection.logger.debug("_getSubjectPredicate: loading predicate from cache. Predicate: " + predIri + " cache:- " + JSON.stringify(cache));

  for (var b = 0,bindings = cache, max = bindings.length, predicate, obj, binding;b < max;b++) {
    binding = bindings[b];
    predicate = binding.predicate;
    if (predIri == predicate.value) {
      return binding.object.value;
    }
  }
  return null;
};

/**
 * Called by a semantic context to indicate facts have been received from a SPARQL endpoint about a specified subject
 *
 * @param {object} result - The MLJS result wrapper. result.doc contains the SPARQL result in a JSON expression
 */
com.marklogic.widgets.graphexplorer.prototype.updateSubjectFacts = function(result) {
  if (true === result || false === result) {
    return; // TODO clear display
  }
  mljs.defaultconnection.logger.debug("graphexplorer.updateSubjectFacts: " + JSON.stringify(result));
  var subjects = com.marklogic.widgets.semantichelper.calculateUniqueSubjects(result);

  // get parentiri, subjectiri, rdftype and group facts to these three
  // find relevant parent-subject iri nodes on the display
  // update this particular data node
  var facts = this.semanticContext.getCachedFacts(subjects[0]).facts
  this.propertyCache[subjects[0]] = facts;
  this._drawSubjectDetail(subjects[0],facts);

  // check against draw when complete too
  // TODO make this more efficient by removing subjects that have been complete from dependencies
  var newDrawWhenComplete = new Array();
  mljs.defaultconnection.logger.debug("graphexplorer.updateSubjectFacts: Entering drawWhenComplete loop...");
  for (var i = 0, max = this.drawWhenComplete.length,doc;i < max;i++) {
    doc = this.drawWhenComplete[i];
    mljs.defaultconnection.logger.debug("graphexplorer.updateSubjectFacts: drawWhenComplete subject: " + doc.subject);

    // check all child IRIs
    var gotall = true;
    for (var s = 0, smax = doc.dependencies.length,dep;s < smax && gotall;s++) {
      dep = doc.dependencies[s];
      mljs.defaultconnection.logger.debug("graphexplorer.updateSubjectFacts: drawWhenComplete subject: " + doc.subject + " dependency: " + dep);
      if (null == this.propertyCache[dep]) {
        gotall = false;
      }
    }

    if (gotall) {
      mljs.defaultconnection.logger.debug("graphexplorer.updateSubjectFacts: Got All for: " + doc.subject + ", redrawing");
      // redraw subject
      this._drawSubjectDetail(doc.subject,this.propertyCache[doc.subject]);
    } else {
      mljs.defaultconnection.logger.debug("graphexplorer.updateSubjectFacts: Not got all for: " + doc.subject + " after loading facts for: " + subjects[0]);
      newDrawWhenComplete.push(doc);
    }
  }
  mljs.defaultconnection.logger.debug("graphexplorer.updateSubjectFacts: Left drawWhenComplete loop.");
  this.drawWhenComplete = newDrawWhenComplete;
};

/**
 * Called by a document context to indicate facets have been received describing a document
 *
 * @param {object} result - The MLJS result wrapper. result.doc contains the search API response JSON expression containing (only?) facet information
 */
com.marklogic.widgets.graphexplorer.prototype.updateDocumentFacets = function(result) {
  // TODO for each result, lookup MLDocument node with the docuri predicate matching each docuri of the result
  // TODO SHOULD be a single document result as we're only ever looking up 1 doc at a time by URI
  // TODO show facet information as properties of the single doc (as each result set only contains 1 document)
  var uri = result.docuri;
  console.log("graphexplorer.updateDocumentFacets: URI: " + uri);
  this.facetCache[uri] = result.facets;

  //var iri = "http://marklogic.com/semantics/ontology/Document" + uri; // TODO replace with URI -> subject cache
  var iri = this._iriFromUri(uri);
  var flen = 0;
  if (undefined != result.facets) {
    flen = result.facets.length;
  }
  console.log("graphexplorer.updateDocumentFacets: facet count: " + flen);
  var plen = 0;
  if (undefined != this.propertyCache[iri]) {
    plen = this.propertyCache[iri].length;
  }
  console.log("graphexplorer.updateDocumentFacets: prop count: " + plen);
  this._drawSubjectDetail(iri,this.propertyCache[iri]); // TODO replace this with lookup of subjects related to the same document - possible with multiple document entities
};

com.marklogic.widgets.graphexplorer.prototype._dropped = function(propelid) {
  var prop = this._propertyFromUI(propelid);
  var entity = this._entityFromUI(prop.parentid);

  // get predicate info from semantic configuration object
  var scfg = this.semanticContext.getTripleConfiguration();
  var predicate = scfg.getPredicateInfo(prop.predicate); // TODO verify this call is correct name

  // add predicate to our built SPARQL query
  // TODO if a Document Facet, save parent's docuri predicate as SPARQL query value, link name to new supplementary content query

  // Fire semantic query builder update event
};

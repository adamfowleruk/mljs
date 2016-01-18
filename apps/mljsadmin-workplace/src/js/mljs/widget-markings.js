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
com.marklogic.widgets.workplaceadminext.widgets["widget-markings.js"] = [
  {title: "XHTML Markings", classname: "com.marklogic.widgets.markings", description: "XHTML section security markings and triple extraction."}
];




/**
 * Creates a Markings widget. This enables the splitting in to sections of any XHTML document. These individual sections are delimited by headings (h tags, or paragraphs with <6 words)
 * followed by one or more text paragraphs. Security read rights can be added to each section. The resultant document surrounds these in div tags with a special secure-content class attribute
 * and a read:ROLENAME class that determines the role name. This is intended to be used with search options and get transforms that always redact content being requested or returned in search results.
 *
 * This widget itself respects redacted sections, but currntly does not provide any secure merge functionality.
 *
 * This widget also has an option to suggest and save triples (facts about entities) based on configure XML elements embedded within the XHTML. This is intended to be used to extract and store
 * a named graph for each secure section of each document, with the same security as that document section. This can be queried via SPARQL.
 *
 * @constructor
 */
com.marklogic.widgets.markings = function(container) {
  this.container = container;
  this.errorPublisher = new com.marklogic.events.Publisher();

  this.tripleEditor = false;
  this._documentContext = null;
  this._permissions = new Array();
  this._updatepermissions = new Array();

  this._uriHandlers = new Array(); // metadata field name -> replaceable string of html controller to forward request on to. E.g. for downloading doc by URI

  this.sections = new Array(); // push()->[]{index: int, content: xmlString, read: stringPerm, triples: tripleArray {subject:,predicate:,object}}

  this.head = ""; // head content from document, used when building for saving

  // TODO have the following as a helper method rather than always present, use accessors to define these too

  this.validTriples = new Array();
  this.validTriples.push({subjectType: "person", objectType: "person", predicateArray: ["knows","friendOf","enemyOf","childOf","parentOf","fundedBy"]});
  this.validTriples.push({subjectType: "person", objectType: "organisation", predicateArray: ["member","studies_at"]});
  this.validTriples.push({subjectType: "organisation", objectType: "organisation", predicateArray: ["member","parentOf","affiliated_with","fundedBy"]});
  this.validTriples.push({subjectType: "person", objectType: "placename", predicateArray: ["based_near"]}); //NB based_near may not be a valid relationship class - may be lon/lat instead
  this.validTriples.push({subjectType: "organisation", objectType: "placename", predicateArray: ["based_near","has_meetings_near"]});
  this.validTriples.push({subjectType: "placename", objectType: "placename", predicateArray: ["located_within","contains_location"]});

  this._predicates = new Array();
  this._predicates["knows"] = "http://xmlns.com/foaf/0.1/knows";
  this._predicates["friendOf"] = "http://xmlns.com/foaf/0.1/friendOf";
  this._predicates["enemyOf"] = "http://xmlns.com/foaf/0.1/enemyOf";
  this._predicates["childOf"] = "http://xmlns.com/foaf/0.1/childOf";
  this._predicates["parentOf"] = "http://xmlns.com/foaf/0.1/parentOf";
  this._predicates["fundedBy"] = "http://xmlns.com/foaf/0.1/fundedBy";
  this._predicates["member"] = "http://xmlns.com/foaf/0.1/member";
  this._predicates["based_near"] = "http://xmlns.com/foaf/0.1/based_near";

  // own extensions - need ontology somewhere for this!
  this._predicates["studies_at"] = "http://www.marklogic.com/ontology/0.1/studies_at";
  this._predicates["affiliated_with"] = "http://www.marklogic.com/ontology/0.1/affiliated_with";
  this._predicates["has_meetings_near"] = "http://www.marklogic.com/ontology/0.1/has_meetings_near";
  this._predicates["located_within"] = "http://www.marklogic.com/ontology/0.1/located_within";
  this._predicates["contains_location"] = "http://www.marklogic.com/ontology/0.1/contains_location";

  this._tripleCollections = new Array();

  this._tripleIDs = new Array(); // simple list of tripleIDs
  this._tripleSection = new Array(); // tripleID -> sectionID
  this.nextTripleId = 1;

  this._iriPatterns = new Array();
  this._iriPatterns["person"] = "http://marklogic.com/semantic/targets/person/#VALUE#";
  this._iriPatterns["organisation"] = "http://marklogic.com/semantic/targets/organisation/#VALUE#";
  this._iriPatterns["placename"] = "http://marklogic.com/semantic/targets/placename/#VALUE#";

  this._rdfTypes = new Array();
  this._rdfTypes["person"] = "http://xmlns.com/foaf/0.1/Person";
  this._rdfTypes["organisation"] = "http://xmlns.com/foaf/0.1/Organization";
  this._rdfTypes["placename"] = "http://schema.org/Place"; // geonames features are an extension of Place

  this._commonNamePredicates = new Array();
  this._commonNamePredicates["person"] = "http://xmlns.com/foaf/0.1/name";
  this._commonNamePredicates["organisation"] = "http://xmlns.com/foaf/0.1/name";
  this._commonNamePredicates["placename"] = "http://www.geonames.org/ontology#name";
  this._init();
};


com.marklogic.widgets.markings.getConfigurationDefinition = function() {
  return {
    readClasses: {type: "multiple", minimum: 0, default: [], title: "Read Roles", description: "Roles permitted to read a document section.",
          childDefinitions: {
            //title,searchcontext,latsrc,lonsrc,titlesrc,summarysrc,icon_source_opt,heatmap_constraint
            role: {type: "string", default: "", title: "Role", description: "The MarkLogic Server role name."}
          }
    },
    triples: {type:"boolean", default: true, title: "Extract Triples", description: "Whether to process the XHTML content to extract triples"},
    tripleCollections: {type: "multiple", minimum: 1, default: [{prefix:"/doctriples#URI#/#SECTIONID#",collection: "doctriples"}], title: "Triple Collections", description: "The collection (named graph) to add extracted triples to.",
          childDefinitions: {
            //title,searchcontext,latsrc,lonsrc,titlesrc,summarysrc,icon_source_opt,heatmap_constraint
            prefix: {type: "string", default: "/doctriples#URI#/#SECTIONID#", title: "Prefix", description: "Triple Document Prefix."},
            collection: {type: "string", default: "doctriples", title: "Collection", description: "Collection name."}
          }
    }
  };
};

com.marklogic.widgets.markings.prototype.setConfiguration = function(config) {
  var readClasses = new Array();
  for (var r = 0,maxr = config.readClasses.length,cl;r < maxr;r++) {
    cl = config.readClasses[r];
    readClasses.push(cl.role);
  }
  this.permissions(readClasses);
  this.updatePermissions(readClasses);
  //this.uriHandler("originaldoc","/documents/fetch?uri=#URI#");
  this.uriHandler("originaldoc","/v1/documents?uri=#URI#");
  this.triples(true);
  var tc = config.tripleCollections;
  var colName = "doctriples";
  var colPrefix = "/doctriples#URI#/#SECTIONID#";
  if (null != tc && null != tc[0]) {
    colName = tc[0].collection;
    colPrefix = tc[0].prefix;
  }
  this.tripleCollections([colPrefix,colName]);
};

com.marklogic.widgets.markings.prototype.setDocumentContext = function(dc) {
  this._documentContext = dc;
};

com.marklogic.widgets.markings.prototype.updateDocumentContent = function(result) {
  // TODO support transforms (call showDocument instead of drawdocument)
  var doc = result.doc;
  var docuri = result.docuri;

  this._drawDocument(docuri,doc);
};

/**
 * Adds an error listener to this widget
 *
 * @param {function(error)} fl - The error listener to add
 */
com.marklogic.widgets.markings.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 *
 * @param {function(error)} fl - The error listener to remove
 */
com.marklogic.widgets.markings.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};

/**
 * Specifies the collections (named graphs) to add any resultant triples in to. Supports text replacement of #URI# for the source document and #SECTIONID# for the source section id (of the secure section)
 *
 * @param {string[]} collections - String array of the collection(s), aka named graphs, to add the facts to. (NB Must result in a unique URI per document secure section)
 */
com.marklogic.widgets.markings.prototype.tripleCollections = function(collections) {
  this._tripleCollections = collections;
};

com.marklogic.widgets.markings.prototype._init = function() {
  var id = this.container + "-markings";
  var html = "<div id='" + id + "'>" +
      "<div id='" + id + "-docinfo' class='mljswidget panel panel-info markings-docinfo'>&nbsp;</div>" +
      "<div id='" + id + "-docsecurity' class='mljswidget panel panel-info markings-docsecurity'>&nbsp;</div>" +
      "<div id='" + id + "-doccontent' class='mljswidget panel panel-info markings-doccontent'>&nbsp;</div>" +
    "</div>";
  document.getElementById(this.container).innerHTML = html;
};


/**
 * Specifies whether to support the suggesting and persisting of triples (default: false).
 *
 * @param {boolean} bool - Allow triple extraction and editing?
 */
com.marklogic.widgets.markings.prototype.triples = function(bool) {
  this.tripleEditor = bool;
};

/**
 * Specifies a URL pattern for a particular XHTML metadata field, if it exists. E.g. a meta tag with name originaldoc could map to the /documents/view?uri=#VALUE# url replacement pattern
 * Could also be used to look up related information. E.g. to find all documents with the same Subject metadata field, or execute a search with that data
 *
 * @param {string} metafield - The name attribute value for the meta tag to generate a hyperlink for
 * @param {string} urlreplace - The URL to send the user's browser to. Supports substitution via the #VALUE# string.
 */
com.marklogic.widgets.markings.prototype.uriHandler = function(metafield,urlreplace) {
  this._uriHandlers[metafield] = urlreplace;
};

/**
 * Specifies the read permission list, in ascending access level, to read the document or secure document section.
 *
 * @param {string[]} list - String list of role names for a read permission. Normally part of a security compartment.
 */
com.marklogic.widgets.markings.prototype.permissions = function(list) {
  // we only ever do read permissions at section level, read and update at doc level
  this._permissions = list;
};

/**
 * Specifies the update permission list for the document only, in ascending access level order.
 *
 * @param {string[]} list - String list of role names for a document update permission. Normally part of a security compartment.
 */
com.marklogic.widgets.markings.prototype.updatePermissions = function(list) {
  // update permission (E.g. for document level)
  this._updatepermissions = list;
};

com.marklogic.widgets.markings.prototype._drawDocument = function(uri,xml) {
  this.docuri = uri;

  // reset holding properties
  this.sections = new Array();
  this.head = "";

  var hid = this.container + "-markings-docinfo";
  var cid = this.container + "-markings-doccontent";
  var hids = this.container + "-markings-docsecurity";
  var self = this;

    var head = xml.getElementsByTagName("head")[0];
    self.head = "<head xmlns='http://www.w3.org/1999/xhtml'>"; //(new XMLSerializer()).serializeToString(head);
    for (var c = 0;c < head.childNodes.length;c++) {
      self.head += (new XMLSerializer()).serializeToString(head.childNodes.item(c));
    }
    self.head += "</head>";

    var count = 0;

    var s = "";

    var titleEl = head.getElementsByTagName("title");
    var title = uri;
    if (titleEl.length > 0 && null != titleEl[0] && null != titleEl[0].nodeValue) {
      title = titleEl[0].nodeValue;
    }
    var subjectEl = head.getElementsByTagName("Subject");
    if (subjectEl.length > 0 && null != subjectEl[0] && null != subjectEl[0].nodeValue) {
      title = subjectEl[0].nodeValue;
    }
    //s += "<h1 class='markings-title'>" + title + "</h1>";

  // Show meta information
    s += "<div class='title panel-heading'>" + uri + " <span class='small'>Document Extracted Metadata</span></div> <table class='table table-striped markings-meta-table'><tr>";
    var metas = head.getElementsByTagName("meta");
    var columns = 2;
    var width = 100 / (2 * columns);
    var firstRow = true;
    var mname, mvalue, mreplace;
    for (var m = 0;m < metas.length;m++) {
      var meta = metas[m];
        if (count >= columns) {
          s += "</tr><tr>";
          count = count % columns;
          firstRow = false;
        }
        count++;
        s += "<td";
        if (firstRow) {
          s += " style='width: " + (0.8 * width) + "%;'";
        }
        mname = meta.getAttribute("name");
        s += "><b>" + mname + ":</b> </td><td"
        if (firstRow) {
          s += " style='width: " + (1.2*width) + "%;'";
        }
        mvalue = meta.getAttribute("content");
        mreplace = self._uriHandlers[mname];
        if (undefined != mreplace) {
          mvalue = "<a href='" + mreplace.replace("#URI#",encodeURI(mvalue)) + "'>" + mvalue + "</a>";
        }
        s += ">" + mvalue + "</td>";
    }
    for (;count < columns;count++) {
      s += "<td";
      if (firstRow) {
        s += " style='width: " + (0.8*width) + "%;'";
      }
      s += ">&nbsp;</td>";
      s += "<td";
      if (firstRow) {
        s += " style='width: " + (1.2*width) + "%;'";
      }
      s+= ">&nbsp;</td>";
    }
    s += "</tr></table>";

    s += "</div>";

    //"<div class='panel panel-info'>";

    // Show top level classification
    var ss = "<div class='title panel-heading'>Document Security Information</div> <div class='markings-security-rolecontainer'>";

    var readperm = "confidential-read"; // TODO read from doc metadata
    var updateperm = "confidential-write"; // TODO remove markings permissions we do not have as a user

    // render read permission selection
    var secinfo = "<label for='" + self.container + "-markings-security-read'>Role for Read access: </label>";
        secinfo += "<select id='" + self.container + "-markings-security-read'>";
        for (var p = 0;p < self._permissions.length;p++) {
          secinfo += "<option value='" + self._permissions[p];
          console.log("this perm: '" + self._permissions[p] + "'");
          if (readperm == self._permissions[p]) {
            secinfo += "' selected='selected";
          }
          secinfo += "'>" + self._permissions[p] + "</option>";
        }
        secinfo += "</select>";
    ss += secinfo;

    // render update permission selection
    secinfo = "<label for='" + self.container + "-markings-security-update'>Role for Update access: </label>";
        secinfo += "<select id='" + self.container + "-markings-security-read'>";
        for (var p = 0;p < self._updatepermissions.length;p++) {
          secinfo += "<option value='" + self._updatepermissions[p];
          console.log("this perm: '" + self._updatepermissions[p] + "'");
          if (updateperm == self._updatepermissions[p]) {
            secinfo += "' selected='selected";
          }
          secinfo += "'>" + self._updatepermissions[p] + "</option>";
        }
        secinfo += "</select>";

    ss += secinfo + "</div>";
    document.getElementById(hid).innerHTML = s;
    document.getElementById(hids).innerHTML = ss;



    var s = "";

    // get contents of Body tag
    var body = xml.getElementsByTagName("body")[0];

    // TODO Check to see if contents are all <div class="secure-section ...
    //var topContent = body.childNodes;
    var allSecure = true;
    // NB its possible to have NO content
    if (undefined != body) {
      for (var c = 0;allSecure && c < body.childNodes.length;c++) {
        // check is div
        // TODO and has classes containing secure-content or secure-redaction
        console.log("nodeName: " + body.childNodes.item(c).nodeName);
        allSecure = allSecure && (body.childNodes.item(c).nodeName == "div");
      }
    }
    console.log("All secure content?: " + allSecure);
    // if not, use divs only (as is the default, above)
    // if so, use these sections as is
    if (!allSecure) {
      console.log("Creating new body element");
      // construct a new body element
      var ds = "<body>";
      var buffer = "";

      var gotH = false;
      for (var c = 0;c < body.childNodes.length;c++) {
        var n = body.childNodes.item(c);
        console.log("  Got child node: " + n.nodeName + " type: " + n.nodeType);
        var isPHeading =  ("p" == n.nodeName && n.childNodes.length == 1 && n.childNodes.item(0).nodeName == "#text" && n.childNodes.item(0).nodeValue.split(" ").length < 6
          && n.childNodes.item(0).nodeValue.trim().length > 0);
        if (1 == n.nodeType) { // is an element
          if ("h1" == n.nodeName || "h2" == n.nodeName || "h3" == n.nodeName || "h4" == n.nodeName || "h5" == n.nodeName || "h6" == n.nodeName || isPHeading) {
            if (!gotH) { // flush buffer if we've not previously had a header
              // flush buffer if not empty
              if (buffer.length > 0) {
          ds += "<div ";
          // add id generated field (for later merge support)
          var secid = "secure-content-" + c;
          ds += "id='" + secid + "' ";
          ds += "class='secure-content role:" + self._permissions[0] + "'>"; // TODO default this to the document's read permission that matches the lowest perm in the list
                ds += buffer;
          ds += "</div>";
              }

              buffer = "";
            }
            gotH = true;
          } else {
            gotH = false;
          }
          // append to buffer
          if (isPHeading) {
            // conver to h2
            buffer += "<h2>" + n.childNodes.item(0).nodeValue + "</h2>";
          } else {
            if ("p" == n.nodeName &&  // got a paragraph
              (
                (null != n.nodeValue && n.nodeValue.trim().length > 0) || // has a value, is not empty (not sure if this is even possible?), or;
                (n.childNodes.length > 0 && n.childNodes.item(0).nodeName == "#text" && n.childNodes.item(0).nodeValue.trim().length > 0) || // just contains 1 text node, which is not empty, or;
                (n.childNodes.length > 1) // contains complex content - e.g. other nodes - so we assume is not 'empty'
              )
            ) {
              var value = (new XMLSerializer()).serializeToString(n);
              buffer += value;
            }
          }
          //}
        } else if (3 == n.nodeType) { // text
          // ignore but log
          console.log("Removing nodeless text from content: " + n.nodeValue);
        }
      }
      // check if buffer is not empty (probably will have content)
      if (buffer.length > 0) {
          ds += "<div ";
          // add id generated field (for later merge support)
          ds += "id='secure-content-" + c + "' ";
          ds += "class='secure-content role:" + self._permissions[0] + "'>"; // TODO default this to the document's read permission that matches the lowest perm in the list
                ds += buffer;
          ds += "</div>";
      }
      ds += "</body>";
      console.log("New body: " + ds);
      body = textToXML(ds);
    }


    var divs = null;
    var content = "<div class='title panel-heading'>Document Secure Content</div>";

    self.body = body;

    if (undefined == body) {
      content += "<p><b>Document has no content</b></p>";
    } else {
      content += "<table class='markings-content-table'>";
     divs = body.getElementsByTagName("div");

    // if not, wrap sections with these
    // put first level headings in their own sections
    // group others with following sections
    // group multiple p/div tags together between headings


    // go through these sections and draw UI as appropriate
    for (var d = 0;d < divs.length;d++) {
      var div = divs[d];
      var classString = div.getAttribute("class");
      var classes = classString.split(" ");
      var readPerms = new Array();
      var redacted = false;
      for (var c = 0;c < classes.length;c++) {
        var cls = classes[c];
        var pos = cls.indexOf("role:");
        if (0 == pos) {
          var perm = cls.substring(5);
          readPerms.push(perm);
          console.log("read perm: '" + perm + "'");
        }
        if ("secure-redaction" == cls) {
          redacted = true;
        }
      }

      content += "<tr class='markings-content-row'>";


        content += "<td class='markings-content-section-";
        if (self.tripleEditor) {
          content += "part";
        } else {
          content += "full";
        }
        content += "'><div class='markings-content-section-content '>";

      // show blank redacted section as-is
      if (redacted) {
        // show redacted place holder -> Done by redaction code - we just don't show any controls, effectively
        // if section is <div class="redacted" /> then show this as information, only ever execute merge on server side
      } else {
        // create editing wrapper element
        content += "<div class='markings-content-section-controls'>";

        content += "<label for='" + self.container + "-markings-section-content-" + d + "'>Role for Read access: </label>";
        content += "<select id='" + self.container + "-markings-section-content-id-" + d + "'>";
        for (var p = 0;p < self._permissions.length;p++) {
          content += "<option value='" + self._permissions[p];
          console.log("this perm: '" + self._permissions[p] + "'");
          if (readPerms[0] == self._permissions[p]) {
            content += "' selected='selected";
          }
          content += "'>" + self._permissions[p] + "</option>";
        }
        content += "</select>";
        content += "</div>";
      }
      content += "<div class='markings-content-section-html' id='" + self.container + "-markings-section-content-C-" + d + "'>";

        // add content element
        /*var divc = "";
        for (var dc = 0;dc < div.childNodes.length;dc++) {
          var divchild = div.childNodes.item(dc);
          if (1 == divchild.nodeType) {
            divc += (new XMLSerializer()).serializeToString(divchild);
          }
        }
        var xmlContent = divc;*/
        var xmlContent = (new XMLSerializer()).serializeToString(div); // must do this so our redacted section has correct css classes -> will have to remove on save()

        var divJson = {index: d, content: xmlContent, role: readPerms[0], redacted: redacted, triples: new Array(), htmlid: div.getAttribute("id")};

        content += xmlContent;
        content += "</div>";

      content += "</div></td>";
        // add JSON placeholder document for triples
        // add triples to view (if required)
        if (self.tripleEditor) {
          content += "<td class='markings-content-section-triples'><h2 class='markings-triples-title'>Extracted Facts [<a href='#'>+</a>]</h2>";
          if (redacted) {
            content += "<p>Triples not available</p>";
          } else {
            // extract identifiers and type
            var objects = new Array();

            // TODO only do the following if there are no existing triple facts (i.e. first run through of suggestion tool)
            self._extractFacts(div,objects);

            // TODO add already known triples to objects array (sem:triple elements)

            // get triple container div
            // get content
            // render each to JSON and display
            // cache JSON in div object
            content += "<div class='markings-content-section-triple-list'>";

            for (var t = 0;t < objects.length;t++) {
              // loop through objects again to find pairs
              for (var t2 = 0;t2 < objects.length;t2++) {
                for (var vt = 0;vt < self.validTriples.length;vt++) {
                  if (t != t2) {
                  if (self.validTriples[vt].subjectType == objects[t].type && self.validTriples[vt].objectType == objects[t2].type) {
                    // we have a match - render fact box

                    var tripId = self.container + "-markings-triple-" + self.nextTripleId++;
                    self._tripleIDs.push(tripId);
                    self._tripleSection[tripId] = d;

                    content += "<div class='markings-triple' id='" + tripId + "'>";
                    content += "[<a href='#'>-</a>] <span class='" + objects[t].type + "' id='" + tripId + "-subject'>" + objects[t].value + "</span>";
                    content += "<select id='" + tripId + "-predicate'>";
                    var rels = self.validTriples[vt].predicateArray;
                    for (var r = 0;r < rels.length;r++) {
                      content += "<option ";
                      if (0 == r) {
                        content += "selected='selected' ";
                      }
                      content += "value='" + rels[r] + "'>" + rels[r] + "</option>";
                    }
                    content += "</select>";
                    content += "<span class='" + objects[t2].type + "' id='" + tripId + "-object'>" + objects[t2].value + "</span>";
                    content += "</div>";
                  }
                  }
                }
              }
            }

            content += "</div>";

            // TODO extract already found facts from hidden triple tag (if it exists)
            // TODO if no triple section (NOT no facts - editor may have rejected all facts) then go through XML content to find all person/organisation/placename elements

            /*
            content += "<div class='markings-content-section-triple-new'>";
            content += "<h2 class='markings-triples-title'>Add New Triple:-</h2>"
            content += "Subject: <select class='markings-triple-new-subject'>";
            for (var t = 0;t < objects.length;t++) {
              content += "<option value='" + t + "'>" + objects[t].value + "</option>";
            }
            content += "</select>";


            content += "<br/>Predicate: <select class='markings-triple-new-subject'>";
            content += "<option value=''>Select Subject and Object first</option>";
            content += "</select>";

            content += "<br/>Object: <select class='markings-triple-new-object'>";
            for (var t = 0;t < objects.length;t++) {
              content += "<option value='" + t + "'>" + objects[t].value + "</option>";
            }
            content += "</select>";

            content += "<br/> <span><b>Add</b></span>";

            content += "</div>";
            */
          }

          content += "</td>";
        }

        //console.log("Adding section: " + JSON.stringify(divJson));
        console.log("Adding section: " + JSON.stringify(divJson));
        self.sections.push(divJson); // here incase we add triple data to it

      content += "</tr>";
    }
    content += "</table>";
  }
    content += "<div class='markings-actionbar'><form id='" + self.container + "-markings-docsubmit'><input type='submit' value='Publish Changes' />" +
      "<span id='" + self.container + "-done'></span></form></div>";

    document.getElementById(cid).innerHTML = content;

    if (undefined != body) {
    // TODO add event click handlers
    for (var d = 0;d < divs.length;d++) {
      console.log("Section div loop. d: " + d);
      var div = divs[d];
      // section security permission drop down on change event
      var id = self.container + "-markings-section-content-id-" + d;
      var sel = document.getElementById(id);
      if (null != sel) {
        // is not a redacted section
        var index = self.sections[d].index;
        sel.onchange = function(evt) {
          self._updateSectionRole(index,sel.value);
        }
      }

      // TODO other event handlers
      // Triple delete
      // Add Triple
    }

  }
    // Doc save event handler
    document.getElementById(self.container + "-markings-docsubmit").onsubmit = function(evt) {
      try {
        self.__saveDocument();
      } catch (ex) {
        console.log("EXCEPTION on save : " + ex.message);
        for (var prop in ex)
    {
       console.log ("property: "+ prop+ " value: ["+ ex[prop]+ "]\n");
    }
      }
      return false;
    };
};

/**
 * Loads the specified XHTML document from MarkLogic and processes it (if required) for display. This function will automatically section the
 * document off if no div tags with a class of secure-content exist as immediate children of the document's body tag.
 *
 * @param {string} uri - Document URI to load
 */
com.marklogic.widgets.markings.prototype.showDocument = function(uri) {
  this.docuri = uri;

  // show loading messages
  var hid = this.container + "-markings-docinfo";
  document.getElementById(hid).innerHTML = "<h2 class='markings-meta-title'>Document Extracted Metadata</h2>" + com.marklogic.widgets.bits.loading(hid + "-loading1") +
    "<h2 class='markings-security-title'>Document Security Information</h2>" + com.marklogic.widgets.bits.loading(hid + "-loading2");
  var cid = this.container + "-markings-doccontent";
  document.getElementById(cid).innerHTML = "<h2 class='markings-content-title'>Document Secure Content</h2>" + com.marklogic.widgets.bits.loading(cid + "-loading");



  // fetch document as XML, applying XSLT controls to it, and render
  var self = this;
  mljs.defaultconnection.get(uri,{transform: "redaction"},function(result) { // TODO remove hardcoded transform - set as default get transform on server for XML content
    var xml = result.doc;

    // TODO insert doc metadata fetch here too
    self._drawDocument(uri,xml);
  });
};

com.marklogic.widgets.markings.prototype._extractFacts = function(el,objects) {
  console.log("_extractFacts: " + el.nodeName);
    if (el.nodeName == "span" && (
      el.getAttribute("class") == "placename" || el.getAttribute("class") == "organisation" || el.getAttribute("class") == "person")
    ) {
      console.log("got fact: " + el.getAttribute("class") + " = " + el.childNodes.item(0).childNodes.item(0).nodeValue);
      objects.push({type:  el.getAttribute("class"), value: el.childNodes.item(0).childNodes.item(0).nodeValue});
    } else {
      // process child nodes
      if (el.childNodes != undefined) {
        for (var i = 0;i < el.childNodes.length;i++) {
          this._extractFacts(el.childNodes.item(i),objects);
        }
      }
    }

};

com.marklogic.widgets.markings.prototype._getSection = function(idx) {
  for (var i = 0;i < this.sections.length;i++) {
    if (this.sections[i].index == idx) {
      return this.sections[i];
    }
  }
  return null; // should never happen
};

com.marklogic.widgets.markings.prototype._updateSectionRole = function(idx,role) {
  console.log("_updateSectionRole idx: " + idx + ", role: " + role);
  this._getSection(idx).role = role;
};

com.marklogic.widgets.markings.prototype.__saveDocument = function() {
  console.log("__saveDocument");

  // re-construct document body content
  var nd = "<html xmlns='http://www.w3.org/1999/xhtml'>";
  // merge with existing (meta data) content
  console.log("head content: " + this.head);
  nd += this.head;
  nd += "<body xmlns='http://www.w3.org/1999/xhtml'>";

  for (var s = 0;s < this.sections.length;s++) {
    var section = this.sections[s];

    // get our HTML div element
    var sid = section.htmlid; // TODO NB Doesn't exist if loaded second+ times
    console.log("SID: " + sid);
    var sc = null;
    if (null != sid) {
      sc = document.getElementById(sid);
    } else {
      sc = document.getElementById(this.container + "-markings-section-content-C-" + section.index).firstChild;
    }
    // create a new secure section tag
    // include security div tags
    nd += "<div class='secure-section role:" + section.role + "'>";
    // get its content only
    for (var c = 0;c < sc.childNodes.length;c++) {
      // include any additional tags like placename, organisation, person -> Done by copying all content over
      var xml = sc.childNodes.item(c);
      console.log("serialising xml: " + xml);
      nd += (new XMLSerializer()).serializeToString(xml);
    }

    // TODO handle secure-redaction sections, content re-ordering, deletions, additions


    // TODO save facts about sections within the sections themselves (sem triples)
    // N/A delete any removed facts (sem-triples section) -> done automatically by saving doc

    nd += "</div>";
  }
  nd += "</body></html>";
  console.log("NEW document content: " + nd);

  var ndx = textToXML(nd);

  var self = this;

  // save document to server
  mljs.defaultconnection.save(ndx,this.docuri,{contentType: "application/xml", format: "xml"}, function(result) {
    console.log("DOC SAVE RESULT: " + JSON.stringify(result));

    // TODO update document saved message on screen
    var completeFunc = function(result) {
      mljs.defaultconnection.logger.debug("ADDED ALL TRIPLE GRAPHS! Result: " + JSON.stringify(result.doc));
      document.getElementById(self.container + "-done").innerHTML = com.marklogic.widgets.bits.done(self.container + "-done-msg");
    }

    var graphsAdded = 0;
    var divs = self.body.getElementsByTagName("div");

    var completeCheck = function(result) {
        graphsAdded++;
        if (graphsAdded == divs.length) {
          completeFunc(result);
        }
    }
    // TODO loop through each section of the document

    // if not, wrap sections with these
    // put first level headings in their own sections
    // group others with following sections
    // group multiple p/div tags together between headings


    // go through these sections and draw UI as appropriate
    for (var d = 0;d < divs.length;d++) {
      var div = divs[d];

    var triples = "";
    var classes = new Array(); // json {type: person, value: Harry Redknapp, typeIRI: http://xmlns.com/foaf/0.1/Person, objectIRI: http://marklogic.com/semantic/targets/person#ID} // via http://www.w3.org/1999/02/22-rdf-syntax-ns#type


    // replace triple URIs (named graphs)
    for (var t = 0;t < self._tripleIDs.length;t++) {
      // only match triples defined within the current section of the document
      var tripId = self._tripleIDs[t];
      mljs.defaultconnection.logger.debug("Processing Triple ID: " + tripId);
      var section = self._tripleSection[tripId];
      if (d == section) {
        var hp = document.getElementById(tripId);
        var sh = document.getElementById(tripId + "-subject");
        var ph = document.getElementById(tripId + "-predicate");
        var oh = document.getElementById(tripId + "-object");
        var stype = sh.getAttribute("class");
        var svalue = sh.childNodes.item(0).nodeValue; // the #text node
        var pvalue = ph.value;
        var otype = oh.getAttribute("class");
        var ovalue = oh.childNodes.item(0).nodeValue; // the #text node

        var gotSubject = false;
        var theSubject = null;
        for (var cl = 0;!gotSubject && cl < classes.length;cl++) {
          gotSubject = classes[cl].type == stype && classes[cl].value == svalue;
          if (gotSubject) {
            theSubject = classes[cl];
          }
        }
        var subjectIRI = "";
        if (!gotSubject) {
          subjectIRI = self._iriPatterns[stype].replace("#VALUE#",encodeURI(svalue));
          theSubject = {type: stype, value: svalue, objectIRI: subjectIRI, typeIRI: self._rdfTypes[stype]};
          classes.push(theSubject);
        }

        var theObject = null;
        var gotObject = false;
        for (var cl = 0;!gotObject && cl < classes.length;cl++) {
          gotObject = classes[cl].type == otype && classes[cl].value == ovalue;
          if (gotObject) {
            theObject = classes[cl];
          }
        }
        var objectIRI = "";
        if (!gotObject) {
          objectIRI = self._iriPatterns[otype].replace("#VALUE#",encodeURI(ovalue));
          theObject = {type: otype, value: ovalue, objectIRI: objectIRI, typeIRI: self._rdfTypes[otype]};
          classes.push(theObject);
        }

        // find IRI for Subject and Object
        triples += "<" + theSubject.objectIRI + "> <" + self._predicates[pvalue] + "> <" + theObject.objectIRI + "> .\n";
      }
    }

    // provenance
    var graphURI = self._tripleCollections[0].replace("#SECTIONID#","secure-content-" + d).replace("#URI#",self.docuri); // TODO verify d == c in above, even when reloaded from DB
    triples += "<" + graphURI + "> <http://marklogic.com/semantics/ontology/derived_from> <" + self.docuri + "> .";

    // define any classes we need to add
    var classess = "";
    for (var cl = 0;cl < classes.length;cl++) {
      classess += "<" + classes[cl].objectIRI + "> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <" + classes[cl].typeIRI + "> .\n";
      classess += "<" + classes[cl].objectIRI + "> <" + self._commonNamePredicates[classes[cl].type] + "> \"" + classes[cl].value + "\"@en .\n"; // TODO I18N for common names
    }

    // add triples graphs for each section
    var graphData = classess + triples;
    // TODO do this for each named graph too
    mljs.defaultconnection.logger.debug("Setting graph URI: " + graphURI + " to data: " + graphData);

    // message on triples complete
    if (graphData.trim().length > 0) {
      mljs.defaultconnection.saveGraph(graphData,graphURI,function(result) {
        completeCheck(result);
      });
    } else {
      // noop
      completeCheck({doc: {result: "blank doc success"}});
    }

  } // end divs loop
  });

};

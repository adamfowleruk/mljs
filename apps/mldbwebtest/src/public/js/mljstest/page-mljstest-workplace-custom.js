/**
 * Workplace with custom widget and context definitions included
 */

// Ensure extension point exists
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};
com.marklogic.widgets.workplaceadminext = window.com.marklogic.widgets.workplaceadminext || {};
com.marklogic.widgets.workplaceadminext.layouts = window.com.marklogic.widgets.workplaceadminext.layouts || {};
com.marklogic.widgets.workplaceadminext.widgets = window.com.marklogic.widgets.workplaceadminext.widgets || {};

// now add your own
com.marklogic.widgets.workplaceadminext.widgets.mljstest = [
  {title: "Some Custom Widget", classname: "com.marklogic.widgets.cooccurence", description: "Custom widget test using existing widget class."}
];

com.marklogic.widgets.searchresultsext = window.com.marklogic.widgets.searchresultsext || {};



// page loaded variable definitions
var sc = null; // will define later in page load function



var getmeta = function(r,param) {

            for (var metai = 0, maxi = r.metadata.length, meta;metai < maxi;metai++) {
              meta = r.metadata[metai];
              //console.log("  meta instance: " + metai);
              for (var p in meta) {
                //console.log("    found param: " + param);
                // find our one
                // NB may be multiple of them - TODO support more than just last found
                if (p == param) {
                  //console.log("      found latsrc constraint param");
                  return meta[p];

                }
              }
            }
            return null;
    };

    var addHandleClickHandler = function(docuri,elid) {
      // contribute facet value for sender for __sender
      var el = document.getElementById(elid);
      el.onclick = function(evt) {
        sc.contributeFacet("sender",el.innerHTML);
        return false;
      };
    };

    var addExploreClickHandler = function(docuri,elid) {
      // contribute facet value for sender for __sender
      var el = document.getElementById(elid);
      el.onclick = function(evt) {
        window.location = "/explore.html?iri=http://marklogic.com/semantics/ontology/Document" + docuri;
        return false;
      };
    };

com.marklogic.widgets.searchresultsext.mljstest = {
  customrenderers: {
    "intercept-tweet": { // a MarkLogic feedsxquery captured tweet
      /** This determines whether this renderer can renderer a particular document **/
      matcher: function(result,manager,settings) {
        return (null != getmeta(result,"sender"));
      },
      /** This is the old, catch all way of rendering the document - title, summary, everything. **/
      processor: function (result,manager,settings) {
        var id = manager.generateLazyID();
        var eid = manager.generateLazyID();
        // TODO rewrite the below for bootstrap CSS
        var s = "<div class='searchresults-result'><h3>" + result.index + ". " + result.uri + "</h3>" +
          "<div style='position:relative;margin-bottom: 4px;'><a class='handle' id='" + id + "'>" + getmeta(result,"sender") + "</a> " +
          "(<a class='explore' id='" + eid + "'>Explore</a> | <a target='_blank' class='view' href='/v1/documents?transform=xmltohtml&uri=" +
          result.uri + "'>View</a>)" +
          " " /*+ getmeta(result,"{http://www.marklogic.com/intel/intercept}extract") */+
          "</div></div>";
        manager.lazyLoad(result.uri,id,addHandleClickHandler);
        manager.lazyLoad(result.uri,eid,addExploreClickHandler);
        return s;
      }
    } // end tweet custom renderer
  } // end custom renderers
};


// TODO custom workplace layout (2 column?)
com.marklogic.widgets.layoutsext = window.com.marklogic.widgets.layoutsext || {};
/**
 * A two column layout. 960.css and bootstrap.css aware. Uses container_12 from 960.css.
 * @constructor
 *
 * @param {string} container - The HTML ID of the container to render this layout within
 */
com.marklogic.widgets.layoutsext.twocolumns = function(container) {
  com.marklogic.widgets.layouts.helper.extendLayout(this,container,["A","B"]);

  this._init();
};

com.marklogic.widgets.layoutsext.twocolumns.prototype._init = function() {
  var s = "<div id='" + this.container + "-layout' class='container_12 row mljswidget layout twocolumns'>";
  s += "<div id='" + this.container + "-A' class='column col-md-6 col-xs-6'></div>";
  s += "<div id='" + this.container + "-B' class='column col-md-6 col-xs-6'></div>";
  s += "</div>";
  var el = document.getElementById(this.container);
  if (undefined == el) {
    console.log("WARNING: ATTEMPTING TO SET NON EXISTENT LAYOUT ELEMENT: " + this.container);
  } else {
    el.innerHTML = s;
  }
};

com.marklogic.widgets.workplaceadminext.layouts.mljstest = [
  {title: "Two Columns", classname: "com.marklogic.widgets.layoutsext.twocolumns", description: "Two equal columns"}
];



// DEFERRED TODO custom ontology in tripleconfig too









// NOTE: The above can be done in any JS file loaded within the page, in any load order (but NOT within a page load function, like that below)

// now load the actual page
window.onload = function() {
  var db = new mljs();
  db.logger.setLogLevel("debug");

  var errors = new com.marklogic.widgets.error("errors");
  errors.showFirstCodefile = true;
  errors.allowDetails = true;

  try {
    // Load workplace nav bar
    var wpcontext = new com.marklogic.widgets.workplacecontext();

    // Load the current page configuration

        var workplace = new com.marklogic.widgets.workplace("workplace");
        workplace.editable(true);
        wpcontext.register(workplace);

        //workplace.editable(); - edited via link on top right of page instead
        //workplace.saveable(false); // don't persist changes
        // NB first below is "try this first, then default to second"
        var pageurl = window.location.pathname; // TODO validate this works in all browsers

        var pc = new com.marklogic.widgets.pagecontext();
        pc.setWorkplaceWidget(workplace);
        wpcontext.register(pc); // will call _parse when page loads

        workplace.loadPage(pageurl, {
          title: "Custom Workplace Test Page", layout: "thinthick",
          urls: ["/mljstest/workplace-custom/","/mljstest/workplace-custom","/mljstest/workplace-custom.html","/workplace-custom.html"],
          widgets: [
      {widget: "searchbar1", type: "com.marklogic.widgets.searchbar", config: {}}
      ],
          assignments: [
      {widget: "searchbar1", zone: "B", order: 1}
      ],
          contexts: [],
          actions: {}
        }); // could instead use loadPage() to determine automatically via window.location, or loadPage("/my/path") to load via search in content database
        // TODO use context instead of widget above

  } catch (err) {
    errors.show(err);
  }

};

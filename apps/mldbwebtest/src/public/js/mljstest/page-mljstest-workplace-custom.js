/**
 * Workplace with custom widget and context definitions included
 */

// Ensure extension point exists
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};
com.marklogic.widgets.workplaceadminext = window.com.marklogic.widgets.workplaceadminext || {};
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
      matcher: function(result,manager,settings) {
        return (null != getmeta(result,"sender"));
      },
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

// TODO custom ontology in tripleconfig too





// NOTE: The above can be done in any JS file loaded within the page, in any load order (but NOT within a page load function)

// TODO now load the actual page

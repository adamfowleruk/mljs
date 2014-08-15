
// Ensure extension point exists
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};


com.marklogic.widgets.searchresultsext = window.com.marklogic.widgets.searchresultsext || {};




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

com.marklogic.widgets.searchresultsext.tweets = {
  customrenderers: {
    "intercept-tweet": { // a MarkLogic feedsxquery captured tweet
      /** This determines whether this renderer can renderer a particular document **/
      matcher: function(result,manager,settings) {
        return (null != getmeta(result,"sender"));
      },
      /** This is the old, catch all way of rendering the document - title, summary, everything. **/
      processor: function (result,manager,settings) {
        console.log("CUSTOMRENDERER: TWEET: " + result.uri);
        var id = manager.generateLazyID();
        var eid = manager.generateLazyID();
        // TODO rewrite the below for bootstrap CSS
        var s =
          "<div style='position:relative;margin-bottom: 4px;'><a class='handle' id='" + id + "'>" +
           getmeta(result,"sender") + "</a> " +
          " " /*+ getmeta(result,"{http://www.marklogic.com/intel/intercept}extract") */+
          "</div>";
        return s;
      }
    } // end tweet custom renderer
  } // end custom renderers
};

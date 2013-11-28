
$(document).ready(function() {
  var db = new mljs(); 
  
  var relob = db.createOptions();
  relob.rangeConstraint("slide","slide","http://marklogic.com/openxml/powerpoint","xs:string","http://marklogic.com/collation/",false,[],"properties")
       ;//.returnResults(false); // uris only
  db.saveSearchOptions(username+"-thumbnails",relob.toJson());
  
  var wgt = new com.marklogic.widgets.searchpage("search-page");
  
  // ADD CUSTOM RENDERER FOR OUR SLIDE IMAGES
  
  var lazyLoader = function(docuri,elid) {
    // load related image via search
    var b = db.createQuery();
    b.query(b.range("slide",docuri));
    db.structuredSearch(b.toJson(),username+"-thumbnails",function(result) {
      var results = result.doc.results;
      
      // get first (and only) uri and generate img tag for it, with scaling applied
      for (var i = 0;i < results.length;i++) {
        var res = results[i];
        //document.getElementById(elid).innerHTML = "<img src='/show/view?uri=" + encodeURI(res.uri) + "&original=true&fullurl=true' class='zoomable' style='width:150px;height: 100px;border:1px solid black;padding: 2px;' alt='Thumbnail' />";
        document.getElementById(elid).innerHTML = "<img src='/v1/documents?uri=" + encodeURI(res.uri) + "' class='zoomable' style='width:150px;height: 100px;border:1px solid black;padding: 2px;' alt='Thumbnail' />";
      }
    });
  };
  
  wgt.results.addProcessor("slides", function(result) {
    if (-1 != result.uri.indexOf("/ppt/slides/")) {
      return true;
    }
    return false;
  }, function (result,lazyhelper) {
    var id = lazyhelper.generateLazyId();
    var elid = id + "result-lazy";
    var str = "<div class='searchresults-result'>" + 
      "<table style='border:none;width:100%;'>" +
      "<tr><td style='width: auto;'>" +
        "<h3>" + result.index + ". " + result.uri + "</h3>";
    if (result.fitness != undefined && 0 != result.fitness) {
      str += "Relevance: " + result.fitness + "<br/>";
    }
    str += com.marklogic.widgets.searchhelper.snippet(result) +
      "</td>" +
      "<td style='width: 155px;' id='" + elid + "'>Loading thumbnail...</td>" +
      "</tr></table>" +
      "</div>";
    lazyhelper.lazyLoad(result.uri,elid,lazyLoader);
    return str;
  });
  
  // END CUSTOM RENDERER
  
  var ob = db.createOptions();
  ob.additionalQuery("<cts:element-query xmlns:cts=\"http://marklogic.com/cts\"><cts:element xmlns:_1=\"http://schemas.openxmlformats.org/presentationml/2006/main\">_1:sld</cts:element><cts:and-query/></cts:element-query>")
    .rangeConstraint("pptx","pptx","http://marklogic.com/openxml/powerpoint","xs:string","http://marklogic.com/collation/",true,[],"properties")
    .rangeConstraint("index","index","http://marklogic.com/openxml/powerpoint","xs:string","http://marklogic.com/collation/",true,[],"properties")
    .snippet();
    
  var options = ob.toJson();
  
  wgt.setOptions(username+"-slides",options);
  wgt.execute();
  
});
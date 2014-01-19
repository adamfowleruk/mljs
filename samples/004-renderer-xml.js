
window.onload = function() {
  var db = new mljs(); 
  
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
  var wgt = new com.marklogic.widgets.searchpage("search-page");
  
  var myfunc = function(prefix){
	  if (prefix === "me") {
	    return "http://myns.com/music-metadata";
	  } else {
	    return null;
	  }
	};
  
  // add our custom XML processor
  wgt.results.addProcessor("music", function(result) {
    // first function is the matcher
		  try {
			  var xmlDoc = textToXML(result.content);
			  
			  if (undefined != xmlDoc.evaluate) {
			    // if it has this element, I'm able to render it
			    var evalResult = xmlDoc.evaluate("//me:message-id",xmlDoc,myfunc,2,null);

			    if (undefined != evalResult && ""!=evalResult.stringValue) {
			      return true;
			    }
			  }
			} catch (err) {
			 // do something when it's not XML
				console.log(err);
				console.log(err.message);
			}
			return false;
		  
		  }, function (result) {
			  // second function is the renderer
			  
			  try {
				  var xmlDoc = textToXML(result.content);
				  mljs.defaultconnection.logger.debug("xmlDoc?: " + typeof(xmlDoc));
				  mljs.defaultconnection.logger.debug("xmlDoc.evaluate?: " + typeof(xmlDoc.evaluate));
				  if (undefined != xmlDoc.evaluate) {
				    
					  var evalResult = xmlDoc.evaluate("//me:original-title",xmlDoc,myfunc,2,null);
				    
				    if (undefined != evalResult && ""!=evalResult.stringValue) {
				    	
				      // extract title and value and return as string
				      var title = xmlDoc.evaluate("//me:original-title",xmlDoc,myfunc,2,null).stringValue;
				      var albumCover = '/images/not-avail.jpg';
			        if (xmlDoc.evaluate("//me:album-cover-uri",xmlDoc,myfunc,2,null) != "") {
			        	albumCover = xmlDoc.evaluate("//me:album-cover-uri",xmlDoc,myfunc,2,null).stringValue;
			        }
			        var artistName = xmlDoc.evaluate("//me:display-artist",xmlDoc,myfunc,2,null).stringValue;
			        var releaseId = xmlDoc.evaluate("//me:release-id",xmlDoc,myfunc,2,null).stringValue;
			        var releaseType = xmlDoc.evaluate("//me:release-type",xmlDoc,myfunc,2,null).stringValue;
			        var label = xmlDoc.evaluate("//me:label-name",xmlDoc,myfunc,2,null).stringValue;
				      
				      
				      // Assemble result sections and display
				      var str = '<p class="searchresults-result">';
				      str +=  '<img src="'+albumCover+'" width="120px" height="120px" style="float: left;padding-right: 20px"/>';
				      str +=  '<span class="title"><a href="/musiceye/product-view?uri=' + encodeURIComponent(result.uri) + '">' + title + '</a></span>';
				      str +=  '<br></br>';
				      str +=  '<br></br>';
				      str +=  '<span class="title">By <a href="/musiceye/artist-view?uri=' +encodeURIComponent(result.uri) + '">' + artistName + '</a></span>';
				      str +=  '<br></br>';
				      str +=  '<br></br>';
				      str +=  '<span class="metadata">Release ID: ' +releaseId+'</span>';
				      str +=  '<br></br>';
				      str +=  '<span class="metadata">Release Type: '+releaseType+'</span>';
				      str +=  '<br></br>';
				      str +=  '<span class="metadata">Label: '+label+'</span>';
				      str += '</p>';		  
				      
				      return str;
				    }
				  } // end evaluate undefined if
				} catch (err) {
				 // do something
					console.log(err);console.log(err.message);
				}
				return "<p>Uh oh</p>";
	  });
  
  var ob = db.createOptions();
  ob.defaultCollation("http://marklogic.com/collation/")
    //.collectionConstraint() // default constraint name of 'collection' 
    .rangeConstraint("CommercialModelType","commercial-model-type","http://myns.com/music-metadata","xs:string","http://marklogic.com/collation/",true,null,null,"Distribution Model Type")
    .rangeConstraint("CountryCode","deal-territory-code","http://myns.com/music-metadata","xs:string","http://marklogic.com/collation/",true,null,null,"Country Code")
    .rangeConstraint("OrderDate","deal-valid-from","http://myns.com/music-metadata","xs:date",null,true,null,null,"Order Date")
    .rangeConstraint("DistributionPartner","distribution-channel-party","http://myns.com/music-metadata","xs:string","http://marklogic.com/collation/",true,null,null,"Distribution Partner")
    .rangeConstraint("DistributionChannelType","distribution-channel-type","http://myns.com/music-metadata","xs:string","http://marklogic.com/collation/",true,null,null,"Distribution Channel Type")
    .rangeConstraint("Genre","genre","http://myns.com/music-metadata","xs:string","http://marklogic.com/collation/",true,null,null,"Genre")
    .rangeConstraint("LabelName","label-name","http://myns.com/music-metadata","xs:string","http://marklogic.com/collation/",true,null,null,"Label Name")
    .rangeConstraint("ReleaseType","release-type","http://myns.com/music-metadata","xs:string","http://marklogic.com/collation/",true,null,null,"Release Type")
    .rangeConstraint("UsageType","use-type","http://myns.com/music-metadata","xs:string","http://marklogic.com/collation/",true,null,null,"Usage Type")
  
  var orderDateBuckets = ob.computedBuckets("OrderDate");
  orderDateBuckets.bucket("P0D","P1D","start-of-day","today","Today")
             .bucket("-P1D","P0D","start-of-day","yesterday","Yesterday") 
             .bucket("-P14D","P0D","start-of-day","last2weeks","Last 2 Weeks")
             .bucket("P0D","P28D","start-of-day","next4weeks","Next 4 Weeks")
             .bucket("P0M","P1M","start-of-year","thismonth","This Month")
  			 .bucket("P0Y","P1Y","start-of-year","thisyear","This Year")
  			 .bucket("-P1Y","P0Y","start-of-year","lastyear","Last Year");
  
  var options = ob.toJson();
  
  wgt.setOptions("musiceye-page-search-options",options);
  wgt.execute();
  
  } catch (err) {
	  error.show(err.message);
	}
  
};